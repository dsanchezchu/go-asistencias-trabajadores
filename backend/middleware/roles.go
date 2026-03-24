package middleware

import (
	"go-asistencias/backend/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// getDemoInfo retorna información del estado de la demo
func getDemoInfo(admin *models.Admin) map[string]interface{} {
	if admin.Role == models.RoleAdmin {
		return map[string]interface{}{
			"is_demo":   false,
			"unlimited": true,
		}
	}

	info := map[string]interface{}{
		"role":                      admin.Role,
		"demo_trabajadores_creados": admin.DemoTrabajadoresCreados,
		"limite_trabajadores":       1,
		"demo_backups_creados":      admin.DemoBackupsCreados,
		"limite_backups":            1,
		"demo_eliminaciones":        admin.DemoEliminaciones,
		"limite_eliminaciones":      2,
		"demo_asistencias_creadas":  admin.DemoAsistenciasCreadas,
		"limite_asistencias":        3,
		"demo_bloqueado":            admin.DemoBloqueado,
		"modules_blocked":           admin.IsModuleBlocked(),
		"backups_agotados":          admin.DemoBackupsCreados >= 1,
		"eliminaciones_agotadas":    admin.DemoEliminaciones >= 2,
		"asistencias_agotadas":      admin.DemoAsistenciasCreadas >= 3,
	}

	if admin.DemoFirstAsistencia != nil {
		expiracion := admin.DemoFirstAsistencia.Add(72 * time.Hour)
		info["demo_first_asistencia"] = admin.DemoFirstAsistencia
		info["demo_expira"] = expiracion
		diasRestantes := int(time.Until(expiracion).Hours() / 24)
		if diasRestantes < 0 {
			diasRestantes = 0
		}
		info["dias_restantes"] = diasRestantes
	}

	return info
}

// RequireAdmin verifica que el usuario sea admin completo
func RequireAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		admin, exists := c.Get("admin")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "No autenticado"})
			c.Abort()
			return
		}

		currentAdmin := admin.(*models.Admin)
		if currentAdmin.Role != models.RoleAdmin {
			c.JSON(http.StatusForbidden, gin.H{"error": "Acceso denegado. Se requiere rol de administrador."})
			c.Abort()
			return
		}
		c.Next()
	}
}

// DemoLimitTrabajadores verifica límites de trabajadores para admin_prueba
func DemoLimitTrabajadores() gin.HandlerFunc {
	return func(c *gin.Context) {
		admin, exists := c.Get("admin")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "No autenticado"})
			c.Abort()
			return
		}

		currentAdmin := admin.(*models.Admin)
		if currentAdmin.Role == models.RoleAdmin {
			c.Next()
			return
		}

		// Verificar límite de trabajadores para admin_prueba
		if currentAdmin.DemoTrabajadoresCreados >= 1 {
			msg := "Límite de demo alcanzado. Solo puedes crear 1 trabajador en modo prueba."
			respType := "TRABAJADORES_LIMIT"
			if currentAdmin.IsFullyExhausted() {
				msg += " Has agotado todos tus créditos de prueba. Contacta al administrador para solicitar acceso completo."
				respType = "FULLY_EXHAUSTED"
			}
			c.JSON(http.StatusForbidden, gin.H{
				"error":    msg,
				"type":     respType,
				"demoInfo": getDemoInfo(currentAdmin),
			})
			c.Abort()
			return
		}
		c.Next()
	}
}

// DemoLimitAsistencias verifica si la demo de 3 días ha expirado
func DemoLimitAsistencias() gin.HandlerFunc {
	return func(c *gin.Context) {
		admin, exists := c.Get("admin")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "No autenticado"})
			c.Abort()
			return
		}

		currentAdmin := admin.(*models.Admin)
		if currentAdmin.Role == models.RoleAdmin {
			c.Next()
			return
		}

		// Verificar expiración de demo
		if currentAdmin.IsDemoExpired() {
			c.JSON(http.StatusForbidden, gin.H{
				"error":    "Tu período de prueba de 3 días ha expirado. Contacta al administrador para obtener acceso completo.",
				"demoInfo": getDemoInfo(currentAdmin),
			})
			c.Abort()
			return
		}
		c.Next()
	}
}

