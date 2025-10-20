# Dockerfile for Railway backend deployment
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy backend source code
COPY backend/ ./

# Expose the WebSocket port
EXPOSE 7350

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "
    const http = require('http');
    const req = http.request({
      hostname: 'localhost',
      port: 7351,
      path: '/health',
      method: 'GET'
    }, (res) => {
      process.exit(res.statusCode === 200 ? 0 : 1);
    });
    req.on('error', () => process.exit(1));
    req.end();
  "

# Start the server
CMD ["npm", "start"]