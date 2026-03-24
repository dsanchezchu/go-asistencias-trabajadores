package services

import (
	"fmt"
	"net/smtp"
	"os"
	"time"
)

type EmailRequest struct {
	Username            string
	Role                string
	RegistrationDate    time.Time
	TrabajadoresCreados int
	AsistenciasCreadas  int
	BackupsCreados      int
	Eliminaciones       int
	ModulesBlocked      bool
	DemoExpired         bool
}

type EmailService struct {
	SMTPHost     string
	SMTPPort     string
	SMTPUser     string
	SMTPPassword string
	AdminEmail   string
}

func NewEmailService() *EmailService {
	return &EmailService{
		SMTPHost:     getEnvOrDefault("SMTP_HOST", "smtp.gmail.com"),
		SMTPPort:     getEnvOrDefault("SMTP_PORT", "587"),
		SMTPUser:     getEnvOrDefault("SMTP_USER", ""),
		SMTPPassword: getEnvOrDefault("SMTP_PASSWORD", ""),
		AdminEmail:   getEnvOrDefault("ADMIN_EMAIL", "admin@empresa.com"),
	}
}

func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func (e *EmailService) SendAccessRequest(req EmailRequest) error {
	if e.SMTPUser == "" || e.SMTPPassword == "" {
		// Si no hay configuración de SMTP, solo logueamos la solicitud
		fmt.Printf("📧 SOLICITUD DE ACCESO RECIBIDA:\n")
		fmt.Printf("Usuario: %s\n", req.Username)
		fmt.Printf("Fecha de registro: %s\n", req.RegistrationDate.Format("2006-01-02 15:04:05"))
		fmt.Printf("Progreso demo:\n")
		fmt.Printf("  - Trabajadores: %d/1\n", req.TrabajadoresCreados)
		fmt.Printf("  - Asistencias: %d/3\n", req.AsistenciasCreadas)
		fmt.Printf("  - Backups: %d/1\n", req.BackupsCreados)
		fmt.Printf("  - Eliminaciones: %d/2\n", req.Eliminaciones)
		fmt.Printf("Estado: %s\n", getStatusText(req))
		return nil
	}

	subject := "🚀 Nueva Solicitud de Acceso - Sistema de Asistencias"
	body := e.buildEmailTemplate(req)

	auth := smtp.PlainAuth("", e.SMTPUser, e.SMTPPassword, e.SMTPHost)

	msg := fmt.Sprintf("From: %s\r\n", e.SMTPUser) +
		fmt.Sprintf("To: %s\r\n", e.AdminEmail) +
		fmt.Sprintf("Subject: %s\r\n", subject) +
		"Content-Type: text/html; charset=UTF-8\r\n" +
		"\r\n" + body

	err := smtp.SendMail(e.SMTPHost+":"+e.SMTPPort, auth, e.SMTPUser, []string{e.AdminEmail}, []byte(msg))
	if err != nil {
		fmt.Printf("❌ Error enviando correo: %v\n", err)
		return err
	}

	fmt.Printf("✅ Correo enviado exitosamente a %s\n", e.AdminEmail)
	return nil
}

