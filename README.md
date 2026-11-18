# TortiSmart — Punto de venta para tortillería

Node.js + Express + MySQL (Railway) · Hosting en Vercel.

## Estructura
```
server.js       API y servidor de la página
database.js     Conexión a MySQL
vercel.json     Configuración de Vercel
public/         Página (index.html, css/, js/, img/)
```

## Variable de entorno (Vercel → Settings → Environment Variables)
| Nombre | Valor |
|---|---|
| `DATABASE_URL` | La `MYSQL_PUBLIC_URL` de tu MySQL en Railway |

Opcionales: `ADMIN_PASS` y `EMPLEADO_PASS` (contraseñas iniciales), `TS_SECRETO` (clave para las sesiones).

## Usuarios iniciales (se crean solos la primera vez)
| Usuario | Contraseña | Rol |
|---|---|---|
| admin | admin123 | Administrador |
| empleado | empleado123 | Trabajador |

## Tablas (se crean solas; llevan prefijo `ts_`)
`ts_usuarios`, `ts_estado`, `ts_ventas`

## Verificar que todo conecta
Abre `https://TU-DOMINIO.vercel.app/api/salud` → debe mostrar `{"ok":true,...}`

## Probar en tu computadora
```bash
npm install
cp .env.example .env     # y pon tu DATABASE_URL
npm start                # http://localhost:3000
```
