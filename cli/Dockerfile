# Étape de construction
FROM golang:1.24-alpine AS builder

# Installation des dépendances de build
RUN apk update && apk add --no-cache git

# Configuration du répertoire de travail
WORKDIR /app

# Copie des fichiers de dépendances
COPY ./go.mod ./go.sum* ./

# Téléchargement des dépendances
RUN go mod download

# Copie du code source
COPY . .

# Construction de l'application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o pierceflare-cli ./cmd/pierceflare-cli

# Étape finale avec une image minimale
FROM alpine:latest

# Installation de CA certificates pour les requêtes HTTPS
RUN apk update && apk add --no-cache ca-certificates

# Configuration du répertoire de travail
WORKDIR /app

# Copie du binaire compilé depuis l'étape de construction
COPY --from=builder /app/pierceflare-cli .

# Variables d'environnement (valeurs par défaut, peuvent être remplacées au runtime)
# Ces variables DOIVENT être fournies lors de l'exécution du conteneur
# ENV PIERCEFLARE_API_KEY=""
# ENV PIERCEFLARE_SERVER_URL=""

# Intervalle de vérification par défaut : 5 minutes (300 secondes)
ENV PIERCEFLARE_CHECK_INTERVAL="300"

# Définition du point d'entrée
ENTRYPOINT ["/app/pierceflare-cli"]