FROM zenika/alpine-chrome:with-node

USER root
ENV NODE_ENV=production
WORKDIR /

COPY package*.json ./
RUN npm install

COPY . .
EXPOSE 8080
CMD ["node" , "index.js"]