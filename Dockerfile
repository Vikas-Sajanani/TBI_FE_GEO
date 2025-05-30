# Use node image to build the app
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files and install deps
COPY package*.json ./
RUN npm install

# Copy all files and build
COPY . .
RUN npm run build

# Use a lightweight server to serve static files
FROM node:18-alpine AS runner

WORKDIR /app

# Install serve globally to serve built files
RUN npm install -g serve

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Expose port 8080
EXPOSE 8080

# Run serve to serve the build folder on port 8080
CMD ["serve", "-s", "dist", "-l", "8080"]
