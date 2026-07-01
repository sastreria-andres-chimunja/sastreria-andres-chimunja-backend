# Sastrería Andrés Chimunja — Backend

API REST (Node.js + Express + Knex + PostgreSQL) para el sistema de gestión de la sastrería.

## Requisitos

- Node.js 18+
- PostgreSQL 14+
- PM2 (`npm i -g pm2`) para producción

## Instalación local

```bash
npm install
cp .env.production .env   # o crea tu propio .env de desarrollo (ver variables abajo)
npm run migrate
npm run seed-admin         # crea el usuario Admin inicial
npm run dev                 # http://localhost:3000, con nodemon
```

## Variables de entorno

| Variable | Descripción |
|---|---|
| `NODE_ENV` | `development` o `production`. Determina qué bloque de `knexfile.js` se usa. |
| `PORT` | Puerto donde escucha Express (default `3000`). |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Conexión a PostgreSQL. |
| `DB_SSL` | `true` solo si el proveedor de PostgreSQL exige SSL. Si la DB corre en el mismo VPS, déjalo en `false`. |
| `JWT_SECRET` | Secreto para firmar tokens JWT. Debe ser un valor largo y aleatorio en producción (nunca reutilizar el de desarrollo). |
| `FRONTEND_ORIGIN` | Dominio(s) permitido(s) por CORS, separados por coma (ej. `https://sastreria.com`). Sin esto, CORS cae al valor por defecto `http://localhost:4200`. |
| `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID` | Credenciales de WhatsApp Meta Cloud API para envío de recibos. |

En `.env.production` ya están los valores fijos (incluyendo un `JWT_SECRET` fuerte generado). Los campos marcados `CAMBIAR_*` deben completarse con los datos reales del VPS antes de desplegar.

## Despliegue en VPS

1. Clonar el repo y correr `npm install --omit=dev`.
2. Copiar `.env.production` al VPS y completar los placeholders `CAMBIAR_*` (host, usuario y password de la DB, `FRONTEND_ORIGIN`).
3. Crear la base de datos en PostgreSQL y correr las migraciones:
   ```bash
   NODE_ENV=production npm run migrate
   ```
4. Levantar el proceso con PM2:
   ```bash
   npm run pm2:start      # pm2 start ecosystem.config.js --env production
   pm2 save                # persiste el proceso entre reinicios del VPS
   pm2 startup              # configura el arranque automático del sistema
   ```
5. Verificar que responde: `curl http://localhost:3000/health` → `{"status":"ok"}`.

### Comandos PM2 útiles

```bash
npm run pm2:restart   # reinicia el proceso tras un deploy
npm run pm2:logs       # ver logs en vivo
pm2 status              # ver estado del proceso
```

### Actualizar el backend tras un cambio de código

```bash
git pull
npm install --omit=dev
NODE_ENV=production npm run migrate
npm run pm2:restart
```

## Scripts

| Script | Uso |
|---|---|
| `npm run dev` | Desarrollo local con recarga automática (nodemon). |
| `npm start` | Arranque directo con `node` (sin recarga). |
| `npm run migrate` | Corre las migraciones pendientes. |
| `npm run rollback` | Revierte la última tanda de migraciones. |
| `npm run reset-db` | Revierte todas las migraciones y las vuelve a aplicar (⚠️ borra datos). |
| `npm run make-migration -- nombre_migracion` | Crea un nuevo archivo de migración. |
| `npm run seed-admin` | Crea el usuario Admin inicial. |

## Notas de seguridad

- `.env` y `.env.production` están en `.gitignore` — nunca deben commitearse.
- CORS solo permite los orígenes listados en `FRONTEND_ORIGIN`.
- Las imágenes subidas (`uploads/`) se clasifican solo en carpetas permitidas (`itempedido`, `medida`); si se agrega un nuevo tipo de referencia para imágenes, hay que sumarlo a `TIPOS_REFERENCIA_PERMITIDOS` en `src/config/multer.js`.
