FROM node:20-alpine AS builder
WORKDIR /app

# Copy package descriptors
COPY package.json package-lock.json* ./
# Install dependencies
RUN npm ci

# Copy the rest of the source code
COPY . .

# Build the Vite application
RUN npm run build

# Use Nginx to serve the static files and proxy to the backend
FROM nginx:alpine
# Copy our custom Nginx config to proxy /api to the backend
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copy the built React app from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
