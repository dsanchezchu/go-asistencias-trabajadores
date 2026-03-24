package handlers

import (
	"go-asistencias/backend/database"
	"go-asistencias/backend/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func CreateAsistencia(c *gin.Context) {
	admin := c.MustGet("admin").(*models.Admin)

	var asistencia models.Asistencia
	if err := c.ShouldBindJSON(&asistencia); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verificar que el trabajador pertenece al admin actual (solo para admin_prueba)
	if admin.Role == models.RoleAdminPrueba {
		var trabajador models.Trabajador
		if err := database.DB.Where("id = ? AND admin_id = ?", asistencia.TrabajadorID, admin.ID).First(&trabajador).Error; err != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "No tienes permisos para crear asistencias para este trabajador"})
			return
		}
	}

	tx := database.DB.Begin()

	// Registrar primera asistencia si es admin_prueba y aún no tiene
	if admin.Role == models.RoleAdminPrueba && admin.DemoFirstAsistencia == nil {
		now := time.Now()
		if err := tx.Model(&models.Admin{}).Where("id = ?", admin.ID).
			Update("demo_first_asistencia", now).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al registrar inicio de demo"})
			return
		}
	}

	if err := tx.Create(&asistencia).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al registrar asistencia"})
		return
	}

	tx.Commit()
	c.JSON(http.StatusCreated, asistencia)
}

