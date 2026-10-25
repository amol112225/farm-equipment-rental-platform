package com.agrorent.backend.service;

import com.agrorent.backend.service.impl.CloudinaryImageStorageService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.multipart.MultipartFile;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class CloudinaryImageStorageServiceTest {

    @Mock
    private MultipartFile mockFile;

    @Test
    @DisplayName("When all 3 Cloudinary credentials are provided, service must report configured")
    void whenCredentialsProvided_shouldBeConfigured() {
        CloudinaryImageStorageService service = new CloudinaryImageStorageService(
                "agrorent-cloud", "1234567890", "secret-key-abcdef"
        );
        assertTrue(service.isCloudStorageConfigured());
    }

    @Test
    @DisplayName("When credentials are missing or blank, service must report inactive without throwing at startup")
    void whenCredentialsMissingOrBlank_shouldBeInactive() {
        CloudinaryImageStorageService serviceEmpty = new CloudinaryImageStorageService("", "", "");
        assertFalse(serviceEmpty.isCloudStorageConfigured());

        CloudinaryImageStorageService serviceNull = new CloudinaryImageStorageService(null, null, null);
        assertFalse(serviceNull.isCloudStorageConfigured());

        CloudinaryImageStorageService servicePartial = new CloudinaryImageStorageService("cloud", "  ", "secret");
        assertFalse(servicePartial.isCloudStorageConfigured());
    }

    @Test
    @DisplayName("When inactive, storeImage must throw IllegalStateException with clear message")
    void whenInactive_storeImage_shouldThrow() {
        CloudinaryImageStorageService service = new CloudinaryImageStorageService("", "", "");
        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> service.storeImage(mockFile));
        assertTrue(ex.getMessage().contains("not configured"));
    }

    @Test
    @DisplayName("When inactive, deleteImage must safely no-op without error")
    void whenInactive_deleteImage_shouldNoOp() {
        CloudinaryImageStorageService service = new CloudinaryImageStorageService("", "", "");
        assertDoesNotThrow(() -> service.deleteImage("https://res.cloudinary.com/test/image/upload/v1/pic.jpg"));
        assertDoesNotThrow(() -> service.deleteImage(null));
        assertDoesNotThrow(() -> service.deleteImage("/api/uploads/equipment/local.jpg"));
    }
}
