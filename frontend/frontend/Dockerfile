FROM node:20-slim AS builder
WORKDIR /app

# Copy package descriptors
COPY package.json package-lock.json* ./
# Install dependencies
RUN npm ci

# Copy the rest of the source code
COPY . .

# Add build argument for Vite API base URL
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

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
