package com.agrorent.backend.service.impl;

import com.agrorent.backend.service.ImageStorageService;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

/**
 * Cloudinary persistent object storage implementation for production deployment on Render.
 * Activated whenever CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are provided.
 */
@Service("cloudinaryImageStorageService")
public class CloudinaryImageStorageService implements ImageStorageService {

    private static final Logger log = LoggerFactory.getLogger(CloudinaryImageStorageService.class);

    private final Cloudinary cloudinary;
    private final boolean configured;

    public CloudinaryImageStorageService(
            @Value("${agrorent.storage.cloudinary.cloud-name:}") String cloudName,
            @Value("${agrorent.storage.cloudinary.api-key:}") String apiKey,
            @Value("${agrorent.storage.cloudinary.api-secret:}") String apiSecret) {

        if (cloudName != null && !cloudName.isBlank()
                && apiKey != null && !apiKey.isBlank()
                && apiSecret != null && !apiSecret.isBlank()) {
            this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                    "cloud_name", cloudName.trim(),
                    "api_key", apiKey.trim(),
                    "api_secret", apiSecret.trim(),
                    "secure", true
            ));
            this.configured = true;
            log.info("Cloudinary persistent image storage configured successfully for cloud: {}", cloudName.trim());
        } else {
            this.cloudinary = null;
            this.configured = false;
            log.info("Cloudinary credentials not provided. Cloudinary storage is inactive.");
        }
    }

    @Override
    public String storeImage(MultipartFile file) {
        if (!configured || cloudinary == null) {
            throw new IllegalStateException("Cloudinary storage provider is not configured.");
        }

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "folder", "agrorent/equipment",
                    "resource_type", "image"
            ));

            String secureUrl = (String) uploadResult.get("secure_url");
            if (secureUrl == null || secureUrl.isBlank()) {
                throw new RuntimeException("Cloudinary upload did not return a secure URL.");
            }

            log.debug("Successfully uploaded photo to Cloudinary: {}", secureUrl);
            return secureUrl;
        } catch (IOException e) {
            log.error("Failed to upload image to Cloudinary", e);
            throw new RuntimeException("Failed to upload photo to Cloudinary cloud storage: " + e.getMessage(), e);
        }
    }

    @Override
    public void deleteImage(String imageUrl) {
        if (!configured || cloudinary == null || imageUrl == null || !imageUrl.contains("cloudinary.com")) {
            return;
        }

        try {
            // Extract publicId between /upload/(v\d+/)? and the file extension
            String publicId = extractPublicId(imageUrl);
            if (publicId != null) {
                cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
                log.debug("Deleted image from Cloudinary with publicId: {}", publicId);
            }
        } catch (Exception e) {
            log.warn("Failed to delete image from Cloudinary: {}", imageUrl, e);
        }
    }

    @Override
    public boolean isCloudStorageConfigured() {
        return configured;
    }

    private String extractPublicId(String imageUrl) {
        try {
            int uploadIdx = imageUrl.indexOf("/upload/");
            if (uploadIdx == -1) return null;
            String afterUpload = imageUrl.substring(uploadIdx + 8);
            // strip version prefix if present (e.g. v1234567890/)
            if (afterUpload.startsWith("v") && afterUpload.indexOf("/") != -1) {
                afterUpload = afterUpload.substring(afterUpload.indexOf("/") + 1);
            }
            int dotIdx = afterUpload.lastIndexOf(".");
            return dotIdx != -1 ? afterUpload.substring(0, dotIdx) : afterUpload;
        } catch (Exception e) {
            return null;
        }
    }
}
