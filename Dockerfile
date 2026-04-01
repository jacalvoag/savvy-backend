# Stage 1 — Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Generar Prisma Client y compilar
RUN npx prisma generate
RUN npm run build

# Stage 2 — Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copiar package files
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --omit=dev

# Copiar build y Prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

EXPOSE 4000

# Ejecutar migraciones y arrancar
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
