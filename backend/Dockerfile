# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files (lockfile optional)
COPY package*.json ./

# Install dependencies (including dev for building)
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy source code
COPY tsconfig.json nest-cli.json ./
COPY src ./src

# Build the application
RUN ls -la && echo "Building..." && npx nest build && echo "Build completed" && ls -la dist/

# ---- Development stage ----
FROM node:20-alpine AS development
WORKDIR /app

# Copy package files (lockfile optional)
COPY package*.json ./

# Install ALL dependencies for development
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy source code
COPY tsconfig.json nest-cli.json ./
COPY src ./src

# Expose port
EXPOSE 3001

# Start in development mode
CMD ["npm", "run", "start:dev"]

# ---- Production stage ----
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# Copy package files
COPY --from=builder /app/package*.json ./

# Copy node_modules from builder and prune dev dependencies
COPY --from=builder /app/node_modules ./node_modules
RUN npm prune --omit=dev && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Debug: check what was copied
RUN echo "Checking copied files:" && ls -la && echo "Checking dist folder:" && ls -la dist/ && echo "Checking main.js:" && ls -la dist/main.js

# SQLite file will be created at runtime in /app
EXPOSE 3001
CMD ["node", "dist/main.js"]