package com.agrorent.backend.service.impl;

import com.agrorent.backend.service.ImageStorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Lazy;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * Delegating primary ImageStorageService.
 * Automatically delegates to CloudinaryImageStorageService when cloud credentials are provided,
 * and falls back to LocalStorageService for local development and offline testing.
 * When Cloudinary is configured, LocalStorageService is never instantiated.
 */
@Service
@Primary
public class StorageServiceImpl implements ImageStorageService {

    private static final Logger log = LoggerFactory.getLogger(StorageServiceImpl.class);

    private final ImageStorageService cloudinaryStorage;
    private final ObjectProvider<ImageStorageService> localStorageProvider;
    private volatile ImageStorageService cachedLocalStorage;

    @Autowired
    public StorageServiceImpl(
            @Qualifier("cloudinaryImageStorageService") ImageStorageService cloudinaryStorage,
            @Lazy @Qualifier("localStorageService") ObjectProvider<ImageStorageService> localStorageProvider) {
        this.cloudinaryStorage = cloudinaryStorage;
        this.localStorageProvider = localStorageProvider;

        if (cloudinaryStorage != null && cloudinaryStorage.isCloudStorageConfigured()) {
            log.info("Primary storage engine: Cloudinary Persistent Cloud Storage.");
        } else {
            log.warn("Cloudinary credentials (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) "
                    + "not detected. Falling back to LocalStorageService for development. "
                    + "Notice: Containerized deployments on Render require Cloudinary or persistent S3 configuration.");
        }
    }

    // Overloaded constructor for unit testing and direct wiring
    public StorageServiceImpl(
            ImageStorageService cloudinaryStorage,
            ImageStorageService localStorage) {
        this.cloudinaryStorage = cloudinaryStorage;
        this.localStorageProvider = null;
        this.cachedLocalStorage = localStorage;
    }

    private ImageStorageService getActiveService() {
        if (cloudinaryStorage != null && cloudinaryStorage.isCloudStorageConfigured()) {
            return cloudinaryStorage;
        }
        return getLocalStorage();
    }

    private ImageStorageService getLocalStorage() {
        if (cachedLocalStorage == null) {
            synchronized (this) {
                if (cachedLocalStorage == null) {
                    if (localStorageProvider != null) {
                        cachedLocalStorage = localStorageProvider.getObject();
                    } else {
                        throw new IllegalStateException("Local storage provider is not available.");
                    }
                }
            }
        }
        return cachedLocalStorage;
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
        return cloudinaryStorage != null && cloudinaryStorage.isCloudStorageConfigured();
    }
}

