FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Build the TypeScript code
RUN npm run build

# Expose the application port
EXPOSE 3001

# Create a directory for logs
RUN mkdir -p logs

# Command to run the application
CMD ["node", "dist/index.js"]
