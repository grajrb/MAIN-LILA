# Use the official Node.js runtime as base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy backend package.json and package-lock.json (if available)
COPY backend/package*.json ./

# Install dependencies
RUN npm ci --production

# Copy the backend application code
COPY backend/ .

# Expose the port the app runs on
EXPOSE 7350

# Start the application
CMD ["node", "server.js"]