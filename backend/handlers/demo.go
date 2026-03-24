package handlers

import (
	"fmt"
	"go-asistencias/backend/database"
	"go-asistencias/backend/models"
	"go-asistencias/backend/services"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func ResetDemo(c *gin.Context) {
	admin, exists := c.Get("admin")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "No autenticado"})
		return
	}

	currentAdmin := admin.(*models.Admin)

	// Solo admin_prueba puede reiniciar su demo
	if currentAdmin.Role != models.RoleAdminPrueba {
		c.JSON(http.StatusForbidden, gin.H{"error": "Esta función solo está disponible para cuentas de prueba"})
		return
	}

	tx := database.DB.Begin()

	// Obtener trabajadores creados por este admin
	var trabajadores []models.Trabajador
	if err := tx.Where("admin_id = ?", currentAdmin.ID).Find(&trabajadores).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al buscar trabajadores"})
		return
	}

	// Eliminar asistencias de los trabajadores
	for _, t := range trabajadores {
		if err := tx.Unscoped().Where("trabajador_id = ?", t.ID).Delete(&models.Asistencia{}).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al eliminar asistencias"})
			return
		}
	}

	// Eliminar trabajadores
	if err := tx.Unscoped().Where("admin_id = ?", currentAdmin.ID).Delete(&models.Trabajador{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al eliminar trabajadores"})
		return
	}

	// Reiniciar contadores del admin
	if err := tx.Model(&models.Admin{}).Where("id = ?", currentAdmin.ID).Updates(map[string]interface{}{
		"demo_trabajadores_creados": 0,
		"demo_first_asistencia":     nil,
		"demo_backups_creados":      0,
		"demo_eliminaciones":        0,
		"demo_asistencias_creadas":  0,
		"demo_bloqueado":            false,
	}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al reiniciar contadores"})
		return
	}

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{
		"msg":                     "Demo reiniciada correctamente",
		"trabajadores_eliminados": len(trabajadores),
	})
}

// GetDemoStatus retorna el estado actual de la demo para el usuario
func GetDemoStatus(c *gin.Context) {
	admin, exists := c.Get("admin")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "No autenticado"})
		return
	}

	currentAdmin := admin.(*models.Admin)

	if currentAdmin.Role != models.RoleAdminPrueba {
		c.JSON(http.StatusOK, gin.H{
			"is_demo":   false,
			"role":      currentAdmin.Role,
			"unlimited": true,
		})
		return
	}

	response := currentAdmin.GetDemoStatus()

	// Contar trabajadores actuales
	var count int64
	database.DB.Model(&models.Trabajador{}).Where("admin_id = ?", currentAdmin.ID).Count(&count)
	response["trabajadores_actuales"] = count

	if currentAdmin.DemoFirstAsistencia != nil {
		expiracion := currentAdmin.DemoFirstAsistencia.Add(72 * time.Hour)
		response["demo_expira"] = expiracion
	}

	c.JSON(http.StatusOK, response)
}

// RequestAccess solicita acceso al administrador (reemplaza el botón Reiniciar Demo)
func RequestAccess(c *gin.Context) {
	admin, exists := c.Get("admin")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "No autenticado"})
		return
	}

	currentAdmin := admin.(*models.Admin)

	// Solo admin_prueba puede solicitar acceso
	if currentAdmin.Role != models.RoleAdminPrueba {
		c.JSON(http.StatusForbidden, gin.H{"error": "Esta función solo está disponible para cuentas de prueba"})
		return
	}

	// Crear instancia del servicio de email
	emailService := services.NewEmailService()

	// Preparar datos del usuario para el email
	emailRequest := services.EmailRequest{
		Username:            currentAdmin.Username,
		Role:                currentAdmin.Role,
		RegistrationDate:    time.Now(), // Usamos fecha actual si no hay CreatedAt definido
		TrabajadoresCreados: currentAdmin.DemoTrabajadoresCreados,
		AsistenciasCreadas:  currentAdmin.DemoAsistenciasCreadas,
		BackupsCreados:      currentAdmin.DemoBackupsCreados,
		Eliminaciones:       currentAdmin.DemoEliminaciones,
		ModulesBlocked:      currentAdmin.IsModuleBlocked(),
		DemoExpired:         currentAdmin.IsDemoExpired(),
	}

	// Enviar correo al administrador
	err := emailService.SendAccessRequest(emailRequest)
	if err != nil {
		fmt.Printf("❌ Error enviando solicitud de acceso: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al procesar la solicitud"})
		return
	}

	fmt.Printf("Solicitud de acceso enviada para usuario: %s\n", currentAdmin.Username)

	c.JSON(http.StatusOK, gin.H{
		"msg":         "Solicitud enviada exitosamente",
		"email_sent":  true,
		"admin_email": emailService.AdminEmail,
		"message":     "Tu solicitud de acceso ha sido enviada al administrador. Te contactaremos pronto.",
		"user_progress": map[string]interface{}{
			"trabajadores":  fmt.Sprintf("%d/1", currentAdmin.DemoTrabajadoresCreados),
			"asistencias":   fmt.Sprintf("%d/3", currentAdmin.DemoAsistenciasCreadas),
			"backups":       fmt.Sprintf("%d/1", currentAdmin.DemoBackupsCreados),
			"eliminaciones": fmt.Sprintf("%d/2", currentAdmin.DemoEliminaciones),
		},
	})
}

