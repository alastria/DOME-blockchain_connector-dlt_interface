FROM node:14.20.0
ENV NODE_ENV=production
WORKDIR /usr/src/app
COPY . .
RUN npm install && npm install typescript@4.7.4 -g && npm install ts-node@10.8.1 -g && npm install mongodb
EXPOSE 8080
RUN chown -R node /usr/src/app
USER node
CMD ["ts-node", "src/server.ts"]