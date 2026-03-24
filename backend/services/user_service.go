package services

import "go-asistencias/backend/repositories"

type UserService struct {
	repo repositories.ThemeRepository
}

func NewUserService(repo repositories.ThemeRepository) *UserService {
	return &UserService{repo: repo}
}

func (s *UserService) SetUserTheme(username string, theme string) error {
	return s.repo.UpdateTheme(username, theme)
}
