# Build stage
FROM node:20 AS build
WORKDIR /app

# Install build dependencies for native modules (lightningcss needs these)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies (include optional packages for platform-specific binaries)
RUN npm install --include=optional \
    && ARCH=$(uname -m) \
    && if [ "$ARCH" = "x86_64" ] || [ "$ARCH" = "amd64" ]; then \
         npm install --no-save lightningcss@1.30.2 @tailwindcss/oxide-linux-x64-gnu@4.1.16; \
       elif [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then \
         npm install --no-save lightningcss@1.30.2 @tailwindcss/oxide-linux-arm64-gnu@4.1.16; \
       else \
         npm install --no-save lightningcss@1.30.2; \
       fi

# Copy source code
COPY . .

# Build argument for API URL (can be overridden at build time)
ARG VITE_API_BASE_URL=/api
ARG VITE_GOOGLE_CLIENT_ID=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV TAILWIND_DISABLE_LIGHTNINGCSS=1

# Build the application
RUN npm run build

# Production stage
FROM nginx:1.27-alpine
WORKDIR /usr/share/nginx/html

# Install wget for healthcheck
RUN apk add --no-cache wget

# Remove default nginx static assets
RUN rm -rf ./*

# Copy built assets from build stage
COPY --from=build /app/dist .

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
