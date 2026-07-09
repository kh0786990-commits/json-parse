FROM node:22

# Install ImageMagick for JP2 conversion
RUN apt-get update && apt-get install -y imagemagick

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
