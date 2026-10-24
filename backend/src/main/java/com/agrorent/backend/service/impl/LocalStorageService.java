package com.agrorent.backend.service.impl;

import com.agrorent.backend.service.ImageStorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.UUID;

/**
 * Local filesystem implementation of ImageStorageService for local development and offline environments.
 * Saves photos to a configurable directory and serves them via Spring WebMvc ResourceHandler.
 */
@Service("localStorageService")
public class LocalStorageService implements ImageStorageService {

    private static final Logger log = LoggerFactory.getLogger(LocalStorageService.class);

    private final Path uploadLocation;

    public LocalStorageService(@Value("${agrorent.storage.local.upload-dir:uploads/equipment}") String uploadDir) {
        this.uploadLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.uploadLocation);
            log.info("LocalStorageService initialized. Storage directory: {}", this.uploadLocation);
        } catch (IOException e) {
            log.error("Could not initialize local storage directory: {}", this.uploadLocation, e);
            throw new IllegalStateException("Could not create local storage directory", e);
        }
    }

    @Override
    public String storeImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Cannot store empty file.");
        }

        String originalFilename = file.getOriginalFilename();
        String extension = ".jpg";
        if (originalFilename != null && originalFilename.contains(".")) {
            String ext = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase(Locale.ROOT);
            if (ext.equals(".jpg") || ext.equals(".jpeg") || ext.equals(".png") || ext.equals(".webp")) {
                extension = ext;
            }
        }

        String safeFileName = UUID.randomUUID().toString() + "_" + System.currentTimeMillis() + extension;
        Path targetLocation = this.uploadLocation.resolve(safeFileName).normalize();

        // Prevent path traversal
        if (!targetLocation.startsWith(this.uploadLocation)) {
            throw new SecurityException("Cannot store file outside current storage directory.");
        }

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, targetLocation, StandardCopyOption.REPLACE_EXISTING);
            log.debug("Stored file locally at {}", targetLocation);
            return "/api/uploads/equipment/" + safeFileName;
        } catch (IOException e) {
            log.error("Failed to store file {}", safeFileName, e);
            throw new RuntimeException("Failed to persist uploaded photo: " + e.getMessage(), e);
        }
    }

    @Override
    public void deleteImage(String imageUrl) {
        if (imageUrl == null || !imageUrl.contains("/api/uploads/equipment/")) {
            return;
        }

        try {
            String fileName = imageUrl.substring(imageUrl.lastIndexOf("/") + 1);
            Path targetFile = this.uploadLocation.resolve(fileName).normalize();
            if (targetFile.startsWith(this.uploadLocation) && Files.exists(targetFile)) {
                Files.delete(targetFile);
                log.debug("Deleted local file {}", targetFile);
            }
        } catch (Exception e) {
            log.warn("Failed to delete local photo at URL: {}", imageUrl, e);
        }
    }

    @Override
    public boolean isCloudStorageConfigured() {
        return false;
    }

    public Path getUploadLocation() {
        return uploadLocation;
    }
}
