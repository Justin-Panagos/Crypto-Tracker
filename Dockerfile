# Stage 1: Build the React frontend
FROM node:18.20 AS frontend-build

WORKDIR /app

# Copy package.json and package-lock.json for caching
COPY package*.json ./

# Copy the contents of frontend/ directly into /app/
COPY frontend/* ./

# Install dependencies
RUN npm install

# Build the React app directly (bypassing the build script's cd frontend)
RUN ./node_modules/.bin/vite build

# Stage 2: Build the FastAPI backend and serve the frontend
FROM python:3.11-slim

WORKDIR /app

# Copy pyproject.toml and uv.lock
COPY pyproject.toml uv.lock ./

# Copy the contents of backend/ directly into /app/
COPY backend/* ./

# Install dependencies
RUN pip install uv && uv sync

# Copy the built frontend to /app/dist/
COPY --from=frontend-build /app/dist ./dist

# Expose the port
EXPOSE 8002

# Run the app from the root directory
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002"]