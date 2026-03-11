# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Accept Vite env vars as build-time arguments.
# Cloud Run / Cloud Build must pass these via --build-arg.
# They are baked into the JS bundle by Vite — they are NOT runtime secrets.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY

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

# The official nginx image automatically runs envsubst on files placed in
# /etc/nginx/templates/ and writes results to /etc/nginx/conf.d/.
# Cloud Run injects $PORT at runtime; nginx will listen on it.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Copy built static files from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Cloud Run always uses 8080 by default; EXPOSE is documentation only.
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
