package com.example.demo.config;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

class SecurityConfigCorsTest {

    private static final String VERCEL_ORIGIN =
            "https://gym-management-ochre-zeta.vercel.app";

    @Test
    void allowsDeployedFrontendPreflightRequests() {
        CorsConfigurationSource source =
                new SecurityConfig(null, null).corsConfigurationSource();
        HttpServletRequest request =
                new MockHttpServletRequest("OPTIONS", "/api/dashboard");
        CorsConfiguration configuration = source.getCorsConfiguration(request);

        assertNotNull(configuration);
        assertEquals(VERCEL_ORIGIN, configuration.checkOrigin(VERCEL_ORIGIN));
        assertNull(configuration.checkOrigin("https://untrusted.example"));
        assertNotNull(configuration.checkHttpMethod(HttpMethod.GET));
        assertNotNull(configuration.checkHttpMethod(HttpMethod.PATCH));
        assertNotNull(configuration.checkHeaders(
                List.of("authorization", "content-type")));
        assertEquals(Boolean.TRUE, configuration.getAllowCredentials());
    }
}
