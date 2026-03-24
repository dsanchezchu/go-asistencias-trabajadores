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

// validateMysqldumpPath valida que el binario mysqldump exista
func validateMysqldumpPath() (string, error) {
	mysqldumpBin := os.Getenv("MYSQLDUMP_PATH")
	if mysqldumpBin == "" {
		// Rutas por defecto según el sistema operativo
		if runtime.GOOS == "windows" {
			// Rutas comunes en Windows
			defaultPaths := []string{
				"C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe",
				"C:\\Program Files\\MySQL\\MySQL Server 5.7\\bin\\mysqldump.exe",
				"C:\\xampp\\mysql\\bin\\mysqldump.exe",
				"C:\\wamp64\\bin\\mysql\\mysql8.0.31\\bin\\mysqldump.exe",
			}
			for _, path := range defaultPaths {
				if _, err := os.Stat(path); err == nil {
					mysqldumpBin = path
					break
				}
			}
			if mysqldumpBin == "" {
				return "", fmt.Errorf("mysqldump no encontrado en rutas comunes de Windows. Configure MYSQLDUMP_PATH en variables de entorno")
			}
		} else {
			// Unix/Linux
			mysqldumpBin = "/usr/bin/mysqldump"
		}
	}

	mysqldumpBin = filepath.Clean(filepath.FromSlash(mysqldumpBin))

	if _, err := os.Stat(mysqldumpBin); os.IsNotExist(err) {
		return "", fmt.Errorf("el binario de mysqldump no existe en la ruta: %s", mysqldumpBin)
	}

	return mysqldumpBin, nil
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
	// Validar configuración de la base de datos
	if err := validateDBConfig(); err != nil {
		return "", fmt.Errorf("configuración de BD inválida: %v", err)
	}

	// Validar ruta de mysqldump
	mysqldumpBin, err := validateMysqldumpPath()
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

	// Nombre del archivo con hora peruana
	var fileName string
	peruLocation, _ := time.LoadLocation("America/Lima")
	peruTime := time.Now().In(peruLocation)

	if admin.Role == models.RoleAdminPrueba {
		fileName = fmt.Sprintf("demo backup %s.sql", peruTime.Format("2006-01-02 15-04-05"))
	} else {
		fileName = fmt.Sprintf("backup %s.sql", peruTime.Format("2006-01-02 15-04-05"))
	}

	outPath := filepath.Join(backupDir, fileName)

	// Construir argumentos de mysqldump (separar host y puerto si es necesario)
	dbHost := os.Getenv("DB_HOST")
	var hostArg, portArg string

	// Separar host:puerto si viene junto
	if strings.Contains(dbHost, ":") {
		parts := strings.Split(dbHost, ":")
		hostArg = parts[0]
		if len(parts) > 1 {
			portArg = parts[1]
		}
	} else {
		hostArg = dbHost
		portArg = "3306" // Puerto por defecto de MySQL
	}

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

	// Logging para debug
	fmt.Printf("🔧 Ejecutando backup con mysqldump: %s\n", mysqldumpBin)
	fmt.Printf("🔧 Argumentos: %s -h %s -P %s -u %s -p[HIDDEN] --no-tablespaces --single-transaction --routines --triggers --default-character-set=utf8mb4 %s\n",
		mysqldumpBin, hostArg, portArg, os.Getenv("DB_USER"), os.Getenv("DB_NAME"))

	// Crear archivo de salida
	outfile, err := os.Create(outPath)
	if err != nil {
		return "", fmt.Errorf("error creando archivo de backup: %v", err)
	}
	defer outfile.Close()

	if admin.Role == models.RoleAdminPrueba {
		// Backup filtrado para usuarios demo: Solo sus trabajadores y sus asistencias
		fmt.Printf("🔧 Iniciando backup filtrado para admin_id: %d\n", admin.ID)

		// 1. Dump Trabajadores
		args1 := append(args, "trabajadores", "--where=admin_id="+fmt.Sprint(admin.ID))
		cmd1 := exec.Command(mysqldumpBin, args1...)
		var stderr1 bytes.Buffer
		cmd1.Stdout = outfile
		cmd1.Stderr = &stderr1
		if err := cmd1.Run(); err != nil {
			os.Remove(outPath)
			return "", fmt.Errorf("error dumping trabajadores: %v\nStderr: %s", err, stderr1.String())
		}

		// 2. Dump Asistencias (Append)
		// Re-abrir el archivo en modo append si es necesario, pero cmd1.Stdout ya escribió al inicio.
		// Para que el segundo comando añada, necesitamos que el puntero del archivo esté al final.
		// En Go, cmd1.Stdout = outfile mantendrá el puntero al final después de terminar.
		args2 := append(args, "asistencia", "--where=trabajador_id IN (SELECT id FROM trabajadores WHERE admin_id="+fmt.Sprint(admin.ID)+")")
		cmd2 := exec.Command(mysqldumpBin, args2...)
		var stderr2 bytes.Buffer
		cmd2.Stdout = outfile // Continuará desde donde terminó el anterior
		cmd2.Stderr = &stderr2
		if err := cmd2.Run(); err != nil {
			// No eliminamos el archivo porque ya tiene parte, pero avisamos
			return "", fmt.Errorf("error dumping asistencias: %v\nStderr: %s", err, stderr2.String())
		}
	} else {
		// Backup completo para administradores reales
		cmd := exec.Command(mysqldumpBin, args...)
		var stderr bytes.Buffer
		cmd.Stdout = outfile
		cmd.Stderr = &stderr
		if err := cmd.Run(); err != nil {
			os.Remove(outPath)
			stderrStr := stderr.String()
			if stderrStr != "" {
				return "", fmt.Errorf("error ejecutando mysqldump: %v\nStderr: %s", err, stderrStr)
			}
			return "", fmt.Errorf("error ejecutando mysqldump: %v", err)
		}
	}

	// Verificar que el archivo no esté vacío
	stat, err := outfile.Stat()
	if err != nil {
		return "", fmt.Errorf("error verificando archivo de backup: %v", err)
	}
	if stat.Size() == 0 {
		os.Remove(outPath)
		return "", fmt.Errorf("backup creado pero está vacío")
	}

	fmt.Printf("✅ Backup creado exitosamente en: %s (%.2f KB)\n", outPath, float64(stat.Size())/1024)
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
