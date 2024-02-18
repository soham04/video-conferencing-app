# Use the official Node.js LTS Alpine image as base
FROM node:lts-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app  

# Copy package.json and package-lock.json (if exists)
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy the rest of the application code
COPY . .

# Install development dependencies for building TypeScript
RUN npm install

# Build the TypeScript code
RUN npm run build

# Expose port 3000
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"]
