package main

import (
	"go-asistencias/backend/config"
	"go-asistencias/backend/database"
	"go-asistencias/backend/handlers"
	"go-asistencias/backend/middleware"
	"go-asistencias/backend/repositories"
	"go-asistencias/backend/services"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()
	database.Connect(cfg)

	// Dependency Injection (DIP)
	userRepo := repositories.NewGormUserRepository(database.DB)
	userService := services.NewUserService(userRepo)
	settingsHandler := handlers.NewSettingsHandler(userService)

	r := gin.Default()

	// Middleware CORS robusto
	r.Use(func(c *gin.Context) {
		log.Printf("Petición %s %s desde origin: %s", c.Request.Method, c.Request.URL.Path, c.GetHeader("Origin"))
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Header("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")
		c.Header("Access-Control-Max-Age", "86400")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Rutas protegidas (todas bajo /api)
	api := r.Group("/api")
	{
		// Rutas públicas dentro de /api para facilitar routing de Nginx
		api.POST("/login", handlers.Login)
		api.POST("/register", handlers.Register)

		// Rutas protegidas
		protected := api.Group("")
		protected.Use(middleware.AuthMiddleware())
		{
			// Rutas sin restricciones adicionales
			protected.GET("/me", handlers.GetMe)
			protected.PATCH("/user/settings", settingsHandler.UpdateSettings)
			protected.GET("/reniec", handlers.ConsultarReniec)

			// Endpoint de demo (disponible siempre)
			protected.GET("/demo/status", handlers.GetDemoStatus)
			protected.POST("/demo/request-access", handlers.RequestAccess) // Nuevo: Solicitar acceso

			// Rutas de administrador completo (Panel Admin)
			adminOnly := protected.Group("")
			adminOnly.Use(middleware.RequireAdmin())
			{
				adminOnly.GET("/admin/demo-users", handlers.ListDemoUsers)
				adminOnly.POST("/admin/reset-user/:user_id", handlers.AdminResetUser)
			}

			// Módulos que pueden bloquearse por eliminaciones excesivas
			modulesGroup := protected.Group("")
			modulesGroup.Use(middleware.DemoBlockModules()) // Bloquea si demo_eliminaciones >= 2
			{
				// === MÓDULO TRABAJADORES ===
				modulesGroup.GET("/trabajadores", handlers.GetTrabajadores)
				modulesGroup.GET("/trabajadores/:id", handlers.GetTrabajador)

				// Crear trabajador (límite 1 para demo)
				trabajadoresLimited := modulesGroup.Group("")
				trabajadoresLimited.Use(middleware.DemoLimitTrabajadores())
				{
					trabajadoresLimited.POST("/trabajadores", handlers.CreateTrabajador)
				}

				// Modificar/Eliminar trabajador (cuenta eliminaciones)
				trabajadoresActions := modulesGroup.Group("")
				trabajadoresActions.Use(middleware.DemoLimitAsistencias()) // Verifica expiración 3 días
				{
					trabajadoresActions.PUT("/trabajadores/:id", handlers.UpdateTrabajador)
					trabajadoresActions.DELETE("/trabajadores/:id", handlers.DeleteTrabajador)
				}

				// === MÓDULO ASISTENCIAS ===
				modulesGroup.GET("/asistencias", handlers.GetAllAsistencias)
				modulesGroup.GET("/asistencias/fecha", handlers.GetAsistenciasByDate)

				// Crear asistencias (límite 3 para demo)
				asistenciasLimited := modulesGroup.Group("")
				asistenciasLimited.Use(middleware.DemoLimitAsistenciasStrict()) // Nuevo middleware estricto
				{
					asistenciasLimited.POST("/asistencias", handlers.CreateAsistencia)
					asistenciasLimited.POST("/asistencias/batch", handlers.BatchUpdateAsistencias)
				}

				// === MÓDULO BACKUPS ===
				modulesGroup.GET("/backups/list", handlers.ListBackups)
				modulesGroup.GET("/backups/download/:filename", handlers.DownloadBackup)

				// Crear backup (límite 1 para demo)
				backupsLimited := modulesGroup.Group("")
				backupsLimited.Use(middleware.DemoLimitBackups())
				{
					backupsLimited.POST("/backups/create", handlers.CreateBackup)
				}
			}

			// Reset demo (solo para admin_prueba, fuera del bloqueo)
			protected.POST("/demo/reset", handlers.ResetDemo)
		}
	}

	// Servir archivos estáticos del frontend
	staticPath := filepath.Join(".", "frontend", "out")
	if _, err := os.Stat(staticPath); err == nil {
		// Servir archivos estáticos de Next.js
		r.Static("/static", filepath.Join(staticPath, "static"))
		r.StaticFile("/favicon.ico", filepath.Join(staticPath, "favicon.ico"))
		r.StaticFile("/manifest.json", filepath.Join(staticPath, "manifest.json"))
		r.StaticFile("/robots.txt", filepath.Join(staticPath, "robots.txt"))

		// Manejar rutas SPA - todas las rutas no-API van al index.html
		r.NoRoute(func(c *gin.Context) {
			// Si la ruta comienza con /api, no es una ruta del frontend
			if len(c.Request.URL.Path) > 4 && c.Request.URL.Path[:4] == "/api" {
				c.JSON(http.StatusNotFound, gin.H{"error": "API endpoint not found"})
				return
			}

			// Para todas las demás rutas, servir index.html (SPA routing)
			c.File(filepath.Join(staticPath, "index.html"))
		})
	} else {
		log.Printf("Frontend static files not found at %s. Running in API-only mode.", staticPath)
		r.GET("/", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "Go Asistencias API Server", "status": "running"})
		})
	}

	log.Printf("Servidor iniciado en el puerto %s", cfg.Port)
	r.Run(":" + cfg.Port)
}
