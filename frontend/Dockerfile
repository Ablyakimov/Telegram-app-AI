# ---- Build stage ----
FROM ghcr.io/docker/library/node:20-alpine AS builder
WORKDIR /app

# Copy package files (lockfile optional)
COPY package*.json ./

# Install dependencies with memory limit
RUN NODE_OPTIONS="--max-old-space-size=512" npm ci --prefer-offline --no-audit --progress=false || \
    NODE_OPTIONS="--max-old-space-size=512" npm install --prefer-offline --no-audit --progress=false

# Copy source code and config files
COPY src ./src
COPY index.html ./
COPY vite.config.js ./
COPY tailwind.config.js ./
COPY postcss.config.js ./

# Build the application with memory limit
RUN NODE_OPTIONS="--max-old-space-size=512" npm run build

# ---- Development stage ----
FROM ghcr.io/docker/library/node:20-alpine AS development
WORKDIR /app

# Copy package files (lockfile optional)
COPY package*.json ./

# Install dependencies
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy source code and config files
COPY src ./src
COPY index.html ./
COPY vite.config.js ./
COPY tailwind.config.js ./
COPY postcss.config.js ./

# Expose port
EXPOSE 5173

# Start in development mode
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ---- Production stage ----
FROM ghcr.io/docker/library/nginx:alpine AS production
WORKDIR /usr/share/nginx/html

# Copy built React app
COPY --from=builder /app/dist .

# Create Nginx config for frontend
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]