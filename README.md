# Savvy Backend

API Backend construida con NestJS, Prisma y PostgreSQL.

## Requisitos

- Node.js >= 20
- Docker >= 24.0 (para deployment)
- PostgreSQL >= 16 (o usar savvy-infra)

## Desarrollo Local

### 1. Levantar Base de Datos

Opción A - Usar savvy-infra:
```bash
cd ../savvy-infra
docker compose up -d
```

Opción B - PostgreSQL local instalado

### 2. Configurar Variables de Entorno

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales (para desarrollo local usar `localhost`):
