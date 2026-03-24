package database

import (
	"fmt"
	"go-asistencias/backend/config"
	"go-asistencias/backend/models"
	"log"
	"strings"
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
		host := cfg.DBHost
		port := "5432"
		
		if strings.Contains(cfg.DBHost, ":") {
			parts := strings.Split(cfg.DBHost, ":")
			host = parts[0]
			if len(parts) > 1 {
				port = parts[1]
			}
		}

		dsn = fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=require TimeZone=America/Lima",
			host, port, cfg.DBUser, cfg.DBPassword, cfg.DBName)
		dialector = postgres.Open(dsn)
	} else {
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

	log.Println("Conexión establecida. Sincronizando tablas...")
	DB.AutoMigrate(&models.Admin{}, &models.Trabajador{}, &models.Asistencia{})

	log.Println("Base de datos sincronizada")
}
