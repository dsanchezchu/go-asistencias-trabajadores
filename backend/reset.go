//go:build ignore

package main

import (
	"fmt"
	"go-asistencias/backend/config"
	"go-asistencias/backend/models"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func main() {
	fmt.Println("⚠️  INICIANDO RESETEO DE BASE DE DATOS...")

	// 1. Cargar Configuración
	cfg := config.Load()

	// 2. Conectar (Copiado de database.Connect pero sin AutoMigrate automático inicial)
	dsn := fmt.Sprintf("%s:%s@tcp(%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		cfg.DBUser, cfg.DBPassword, cfg.DBHost, cfg.DBName)

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		panic("❌ No se pudo conectar a MySQL: " + err.Error())
	}
	fmt.Println("✅ Conexión establecida.")

	// 3. Eliminar Tablas (Orden descendente por FKs)
	// Asistencia depende de Trabajador. Admin es independiente.
	fmt.Println("🗑️  Eliminando tablas existentes...")

	// Usamos Migrator().DropTable para ser explícitos
	if err := db.Migrator().DropTable(&models.Asistencia{}, &models.Trabajador{}, &models.Admin{}); err != nil {
		fmt.Printf("⚠️  Advertencia al borrar tablas (puede que no existan): %v\n", err)
	} else {
		fmt.Println("✅ Tablas eliminadas correctamente.")
	}

	// 4. Recrear Tablas
	fmt.Println("🏗️  Creando nuevas tablas...")
	if err := db.AutoMigrate(&models.Admin{}, &models.Trabajador{}, &models.Asistencia{}); err != nil {
		panic("❌ Error al migrar tablas: " + err.Error())
	}

	// 5. Restaurar Foreign Keys
	db.Exec("ALTER TABLE asistencia DROP FOREIGN KEY IF EXISTS fk_trabajadores_asistencias")
	db.Exec("ALTER TABLE asistencia ADD CONSTRAINT fk_trabajadores_asistencias FOREIGN KEY (trabajador_id) REFERENCES trabajadores(id) ON DELETE CASCADE ON UPDATE CASCADE")

	fmt.Println("✅ Estructura de base de datos creada.")

	fmt.Println("\n✨ ¡RESETEO COMPLETADO EXITOSAMENTE! ✨")
	fmt.Println("Ahora puedes reiniciar tu servidor principal.")
}
