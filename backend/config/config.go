package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DBUser        string
	DBPassword    string
	DBHost        string
	DBName        string
	JWTSecret     string
	BackupDir     string
	MysqlDumpPath string
	MysqlDumpArgs string
	ReniecToken   string
	Port          string
}

func Load() *Config {
	// Intentar cargar .env pero de forma silenciosa si no existe (normal en Docker)
	_ = godotenv.Load()

	return &Config{
		DBUser:        getEnv("DB_USER", ""),
		DBPassword:    getEnv("DB_PASSWORD", ""),
		DBHost:        getEnv("DB_HOST", "localhost:3306"),
		DBName:        getEnv("DB_NAME", ""),
		JWTSecret:     getEnv("JWT_SECRET", "secret"),
		BackupDir:     getEnv("BACKUP_DIR", "./backups"),
		MysqlDumpPath: getEnv("MYSQLDUMP_PATH", "mysqldump"),
		MysqlDumpArgs: getEnv("MYSQLDUMP_ARGS", ""),
		ReniecToken:   getEnv("RENIEC_TOKEN", ""),
		Port:          getEnv("PORT", "8080"),
	}
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
