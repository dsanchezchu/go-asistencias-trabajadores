package handlers

import (
	"go-asistencias/backend/config"
	"go-asistencias/backend/database"
	"go-asistencias/backend/models"
	"go-asistencias/backend/utils"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func CreateBackup(c *gin.Context) {
	// Obtener admin del context
	admin, exists := c.Get("admin")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "No autenticado"})
		return
	}

	currentAdmin := admin.(*models.Admin)

	filename, err := utils.CreateBackup(currentAdmin)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear backup: " + err.Error()})
		return
	}

	// Actualizar contador para usuarios demo
	if currentAdmin.Role == models.RoleAdminPrueba {
		database.DB.Model(&models.Admin{}).Where("id = ?", currentAdmin.ID).
			Update("demo_backups_creados", gorm.Expr("demo_backups_creados + 1"))
	}

	c.JSON(http.StatusOK, gin.H{"filename": filename})
}

func ListBackups(c *gin.Context) {
	admin, exists := c.Get("admin")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "No autenticado"})
		return
	}

	currentAdmin := admin.(*models.Admin)

	// Soporte para filtrar por admin_id
	filterAdminID := c.Query("filter_admin_id")
	targetAdmin := currentAdmin

	if currentAdmin.Role == models.RoleAdmin && filterAdminID != "" {
		// El admin completo quiere ver los backups de un usuario demo
		var target models.Admin
		if err := database.DB.Where("id = ?", filterAdminID).First(&target).Error; err == nil {
			targetAdmin = &target
		}
	}

	backups, err := utils.ListBackups(targetAdmin)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al listar backups"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"backups": backups})
}

func DownloadBackup(c *gin.Context) {
	filename := c.Param("filename")
	if filename == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "filename is required"})
		return
	}

	// Seguridad: Evitar Path Traversal
	if strings.Contains(filename, "..") || strings.Contains(filename, "/") || strings.Contains(filename, "\\") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid filename"})
		return
	}

	admin, exists := c.Get("admin")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "No autenticado"})
		return
	}

	currentAdmin := admin.(*models.Admin)
	cfg := config.Load()

	// Soporte para filtrar por admin_id en descarga
	filterAdminID := c.Query("filter_admin_id")
	targetAdmin := currentAdmin

	if currentAdmin.Role == models.RoleAdmin && filterAdminID != "" {
		var target models.Admin
		if err := database.DB.Where("id = ?", filterAdminID).First(&target).Error; err == nil {
			targetAdmin = &target
		}
	}

	// Determinar path correcto según rol del usuario objetivo
	var filePath string
	if targetAdmin.Role == models.RoleAdminPrueba {
		userHash := utils.GenerateUserHash(targetAdmin)
		filePath = filepath.Join(cfg.BackupDir, "demo", userHash, filename)
	} else {
		filePath = filepath.Join(cfg.BackupDir, filename)
	}

	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "file not found"})
		return
	}

	c.Header("Content-Type", "application/octet-stream")
	c.FileAttachment(filePath, filename)
}
