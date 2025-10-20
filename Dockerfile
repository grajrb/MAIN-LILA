# Multi-stage Dockerfile for Tic-Tac-Toe game
FROM node:18-alpine AS base

# Install dependencies for both client and server
FROM base AS deps
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json bun.lockb ./
RUN npm install

# Build the frontend
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the React app
RUN npm run build

# Production server stage
FROM base AS runner
WORKDIR /app

# Install Bun for server runtime
RUN npm install -g bun

# Copy built frontend
COPY --from=builder /app/dist ./dist

# Copy server files
COPY mock-nakama-server.ts ./
COPY package.json ./

# Install production dependencies for server
RUN npm install ws @types/ws

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 gameserver
USER gameserver

# Expose ports for both frontend and WebSocket server
EXPOSE 3000 7350

# Create startup script
COPY --chown=gameserver:nodejs <<EOF /app/start.sh
#!/bin/sh
# Start the WebSocket server in the background
bun mock-nakama-server.ts &
# Start a simple HTTP server for the frontend
cd dist && python3 -m http.server 3000
EOF

RUN chmod +x /app/start.sh

CMD ["sh", "/app/start.sh"]