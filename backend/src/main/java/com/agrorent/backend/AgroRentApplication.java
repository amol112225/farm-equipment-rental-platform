package com.agrorent.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.nio.charset.StandardCharsets;

/**
 * Main Spring Boot Application Launcher for AgroRent Platform.
 */
@SpringBootApplication
public class AgroRentApplication {

    public static void main(String[] args) {
        loadDotenvIfPresent();
        SpringApplication.run(AgroRentApplication.class, args);
    }

    /**
     * Automatically loads key-value pairs from a local .env file (if present)
     * into Java System properties before Spring Boot boots up.
     * Host environment variables and existing system properties take precedence.
     */
    private static void loadDotenvIfPresent() {
        File[] candidateFiles = new File[] {
                new File(".env"),
                new File("backend/.env"),
                new File("../backend/.env")
        };

        for (File file : candidateFiles) {
            if (file.exists() && file.isFile()) {
                try (BufferedReader reader = new BufferedReader(new FileReader(file, StandardCharsets.UTF_8))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        line = line.trim();
                        if (line.isEmpty() || line.startsWith("#")) {
                            continue;
                        }
                        int separatorIndex = line.indexOf('=');
                        if (separatorIndex > 0) {
                            String key = line.substring(0, separatorIndex).trim();
                            String value = line.substring(separatorIndex + 1).trim();

                            // Strip surrounding single or double quotes if present
                            if ((value.startsWith("\"") && value.endsWith("\"")) ||
                                (value.startsWith("'") && value.endsWith("'"))) {
                                if (value.length() >= 2) {
                                    value = value.substring(1, value.length() - 1);
                                }
                            }

                            // Host environment variables and existing system properties take precedence
                            if (System.getProperty(key) == null && System.getenv(key) == null) {
                                System.setProperty(key, value);
                            }
                        }
                    }
                } catch (Exception ignored) {
                    // Non-fatal if local .env cannot be read
                }
                break;
            }
        }
    }
}
