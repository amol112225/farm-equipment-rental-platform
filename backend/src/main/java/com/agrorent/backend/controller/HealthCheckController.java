package com.agrorent.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Health Check Controller for AgroRent Backend.
 * Provides endpoint GET /api/health to verify application runtime
 * and database connectivity.
 */
@RestController
@RequestMapping("/api")
public class HealthCheckController {

    private final DataSource dataSource;

    @Autowired
    public HealthCheckController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> getHealthStatus() {
        Map<String, Object> response = new HashMap<>();
        response.put("application", "AgroRent Backend Foundation");
        response.put("timestamp", Instant.now().toString());

        Map<String, Object> dbStatus = new HashMap<>();
        boolean dbConnected = false;

        try (Connection connection = dataSource.getConnection()) {
            if (connection != null && connection.isValid(2)) {
                dbConnected = true;
                dbStatus.put("connected", true);
                dbStatus.put("details", "Database Connection Verified Successfully");
                dbStatus.put("catalog", connection.getCatalog());
            } else {
                dbStatus.put("connected", false);
                dbStatus.put("details", "Database connection invalid or timed out");
            }
        } catch (Exception e) {
            dbConnected = false;
            dbStatus.put("connected", false);
            dbStatus.put("error", e.getMessage());
        }

        response.put("database", dbStatus);
        response.put("status", dbConnected ? "UP" : "DEGRADED");

        return ResponseEntity.ok(response);
    }
}
