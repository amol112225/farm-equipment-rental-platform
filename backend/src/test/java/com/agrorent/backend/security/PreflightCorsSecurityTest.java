package com.agrorent.backend.security;

import com.agrorent.backend.config.SecurityConfig;
import com.agrorent.backend.controller.EquipmentController;
import com.agrorent.backend.service.EquipmentService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.filter.CorsFilter;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class PreflightCorsSecurityTest {

    @Test
    @DisplayName("Simulate preflight OPTIONS /api/equipment through CorsFilter")
    void testPreflightThroughCorsFilter() throws Exception {
        JwtAuthenticationFilter jwtFilter = new JwtAuthenticationFilter(null, null);
        CustomAuthenticationEntryPoint authEntryPoint = new CustomAuthenticationEntryPoint();
        SecurityConfig securityConfig = new SecurityConfig(jwtFilter, authEntryPoint);

        EquipmentService equipmentService = Mockito.mock(EquipmentService.class);
        EquipmentController equipmentController = new EquipmentController(equipmentService);

        CorsFilter corsFilter = new CorsFilter(securityConfig.corsConfigurationSource());

        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(equipmentController)
                .addFilters(corsFilter, jwtFilter)
                .build();

        mockMvc.perform(options("/api/equipment")
                        .header("Origin", "https://farm-equipment-rental-platform-six.vercel.app")
                        .header("Access-Control-Request-Method", "GET")
                        .header("Access-Control-Request-Headers", "content-type"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "https://farm-equipment-rental-platform-six.vercel.app"))
                .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
    }

    @Test
    @DisplayName("Simulate preflight OPTIONS with PATCH method through CorsFilter")
    void testPreflightPatchMethodThroughCorsFilter() throws Exception {
        JwtAuthenticationFilter jwtFilter = new JwtAuthenticationFilter(null, null);
        CustomAuthenticationEntryPoint authEntryPoint = new CustomAuthenticationEntryPoint();
        SecurityConfig securityConfig = new SecurityConfig(jwtFilter, authEntryPoint);

        EquipmentService equipmentService = Mockito.mock(EquipmentService.class);
        EquipmentController equipmentController = new EquipmentController(equipmentService);

        CorsFilter corsFilter = new CorsFilter(securityConfig.corsConfigurationSource());

        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(equipmentController)
                .addFilters(corsFilter, jwtFilter)
                .build();

        mockMvc.perform(options("/api/equipment/1")
                        .header("Origin", "https://farm-equipment-rental-platform-six.vercel.app")
                        .header("Access-Control-Request-Method", "PATCH")
                        .header("Access-Control-Request-Headers", "content-type,authorization"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "https://farm-equipment-rental-platform-six.vercel.app"))
                .andExpect(header().string("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,PATCH,OPTIONS"));
    }

    @Test
    @DisplayName("Reject untrusted origin on preflight OPTIONS with 403 Forbidden")
    void testPreflightRejectUntrustedOrigin() throws Exception {
        JwtAuthenticationFilter jwtFilter = new JwtAuthenticationFilter(null, null);
        CustomAuthenticationEntryPoint authEntryPoint = new CustomAuthenticationEntryPoint();
        SecurityConfig securityConfig = new SecurityConfig(jwtFilter, authEntryPoint);

        EquipmentService equipmentService = Mockito.mock(EquipmentService.class);
        EquipmentController equipmentController = new EquipmentController(equipmentService);

        CorsFilter corsFilter = new CorsFilter(securityConfig.corsConfigurationSource());

        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(equipmentController)
                .addFilters(corsFilter, jwtFilter)
                .build();

        mockMvc.perform(options("/api/equipment")
                        .header("Origin", "https://untrusted-malicious-site.com")
                        .header("Access-Control-Request-Method", "GET")
                        .header("Access-Control-Request-Headers", "content-type"))
                .andExpect(status().isForbidden());
    }
}
