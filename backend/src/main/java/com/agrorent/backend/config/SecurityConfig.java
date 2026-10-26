package com.agrorent.backend.config;

import com.agrorent.backend.security.CustomAuthenticationEntryPoint;
import com.agrorent.backend.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Spring Security Configuration for Stateless REST API, CORS rules,
 * endpoint protection, and JWT authentication filter registration.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomAuthenticationEntryPoint customAuthenticationEntryPoint;

    public static final String PRODUCTION_VERCEL_ORIGIN =
            "https://farm-equipment-rental-platform-six.vercel.app";

    public static final List<String> DEFAULT_DEVELOPMENT_ORIGINS = List.of(
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
            "http://127.0.0.1:3000"
    );

    public static final String DEFAULT_ALLOWED_ORIGINS =
            "http://localhost:5173,http://localhost:5174,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:5174,http://127.0.0.1:3000," + PRODUCTION_VERCEL_ORIGIN;

    @Value("${cors.allowed-origins:" + DEFAULT_ALLOWED_ORIGINS + "}")
    private String allowedOrigins = DEFAULT_ALLOWED_ORIGINS;

    @Autowired
    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter,
            CustomAuthenticationEntryPoint customAuthenticationEntryPoint) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.customAuthenticationEntryPoint = customAuthenticationEntryPoint;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exceptions -> exceptions.authenticationEntryPoint(customAuthenticationEntryPoint))
                .authorizeHttpRequests(auth -> auth
                        // Preflight CORS requests: explicitly permit all OPTIONS requests globally
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // Public Endpoints
                        .requestMatchers(HttpMethod.GET, "/api/health").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/farmers/register").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/farmers/login").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/equipment", "/api/equipment/", "/equipment", "/equipment/").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/equipment/{id:[0-9]+}", "/equipment/{id:[0-9]+}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/uploads/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/reviews/owner/**", "/api/reviews/equipment/**").permitAll()
                        // Protected Equipment and Booking endpoint explicit rules
                        .requestMatchers("/api/equipment/my", "/equipment/my").authenticated()
                        .requestMatchers("/equipment/**").authenticated()
                        .requestMatchers("/api/bookings/**").authenticated()
                        // All other API endpoints require authentication
                        .requestMatchers("/api/**").authenticated()
                        .anyRequest().permitAll())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        Set<String> resolvedOrigins = new LinkedHashSet<>();
        // 1. Explicitly allow exact production Vercel frontend origin
        resolvedOrigins.add(PRODUCTION_VERCEL_ORIGIN);
        // 2. Preserve local development origins
        resolvedOrigins.addAll(DEFAULT_DEVELOPMENT_ORIGINS);
        // 3. Include any additional configured origins (e.g. from CORS_ALLOWED_ORIGINS env var)
        if (allowedOrigins != null && !allowedOrigins.trim().isEmpty()) {
            Arrays.stream(allowedOrigins.split(","))
                    .map(String::trim)
                    .map(origin -> origin.replaceAll("/+$", ""))
                    .filter(origin -> !origin.isEmpty())
                    .forEach(resolvedOrigins::add);
        }

        configuration.setAllowedOrigins(new ArrayList<>(resolvedOrigins));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList(
                "Authorization",
                "Content-Type",
                "X-Requested-With",
                "Accept",
                "Origin",
                "Access-Control-Request-Method",
                "Access-Control-Request-Headers"
        ));
        configuration.setExposedHeaders(Arrays.asList("Authorization", "Content-Disposition"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
