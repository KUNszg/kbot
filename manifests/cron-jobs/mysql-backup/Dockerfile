FROM node:20.12.2-alpine

WORKDIR /usr/src/app

COPY mysqlBackup.js ./mysql-backup/

WORKDIR /usr/src/app/mysql-backup

EXPOSE 8080

CMD ["node", "mysqlBackup.js"]