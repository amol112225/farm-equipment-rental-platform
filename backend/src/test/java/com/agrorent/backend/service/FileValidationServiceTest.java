package com.agrorent.backend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;

public class FileValidationServiceTest {

    private FileValidationService validationService;

    @BeforeEach
    void setUp() {
        validationService = new FileValidationService();
    }

    public static byte[] createValidJpegBytes() {
        try {
            BufferedImage image = new BufferedImage(2, 2, BufferedImage.TYPE_INT_RGB);
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(image, "jpg", baos);
            return baos.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    public static byte[] createValidPngBytes() {
        try {
            BufferedImage image = new BufferedImage(2, 2, BufferedImage.TYPE_INT_RGB);
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(image, "png", baos);
            return baos.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    public static byte[] createValidWebpBytes() {
        return new byte[]{
                0x52, 0x49, 0x46, 0x46, 0x1A, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
                0x56, 0x50, 0x38, 0x4C, 0x0D, 0x00, 0x00, 0x00, 0x2F, 0x00, 0x00, 0x00,
                0x10, 0x07, 0x10, 0x11, 0x11, (byte) 0x88, (byte) 0x88, (byte) 0xFE, 0x07, 0x00
        };
    }

    @Test
    @DisplayName("Scenario 1: Should accept valid JPEG photo")
    void testValidJpeg() {
        MockMultipartFile file = new MockMultipartFile(
                "photos",
                "tractor.jpg",
                "image/jpeg",
                createValidJpegBytes()
        );

        assertDoesNotThrow(() -> validationService.validateImageFile(file));
    }

    @Test
    @DisplayName("Scenario 2: Should accept valid PNG photo")
    void testValidPng() {
        MockMultipartFile file = new MockMultipartFile(
                "photos",
                "harvester.png",
                "image/png",
                createValidPngBytes()
        );

        assertDoesNotThrow(() -> validationService.validateImageFile(file));
    }

    @Test
    @DisplayName("Scenario 3: Should accept valid WebP photo")
    void testValidWebp() {
        MockMultipartFile file = new MockMultipartFile(
                "photos",
                "plow.webp",
                "image/webp",
                createValidWebpBytes()
        );

        assertDoesNotThrow(() -> validationService.validateImageFile(file));
    }

    @Test
    @DisplayName("Scenario 4: Should reject unsupported MIME type such as PDF or GIF")
    void testRejectUnsupportedMimeType() {
        MockMultipartFile pdfFile = new MockMultipartFile(
                "photos",
                "document.pdf",
                "application/pdf",
                new byte[]{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12}
        );

        IllegalArgumentException exPdf = assertThrows(IllegalArgumentException.class,
                () -> validationService.validateImageFile(pdfFile));
        assertTrue(exPdf.getMessage().contains("Unsupported file type"));

        MockMultipartFile gifFile = new MockMultipartFile(
                "photos",
                "animated.gif",
                "image/gif",
                new byte[]{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12}
        );

        IllegalArgumentException exGif = assertThrows(IllegalArgumentException.class,
                () -> validationService.validateImageFile(gifFile));
        assertTrue(exGif.getMessage().contains("Unsupported file type"));
    }

    @Test
    @DisplayName("Scenario 5: Should reject file exceeding maximum size limit (5MB)")
    void testRejectFileExceedingMaxSize() {
        // 5MB + 1 byte
        byte[] oversizedData = new byte[(5 * 1024 * 1024) + 1];
        MockMultipartFile oversizedFile = new MockMultipartFile(
                "photos",
                "large.jpg",
                "image/jpeg",
                oversizedData
        );

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> validationService.validateImageFile(oversizedFile));
        assertTrue(ex.getMessage().contains("exceeds maximum allowed limit"));
    }

    @Test
    @DisplayName("Scenario 6: Should reject empty or zero-byte file")
    void testRejectEmptyFile() {
        MockMultipartFile emptyFile = new MockMultipartFile(
                "photos",
                "empty.jpg",
                "image/jpeg",
                new byte[0]
        );

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> validationService.validateImageFile(emptyFile));
        assertTrue(ex.getMessage().contains("empty"));

        IllegalArgumentException exNull = assertThrows(IllegalArgumentException.class,
                () -> validationService.validateImageFile(null));
        assertTrue(exNull.getMessage().contains("empty"));
    }

    @Test
    @DisplayName("Scenario 7: Should reject invalid or unreadable image content even if extension is .jpg")
    void testRejectInvalidImageContent() {
        // Plain text disguised as JPEG
        MockMultipartFile textFile = new MockMultipartFile(
                "photos",
                "fake.jpg",
                "image/jpeg",
                "This is not a real image, it is plain text content!".getBytes(StandardCharsets.UTF_8)
        );

        IllegalArgumentException exText = assertThrows(IllegalArgumentException.class,
                () -> validationService.validateImageFile(textFile));
        assertTrue(exText.getMessage().contains("Invalid or unreadable image content")
                || exText.getMessage().contains("Invalid image content"));

        // Corrupted JPEG header (starts with FF D8 FF but remaining bytes are corrupted)
        byte[] corruptedJpeg = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00};
        MockMultipartFile corruptFile = new MockMultipartFile(
                "photos",
                "corrupt.jpg",
                "image/jpeg",
                corruptedJpeg
        );

        IllegalArgumentException exCorrupt = assertThrows(IllegalArgumentException.class,
                () -> validationService.validateImageFile(corruptFile));
        assertTrue(exCorrupt.getMessage().contains("Invalid or unreadable image content"));
    }

    @Test
    @DisplayName("Should reject file with disallowed extension even if MIME is spoofed")
    void testRejectDisallowedExtension() {
        MockMultipartFile fakeFile = new MockMultipartFile(
                "photos",
                "script.exe",
                "image/jpeg",
                createValidJpegBytes()
        );

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> validationService.validateImageFile(fakeFile));
        assertTrue(ex.getMessage().contains("Invalid file extension"));
    }

    @Test
    @DisplayName("Should validate photo quantity within limit")
    void testValidatePhotosQuantityWithinLimit() {
        assertDoesNotThrow(() -> validationService.validatePhotosQuantity(0, 3));
        assertDoesNotThrow(() -> validationService.validatePhotosQuantity(2, 3));
    }

    @Test
    @DisplayName("Should reject when total photos exceed limit of 5")
    void testRejectPhotosQuantityExceedingLimit() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> validationService.validatePhotosQuantity(3, 3));
        assertTrue(ex.getMessage().contains("Maximum 5 photos allowed"));
    }

    @Test
    @DisplayName("Should reject zero or negative new photo upload count")
    void testRejectZeroPhotoUploadCount() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> validationService.validatePhotosQuantity(0, 0));
        assertTrue(ex.getMessage().contains("at least one photo"));
    }
}
