# ============================================================
# CommunityLink – Frontend Dockerfile (multi-stage build)
# Requirements: 7.1, 7.9
#
# Stage 1 – builder : compile the React production bundle
# Stage 2 – runtime : serve static assets via Nginx on port 3000
# ============================================================

# ── Stage 1: Build ──────────────────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependency manifests first to leverage layer caching
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies needed by react-scripts)
RUN npm install --legacy-peer-deps

# Copy the rest of the source code
COPY . .

# Build the optimised production bundle into /app/build
RUN npm run build

# ── Stage 2: Serve ──────────────────────────────────────────
FROM nginx:alpine

# Remove the default Nginx static site
RUN rm -rf /usr/share/nginx/html/*

# Copy the React build output from Stage 1
COPY --from=builder /app/build /usr/share/nginx/html

# Add custom Nginx config that supports React Router (SPA fallback)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Document the port Nginx listens on
EXPOSE 3000

# Nginx runs in foreground by default in the official image
CMD ["nginx", "-g", "daemon off;"]
