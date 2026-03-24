package handlers

import (
	"fmt"
	"go-asistencias/backend/database"
	"go-asistencias/backend/models"
	"net/http"
	"time"

	"regexp"

	"github.com/gin-gonic/gin"
)

func CreateTrabajador(c *gin.Context) {
	admin := c.MustGet("admin").(*models.Admin)

	var trabajador models.Trabajador
	if err := c.ShouldBindJSON(&trabajador); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validaciones - Permitir hasta 4 nombres y caracteres especiales (diéresis, etc.)
	nombreRegex := regexp.MustCompile(`^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜïÏ ]{1,100}$`)
	if !nombreRegex.MatchString(trabajador.Nombres) || !nombreRegex.MatchString(trabajador.ApellidoPaterno) || !nombreRegex.MatchString(trabajador.ApellidoMaterno) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Los nombres y apellidos solo deben contener letras, espacios y caracteres especiales válidos (máximo 100 caracteres)"})
		return
	}

	dniRegex := regexp.MustCompile(`^\d{8}$`)
	if !dniRegex.MatchString(trabajador.DNI) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "El DNI debe tener exactamente 8 dígitos numéricos"})
		return
	}

	if trabajador.DuracionMeses <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "La duración en meses debe ser mayor a 0"})
		return
	}

	if trabajador.TotalHorasRequeridas <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "El total de horas debe ser mayor a 0"})
		return
	}

	// Vincular trabajador al admin creador
	trabajador.AdminID = admin.ID

	// Seteamos fecha de inicio si no viene
	if trabajador.FechaInicio == nil {
		now := time.Now()
		trabajador.FechaInicio = &now
	}

	tx := database.DB.Begin()

	if err := tx.Create(&trabajador).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear trabajador"})
		return
	}

	// Incrementar contador para admin_prueba
	if admin.Role == models.RoleAdminPrueba {
		if err := tx.Model(&models.Admin{}).Where("id = ?", admin.ID).
			Update("demo_trabajadores_creados", admin.DemoTrabajadoresCreados+1).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar contador"})
			return
		}
	}

	tx.Commit()
	c.JSON(http.StatusCreated, trabajador)
}

func GetTrabajadores(c *gin.Context) {
	admin := c.MustGet("admin").(*models.Admin)

	var trabajadores []models.Trabajador
	query := database.DB.Preload("Asistencias")

	// Verificar si hay un filtro por admin específico
	filterAdminID := c.Query("filter_admin_id")

	if admin.Role == models.RoleAdminPrueba {
		// Los admin_prueba solo ven sus propios trabajadores
		query = query.Where("admin_id = ?", admin.ID)
	} else if admin.Role == models.RoleAdmin && filterAdminID != "" {
		// Los admin completos pueden filtrar por un admin específico
		query = query.Where("admin_id = ?", filterAdminID)
	}
	// Si es admin completo sin filtro, ve todos los trabajadores

	if err := query.Find(&trabajadores).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener trabajadores"})
		return
	}

	now := time.Now()
	for i := range trabajadores {
		t := &trabajadores[i]

		// Calcular Horas Reales (1 día presente = 4 horas, tardanza descuenta proporcionalmente)
		reales := 0.0
		for _, a := range t.Asistencias {
			if a.Estado == "presente" {
				reales += 4.0
			} else if a.Estado == "tardanza" {
				discount := float64(a.MinutosTardanza) / 60.0
				ganadas := 4.0 - discount
				if ganadas < 0 {
					ganadas = 0
				}
				reales += ganadas
			}
		}
		t.HorasReales = reales

		// Calcular Horas Ideales
		if t.FechaInicio != nil {
			mesesTranscurridos := now.Sub(*t.FechaInicio).Hours() / 24 / 30
			if mesesTranscurridos < 0 {
				mesesTranscurridos = 0
			}
			t.HorasIdeales = (float64(t.TotalHorasRequeridas) / float64(t.DuracionMeses)) * mesesTranscurridos
			if t.HorasIdeales > float64(t.TotalHorasRequeridas) {
				t.HorasIdeales = float64(t.TotalHorasRequeridas)
			}
		}
	}

	c.JSON(http.StatusOK, trabajadores)
}

