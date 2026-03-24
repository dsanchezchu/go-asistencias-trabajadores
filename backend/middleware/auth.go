package middleware

import (
	"go-asistencias/backend/database"
	"go-asistencias/backend/models"
	"go-asistencias/backend/utils"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization format must be Bearer {token}"})
			c.Abort()
			return
		}

		username, err := utils.ValidateJWT(parts[1])
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		// Cargar admin completo al contexto
		var admin models.Admin
		if err := database.DB.Where("username = ?", username).First(&admin).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuario no encontrado"})
			c.Abort()
			return
		}

		c.Set("username", username)
		c.Set("admin", &admin)
		c.Set("role", admin.Role)
		c.Next()
	}
}
