# ==============================================================================
# AgroRent Backend Dockerfile
# Multi-stage production container build for Spring Boot on Java 21
# Compatible with Render Docker runtime or any container deployment platform
# ==============================================================================

# Stage 1: Build stage with Maven and OpenJDK 21
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder
WORKDIR /workspace

# Cache Maven dependencies by copying pom.xml first
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy application source code and compile production JAR
COPY src ./src
RUN mvn clean package -DskipTests -B

# Stage 2: Minimal, secure JRE 21 runtime container
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create unprivileged system user for process isolation
RUN addgroup -S agrorent && adduser -S agrorent -G agrorent
USER agrorent:agrorent

# Copy the built Spring Boot runnable JAR from builder stage
COPY --from=builder /workspace/target/*.jar app.jar

# Dynamic port binding (Render injects PORT at container runtime)
ENV PORT=8080
EXPOSE ${PORT}

# Spring production flags & JVM container memory ergonomics
ENTRYPOINT ["sh", "-c", "java -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom -jar app.jar"]
