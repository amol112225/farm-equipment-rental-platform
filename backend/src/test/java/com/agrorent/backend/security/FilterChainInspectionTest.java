package com.agrorent.backend.security;

import com.agrorent.backend.config.SecurityConfig;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Configuration;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

import jakarta.servlet.Filter;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class FilterChainInspectionTest {

    @Configuration
    @EnableWebSecurity
    static class TestConfig extends SecurityConfig {
        public TestConfig() {
            super(new JwtAuthenticationFilter(null, null), new CustomAuthenticationEntryPoint());
        }
    }

    @Test
    @DisplayName("Inspect Spring Security Filter Chain ordering")
    void testFilterChainOrdering() {
        AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext();
        context.register(TestConfig.class);
        context.refresh();

        SecurityFilterChain filterChain = context.getBean(SecurityFilterChain.class);
        assertNotNull(filterChain);

        List<Filter> filters = filterChain.getFilters();
        int corsFilterIndex = -1;
        int jwtFilterIndex = -1;
        for (int i = 0; i < filters.size(); i++) {
            String filterName = filters.get(i).getClass().getName();
            if (filterName.contains("CorsFilter")) {
                corsFilterIndex = i;
            }
            if (filterName.contains("JwtAuthenticationFilter")) {
                jwtFilterIndex = i;
            }
        }

        assertTrue(corsFilterIndex != -1, "CorsFilter must be present in filter chain");
        assertTrue(jwtFilterIndex != -1, "JwtAuthenticationFilter must be present in filter chain");
        assertTrue(corsFilterIndex < jwtFilterIndex, "CorsFilter must precede JwtAuthenticationFilter");
        context.close();
    }

    @Test
    @DisplayName("Preflight request through full SecurityFilterChain")
    void testPreflightThroughFilterChain() throws Exception {
        AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext();
        context.register(TestConfig.class);
        context.refresh();

        SecurityFilterChain filterChain = context.getBean(SecurityFilterChain.class);

        MockHttpServletRequest request = new MockHttpServletRequest("OPTIONS", "/api/equipment");
        request.addHeader("Origin", "https://farm-equipment-rental-platform-six.vercel.app");
        request.addHeader("Access-Control-Request-Method", "GET");
        request.addHeader("Access-Control-Request-Headers", "content-type");

        MockHttpServletResponse response = new MockHttpServletResponse();

        // Run through each filter in the chain sequentially, stopping if response is committed or filter stops chain
        List<Filter> filters = filterChain.getFilters();
        MockFilterChain chain = new MockFilterChain();
        for (Filter f : filters) {
            // Note: in servlet container, each filter wraps the next
        }

        // Using a composite chain
        class Runner {
            int current = 0;
            void doFilter(jakarta.servlet.ServletRequest req, jakarta.servlet.ServletResponse res) throws Exception {
                if (current < filters.size()) {
                    Filter f = filters.get(current++);
                    f.doFilter(req, res, (r, s) -> {
                        try {
                            doFilter(r, s);
                        } catch (Exception e) {
                            throw new RuntimeException(e);
                        }
                    });
                }
            }
        }

        Runner runner = new Runner();
        runner.doFilter(request, response);

        System.out.println("Response Status: " + response.getStatus());
        System.out.println("Allow Origin: " + response.getHeader("Access-Control-Allow-Origin"));
        System.out.println("Allow Credentials: " + response.getHeader("Access-Control-Allow-Credentials"));

        assertEquals(200, response.getStatus(), "Preflight should return 200 OK");
        assertEquals("https://farm-equipment-rental-platform-six.vercel.app",
                response.getHeader("Access-Control-Allow-Origin"));
        assertEquals("true", response.getHeader("Access-Control-Allow-Credentials"));

        context.close();
    }
}
