package com.agrorent.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

/**
 * Service to validate uploaded equipment photos for type, size, content integrity, and quantity limits.
 */
@Service
public class FileValidationService {

    public static final long DEFAULT_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
    public static final int DEFAULT_MAX_PHOTOS_PER_EQUIPMENT = 5;

    private static final List<String> ALLOWED_CONTENT_TYPES = Arrays.asList(
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp"
    );

    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList(
            ".jpg",
            ".jpeg",
            ".png",
            ".webp"
    );

    @Value("${agrorent.storage.max-file-size-bytes:5242880}")
    private long maxFileSizeBytes = DEFAULT_MAX_FILE_SIZE_BYTES;

    @Value("${agrorent.storage.max-photos-per-equipment:5}")
    private int maxPhotosPerEquipment = DEFAULT_MAX_PHOTOS_PER_EQUIPMENT;

    public void validateImageFile(MultipartFile file) {
        if (file == null || file.isEmpty() || file.getSize() == 0) {
            throw new IllegalArgumentException("Uploaded file cannot be empty. Please select a valid photo.");
        }

        if (file.getSize() > maxFileSizeBytes) {
            long maxMb = maxFileSizeBytes / (1024 * 1024);
            throw new IllegalArgumentException("File size exceeds maximum allowed limit of " + maxMb + "MB.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.trim().toLowerCase(Locale.ROOT))) {
            throw new IllegalArgumentException("Unsupported file type '" + (contentType != null ? contentType : "unknown")
                    + "'. Only JPEG, PNG, and WebP images are supported.");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename != null && !originalFilename.isBlank()) {
            String lowerName = originalFilename.trim().toLowerCase(Locale.ROOT);
            boolean hasValidExtension = ALLOWED_EXTENSIONS.stream().anyMatch(lowerName::endsWith);
            if (!hasValidExtension) {
                throw new IllegalArgumentException("Invalid file extension. Only .jpg, .jpeg, .png, and .webp files are supported.");
            }
        }

        // Validate actual file content and magic bytes (do not trust extension or MIME type alone)
        validateImageContent(file);
    }

    private void validateImageContent(MultipartFile file) {
        byte[] header = new byte[16];
        int bytesRead;
        try (InputStream is = file.getInputStream()) {
            bytesRead = is.read(header);
        } catch (IOException e) {
            throw new IllegalArgumentException("Unable to read uploaded file content: " + e.getMessage(), e);
        }

        if (bytesRead < 12) {
            throw new IllegalArgumentException("Invalid or unreadable image content. The uploaded file is too small to be a valid image.");
        }

        boolean isJpeg = (header[0] == (byte) 0xFF && header[1] == (byte) 0xD8 && header[2] == (byte) 0xFF);
        boolean isPng = (bytesRead >= 8
                && header[0] == (byte) 0x89
                && header[1] == (byte) 0x50
                && header[2] == (byte) 0x4E
                && header[3] == (byte) 0x47
                && header[4] == (byte) 0x0D
                && header[5] == (byte) 0x0A
                && header[6] == (byte) 0x1A
                && header[7] == (byte) 0x0A);
        boolean isWebp = (bytesRead >= 12
                && header[0] == (byte) 0x52 && header[1] == (byte) 0x49 && header[2] == (byte) 0x46 && header[3] == (byte) 0x46
                && header[8] == (byte) 0x57 && header[9] == (byte) 0x45 && header[10] == (byte) 0x42 && header[11] == (byte) 0x50);

        if (!isJpeg && !isPng && !isWebp) {
            throw new IllegalArgumentException("Invalid or unreadable image content. The uploaded file content does not match any supported image format (JPEG, PNG, WebP).");
        }

        // Verify that magic bytes match declared content type / extension
        String contentType = file.getContentType() != null ? file.getContentType().trim().toLowerCase(Locale.ROOT) : "";
        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().trim().toLowerCase(Locale.ROOT) : "";

        if ((contentType.contains("jpeg") || contentType.contains("jpg") || filename.endsWith(".jpg") || filename.endsWith(".jpeg")) && !isJpeg) {
            throw new IllegalArgumentException("Invalid image content. File declared as JPEG does not contain valid JPEG image data.");
        }
        if ((contentType.contains("png") || filename.endsWith(".png")) && !isPng) {
            throw new IllegalArgumentException("Invalid image content. File declared as PNG does not contain valid PNG image data.");
        }
        if ((contentType.contains("webp") || filename.endsWith(".webp")) && !isWebp) {
            throw new IllegalArgumentException("Invalid image content. File declared as WebP does not contain valid WebP image data.");
        }

        // For JPEG and PNG: verify decodability with ImageIO
        if (isJpeg || isPng) {
            try (InputStream is = file.getInputStream()) {
                BufferedImage image = ImageIO.read(is);
                if (image == null || image.getWidth() <= 0 || image.getHeight() <= 0) {
                    throw new IllegalArgumentException("Invalid or unreadable image content. The image could not be decoded.");
                }
            } catch (IOException e) {
                throw new IllegalArgumentException("Invalid or unreadable image content. The image file is damaged or corrupted: " + e.getMessage(), e);
            }
        }

        // For WebP: verify VP8 chunk header in bytes 12..15
        if (isWebp) {
            if (bytesRead < 16) {
                throw new IllegalArgumentException("Invalid or unreadable image content. WebP file is missing VP8 chunk header.");
            }
            boolean validVp8 = (header[12] == (byte) 0x56 && header[13] == (byte) 0x50 && header[14] == (byte) 0x38
                    && (header[15] == (byte) 0x20 || header[15] == (byte) 0x4C || header[15] == (byte) 0x58));
            if (!validVp8) {
                throw new IllegalArgumentException("Invalid or unreadable image content. WebP file contains an invalid or missing VP8 chunk signature.");
            }
        }
    }

    public void validatePhotosQuantity(int currentPhotosCount, int newPhotosCount) {
        if (newPhotosCount <= 0) {
            throw new IllegalArgumentException("Please select at least one photo to upload.");
        }
        if (currentPhotosCount + newPhotosCount > maxPhotosPerEquipment) {
            throw new IllegalArgumentException("Cannot upload " + newPhotosCount + " photo(s). Maximum "
                    + maxPhotosPerEquipment + " photos allowed per equipment listing (currently "
                    + currentPhotosCount + " uploaded).");
        }
    }

    public long getMaxFileSizeBytes() {
        return maxFileSizeBytes;
    }

    public int getMaxPhotosPerEquipment() {
        return maxPhotosPerEquipment;
    }
}
