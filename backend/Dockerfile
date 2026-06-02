FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

COPY pom.xml .
COPY src ./src

RUN mvn -B -DskipTests package

FROM eclipse-temurin:17-jre
WORKDIR /app

ENV JAVA_OPTS=""
ENV SERVER_PORT=8083

COPY --from=build /app/target/discwake-backend-0.0.1-SNAPSHOT.jar /app/app.jar

EXPOSE 8083

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
