FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /klyrodns ./cmd/klyrodns

FROM alpine:3.19
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=builder /klyrodns .
COPY config/ config/
EXPOSE 5353/udp 5353/tcp 8080
ENTRYPOINT ["/app/klyrodns"]
