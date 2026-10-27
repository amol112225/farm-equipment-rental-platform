package com.agrorent.backend.security;

import com.agrorent.backend.repository.FarmerRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    private JwtTokenProvider tokenProvider;

    @Mock
    private FarmerRepository farmerRepository;

    @Mock
    private FilterChain filterChain;

    private JwtAuthenticationFilter jwtAuthenticationFilter;
    private final String validSecret = "AgroRent_Super_Secure_HMAC_SHA256_JWT_Secret_Key_2026_At_Least_32_Bytes!";

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        tokenProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(tokenProvider, "jwtSecretEnv", validSecret);
        tokenProvider.init();

        jwtAuthenticationFilter = new JwtAuthenticationFilter(tokenProvider, farmerRepository);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Should authenticate valid JWT token without executing redundant database lookup")
    void testValidTokenSetsAuthenticationWithoutDatabaseLookup() throws ServletException, IOException {
        String email = "farmer@example.com";
        String validToken = tokenProvider.generateToken(email);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + validToken);
        MockHttpServletResponse response = new MockHttpServletResponse();

        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertNotNull(auth, "Authentication should be set in SecurityContextHolder");
        assertEquals(email, auth.getPrincipal(), "Principal must be the verified email from token claims");
        assertEquals(email, auth.getName(), "Name must match verified email");
        assertTrue(auth.isAuthenticated(), "Authentication must be marked authenticated");

        // Verify that farmerRepository was NEVER queried during JWT authentication!
        verify(farmerRepository, never()).findByEmail(anyString());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("Should not authenticate when token validation fails")
    void testInvalidTokenDoesNotSetAuthentication() throws ServletException, IOException {
        String invalidToken = "invalid.tampered.token";

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + invalidToken);
        MockHttpServletResponse response = new MockHttpServletResponse();

        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(farmerRepository, never()).findByEmail(anyString());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("Should pass request through filter chain when Authorization header is absent")
    void testNoTokenPassesThroughChain() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(farmerRepository, never()).findByEmail(anyString());
        verify(filterChain).doFilter(request, response);
    }
}
