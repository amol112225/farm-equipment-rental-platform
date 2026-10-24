package com.agrorent.backend.service;

import org.springframework.web.multipart.MultipartFile;

/**
 * Storage interface for persisting equipment photos.
 * Implemented by Cloudinary (persistent cloud storage) and Local filesystem storage.
 */
public interface ImageStorageService {

    /**
     * Stores an uploaded photo and returns the accessible public URL or relative path.
     * @param file The validated multipart file to store
     * @return The stored image URL
     */
    String storeImage(MultipartFile file);

    /**
     * Deletes a stored photo given its URL or identifier.
     * @param imageUrl The URL of the photo to remove
     */
    void deleteImage(String imageUrl);

    /**
     * Indicates whether a persistent cloud storage provider is actively configured.
     * @return true if cloud storage is active, false if using local storage
     */
    boolean isCloudStorageConfigured();
}
