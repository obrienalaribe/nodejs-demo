# Step 1: Build Stage
FROM node:16-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy only the package files to install dependencies
COPY package*.json ./

# Install only production dependencies
RUN npm ci

# Copy the application source code
COPY . .

# Step 2: Production Stage
FROM node:16-alpine

# Set the working directory
WORKDIR /app

# Copy only the necessary files from the builder stage
COPY --from=builder /app .

# Set environment variable again for runtime
ENV NODE_ENV=production

# Expose the application port
EXPOSE 3000

# Command to start the application
CMD ["node", "server.js"]
