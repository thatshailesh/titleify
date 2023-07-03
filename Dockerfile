# Base image
FROM node:16-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Install Nest CLI globally
RUN npm i -g @nestjs/cli

# Copy the entire project to the container
COPY . .

# Build app
RUN npm run build

# Expose the port on which the NestJS application will run
EXPOSE 3000

# Start the NestJS application
CMD ["npm", "run", "start:prod"]
