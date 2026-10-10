# ============================================================
# CommunityLink – Backend Dockerfile
# Requirements: 7.2, 7.9
#
# Uses node:18-alpine to keep the image small and secure.
# Only production dependencies are installed (npm ci --only=production).
# ============================================================

FROM node:18-alpine

# Set working directory inside the container
WORKDIR /app

# Copy dependency manifests first to leverage Docker layer caching.
# The node_modules layer is only rebuilt when package*.json changes.
COPY package.json package-lock.json ./

# Install production dependencies only (no devDependencies)
RUN npm ci --only=production

# Copy application source code
COPY . .

# Document the port the API listens on
EXPOSE 5000

# Start the Express server
CMD ["node", "server.js"]
