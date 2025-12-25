# Use uma imagem Node estável e leve
FROM node:22-slim

# Define diretório de trabalho
WORKDIR /usr/src/app

# Instala apenas dependências de produção
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Copia o restante do código
COPY . .

# Define variável de ambiente padrão (opcional)
ENV NODE_ENV=production

# Cloud Run injeta PORT dinamicamente
# Expor é opcional, mas ajuda na documentação da imagem
EXPOSE 8080

# Comando de inicialização
CMD ["npm", "start"]
