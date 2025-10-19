# ---- Base build image ----
FROM node:20-alpine AS base
WORKDIR /app

# Install deps
COPY package.json package-lock.json* ./
RUN npm ci --only=production=false || npm install

# Copy sources
COPY tsconfig.json nest-cli.json ./
COPY src ./src

# Build
RUN npx nest build

# ---- Production runtime ----
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=base /app/package.json ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist

# SQLite file will be created at runtime in /app
EXPOSE 3001
CMD ["node", "dist/main.js"]


