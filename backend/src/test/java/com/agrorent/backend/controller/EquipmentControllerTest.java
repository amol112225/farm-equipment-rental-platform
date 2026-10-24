package com.agrorent.backend.controller;

import com.agrorent.backend.dto.ApiResponse;
import com.agrorent.backend.dto.EquipmentCreateRequest;
import com.agrorent.backend.dto.EquipmentResponse;
import com.agrorent.backend.service.EquipmentService;
import com.agrorent.backend.service.FileValidationServiceTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;

import java.security.Principal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EquipmentControllerTest {

    @Mock
    private EquipmentService equipmentService;

    private EquipmentController equipmentController;

    private Principal mockPrincipal;

    @BeforeEach
    void setUp() {
        equipmentController = new EquipmentController(equipmentService);
        mockPrincipal = () -> "owner@agrorent.com";
    }

    @Test
    @DisplayName("Should reject photo upload when unauthenticated (null Principal) with 401 UNAUTHORIZED")
    void testUploadPhotosUnauthenticated() {
        MockMultipartFile file = new MockMultipartFile("photos", "tractor.jpg", "image/jpeg", FileValidationServiceTest.createValidJpegBytes());

        ResponseEntity<ApiResponse<EquipmentResponse>> response =
                equipmentController.uploadPhotos(100L, List.of(file), null);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        verify(equipmentService, never()).uploadEquipmentPhotos(anyLong(), any(), anyString());
    }

    @Test
    @DisplayName("Should reject createEquipmentWithPhotos when unauthenticated with 401 UNAUTHORIZED")
    void testCreateEquipmentWithPhotosUnauthenticated() {
        MockMultipartFile file = new MockMultipartFile("photos", "tractor.jpg", "image/jpeg", FileValidationServiceTest.createValidJpegBytes());
        EquipmentCreateRequest req = new EquipmentCreateRequest();

        ResponseEntity<ApiResponse<EquipmentResponse>> response =
                equipmentController.createEquipmentWithPhotos(req, List.of(file), null);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        verify(equipmentService, never()).createEquipmentWithPhotos(any(), any(), anyString());
    }

    @Test
    @DisplayName("Should reject photo deletion when unauthenticated with 401 UNAUTHORIZED")
    void testDeletePhotoUnauthenticated() {
        ResponseEntity<ApiResponse<EquipmentResponse>> response =
                equipmentController.deletePhoto(100L, 500L, null);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        verify(equipmentService, never()).deleteEquipmentPhoto(anyLong(), anyLong(), anyString());
    }

    @Test
    @DisplayName("Should reject setting primary photo when unauthenticated with 401 UNAUTHORIZED")
    void testSetPrimaryPhotoUnauthenticated() {
        ResponseEntity<ApiResponse<EquipmentResponse>> response =
                equipmentController.setPrimaryPhoto(100L, 500L, null);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        verify(equipmentService, never()).setPrimaryPhoto(anyLong(), anyLong(), anyString());
    }

    @Test
    @DisplayName("Should allow photo upload for authenticated user and return 200 OK")
    void testUploadPhotosAuthenticated() {
        MockMultipartFile file = new MockMultipartFile("photos", "tractor.jpg", "image/jpeg", FileValidationServiceTest.createValidJpegBytes());
        EquipmentResponse mockResp = new EquipmentResponse();
        mockResp.setId(100L);

        when(equipmentService.uploadEquipmentPhotos(eq(100L), any(), eq("owner@agrorent.com")))
                .thenReturn(mockResp);

        ResponseEntity<ApiResponse<EquipmentResponse>> response =
                equipmentController.uploadPhotos(100L, List.of(file), mockPrincipal);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals(100L, response.getBody().getData().getId());
        verify(equipmentService).uploadEquipmentPhotos(eq(100L), any(), eq("owner@agrorent.com"));
    }

    @Test
    @DisplayName("Should allow setting primary photo for authenticated user and return 200 OK")
    void testSetPrimaryPhotoAuthenticated() {
        EquipmentResponse mockResp = new EquipmentResponse();
        mockResp.setId(100L);

        when(equipmentService.setPrimaryPhoto(100L, 500L, "owner@agrorent.com"))
                .thenReturn(mockResp);

        ResponseEntity<ApiResponse<EquipmentResponse>> response =
                equipmentController.setPrimaryPhoto(100L, 500L, mockPrincipal);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        verify(equipmentService).setPrimaryPhoto(100L, 500L, "owner@agrorent.com");
    }

    @Test
    @DisplayName("Should allow photo deletion for authenticated user and return 200 OK")
    void testDeletePhotoAuthenticated() {
        EquipmentResponse mockResp = new EquipmentResponse();
        mockResp.setId(100L);

        when(equipmentService.deleteEquipmentPhoto(100L, 500L, "owner@agrorent.com"))
                .thenReturn(mockResp);

        ResponseEntity<ApiResponse<EquipmentResponse>> response =
                equipmentController.deletePhoto(100L, 500L, mockPrincipal);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        verify(equipmentService).deleteEquipmentPhoto(100L, 500L, "owner@agrorent.com");
    }
}
