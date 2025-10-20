# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./


RUN npm ci || npm install

# Copy source code
COPY tsconfig.json nest-cli.json ./
COPY src ./src

# Build the application
RUN npx nest build

# ---- Production stage ----
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Copy package files for production dependencies
COPY package.json package-lock.json* ./

# Install ONLY production dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# SQLite file will be created at runtime in /app
EXPOSE 3001
CMD ["node", "dist/main.js"]


