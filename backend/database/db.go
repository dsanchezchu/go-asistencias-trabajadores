package database

import (
	"fmt"
	"go-asistencias/backend/config"
	"go-asistencias/backend/models"
	"log"
	"time"

	"gorm.io/driver/mysql"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect(cfg *config.Config) {
	var dsn string
	var dialector gorm.Dialector

	if cfg.DBConnection == "postgres" {
		dsn = fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=5432 sslmode=require TimeZone=America/Lima",
			cfg.DBHost, cfg.DBUser, cfg.DBPassword, cfg.DBName)
		dialector = postgres.Open(dsn)
	} else {
		// Por defecto mysql
		dsn = fmt.Sprintf("%s:%s@tcp(%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
			cfg.DBUser, cfg.DBPassword, cfg.DBHost, cfg.DBName)
		dialector = mysql.Open(dsn)
	}

	var err error
	maxRetries := 5
	for i := 1; i <= maxRetries; i++ {
		log.Printf("Intentando conectar a DB (Intento %d/%d)...", i, maxRetries)
		DB, err = gorm.Open(dialector, &gorm.Config{})
		if err == nil {
			break
		}
		if i < maxRetries {
			log.Printf("Error al conectar: %v. Reintentando en 5s...", err)
			time.Sleep(5 * time.Second)
		}
	}

	if err != nil {
		log.Fatalf("Error fatal: No se pudo conectar a la base de datos tras %d intentos: %v", maxRetries, err)
	}

	// Crear tablas
	log.Println("Conexión establecida. Sincronizando tablas...")
	DB.AutoMigrate(&models.Admin{}, &models.Trabajador{}, &models.Asistencia{})

	// REMOVIDO: Ya no se asigna automáticamente rol admin al primer usuario
	// Ahora todos los usuarios nuevos se crean como admin_prueba por defecto
	// DB.Model(&models.Admin{}).Where("id = 1 AND (role IS NULL OR role = '' OR role = 'admin_prueba')").Update("role", models.RoleAdmin)

	log.Println("Base de datos sincronizada")
}
