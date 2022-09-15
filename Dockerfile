FROM node:lts-alpine

# wokring directory in the container
WORKDIR /app     

COPY . .

RUN npm install --only=production

# RUN npm start

CMD ["npm", "start"]

EXPOSE 8000
