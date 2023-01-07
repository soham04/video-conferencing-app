FROM node:lts-alpine

# Create app directory
WORKDIR /usr/src/app  

COPY . .

RUN npm install --only=production

# RUN npm start

CMD ["npm", "start"]

EXPOSE 3000
