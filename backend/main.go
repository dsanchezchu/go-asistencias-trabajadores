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
	"strings"

	"github.com/gin-gonic/gin"
)

func setupRoutes(r *gin.Engine, settingsHandler *handlers.SettingsHandler) {
	// CORS y otras configuraciones globales se heredan de r
	registerAPI := func(rg *gin.RouterGroup) {
		rg.POST("/login", handlers.Login)
		rg.POST("/register", handlers.Register)

		protected := rg.Group("")
		protected.Use(middleware.AuthMiddleware())
		{
			protected.GET("/me", handlers.GetMe)
			protected.PATCH("/user/settings", settingsHandler.UpdateSettings)
			protected.GET("/reniec", handlers.ConsultarReniec)
			protected.GET("/demo/status", handlers.GetDemoStatus)
			protected.POST("/demo/request-access", handlers.RequestAccess)

			adminOnly := protected.Group("")
			adminOnly.Use(middleware.RequireAdmin())
			{
				adminOnly.GET("/admin/demo-users", handlers.ListDemoUsers)
				adminOnly.POST("/admin/reset-user/:user_id", handlers.AdminResetUser)
			}

			modulesGroup := protected.Group("")
			modulesGroup.Use(middleware.DemoBlockModules())
			{
				modulesGroup.GET("/trabajadores", handlers.GetTrabajadores)
				modulesGroup.GET("/trabajadores/:id", handlers.GetTrabajador)
				trabajadoresLimited := modulesGroup.Group("")
				trabajadoresLimited.Use(middleware.DemoLimitTrabajadores())
				{
					trabajadoresLimited.POST("/trabajadores", handlers.CreateTrabajador)
				}
				trabajadoresActions := modulesGroup.Group("")
				trabajadoresActions.Use(middleware.DemoLimitAsistencias())
				{
					trabajadoresActions.PUT("/trabajadores/:id", handlers.UpdateTrabajador)
					trabajadoresActions.DELETE("/trabajadores/:id", handlers.DeleteTrabajador)
				}
				modulesGroup.GET("/asistencias", handlers.GetAllAsistencias)
				modulesGroup.GET("/asistencias/fecha", handlers.GetAsistenciasByDate)
				asistenciasLimited := modulesGroup.Group("")
				asistenciasLimited.Use(middleware.DemoLimitAsistenciasStrict())
				{
					asistenciasLimited.POST("/asistencias", handlers.CreateAsistencia)
					asistenciasLimited.POST("/asistencias/batch", handlers.BatchUpdateAsistencias)
				}
				modulesGroup.GET("/backups/list", handlers.ListBackups)
				modulesGroup.GET("/backups/download/:filename", handlers.DownloadBackup)
				backupsLimited := modulesGroup.Group("")
				backupsLimited.Use(middleware.DemoLimitBackups())
				{
					backupsLimited.POST("/backups/create", handlers.CreateBackup)
				}
			}
			protected.POST("/demo/reset", handlers.ResetDemo)
		}
	}

	// Registrar rutas originales y con prefijo de Cloudflare
	basePath := "/proyectos/asistencias"
	registerAPI(r.Group("/api"))
	registerAPI(r.Group(basePath + "/api"))
}

func main() {
	cfg := config.Load()
	database.Connect(cfg)

	userRepo := repositories.NewGormUserRepository(database.DB)
	userService := services.NewUserService(userRepo)
	settingsHandler := handlers.NewSettingsHandler(userService)

	r := gin.Default()

	r.Use(func(c *gin.Context) {
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

	setupRoutes(r, settingsHandler)

	staticPath := filepath.Join(".", "frontend", "out")
	basePath := "/proyectos/asistencias"

	if _, err := os.Stat(staticPath); err == nil {
		r.Static(basePath+"/_next", filepath.Join(staticPath, "_next"))
		r.Static(basePath+"/images", filepath.Join(staticPath, "images"))
		r.StaticFile(basePath+"/favicon.ico", filepath.Join(staticPath, "favicon.ico"))
		r.StaticFile(basePath+"/manifest.json", filepath.Join(staticPath, "manifest.json"))
		r.StaticFile(basePath+"/robots.txt", filepath.Join(staticPath, "robots.txt"))

		r.Static("/_next", filepath.Join(staticPath, "_next"))
		r.Static("/images", filepath.Join(staticPath, "images"))
		r.StaticFile("/favicon.ico", filepath.Join(staticPath, "favicon.ico"))
		r.StaticFile("/manifest.json", filepath.Join(staticPath, "manifest.json"))
		r.StaticFile("/robots.txt", filepath.Join(staticPath, "robots.txt"))

		r.NoRoute(func(c *gin.Context) {
			path := c.Request.URL.Path
			if strings.HasPrefix(path, "/api") || strings.HasPrefix(path, basePath+"/api") {
				c.JSON(http.StatusNotFound, gin.H{"error": "API endpoint not found"})
				return
			}
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

