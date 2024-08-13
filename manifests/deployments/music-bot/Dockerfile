FROM openjdk:11-jre-slim

WORKDIR /usr/src/app

COPY musicBot-0.3.9.jar ./music-bot/

WORKDIR /usr/src/app/music-bot

EXPOSE 8080

CMD ["java", "-Dnogui=true", "-jar", "musicBot-0.3.9.jar"]