func GetTrabajador(c *gin.Context) {
	admin := c.MustGet("admin").(*models.Admin)
	id := c.Param("id")
	fmt.Printf("DEBUG: Fetching trabajador ID: %s\n", id)

	var t models.Trabajador
	query := database.DB.Preload("Asistencias")

	// Los admin_prueba solo pueden ver sus propios trabajadores
	if admin.Role == models.RoleAdminPrueba {
		query = query.Where("admin_id = ?", admin.ID)
	}

	if err := query.First(&t, id).Error; err != nil {
		fmt.Printf("DEBUG: Error fetching: %v\n", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Trabajador no encontrado"})
		return
	}
	// Calcular Horas Reales (1 día presente = 4 horas, tardanza descuenta proporcionalmente)
	reales := 0.0
	for _, a := range t.Asistencias {
		if a.Estado == "presente" {
			reales += 4.0
		} else if a.Estado == "tardanza" {
			discount := float64(a.MinutosTardanza) / 60.0
			ganadas := 4.0 - discount
			if ganadas < 0 {
				ganadas = 0
			}
			reales += ganadas
		}
	}
	t.HorasReales = reales

	// Calcular Horas Ideales
	if t.FechaInicio != nil {
		now := time.Now()
		mesesTranscurridos := now.Sub(*t.FechaInicio).Hours() / 24 / 30
		if mesesTranscurridos < 0 {
			mesesTranscurridos = 0
		}
		t.HorasIdeales = (float64(t.TotalHorasRequeridas) / float64(t.DuracionMeses)) * mesesTranscurridos
		if t.HorasIdeales > float64(t.TotalHorasRequeridas) {
			t.HorasIdeales = float64(t.TotalHorasRequeridas)
		}
	}

	c.JSON(http.StatusOK, t)
}

func UpdateTrabajador(c *gin.Context) {
	admin := c.MustGet("admin").(*models.Admin)
	id := c.Param("id")

	var t models.Trabajador
	query := database.DB

	// Los admin_prueba solo pueden actualizar sus propios trabajadores
	if admin.Role == models.RoleAdminPrueba {
		query = query.Where("admin_id = ?", admin.ID)
	}

	if err := query.First(&t, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Trabajador no encontrado"})
		return
	}

	if err := c.ShouldBindJSON(&t); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validaciones en actualización - Permitir hasta 4 nombres y caracteres especiales
	nombreRegex := regexp.MustCompile(`^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜïÏ ]{1,100}$`)
	if !nombreRegex.MatchString(t.Nombres) || !nombreRegex.MatchString(t.ApellidoPaterno) || !nombreRegex.MatchString(t.ApellidoMaterno) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Los nombres y apellidos solo deben contener letras, espacios y caracteres especiales válidos (máximo 100 caracteres)"})
		return
	}

	dniRegex := regexp.MustCompile(`^\d{8}$`)
	if !dniRegex.MatchString(t.DNI) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "El DNI debe tener exactamente 8 dígitos numéricos"})
		return
	}

	if t.DuracionMeses <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "La duración en meses debe ser mayor a 0"})
		return
	}

	if err := database.DB.Save(&t).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar"})
		return
	}

	c.JSON(http.StatusOK, t)
}

func DeleteTrabajador(c *gin.Context) {
	id := c.Param("id")
	fmt.Printf("DEBUG: Deleting trabajador ID: %s\n", id)

	// Obtener admin del context para verificar permisos
	admin, exists := c.Get("admin")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "No autenticado"})
		return
	}

	currentAdmin := admin.(*models.Admin)

	// Los usuarios admin_prueba NO pueden eliminar trabajadores
	if currentAdmin.Role == models.RoleAdminPrueba {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Los usuarios demo no pueden eliminar trabajadores. Solo pueden crear y editar.",
			"type":  "DEMO_NO_DELETE",
			"demoInfo": currentAdmin.GetDemoStatus(),
		})
		return
	}

	tx := database.DB.Begin()

	// Borrar asistencias asociadas manualmente por si falla la FK
	if err := tx.Unscoped().Where("trabajador_id = ?", id).Delete(&models.Asistencia{}).Error; err != nil {
		tx.Rollback()
		fmt.Printf("DEBUG: Error deleting associated asistencias: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al eliminar asistencias"})
		return
	}

	if err := tx.Unscoped().Delete(&models.Trabajador{}, id).Error; err != nil {
		tx.Rollback()
		fmt.Printf("DEBUG: Error deleting trabajador: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al eliminar: " + err.Error()})
		return
	}

	// Incrementar contador de eliminaciones para admin_prueba
	if currentAdmin.Role == models.RoleAdminPrueba {
		newCount := currentAdmin.DemoEliminaciones + 1
		if err := tx.Model(&models.Admin{}).Where("id = ?", currentAdmin.ID).Updates(map[string]interface{}{
			"demo_eliminaciones": newCount,
			// Si llega a 2 eliminaciones, bloquear módulos
			"demo_bloqueado": newCount >= 2,
		}).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar contador de eliminaciones"})
			return
		}

		// Si es la segunda eliminación, enviar mensaje especial
		if newCount >= 2 {
			tx.Commit()
			c.JSON(http.StatusOK, gin.H{
				"msg": "Trabajador eliminado correctamente",
				"warning": "⚠️ Has alcanzado el límite de eliminaciones (2/2). Los módulos Trabajadores, Asistencias y Backups han sido bloqueados.",
				"modules_blocked": true,
				"eliminaciones": newCount,
			})
			return
		}
	}

	tx.Commit()
	c.JSON(http.StatusOK, gin.H{"msg": "Eliminado correctamente"})
}
