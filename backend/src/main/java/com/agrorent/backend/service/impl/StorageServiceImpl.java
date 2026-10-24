package com.agrorent.backend.service.impl;

import com.agrorent.backend.service.ImageStorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * Delegating primary ImageStorageService.
 * Automatically delegates to CloudinaryImageStorageService when cloud credentials are provided,
 * and falls back to LocalStorageService for local development and offline testing.
 */
@Service
@Primary
public class StorageServiceImpl implements ImageStorageService {

    private static final Logger log = LoggerFactory.getLogger(StorageServiceImpl.class);

    private final ImageStorageService cloudinaryStorage;
    private final ImageStorageService localStorage;

    public StorageServiceImpl(
            @Qualifier("cloudinaryImageStorageService") ImageStorageService cloudinaryStorage,
            @Qualifier("localStorageService") ImageStorageService localStorage) {
        this.cloudinaryStorage = cloudinaryStorage;
        this.localStorage = localStorage;

        if (cloudinaryStorage.isCloudStorageConfigured()) {
            log.info("Primary storage engine: Cloudinary Persistent Cloud Storage.");
        } else {
            log.warn("Cloudinary credentials (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) "
                    + "not detected. Falling back to LocalStorageService for development. "
                    + "Notice: Containerized deployments on Render require Cloudinary or persistent S3 configuration.");
        }
    }

    private ImageStorageService getActiveService() {
        if (cloudinaryStorage.isCloudStorageConfigured()) {
            return cloudinaryStorage;
        }
        return localStorage;
    }

    @Override
    public String storeImage(MultipartFile file) {
        return getActiveService().storeImage(file);
    }

    @Override
    public void deleteImage(String imageUrl) {
        getActiveService().deleteImage(imageUrl);
    }

    @Override
    public boolean isCloudStorageConfigured() {
        return cloudinaryStorage.isCloudStorageConfigured();
    }
}
