// backend/utils/jwt.go
package utils

import (
	"fmt"
	"go-asistencias/backend/config"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var jwtKey = []byte(config.Load().JWTSecret)

func GenerateJWT(username string) (string, error) {
	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &jwt.MapClaims{
		"username": username,
		"exp":      expirationTime.Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtKey)
}

func ValidateJWT(tokenString string) (string, error) {
	claims := &jwt.MapClaims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(t *jwt.Token) (interface{}, error) {
		return jwtKey, nil
	})
	if err != nil {
		return "", err
	}
	if !token.Valid {
		return "", jwt.ErrSignatureInvalid
	}
	if username, ok := (*claims)["username"].(string); ok {
		return username, nil
	}
	return "", fmt.Errorf("invalid claims")
}
