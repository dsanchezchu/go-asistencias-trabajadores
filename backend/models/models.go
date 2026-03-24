package models

import "time"

// Constantes de roles
const (
	RoleAdmin       = "admin"
	RoleAdminPrueba = "admin_prueba"
)

type Admin struct {
	ID                      uint   `gorm:"primaryKey"`
	Username                string `gorm:"type:varchar(100);uniqueIndex"`
	Password                string
	Theme                   string     `gorm:"type:varchar(20);default:'dark'" json:"theme"`
	Approved                bool       `gorm:"default:false" json:"approved"`
	Role                    string     `gorm:"type:varchar(20);default:'admin_prueba'" json:"role"`
	DemoTrabajadoresCreados int        `gorm:"default:0" json:"demo_trabajadores_creados"`
	DemoFirstAsistencia     *time.Time `json:"demo_first_asistencia"`
	DemoBackupsCreados      int        `gorm:"default:0" json:"demo_backups_creados"`
	DemoEliminaciones       int        `gorm:"default:0" json:"demo_eliminaciones"`
	DemoAsistenciasCreadas  int        `gorm:"default:0" json:"demo_asistencias_creadas"`
	DemoBloqueado           bool       `gorm:"default:false" json:"demo_bloqueado"`
}

// IsAdmin verifica si el usuario tiene rol de administrador completo
func (a *Admin) IsAdmin() bool {
	return a.Role == RoleAdmin
}

// IsAdminPrueba verifica si el usuario tiene rol de prueba
func (a *Admin) IsAdminPrueba() bool {
	return a.Role == RoleAdminPrueba
}

// IsDemoExpired verifica si la demo de 3 días ha expirado
func (a *Admin) IsDemoExpired() bool {
	if a.Role != RoleAdminPrueba || a.DemoFirstAsistencia == nil {
		return false
	}
	return time.Since(*a.DemoFirstAsistencia) > 72*time.Hour
}

// CanCreateTrabajador verifica si puede crear más trabajadores
func (a *Admin) CanCreateTrabajador() bool {
	if a.Role == RoleAdmin {
		return true
	}
	return a.DemoTrabajadoresCreados < 1
}

// CanCreateBackup verifica si puede crear más backups
func (a *Admin) CanCreateBackup() bool {
	if a.Role == RoleAdmin {
		return true
	}
	return a.DemoBackupsCreados < 1 && !a.DemoBloqueado
}

// CanDeleteTrabajador verifica si puede eliminar trabajadores
func (a *Admin) CanDeleteTrabajador() bool {
	if a.Role == RoleAdmin {
		return true
	}
	return a.DemoEliminaciones < 2 && !a.DemoBloqueado
}

// CanCreateAsistencia verifica si puede crear asistencias
func (a *Admin) CanCreateAsistencia() bool {
	if a.Role == RoleAdmin {
		return true
	}
	return a.DemoAsistenciasCreadas < 3 && !a.DemoBloqueado
}

// IsModuleBlocked verifica si los módulos están bloqueados
func (a *Admin) IsModuleBlocked() bool {
	if a.Role == RoleAdmin {
		return false
	}
	return a.DemoEliminaciones >= 2 || a.DemoBloqueado
}

// IsFullyExhausted verifica si el usuario ha agotado TODOS los criterios de demo
func (a *Admin) IsFullyExhausted() bool {
	if a.Role == RoleAdmin {
		return false
	}
	return (a.DemoTrabajadoresCreados >= 1 &&
		a.DemoAsistenciasCreadas >= 3 &&
		a.DemoBackupsCreados >= 1 &&
		a.DemoEliminaciones >= 2) || a.IsDemoExpired()
}

// GetDemoStatus verifica el estado completo de la demo
func (a *Admin) GetDemoStatus() map[string]interface{} {
	if a.Role == RoleAdmin {
		return map[string]interface{}{
			"is_demo":   false,
			"role":      a.Role,
			"unlimited": true,
		}
	}

	return map[string]interface{}{
		"is_demo":                   true,
		"role":                      a.Role,
		"demo_trabajadores_creados": a.DemoTrabajadoresCreados,
		"limite_trabajadores":       1,
		"demo_backups_creados":      a.DemoBackupsCreados,
		"limite_backups":            1,
		"demo_eliminaciones":        a.DemoEliminaciones,
		"limite_eliminaciones":      2,
		"demo_asistencias_creadas":  a.DemoAsistenciasCreadas,
		"limite_asistencias":        3,
		"demo_bloqueado":            a.DemoBloqueado,
		"modules_blocked":           a.IsModuleBlocked(),
		"demo_expired":              a.IsDemoExpired(),
		"demo_first_asistencia":     a.DemoFirstAsistencia,
		"backups_agotados":          a.DemoBackupsCreados >= 1,
		"eliminaciones_agotadas":    a.DemoEliminaciones >= 2,
		"asistencias_agotadas":      a.DemoAsistenciasCreadas >= 3,
		"fully_exhausted":           a.IsFullyExhausted(),
	}
}

type Trabajador struct {
	ID                   uint         `gorm:"primaryKey" json:"id"`
	Nombres              string       `gorm:"not null" json:"nombres"`
	ApellidoPaterno      string       `gorm:"not null" json:"apellido_paterno"`
	ApellidoMaterno      string       `gorm:"not null" json:"apellido_materno"`
	DNI                  string       `gorm:"type:varchar(20);uniqueIndex,not null" json:"dni"`
	TotalHorasRequeridas int          `gorm:"default:300" json:"total_horas_requeridas"`
	DuracionMeses        int          `gorm:"default:6" json:"duracion_meses"`
	FechaInicio          *time.Time   `json:"fecha_inicio"`
	Asistencias          []Asistencia `json:"asistencias" gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;foreignKey:TrabajadorID"`
	HorasReales          float64      `json:"horas_reales" gorm:"-"`
	HorasIdeales         float64      `json:"horas_ideales" gorm:"-"`
	Turno                string       `json:"turno" gorm:"type:varchar(20)"`
	HoraEntrada          string       `json:"hora_entrada" gorm:"type:varchar(10)"`
	AdminID              uint         `json:"admin_id"`
}

func (Trabajador) TableName() string {
	return "trabajadores"
}

type Asistencia struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	Fecha           time.Time `gorm:"not null" json:"fecha"`
	Estado          string    `gorm:"not null" json:"estado"` // "presente", "ausente", "justificado", "tardanza"
	MinutosTardanza int       `json:"minutos_tardanza" gorm:"default:0"`
	HoraIngreso     string    `json:"hora_ingreso" gorm:"type:varchar(10)"`
	Turno           string    `json:"turno" gorm:"type:varchar(20)"` // "mañana", "tarde"
	TrabajadorID    uint      `json:"trabajador_id"`
}

func (Asistencia) TableName() string {
	return "asistencia"
}
