package handlers

import (
	"fmt"
	"go-asistencias/backend/database"
	"go-asistencias/backend/models"
	"go-asistencias/backend/services"
	"go-asistencias/backend/utils"
	"net/http"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

func Login(c *gin.Context) {
	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}
	fmt.Printf("Intento de login para usuario: %s\n", req.Username)

	var admin models.Admin
	if err := database.DB.Where("username = ?", req.Username).First(&admin).Error; err != nil {
		fmt.Printf("Usuario no encontrado: %s\n", req.Username)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Credenciales inválidas"})
		return
	}

	if !admin.Approved {
		c.JSON(http.StatusForbidden, gin.H{"error": "Cuenta pendiente de aprobación por el administrador"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(admin.Password), []byte(req.Password)); err != nil {
		fmt.Println("Contraseña incorrecta")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Credenciales inválidas"})
		return
	}

	fmt.Println("Login exitoso")
	token, _ := utils.GenerateJWT(admin.Username)
	c.JSON(http.StatusOK, gin.H{"token": token, "theme": admin.Theme})
}

func GetMe(c *gin.Context) {
	username, _ := c.Get("username")
	var admin models.Admin
	if err := database.DB.Where("username = ?", username).First(&admin).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Usuario no encontrado"})
		return
	}
	c.JSON(http.StatusOK, admin)
}

type SettingsHandler struct {
	userService *services.UserService
}

func NewSettingsHandler(s *services.UserService) *SettingsHandler {
	return &SettingsHandler{userService: s}
}

func (h *SettingsHandler) UpdateSettings(c *gin.Context) {
	username, _ := c.Get("username")
	var req struct {
		Theme string `json:"theme"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	if err := h.userService.SetUserTheme(username.(string), req.Theme); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar configuración"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"msg": "Configuración actualizada", "theme": req.Theme})
}

func Register(c *gin.Context) {
	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	var existing models.Admin
	if err := database.DB.Where("username = ?", req.Username).First(&existing).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "El nombre de usuario ya está en uso"})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al procesar contraseña"})
		return
	}

	admin := models.Admin{
		Username: req.Username,
		Password: string(hashedPassword),
		Approved: false, // Por defecto requiere aprobación manual
		Theme:    "dark",
	}

	if err := database.DB.Create(&admin).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al registrar usuario"})
		return
	}

	go func() {
		emailService := services.NewEmailService()
		emailService.SendRegistrationNotification(admin.Username)
	}()

	c.JSON(http.StatusOK, gin.H{"msg": "Registro exitoso. Espere la aprobación manual del administrador."})
}