func BatchUpdateAsistencias(c *gin.Context) {
	admin := c.MustGet("admin").(*models.Admin)

	var req struct {
		Fecha       string `json:"fecha"` // Formato "2006-01-02"
		Asistencias []struct {
			TrabajadorID    uint   `json:"trabajador_id"`
			Estado          string `json:"estado"`
			MinutosTardanza int    `json:"minutos_tardanza"`
			HoraIngreso     string `json:"hora_ingreso"`
			Turno           string `json:"turno"`
		} `json:"asistencias"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	// Verificar que todos los trabajadores pertenecen al admin actual (solo para admin_prueba)
	if admin.Role == models.RoleAdminPrueba {
		for _, a := range req.Asistencias {
			var trabajador models.Trabajador
			if err := database.DB.Where("id = ? AND admin_id = ?", a.TrabajadorID, admin.ID).First(&trabajador).Error; err != nil {
				c.JSON(http.StatusForbidden, gin.H{"error": "No tienes permisos para crear asistencias para algunos de estos trabajadores"})
				return
			}
		}
	}

	// Parseamos la fecha en la zona horaria local del servidor para que coincida con loc=Local del DSN
	fechaParsed, err := time.ParseInLocation("2006-01-02", req.Fecha, time.Local)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Formato de fecha inválido. Debe ser YYYY-MM-DD"})
		return
	}

	// FIX: Sumar 12 horas para evitar que cambios de zona horaria muevan la fecha al día anterior (e.g. 00:00 -> 23:00 ayer)
	// Esto asegura que al guardar en la BD (DATE o DATETIME) caiga en el día correcto del calendario.
	fechaParsed = fechaParsed.Add(12 * time.Hour)

	tx := database.DB.Begin()

	// Registrar primera asistencia si es admin_prueba y aún no tiene
	if admin.Role == models.RoleAdminPrueba && admin.DemoFirstAsistencia == nil {
		now := time.Now()
		if err := tx.Model(&models.Admin{}).Where("id = ?", admin.ID).
			Update("demo_first_asistencia", now).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al registrar inicio de demo"})
			return
		}
	}

	// Contador de asistencias creadas para esta sesión
	asistenciasCreadas := 0

	for _, item := range req.Asistencias {
		// Validar estado
		if item.Estado == "" {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "El estado de asistencia no puede estar vacío"})
			return
		}
		var existing models.Asistencia
		// Buscamos si ya existe asistencia para ese trabajador en ese día
		err := tx.Where("trabajador_id = ? AND DATE(fecha) = DATE(?)", item.TrabajadorID, fechaParsed).First(&existing).Error

		if err == nil {
			tx.Rollback()
			c.JSON(http.StatusConflict, gin.H{"error": "⚠️ Registro duplicado: Algunos trabajadores ya marcaron asistencia hoy. Por favor, actualice la vista."})
			return
		} else {
			// Crear nueva
			newAsis := models.Asistencia{
				TrabajadorID:    item.TrabajadorID,
				Fecha:           fechaParsed,
				Estado:          item.Estado,
				MinutosTardanza: item.MinutosTardanza,
				HoraIngreso:     item.HoraIngreso,
				Turno:           item.Turno,
			}
			if err := tx.Create(&newAsis).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear asistencia"})
				return
			}
			asistenciasCreadas++
		}
	}

	// Actualizar contador de asistencias para admin_prueba
	if admin.Role == models.RoleAdminPrueba && asistenciasCreadas > 0 {
		if err := tx.Model(&models.Admin{}).Where("id = ?", admin.ID).
			Update("demo_asistencias_creadas", admin.DemoAsistenciasCreadas+asistenciasCreadas).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar contador de asistencias"})
			return
		}
	}

	tx.Commit()

	response := gin.H{"msg": "Asistencias procesadas correctamente"}

	// Advertir si se acerca al límite (solo para demo)
	if admin.Role == models.RoleAdminPrueba {
		newTotal := admin.DemoAsistenciasCreadas + asistenciasCreadas
		if newTotal >= 3 {
			response["warning"] = "⚠️ Has alcanzado el límite de asistencias (3/3). No podrás registrar más asistencias."
			response["limit_reached"] = true
		} else if newTotal == 2 {
			response["warning"] = "⚠️ Te queda 1 asistencia por registrar antes de alcanzar el límite."
		}
		response["asistencias_totales"] = newTotal
	}

	c.JSON(http.StatusOK, response)
}

func GetAsistenciasByDate(c *gin.Context) {
	admin := c.MustGet("admin").(*models.Admin)
	fecha := c.Query("fecha") // Formato "2006-01-02"
	if fecha == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Fecha requerida"})
		return
	}

	var asistencias []models.Asistencia
	query := database.DB.Where("DATE(fecha) = DATE(?) AND estado IS NOT NULL AND estado != ''", fecha)

	// Verificar si hay un filtro por admin específico
	filterAdminID := c.Query("filter_admin_id")

	// Aplicar filtros según el tipo de usuario
	if admin.Role == models.RoleAdminPrueba {
		// Los admin_prueba solo ven asistencias de sus propios trabajadores
		query = query.Joins("JOIN trabajadores ON asistencia.trabajador_id = trabajadores.id").
			Where("trabajadores.admin_id = ?", admin.ID)
	} else if admin.Role == models.RoleAdmin && filterAdminID != "" {
		// Los admin completos pueden filtrar por un admin específico
		query = query.Joins("JOIN trabajadores ON asistencia.trabajador_id = trabajadores.id").
			Where("trabajadores.admin_id = ?", filterAdminID)
	}
	// Si es admin completo sin filtro, ve todas las asistencias

	if err := query.Find(&asistencias).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener asistencias"})
		return
	}

	c.JSON(http.StatusOK, asistencias)
}

func GetAllAsistencias(c *gin.Context) {
	admin := c.MustGet("admin").(*models.Admin)

	var results []struct {
		ID              uint      `json:"id"`
		Fecha           time.Time `json:"fecha"`
		Estado          string    `json:"estado"`
		MinutosTardanza int       `json:"minutos_tardanza"`
		HoraIngreso     string    `json:"hora_ingreso"`
		Turno           string    `json:"turno"`
		TrabajadorID    uint      `json:"trabajador_id"`
		Nombre          string    `json:"nombre"`
		DNI             string    `json:"dni"`
	}

	query := database.DB.Table("asistencia").
		Select("asistencia.id, asistencia.fecha, asistencia.estado, asistencia.minutos_tardanza, asistencia.hora_ingreso, asistencia.turno, asistencia.trabajador_id, CONCAT(trabajadores.nombres, ' ', trabajadores.apellido_paterno, ' ', trabajadores.apellido_materno) as nombre, trabajadores.dni").
		Joins("JOIN trabajadores ON asistencia.trabajador_id = trabajadores.id")

	// Verificar si hay un filtro por admin específico
	filterAdminID := c.Query("filter_admin_id")

	// Aplicar filtros según el tipo de usuario
	if admin.Role == models.RoleAdminPrueba {
		// Los admin_prueba solo ven asistencias de sus propios trabajadores
		query = query.Where("trabajadores.admin_id = ?", admin.ID)
	} else if admin.Role == models.RoleAdmin && filterAdminID != "" {
		// Los admin completos pueden filtrar por un admin específico
		query = query.Where("trabajadores.admin_id = ?", filterAdminID)
	}
	// Si es admin completo sin filtro, ve todas las asistencias

	err := query.Order("asistencia.fecha DESC").Scan(&results).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener historial"})
		return
	}

	c.JSON(http.StatusOK, results)
}
