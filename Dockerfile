# Stage 1: Build the React frontend
FROM node:18.20 AS frontend-build

WORKDIR /app

COPY package*.json ./
COPY tailwind.config.js ./   
COPY postcss.config.js ./         
COPY vite.config.js ./

COPY frontend/ ./frontend/

RUN npm install
RUN ./node_modules/.bin/vite build

# Stage 2: Build the FastAPI backend and serve the frontend
FROM python:3.11-slim

WORKDIR /app

# Copy pyproject.toml and uv.lock
COPY pyproject.toml uv.lock ./
COPY backend/* ./
# Install dependencies
RUN pip install uv && uv sync

# Copy the built frontend to /app/dist/
COPY --from=frontend-build /app/frontend/dist ./dist

# Expose the port
EXPOSE 8002

# Run the app from the root directory
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002"]