# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (separate layer for better caching)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# ── Stage 2: Serve ───────────────────────────────────────────────────────────
FROM nginx:1.27-alpine

# Remove the default nginx server block
RUN rm /etc/nginx/conf.d/default.conf

# Copy the template to a non-processed location.
# start.sh runs envsubst '${PORT}' at container startup so that nginx
# variables like $uri are NOT touched — only $PORT is replaced.
COPY nginx.conf.template /etc/nginx/nginx.conf.template

# Copy built static files from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy and wire up the startup script
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Cloud Run always uses 8080 by default; EXPOSE is documentation only.
EXPOSE 8080

CMD ["/start.sh"]
