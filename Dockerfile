FROM node:latest
WORKDIR /app
COPY package*.json ./
COPY yarn.lock ./
COPY src ./src
RUN npm install
EXPOSE 3000
CMD ["yarn", "start"]