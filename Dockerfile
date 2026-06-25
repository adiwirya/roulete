# syntax=docker/dockerfile:1

# ---- Build stage ----------------------------------------------------------
# Vite 8 needs Node 20.19+ / 22.12+.
FROM node:22-alpine AS build
WORKDIR /app

# Install dependencies first so this layer is cached unless the lockfile changes.
COPY package.json package-lock.json ./
RUN npm ci

# Vite inlines VITE_* variables at build time — they must exist NOW, not at runtime.
# (The Supabase anon key is a public client-side key, so baking it into the bundle is expected.)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

COPY . .
RUN npm run build

# ---- Serve stage ----------------------------------------------------------
FROM nginx:1.27-alpine AS serve
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
