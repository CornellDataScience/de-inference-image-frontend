FROM node:10-alpine

ENV PORT 8080
WORKDIR /app

# Copying files and npm install
COPY package*.json ./
RUN npm install
COPY . .

# Build webapp
RUN npm run build

# Serving webserver
EXPOSE ${PORT}
CMD [ "npm", "run", "start-server" ] 