func (e *EmailService) buildEmailTemplate(req EmailRequest) string {
	status := getStatusText(req)
	statusColor := getStatusColor(req)
	primaryColor := "#3962a5"

	template := `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Segoe UI', Helvetica, Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f4f7fa; margin: 0; padding: 0; }
        .wrapper { width: 100%%; table-layout: fixed; background-color: #f4f7fa; padding-bottom: 40px; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); }
        
        /* Header */
        .header { background-color: ` + primaryColor + `; padding: 40px 20px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; }
        .header p { color: #dbeafe; margin: 10px 0 0; font-size: 14px; opacity: 0.9; }

        /* Content */
        .content { padding: 40px; }
        .section-title { font-size: 12px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
        
        /* User Info Table */
        .info-table { width: 100%%; margin-bottom: 30px; border-collapse: collapse; }
        .info-table td { padding: 12px 0; border-bottom: 1px solid #f3f4f6; }
        .label { color: #6b7280; font-size: 14px; width: 40%%; }
        .value { color: #111827; font-size: 14px; font-weight: 500; text-align: right; }

        /* Stats Grid */
        .grid { display: table; width: 100%%; border-spacing: 10px; margin: 0 -10px 30px -10px; }
        .grid-item { display: table-cell; background-color: #f8fafc; padding: 20px; border-radius: 6px; text-align: center; border: 1px solid #e2e8f0; width: 25%%; }
        .stat-num { display: block; font-size: 18px; font-weight: 700; color: ` + primaryColor + `; }
        .stat-desc { display: block; font-size: 11px; color: #64748b; margin-top: 4px; text-transform: uppercase; }

        /* Status Badge */
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; color: #ffffff; background-color: %s; }

        /* CTA */
        .cta-container { text-align: center; margin-top: 20px; }
        .btn { background-color: ` + primaryColor + `; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 5px; font-size: 14px; font-weight: 600; display: inline-block; }
        
        /* Footer */
        .footer { background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }
        .footer p { margin: 0; font-size: 12px; color: #9ca3af; }
        .footer-brand { font-weight: 600; color: #4b5563; margin-bottom: 5px !important; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <h1>Solicitud de Renovación</h1>
                <p>Gestión de Acceso - Plataforma de Asistencias</p>
            </div>

            <div class="content">
                <div class="section-title">Información del Solicitante</div>
                <table class="info-table">
                    <tr>
                        <td class="label">Nombre de Usuario</td>
                        <td class="value">%s</td>
                    </tr>
                    <tr>
                        <td class="label">Rol Asignado</td>
                        <td class="value">%s</td>
                    </tr>
                    <tr>
                        <td class="label">Fecha de Registro</td>
                        <td class="value">%s</td>
                    </tr>
                    <tr>
                        <td class="label">Estado de Cuenta</td>
                        <td class="value"><span class="status-badge">%s</span></td>
                    </tr>
                </table>

                <div class="section-title">Métricas de Uso de Demo</div>
                <div class="grid">
                    <div class="grid-item">
                        <span class="stat-num">%d/1</span>
                        <span class="stat-desc">Personal</span>
                    </div>
                    <div class="grid-item">
                        <span class="stat-num">%d/3</span>
                        <span class="stat-desc">Asistencia</span>
                    </div>
                    <div class="grid-item">
                        <span class="stat-num">%d/1</span>
                        <span class="stat-desc">Respaldos</span>
                    </div>
                    <div class="grid-item">
                        <span class="stat-num">%d/2</span>
                        <span class="stat-desc">Bajas</span>
                    </div>
                </div>

                <div class="cta-container">
                    <a href="http://localhost:3000/admin/demo-users" class="btn">
                        Gestionar Acceso en Panel Admin
                    </a>
                </div>
            </div>

            <div class="footer">
                <p class="footer-brand">Sistema de Asistencias BullBet</p>
                <p>Este es un mensaje institucional generado automáticamente por el servidor.</p>
                <p>Fecha de emisión: %s</p>
            </div>
        </div>
    </div>
</body>
</html>
`

	return fmt.Sprintf(template,
		statusColor,
		req.Username,
		req.Role,
		req.RegistrationDate.Format("02/01/2006 15:04"),
		status,
		req.TrabajadoresCreados,
		req.AsistenciasCreadas,
		req.BackupsCreados,
		req.Eliminaciones,
		time.Now().Format("02/01/2006 15:04"),
	)
}

func getStatusText(req EmailRequest) string {
	if req.DemoExpired {
		return "Demo Expirada"
	}
	if req.ModulesBlocked {
		return "Módulos Bloqueados"
	}
	return "Activo"
}

func getStatusColor(req EmailRequest) string {
	if req.DemoExpired {
		return "#6b7280" // gray
	}
	if req.ModulesBlocked {
		return "#ef4444" // red
	}
	return "#10b981" // green
}