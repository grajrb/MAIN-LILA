# Use minimal Node.js image for faster builds
FROM node:18-slim

# Set the working directory inside the container
WORKDIR /app

# Copy backend package.json and package-lock.json (if available)
COPY backend/package*.json ./

# Install dependencies quickly
RUN npm install --production --no-audit --no-fund --no-optional

# Copy the backend application code
COPY backend/ .

# Expose the port the app runs on
EXPOSE 7350

# Start the application
CMD ["node", "server.js"]