// DemoLimitBackups limita backups a 1 máximo para admin_prueba
func DemoLimitBackups() gin.HandlerFunc {
	return func(c *gin.Context) {
		admin, exists := c.Get("admin")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "No autenticado"})
			c.Abort()
			return
		}

		currentAdmin := admin.(*models.Admin)

		// Administradores completos pasan sin restricciones
		if currentAdmin.Role == models.RoleAdmin {
			c.Next()
			return
		}

		// Verificar límite de backups para admin_prueba
		if !currentAdmin.CanCreateBackup() {
			msg := "Límite de demo alcanzado. Solo puedes crear 1 backup en modo prueba."
			respType := "BACKUPS_LIMIT"
			if currentAdmin.IsFullyExhausted() {
				msg += " Has agotado todos tus créditos de prueba. Contacta al administrador para solicitar acceso completo."
				respType = "FULLY_EXHAUSTED"
			}
			c.JSON(http.StatusForbidden, gin.H{
				"error":    msg,
				"type":     respType,
				"demoInfo": getDemoInfo(currentAdmin),
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// DemoLimitExport bloquea exportación para admin_prueba
func DemoLimitExport() gin.HandlerFunc {
	return func(c *gin.Context) {
		admin, exists := c.Get("admin")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "No autenticado"})
			c.Abort()
			return
		}

		currentAdmin := admin.(*models.Admin)
		if currentAdmin.Role == models.RoleAdminPrueba {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "La exportación a Excel no está disponible en modo prueba.",
			})
			c.Abort()
			return
		}
		c.Next()
	}
}

// DemoLimitAsistenciasStrict verifica límite estricto de 3 asistencias
func DemoLimitAsistenciasStrict() gin.HandlerFunc {
	return func(c *gin.Context) {
		admin, exists := c.Get("admin")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "No autenticado"})
			c.Abort()
			return
		}

		currentAdmin := admin.(*models.Admin)
		if currentAdmin.Role == models.RoleAdmin {
			c.Next()
			return
		}

		// Verificar si los módulos están bloqueados
		if currentAdmin.IsModuleBlocked() {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Acceso bloqueado. Has superado el límite de eliminaciones permitidas (2/2).",
				"type":  "MODULES_BLOCKED",
				"demoInfo": getDemoInfo(currentAdmin),
			})
			c.Abort()
			return
		}

		// Verificar límite de asistencias
		if !currentAdmin.CanCreateAsistencia() {
			msg := "Límite de asistencias alcanzado. Solo puedes registrar 3 asistencias en modo demo."
			respType := "ASISTENCIAS_LIMIT"
			if currentAdmin.IsFullyExhausted() {
				msg += " Has agotado todos tus créditos de prueba. Contacta al administrador para solicitar acceso completo."
				respType = "FULLY_EXHAUSTED"
			}
			c.JSON(http.StatusForbidden, gin.H{
				"error":    msg,
				"type":     respType,
				"demoInfo": getDemoInfo(currentAdmin),
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// DemoBlockModules bloquea acceso a módulos para usuarios con límites superados
func DemoBlockModules() gin.HandlerFunc {
	return func(c *gin.Context) {
		admin, exists := c.Get("admin")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "No autenticado"})
			c.Abort()
			return
		}

		currentAdmin := admin.(*models.Admin)
		if currentAdmin.Role == models.RoleAdmin {
			c.Next()
			return
		}

		// Verificar si los módulos están bloqueados
		if currentAdmin.IsModuleBlocked() {
			msg := "Acceso bloqueado. Has superado el límite de eliminaciones permitidas (2/2)."
			respType := "MODULES_BLOCKED"
			if currentAdmin.IsFullyExhausted() {
				msg += " Contacta al administrador para solicitar acceso completo."
				respType = "FULLY_EXHAUSTED"
			}
			c.JSON(http.StatusForbidden, gin.H{
				"error":           msg,
				"type":            respType,
				"demoInfo":        getDemoInfo(currentAdmin),
				"blocked_modules": []string{"trabajadores", "asistencias", "backups"},
			})
			c.Abort()
			return
		}

		c.Next()
	}
}