// AdminResetUser permite al admin resetear cualquier usuario demo (Panel Admin)
func AdminResetUser(c *gin.Context) {
	// Verificar que el usuario actual es admin completo
	admin, exists := c.Get("admin")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "No autenticado"})
		return
	}

	currentAdmin := admin.(*models.Admin)
	if currentAdmin.Role != models.RoleAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Solo administradores completos pueden realizar esta acción"})
		return
	}

	// Obtener ID del usuario a resetear
	userID := c.Param("user_id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de usuario requerido"})
		return
	}

	tx := database.DB.Begin()

	// Buscar el usuario demo a resetear
	var targetUser models.Admin
	if err := tx.Where("id = ? AND role = ?", userID, models.RoleAdminPrueba).First(&targetUser).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "Usuario demo no encontrado"})
		return
	}

	// Obtener y eliminar trabajadores del usuario
	var trabajadores []models.Trabajador
	if err := tx.Where("admin_id = ?", targetUser.ID).Find(&trabajadores).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al buscar trabajadores"})
		return
	}

	// Eliminar asistencias
	for _, t := range trabajadores {
		if err := tx.Unscoped().Where("trabajador_id = ?", t.ID).Delete(&models.Asistencia{}).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al eliminar asistencias"})
			return
		}
	}

	// Eliminar trabajadores
	if err := tx.Unscoped().Where("admin_id = ?", targetUser.ID).Delete(&models.Trabajador{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al eliminar trabajadores"})
		return
	}

	// Resetear contadores del usuario
	if err := tx.Model(&models.Admin{}).Where("id = ?", targetUser.ID).Updates(map[string]interface{}{
		"demo_trabajadores_creados": 0,
		"demo_first_asistencia":     nil,
		"demo_backups_creados":      0,
		"demo_eliminaciones":        0,
		"demo_asistencias_creadas":  0,
		"demo_bloqueado":            false,
	}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al reiniciar contadores"})
		return
	}

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{
		"msg":                     "Usuario demo reiniciado correctamente",
		"username":                targetUser.Username,
		"trabajadores_eliminados": len(trabajadores),
		"reset_by":                currentAdmin.Username,
	})
}

// ListDemoUsers lista todos los usuarios en modo demo (Panel Admin)
func ListDemoUsers(c *gin.Context) {
	// Verificar que el usuario actual es admin completo
	admin, exists := c.Get("admin")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "No autenticado"})
		return
	}

	currentAdmin := admin.(*models.Admin)
	if currentAdmin.Role != models.RoleAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Solo administradores completos pueden ver usuarios demo"})
		return
	}

	// Paginación
	page := c.DefaultQuery("page", "1")
	limit := c.DefaultQuery("limit", "10")

	// Buscar usuarios demo
	var demoUsers []models.Admin
	var total int64

	database.DB.Model(&models.Admin{}).Where("role = ?", models.RoleAdminPrueba).Count(&total)

	offset := 0
	if page != "1" && page != "" {
		// Simple offset calculation - en producción usar algo más robusto
		offset = 10 * (int(page[0] - '1'))
	}

	if err := database.DB.Where("role = ?", models.RoleAdminPrueba).
		Offset(offset).Limit(10).Find(&demoUsers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al listar usuarios demo"})
		return
	}

	// Enriquecer datos con estadísticas
	var users []map[string]interface{}
	for _, user := range demoUsers {
		var trabajadorCount int64
		database.DB.Model(&models.Trabajador{}).Where("admin_id = ?", user.ID).Count(&trabajadorCount)

		userData := map[string]interface{}{
			"id":                        user.ID,
			"username":                  user.Username,
			"approved":                  user.Approved,
			"demo_trabajadores_creados": user.DemoTrabajadoresCreados,
			"demo_backups_creados":      user.DemoBackupsCreados,
			"demo_eliminaciones":        user.DemoEliminaciones,
			"demo_asistencias_creadas":  user.DemoAsistenciasCreadas,
			"demo_bloqueado":            user.DemoBloqueado,
			"demo_first_asistencia":     user.DemoFirstAsistencia,
			"demo_expired":              user.IsDemoExpired(),
			"trabajadores_actuales":     trabajadorCount,
			"modules_blocked":           user.IsModuleBlocked(),
		}

		if user.DemoFirstAsistencia != nil {
			expiracion := user.DemoFirstAsistencia.Add(72 * time.Hour)
			userData["demo_expira"] = expiracion
			userData["dias_restantes"] = int(time.Until(expiracion).Hours() / 24)
		}

		users = append(users, userData)
	}

	c.JSON(http.StatusOK, gin.H{
		"users": users,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}
