FROM golang:1.24-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

FROM debian:stable-slim
RUN apt-get update \
	&& apt-get install -y --no-install-recommends ca-certificates tzdata mariadb-client \
	&& rm -rf /var/lib/apt/lists/*
WORKDIR /root/
COPY --from=builder /app/main .
RUN mkdir -p /backups && chown root:root /backups && chmod 700 /backups
EXPOSE 8050
CMD ["./main"]
