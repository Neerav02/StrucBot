FROM node:20-alpine
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install production dependencies only  
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/health || exit 1

# Start server
CMD ["node", "server.js"]
