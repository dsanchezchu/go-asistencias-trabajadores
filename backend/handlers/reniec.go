package handlers

import (
	"encoding/json"
	"fmt"
	"go-asistencias/backend/config"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type ReniecResponse struct {
	FirstName      string `json:"first_name"`
	FirstLastName  string `json:"first_last_name"`
	SecondLastName string `json:"second_last_name"`
	FullName       string `json:"full_name"`
	DocumentNumber string `json:"document_number"`
}

func ConsultarReniec(c *gin.Context) {
	dni := c.Query("dni")
	if len(dni) != 8 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "El DNI debe tener 8 dígitos"})
		return
	}

	cfg := config.Load()
	if cfg.ReniecToken == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Servicio de RENIEC no configurado (Token faltante)"})
		return
	}

	url := fmt.Sprintf("https://api.decolecta.com/v1/reniec/dni?numero=%s", dni)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear la solicitud"})
		return
	}

	req.Header.Set("Authorization", "Bearer "+cfg.ReniecToken)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error de conexión con RENIEC"})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		if resp.StatusCode == 404 {
			c.JSON(http.StatusNotFound, gin.H{"error": "DNI no encontrado"})
		} else {
			c.JSON(http.StatusBadGateway, gin.H{"error": "Error en el servicio externo"})
		}
		return
	}

	var data ReniecResponse
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al procesar respuesta"})
		return
	}

	c.JSON(http.StatusOK, data)
}
