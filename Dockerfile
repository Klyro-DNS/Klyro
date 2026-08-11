# Stage 1: Build Angular dashboard
FROM node:22-alpine AS frontend
WORKDIR /app/klyro-dashboard
COPY klyro-dashboard/ ./
RUN npm install
RUN npx ng build --configuration=production

# Stage 2: Build Go binary
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN rm -rf internal/api/dashboard/*
COPY --from=frontend /app/klyro-dashboard/dist/klyro-dashboard/browser/ internal/api/dashboard/
RUN CGO_ENABLED=0 go build -o /klyrodns ./cmd/klyrodns

# Stage 3: Runtime
FROM alpine:3.19
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=builder /klyrodns .
# COPY config/ config/
EXPOSE 5353/udp 5353/tcp 8080
ENTRYPOINT ["/app/klyrodns"]
