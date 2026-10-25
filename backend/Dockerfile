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

# Pre-create uploads directory and set permissions for unprivileged user
RUN mkdir -p /app/uploads/equipment && chown -R agrorent:agrorent /app

USER agrorent:agrorent

# Copy the built Spring Boot runnable JAR from builder stage
COPY --from=builder --chown=agrorent:agrorent /workspace/target/*.jar app.jar

# Dynamic port binding (Render injects PORT at container runtime, defaults to 8080)
ENV PORT=8080
EXPOSE 8080

# Spring production flags, PID 1 signal handling (exec), and dynamic port binding
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Dserver.port=${PORT:-8080} -Djava.security.egd=file:/dev/./urandom -jar app.jar"]

