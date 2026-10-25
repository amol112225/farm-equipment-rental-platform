package com.agrorent.backend.security;

import com.agrorent.backend.config.SecurityConfig;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class CorsConfigurationTest {

    @Test
    @DisplayName("Should allow production Vercel frontend origin and required methods/headers")
    void testCorsConfigurationAllowsVercelOrigin() {
        JwtAuthenticationFilter jwtFilter = new JwtAuthenticationFilter(null, null);
        CustomAuthenticationEntryPoint authEntryPoint = new CustomAuthenticationEntryPoint();

        SecurityConfig securityConfig = new SecurityConfig(jwtFilter, authEntryPoint);

        CorsConfigurationSource source = securityConfig.corsConfigurationSource();
        assertNotNull(source);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/equipment");

        CorsConfiguration config = source.getCorsConfiguration(request);
        assertNotNull(config, "CORS configuration should be registered for /**");

        // Verify allowed origins
        List<String> allowedOrigins = config.getAllowedOrigins();
        assertNotNull(allowedOrigins);
        assertTrue(allowedOrigins.contains("https://farm-equipment-rental-platform-six.vercel.app"),
                "Allowed origins must include the production Vercel frontend URL");

        // Verify allowed methods
        List<String> allowedMethods = config.getAllowedMethods();
        assertNotNull(allowedMethods);
        assertTrue(allowedMethods.containsAll(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS")),
                "Allowed methods must include GET, POST, PUT, DELETE, and OPTIONS");

        // Verify allowed headers
        List<String> allowedHeaders = config.getAllowedHeaders();
        assertNotNull(allowedHeaders);
        assertTrue(allowedHeaders.contains("Content-Type"));
        assertTrue(allowedHeaders.contains("Authorization"));

        // Verify credentials
        assertTrue(Boolean.TRUE.equals(config.getAllowCredentials()),
                "Credentials must be allowed for JWT / authenticated cookie requests");
    }

    @Test
    @DisplayName("Should validate preflight origin check for Vercel frontend")
    void testPreflightCheckForVercelOrigin() {
        JwtAuthenticationFilter jwtFilter = new JwtAuthenticationFilter(null, null);
        CustomAuthenticationEntryPoint authEntryPoint = new CustomAuthenticationEntryPoint();

        SecurityConfig securityConfig = new SecurityConfig(jwtFilter, authEntryPoint);
        CorsConfigurationSource source = securityConfig.corsConfigurationSource();

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/equipment");
        CorsConfiguration config = source.getCorsConfiguration(request);

        assertNotNull(config);
        String vercelOrigin = "https://farm-equipment-rental-platform-six.vercel.app";
        String allowed = config.checkOrigin(vercelOrigin);
        assertEquals(vercelOrigin, allowed, "Vercel origin should be accepted by CORS check");

        String untrustedOrigin = "https://malicious-website.com";
        String rejected = config.checkOrigin(untrustedOrigin);
        assertNull(rejected, "Untrusted origin should be rejected by CORS check");
    }
}
