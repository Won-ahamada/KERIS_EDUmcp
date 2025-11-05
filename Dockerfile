# Dockerfile for Smithery MCP Server Deployment
# Multi-stage build for optimal image size

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY src ./src
COPY providers ./providers

# Build TypeScript
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/providers ./providers

# Copy documentation
COPY README.md LICENSE CHANGELOG.md ./

# Set environment
ENV NODE_ENV=production
ENV LOG_LEVEL=info

# Expose MCP port (if using stdio, this is not needed)
# The MCP SDK typically uses stdio, not network ports

# Run the MCP server
CMD ["node", "dist/index.js"]
