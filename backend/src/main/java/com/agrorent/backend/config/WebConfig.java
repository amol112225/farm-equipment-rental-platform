package com.agrorent.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Web MVC Configuration for serving locally stored equipment images.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${agrorent.storage.local.upload-dir:uploads/equipment}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        String uriPath = uploadPath.toUri().toString();
        if (!uriPath.endsWith("/")) {
            uriPath = uriPath + "/";
        }
        registry.addResourceHandler("/api/uploads/equipment/**")
                .addResourceLocations(uriPath);
    }
}
