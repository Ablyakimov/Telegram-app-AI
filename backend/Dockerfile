# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies (including dev for building)
RUN npm ci || npm install

# Copy source code
COPY tsconfig.json nest-cli.json ./
COPY src ./src

# Build the application
RUN npx nest build

# ---- Development stage ----
FROM node:20-alpine AS development
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install ALL dependencies for development
RUN npm ci || npm install

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

# Copy package files for production dependencies
COPY package.json package-lock.json* ./

# Install ONLY production dependencies
RUN npm install --omit=dev && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# SQLite file will be created at runtime in /app
EXPOSE 3001
CMD ["node", "dist/main.js"]