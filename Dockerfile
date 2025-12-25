# Use a stable and lightweight Node image
FROM node:22-slim

# Define working directory
WORKDIR /usr/src/app

# Install only production dependencies
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Copy the rest of the code
COPY . .

# Define default environment variable (optional)
ENV NODE_ENV=production

# Cloud Run injects PORT dynamically
# Exposing is optional but helps document the image
EXPOSE 8080

# Startup command
CMD ["npm", "start"]
