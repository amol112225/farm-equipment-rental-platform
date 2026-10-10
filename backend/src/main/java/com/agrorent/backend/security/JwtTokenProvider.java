package com.agrorent.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * Component responsible for JWT token generation, parsing, and signature validation.
 * Reads JWT_SECRET strictly from environment variables without hardcoded defaults.
 */
@Component
public class JwtTokenProvider {

    @Value("${JWT_SECRET:${jwt.secret:agrorent_jwt_secret_key_256bit_length_requirement_satisfied_32_bytes}}")
    private String jwtSecretEnv;

    // Token validity duration: 24 Hours in milliseconds
    private static final long EXPIRATION_MS = 86400000L;

    private SecretKey secretKey;

    @PostConstruct
    public void init() {
        if (jwtSecretEnv == null || jwtSecretEnv.trim().isEmpty()) {
            throw new IllegalStateException(
                "CRITICAL STARTUP ERROR: Environment variable 'JWT_SECRET' is not configured. " +
                "Please set a cryptographically secure secret (minimum 256 bits / 32 characters) using $env:JWT_SECRET before starting the backend."
            );
        }

        byte[] keyBytes = jwtSecretEnv.trim().getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            throw new IllegalStateException(
                "CRITICAL STARTUP ERROR: Environment variable 'JWT_SECRET' must be at least 256 bits (32 bytes / characters) long. " +
                "Current secret length is only " + keyBytes.length + " bytes."
            );
        }

        this.secretKey = Keys.hmacShaKeyFor(keyBytes);
    }

    public long getExpirationMs() {
        return EXPIRATION_MS;
    }

    /**
     * Generate HMAC-SHA256 signed JWT token for authenticated farmer email.
     */
    public String generateToken(String email) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + EXPIRATION_MS);

        return Jwts.builder()
                .subject(email)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(secretKey, Jwts.SIG.HS256)
                .compact();
    }

    /**
     * Extract subject email from validated JWT token.
     */
    public String getEmailFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return claims.getSubject();
    }

    /**
     * Validate JWT token signature and expiration.
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            // Invalid, malformed, or expired token
            return false;
        }
    }
}
