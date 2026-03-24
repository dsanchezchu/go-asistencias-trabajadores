import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Go Asistencias | Sistema de Gestión",
  description: "Sistema avanzado para el seguimiento de asistencias y rendimiento de trabajadores en Go Asistencias.",
  keywords: ["asistencias", "gestión", "trabajadores", "rendimiento", "go asistencias", "RRHH"],
  authors: [{ name: "Go Asistencias Development Team" }],
  robots: "index, follow",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Go Asistencias",
    description: "Gestión de asistencias de alto rendimiento",
    type: "website",
    locale: "es_PE",
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Configuración estática base. El ThemeProvider hidratará el tema correcto en el cliente.
  const theme = "dark";

  return (
    <html lang="es" data-theme={theme} className="dark">
      <body className={`${inter.className} transition-colors duration-300`}>
        <ThemeProvider initialTheme={theme}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}