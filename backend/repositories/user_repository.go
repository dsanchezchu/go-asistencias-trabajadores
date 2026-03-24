package repositories

import (
	"go-asistencias/backend/models"

	"gorm.io/gorm"
)

type ThemeRepository interface {
	UpdateTheme(username string, theme string) error
	GetTheme(username string) (string, error)
}

type GormUserRepository struct {
	db *gorm.DB
}

func NewGormUserRepository(db *gorm.DB) *GormUserRepository {
	return &GormUserRepository{db: db}
}

func (r *GormUserRepository) UpdateTheme(username string, theme string) error {
	return r.db.Model(&models.Admin{}).Where("username = ?", username).Update("theme", theme).Error
}

func (r *GormUserRepository) GetTheme(username string) (string, error) {
	var admin models.Admin
	err := r.db.Where("username = ?", username).First(&admin).Error
	return admin.Theme, err
}
