// backend/utils/backup.go
package utils

import (
	"bytes"
	"crypto/sha256"
	"fmt"
	"go-asistencias/backend/config"
	"go-asistencias/backend/models"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

// GenerateUserHash genera hash único por usuario
func GenerateUserHash(admin *models.Admin) string {
	hasher := sha256.New()
	hasher.Write([]byte(fmt.Sprintf("%s_%d", admin.Username, admin.ID)))
	return fmt.Sprintf("%x", hasher.Sum(nil))[:16] // Primeros 16 caracteres
}

func validateDumpPath(isPostgres bool) (string, error) {
	envKey := "MYSQLDUMP_PATH"
	if isPostgres {
		envKey = "PG_DUMP_PATH"
	}
	dumpBin := os.Getenv(envKey)

	if dumpBin == "" {
		if runtime.GOOS == "windows" {
			if isPostgres {
				defaultPaths := []string{
					"C:\\Program Files\\PostgreSQL\\15\\bin\\pg_dump.exe",
					"C:\\Program Files\\PostgreSQL\\14\\bin\\pg_dump.exe",
				}
				for _, path := range defaultPaths {
					if _, err := os.Stat(path); err == nil {
						dumpBin = path
						break
					}
				}
			} else {
				defaultPaths := []string{
					"C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe",
					"C:\\Program Files\\MySQL\\MySQL Server 5.7\\bin\\mysqldump.exe",
					"C:\\xampp\\mysql\\bin\\mysqldump.exe",
					"C:\\wamp64\\bin\\mysql\\mysql8.0.31\\bin\\mysqldump.exe",
				}
				for _, path := range defaultPaths {
					if _, err := os.Stat(path); err == nil {
						dumpBin = path
						break
					}
				}
			}
			if dumpBin == "" {
				binName := "mysqldump"
				if isPostgres {
					binName = "pg_dump"
				}
				return "", fmt.Errorf("%s no encontrado. Configure %s en variables de entorno", binName, envKey)
			}
		} else {
			if isPostgres {
				dumpBin = "pg_dump"
			} else {
				dumpBin = "mysqldump"
			}
		}
	}
    // If it's a direct command like "pg_dump" or "mysqldump" rely on $PATH instead of Stat
	if filepath.IsAbs(dumpBin) || strings.Contains(dumpBin, string(os.PathSeparator)) {
		dumpBin = filepath.Clean(filepath.FromSlash(dumpBin))
		if _, err := os.Stat(dumpBin); os.IsNotExist(err) {
			return "", fmt.Errorf("el binario no existe en la ruta: %s", dumpBin)
		}
	}

	return dumpBin, nil
}

// validateDBConfig valida que las variables de entorno de la BD estén configuradas
func validateDBConfig() error {
	requiredEnvs := []string{"DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"}
	for _, env := range requiredEnvs {
		if os.Getenv(env) == "" {
			return fmt.Errorf("variable de entorno requerida no configurada: %s", env)
		}
	}
	return nil
}

func CreateBackup(admin *models.Admin) (string, error) {
	cfg := config.Load()
	isPostgres := cfg.DBConnection == "postgres"

	// Validar configuración de la base de datos
	if err := validateDBConfig(); err != nil {
		return "", fmt.Errorf("configuración de BD inválida: %v", err)
	}

	// Validar ruta del binario de dump
	dumpBin, err := validateDumpPath(isPostgres)
	if err != nil {
		return "", err
	}

	// Configurar directorios
	baseBackupDir := os.Getenv("BACKUP_DIR")
	if baseBackupDir == "" {
		baseBackupDir = "./backups"
	}

	var backupDir string
	if admin.Role == models.RoleAdminPrueba {
		userHash := GenerateUserHash(admin)
		backupDir = filepath.Join(baseBackupDir, "demo", userHash)
	} else {
		backupDir = baseBackupDir
	}

	// Crear directorio si no existe
	if err := os.MkdirAll(backupDir, 0755); err != nil {
		return "", fmt.Errorf("error creando directorio de backups: %v", err)
	}

	var fileName string
	peruLocation, _ := time.LoadLocation("America/Lima")
	peruTime := time.Now().In(peruLocation)

	prefix := "backup"
	if admin.Role == models.RoleAdminPrueba {
		prefix = "demo backup"
	}
	fileName = fmt.Sprintf("%s %s.sql", prefix, peruTime.Format("2006-01-02 15-04-05"))
	outPath := filepath.Join(backupDir, fileName)

	dbHost := os.Getenv("DB_HOST")
	var hostArg, portArg string

	if strings.Contains(dbHost, ":") {
		parts := strings.Split(dbHost, ":")
		hostArg = parts[0]
		if len(parts) > 1 {
			portArg = parts[1]
		}
	} else {
		hostArg = dbHost
		portArg = "3306"
		if isPostgres {
			portArg = "5432"
		}
	}

	outfile, err := os.Create(outPath)
	if err != nil {
		return "", fmt.Errorf("error creando archivo de backup: %v", err)
	}
	defer outfile.Close()

	if isPostgres {
		// PostgreSQL Backend Logic
		os.Setenv("PGPASSWORD", os.Getenv("DB_PASSWORD"))
		defer os.Unsetenv("PGPASSWORD")

		args := []string{
			"-h", hostArg,
			"-p", portArg,
			"-U", os.Getenv("DB_USER"),
			"-d", os.Getenv("DB_NAME"),
		}

		if admin.Role == models.RoleAdminPrueba {
			// Demo filter not fully supported natively in pg_dump without complex commands.
			// Falling back to full schema but could filter tables.
			args = append(args, "-t", "trabajadores", "-t", "asistencias")
		}

		cmd := exec.Command(dumpBin, args...)
		var stderr bytes.Buffer
		cmd.Stdout = outfile
		cmd.Stderr = &stderr
		if err := cmd.Run(); err != nil {
			os.Remove(outPath)
			return "", fmt.Errorf("error ejecutando pg_dump: %v\nStderr: %s", err, stderr.String())
		}
	} else {
		// MySQL Backend Logic
		args := []string{
			"-h", hostArg,
			"-P", portArg,
			"-u", os.Getenv("DB_USER"),
			"-p" + os.Getenv("DB_PASSWORD"),
			"--no-tablespaces",
			"--single-transaction",
			"--routines",
			"--triggers",
			"--default-character-set=utf8mb4",
			os.Getenv("DB_NAME"),
		}

		if admin.Role == models.RoleAdminPrueba {
			args1 := append(args, "trabajadores", "--where=admin_id="+fmt.Sprint(admin.ID))
			cmd1 := exec.Command(dumpBin, args1...)
			var stderr1 bytes.Buffer
			cmd1.Stdout = outfile
			cmd1.Stderr = &stderr1
			if err := cmd1.Run(); err != nil {
				os.Remove(outPath)
				return "", fmt.Errorf("error dumping trabajadores: %v\nStderr: %s", err, stderr1.String())
			}

			args2 := append(args, "asistencias", "--where=trabajador_id IN (SELECT id FROM trabajadores WHERE admin_id="+fmt.Sprint(admin.ID)+")")
			cmd2 := exec.Command(dumpBin, args2...)
			var stderr2 bytes.Buffer
			cmd2.Stdout = outfile
			cmd2.Stderr = &stderr2
			if err := cmd2.Run(); err != nil {
				return "", fmt.Errorf("error dumping asistencias: %v\nStderr: %s", err, stderr2.String())
			}
		} else {
			cmd := exec.Command(dumpBin, args...)
			var stderr bytes.Buffer
			cmd.Stdout = outfile
			cmd.Stderr = &stderr
			if err := cmd.Run(); err != nil {
				os.Remove(outPath)
				return "", fmt.Errorf("error ejecutando mysqldump: %v\nStderr: %s", err, stderr.String())
			}
		}
	}

	stat, err := outfile.Stat()
	if err != nil {
		return "", fmt.Errorf("error verificando archivo de backup: %v", err)
	}
	if stat.Size() == 0 {
		os.Remove(outPath)
		return "", fmt.Errorf("backup creado pero está vacío")
	}

	return fileName, nil
}

func ListBackups(admin *models.Admin) ([]string, error) {
	cfg := config.Load()

	// Determinar directorio correcto por usuario
	var backupDir string
	if admin.Role == models.RoleAdminPrueba {
		userHash := GenerateUserHash(admin)
		backupDir = filepath.Join(cfg.BackupDir, "demo", userHash)
	} else {
		backupDir = cfg.BackupDir
	}

	files, err := os.ReadDir(backupDir)
	if err != nil {
		if os.IsNotExist(err) {
			return []string{}, nil
		}
		return nil, err
	}

	var backups []string
	for _, file := range files {
		if !file.IsDir() && strings.HasSuffix(file.Name(), ".sql") {
			backups = append(backups, file.Name())
		}
	}

	return backups, nil
}
