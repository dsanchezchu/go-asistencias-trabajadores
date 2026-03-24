const isProd = process.env.NODE_ENV === 'production';
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || (isProd ? '/proyectos/asistencias' : '');
export const API_URL = process.env.NEXT_PUBLIC_API_URL || (isProd ? '/proyectos/asistencias' : 'http://localhost:8080');
