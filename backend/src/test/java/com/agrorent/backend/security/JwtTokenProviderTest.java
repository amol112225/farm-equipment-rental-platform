package com.agrorent.backend.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;

class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;
    private final String validSecret = "AgroRent_Super_Secure_HMAC_SHA256_JWT_Secret_Key_2026_At_Least_32_Bytes!";

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtSecretEnv", validSecret);
        jwtTokenProvider.init();
    }

    @Test
    @DisplayName("Should generate valid token and extract subject email")
    void testGenerateTokenAndExtractEmail() {
        String email = "farmer.test@agrorent.com";
        String token = jwtTokenProvider.generateToken(email);

        assertNotNull(token);
        assertTrue(jwtTokenProvider.validateToken(token));
        assertEquals(email, jwtTokenProvider.getEmailFromToken(token));
    }

    @Test
    @DisplayName("Should fail startup if JWT secret is missing or shorter than 256 bits")
    void testShortSecretValidation() {
        JwtTokenProvider providerMissing = new JwtTokenProvider();
        ReflectionTestUtils.setField(providerMissing, "jwtSecretEnv", "");
        IllegalStateException exMissing = assertThrows(IllegalStateException.class, providerMissing::init);
        assertTrue(exMissing.getMessage().contains("not configured"));

        JwtTokenProvider providerShort = new JwtTokenProvider();
        ReflectionTestUtils.setField(providerShort, "jwtSecretEnv", "too-short-secret");
        IllegalStateException exShort = assertThrows(IllegalStateException.class, providerShort::init);
        assertTrue(exShort.getMessage().contains("256 bits"));
    }

    @Test
    @DisplayName("Should reject invalid or tampered token")
    void testValidateInvalidToken() {
        assertFalse(jwtTokenProvider.validateToken("invalid.jwt.signature"));
    }

    @Test
    @DisplayName("Should reject expired token")
    void testValidateExpiredToken() {
        SecretKey key = Keys.hmacShaKeyFor(validSecret.getBytes(StandardCharsets.UTF_8));
        Date now = new Date();
        Date past = new Date(now.getTime() - 10000); // 10 seconds ago

        String expiredToken = Jwts.builder()
                .subject("farmer.expired@agrorent.com")
                .issuedAt(past)
                .expiration(past)
                .signWith(key, Jwts.SIG.HS256)
                .compact();

        assertFalse(jwtTokenProvider.validateToken(expiredToken));
    }
}
