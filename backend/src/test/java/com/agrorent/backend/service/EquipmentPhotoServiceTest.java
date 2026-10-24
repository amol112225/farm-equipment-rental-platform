package com.agrorent.backend.service;

import com.agrorent.backend.dto.EquipmentCreateRequest;
import com.agrorent.backend.dto.EquipmentResponse;
import com.agrorent.backend.dto.EquipmentUpdateRequest;
import com.agrorent.backend.exception.ResourceNotFoundException;
import com.agrorent.backend.exception.UnauthorizedActionException;
import com.agrorent.backend.model.Equipment;
import com.agrorent.backend.model.EquipmentImage;
import com.agrorent.backend.model.Farmer;
import com.agrorent.backend.repository.EquipmentImageRepository;
import com.agrorent.backend.repository.EquipmentRepository;
import com.agrorent.backend.repository.FarmerRepository;
import com.agrorent.backend.repository.ReviewRepository;
import com.agrorent.backend.service.impl.EquipmentServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EquipmentPhotoServiceTest {

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private FarmerRepository farmerRepository;

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private EquipmentImageRepository equipmentImageRepository;

    @Mock
    private ImageStorageService imageStorageService;

    private FileValidationService fileValidationService;

    private EquipmentServiceImpl equipmentService;

    private Farmer ownerFarmer;
    private Farmer otherFarmer;
    private Equipment testEquipment;

    @BeforeEach
    void setUp() {
        fileValidationService = new FileValidationService();

        equipmentService = new EquipmentServiceImpl(
                equipmentRepository,
                farmerRepository,
                reviewRepository,
                equipmentImageRepository,
                imageStorageService,
                fileValidationService);

        ownerFarmer = new Farmer();
        ownerFarmer.setId(10L);
        ownerFarmer.setFullName("Ramesh Patel");
        ownerFarmer.setEmail("ramesh@agrorent.com");

        otherFarmer = new Farmer();
        otherFarmer.setId(20L);
        otherFarmer.setFullName("Suresh Kumar");
        otherFarmer.setEmail("suresh@agrorent.com");

        testEquipment = new Equipment();
        testEquipment.setId(101L);
        testEquipment.setName("Mahindra 575 DI");
        testEquipment.setCategory("Tractors");
        testEquipment.setDescription("45 HP tractor in excellent condition");
        testEquipment.setPrice(new BigDecimal("450.00"));
        testEquipment.setPriceUnit("hour");
        testEquipment.setBookingType("both");
        testEquipment.setLocation("Gujarat");
        testEquipment.setIsAvailable(true);
        testEquipment.setOwner(ownerFarmer);
        testEquipment.setImages(new ArrayList<>());
    }

    @Test
    @DisplayName("Should create equipment with valid photo uploads and assign primary image")
    void testCreateEquipmentWithPhotosSuccess() {
        when(farmerRepository.findByEmail("ramesh@agrorent.com")).thenReturn(Optional.of(ownerFarmer));
        when(equipmentRepository.save(any(Equipment.class))).thenAnswer(inv -> {
            Equipment eq = inv.getArgument(0);
            eq.setId(101L);
            return eq;
        });

        MockMultipartFile photo1 = new MockMultipartFile("photos", "tractor1.jpg", "image/jpeg",
                FileValidationServiceTest.createValidJpegBytes());
        MockMultipartFile photo2 = new MockMultipartFile("photos", "tractor2.png", "image/png",
                FileValidationServiceTest.createValidPngBytes());

        when(imageStorageService.storeImage(photo1)).thenReturn("/api/uploads/equipment/stored1.jpg");
        when(imageStorageService.storeImage(photo2)).thenReturn("/api/uploads/equipment/stored2.png");

        EquipmentCreateRequest request = new EquipmentCreateRequest();
        request.setName("Mahindra 575 DI");
        request.setCategory("Tractors");
        request.setDescription("45 HP tractor");
        request.setPrice(new BigDecimal("450.00"));
        request.setPriceUnit("hour");
        request.setBookingType("both");
        request.setLocation("Gujarat");

        EquipmentResponse response = equipmentService.createEquipmentWithPhotos(
                request,
                List.of(photo1, photo2),
                "ramesh@agrorent.com");

        assertNotNull(response);
        assertEquals(101L, response.getId());
        assertEquals("/api/uploads/equipment/stored1.jpg", response.getImageUrl());
        assertNotNull(response.getImages());
        assertEquals(2, response.getImages().size());
        assertTrue(response.getImages().get(0).getIsPrimary());
        assertEquals("/api/uploads/equipment/stored1.jpg", response.getImages().get(0).getImageUrl());
        assertFalse(response.getImages().get(1).getIsPrimary());
        assertEquals("/api/uploads/equipment/stored2.png", response.getImages().get(1).getImageUrl());

        verify(equipmentRepository, atLeastOnce()).save(any(Equipment.class));
    }

    @Test
    @DisplayName("Should upload additional photos to existing equipment for authenticated owner")
    void testUploadPhotosSuccess() {
        when(equipmentRepository.findById(101L)).thenReturn(Optional.of(testEquipment));
        when(equipmentRepository.save(any(Equipment.class))).thenReturn(testEquipment);

        MockMultipartFile newPhoto = new MockMultipartFile("photos", "attachment.jpg", "image/jpeg",
                FileValidationServiceTest.createValidJpegBytes());
        when(imageStorageService.storeImage(newPhoto)).thenReturn("/api/uploads/equipment/attachment.jpg");

        List<MultipartFile> files = List.of(newPhoto);
        EquipmentResponse response = equipmentService.uploadEquipmentPhotos(101L, files, "ramesh@agrorent.com");

        assertNotNull(response);
        assertEquals(1, testEquipment.getImages().size());
        assertEquals("/api/uploads/equipment/attachment.jpg", testEquipment.getImageUrl());
        verify(equipmentRepository).save(testEquipment);
    }

    @Test
    @DisplayName("Should reject photo upload when requester is not the equipment owner (UnauthorizedActionException)")
    void testUploadPhotosForbiddenForNonOwner() {
        when(equipmentRepository.findById(101L)).thenReturn(Optional.of(testEquipment));

        MockMultipartFile newPhoto = new MockMultipartFile("photos", "hack.jpg", "image/jpeg",
                FileValidationServiceTest.createValidJpegBytes());

        assertThrows(UnauthorizedActionException.class,
                () -> equipmentService.uploadEquipmentPhotos(101L, List.of(newPhoto), "suresh@agrorent.com"));

        verify(imageStorageService, never()).storeImage(any());
        verify(equipmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should delete photo when requested by owner and reassign primary if primary was deleted")
    void testDeletePhotoSuccessAndReassignPrimary() {
        EquipmentImage img1 = new EquipmentImage();
        img1.setId(501L);
        img1.setImageUrl("/api/uploads/equipment/photo1.jpg");
        img1.setIsPrimary(true);
        img1.setDisplayOrder(0);
        testEquipment.addImage(img1);
        testEquipment.setImageUrl("/api/uploads/equipment/photo1.jpg");

        EquipmentImage img2 = new EquipmentImage();
        img2.setId(502L);
        img2.setImageUrl("/api/uploads/equipment/photo2.jpg");
        img2.setIsPrimary(false);
        img2.setDisplayOrder(1);
        testEquipment.addImage(img2);

        when(equipmentRepository.findById(101L)).thenReturn(Optional.of(testEquipment));
        when(equipmentRepository.save(any(Equipment.class))).thenReturn(testEquipment);

        EquipmentResponse response = equipmentService.deleteEquipmentPhoto(101L, 501L, "ramesh@agrorent.com");

        assertNotNull(response);
        verify(imageStorageService).deleteImage("/api/uploads/equipment/photo1.jpg");
        assertEquals(1, testEquipment.getImages().size());
        // Remaining image 502 should now become primary
        assertTrue(img2.getIsPrimary());
        assertEquals("/api/uploads/equipment/photo2.jpg", testEquipment.getImageUrl());
        verify(equipmentRepository).save(testEquipment);
    }

    @Test
    @DisplayName("Should reject photo deletion when requested by non-owner")
    void testDeletePhotoForbiddenForNonOwner() {
        EquipmentImage img1 = new EquipmentImage();
        img1.setId(501L);
        img1.setImageUrl("/api/uploads/equipment/photo1.jpg");
        testEquipment.addImage(img1);

        when(equipmentRepository.findById(101L)).thenReturn(Optional.of(testEquipment));

        assertThrows(UnauthorizedActionException.class,
                () -> equipmentService.deleteEquipmentPhoto(101L, 501L, "suresh@agrorent.com"));

        verify(imageStorageService, never()).deleteImage(anyString());
        verify(equipmentImageRepository, never()).delete(any());
    }

    @Test
    @DisplayName("Should reject photo deletion if photo does not belong to the target equipment")
    void testDeletePhotoBelongingToDifferentEquipment() {
        when(equipmentRepository.findById(101L)).thenReturn(Optional.of(testEquipment));

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
                () -> equipmentService.deleteEquipmentPhoto(101L, 777L, "ramesh@agrorent.com"));

        assertTrue(ex.getMessage().contains("Photo with ID 777 not found on equipment listing 101"));
        verify(imageStorageService, never()).deleteImage(anyString());
    }

    @Test
    @DisplayName("Should set selected photo as primary and update legacy imageUrl")
    void testSetPrimaryPhotoSuccess() {
        EquipmentImage img1 = new EquipmentImage();
        img1.setId(501L);
        img1.setImageUrl("/api/uploads/equipment/photo1.jpg");
        img1.setIsPrimary(true);
        testEquipment.addImage(img1);

        EquipmentImage img2 = new EquipmentImage();
        img2.setId(502L);
        img2.setImageUrl("/api/uploads/equipment/photo2.jpg");
        img2.setIsPrimary(false);
        testEquipment.addImage(img2);

        when(equipmentRepository.findById(101L)).thenReturn(Optional.of(testEquipment));
        when(equipmentRepository.save(any(Equipment.class))).thenReturn(testEquipment);

        EquipmentResponse response = equipmentService.setPrimaryPhoto(101L, 502L, "ramesh@agrorent.com");

        assertNotNull(response);
        assertFalse(img1.getIsPrimary());
        assertTrue(img2.getIsPrimary());
        assertEquals("/api/uploads/equipment/photo2.jpg", testEquipment.getImageUrl());
        verify(equipmentRepository).save(testEquipment);
    }

    @Test
    @DisplayName("Should reject setting primary photo when requested by non-owner")
    void testSetPrimaryPhotoForbiddenForNonOwner() {
        EquipmentImage img1 = new EquipmentImage();
        img1.setId(501L);
        testEquipment.addImage(img1);

        when(equipmentRepository.findById(101L)).thenReturn(Optional.of(testEquipment));

        assertThrows(UnauthorizedActionException.class,
                () -> equipmentService.setPrimaryPhoto(101L, 501L, "suresh@agrorent.com"));

        verify(equipmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should preserve existing photos when editing general equipment fields")
    void testUpdateEquipmentPreservesExistingPhotos() {
        EquipmentImage img1 = new EquipmentImage();
        img1.setId(501L);
        img1.setImageUrl("/api/uploads/equipment/photo1.jpg");
        img1.setIsPrimary(true);
        testEquipment.addImage(img1);
        testEquipment.setImageUrl("/api/uploads/equipment/photo1.jpg");

        when(equipmentRepository.findById(101L)).thenReturn(Optional.of(testEquipment));
        when(equipmentRepository.save(any(Equipment.class))).thenReturn(testEquipment);

        EquipmentUpdateRequest updateReq = new EquipmentUpdateRequest();
        updateReq.setName("Mahindra 575 DI Updated Edition");
        updateReq.setCategory("Tractors");
        updateReq.setDescription("Updated description");
        updateReq.setPrice(new BigDecimal("500.00"));
        updateReq.setPriceUnit("hour");
        updateReq.setBookingType("both");
        updateReq.setLocation("Gujarat");
        updateReq.setIsAvailable(true);

        EquipmentResponse response = equipmentService.updateEquipment(101L, updateReq, "ramesh@agrorent.com");

        assertNotNull(response);
        assertEquals("Mahindra 575 DI Updated Edition", response.getName());
        assertEquals(1, testEquipment.getImages().size());
        assertEquals("/api/uploads/equipment/photo1.jpg", testEquipment.getImageUrl());
    }

    @Test
    @DisplayName("Should handle legacy equipment without photos gracefully")
    void testLegacyEquipmentWithoutPhotos() {
        testEquipment.setImages(new ArrayList<>());
        testEquipment.setImageUrl(null);

        when(equipmentRepository.findById(101L)).thenReturn(Optional.of(testEquipment));

        EquipmentResponse response = equipmentService.getPublicEquipmentById(101L);

        assertNotNull(response);
        assertNull(response.getImageUrl());
        assertNotNull(response.getImages());
        assertTrue(response.getImages().isEmpty());
    }

    @Test
    @DisplayName("Should handle storage failure gracefully by propagating error and avoiding invalid state")
    void testStorageFailureHandling() {
        when(farmerRepository.findByEmail("ramesh@agrorent.com")).thenReturn(Optional.of(ownerFarmer));
        MockMultipartFile photo = new MockMultipartFile("photos", "upload.jpg", "image/jpeg",
                FileValidationServiceTest.createValidJpegBytes());

        when(imageStorageService.storeImage(photo)).thenThrow(new RuntimeException("Cloudinary connection failed"));

        EquipmentCreateRequest request = new EquipmentCreateRequest();
        request.setName("Failed Equipment");
        request.setCategory("Tractors");
        request.setDescription("45 HP tractor");
        request.setPrice(new BigDecimal("450.00"));
        request.setPriceUnit("hour");
        request.setBookingType("both");
        request.setLocation("Gujarat");

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> equipmentService.createEquipmentWithPhotos(request, List.of(photo), "ramesh@agrorent.com"));

        assertTrue(ex.getMessage().contains("Cloudinary connection failed"));
        // Ensure no equipment was saved with corrupt/partial images
        verify(equipmentRepository, never()).save(any(Equipment.class));
    }

    @Test
    @DisplayName("Should create equipment with explicitly designated primary photo index")
    void testCreateEquipmentWithExplicitPrimaryIndex() {
        when(farmerRepository.findByEmail("ramesh@agrorent.com")).thenReturn(Optional.of(ownerFarmer));
        when(equipmentRepository.save(any(Equipment.class))).thenAnswer(inv -> {
            Equipment eq = inv.getArgument(0);
            eq.setId(101L);
            return eq;
        });

        MockMultipartFile photo1 = new MockMultipartFile("photos", "tractor1.jpg", "image/jpeg",
                FileValidationServiceTest.createValidJpegBytes());
        MockMultipartFile photo2 = new MockMultipartFile("photos", "tractor2.png", "image/png",
                FileValidationServiceTest.createValidPngBytes());

        when(imageStorageService.storeImage(photo1)).thenReturn("/api/uploads/equipment/stored1.jpg");
        when(imageStorageService.storeImage(photo2)).thenReturn("/api/uploads/equipment/stored2.png");

        EquipmentCreateRequest request = new EquipmentCreateRequest();
        request.setName("Mahindra 575 DI");
        request.setCategory("Tractors");
        request.setDescription("45 HP tractor");
        request.setPrice(new BigDecimal("450.00"));
        request.setPriceUnit("hour");
        request.setBookingType("both");
        request.setLocation("Gujarat");

        // Request with primaryIndex = 1 (second photo)
        EquipmentResponse response = equipmentService.createEquipmentWithPhotos(
                request,
                List.of(photo1, photo2),
                1,
                "ramesh@agrorent.com");

        assertNotNull(response);
        assertEquals("/api/uploads/equipment/stored2.png", response.getImageUrl());
        assertFalse(response.getImages().get(0).getIsPrimary());
        assertTrue(response.getImages().get(1).getIsPrimary());
        assertEquals("/api/uploads/equipment/stored2.png", response.getImages().get(1).getImageUrl());
    }

    @Test
    @DisplayName("Should update equipment and change primary photo via primaryImageId")
    void testUpdateEquipmentWithPrimaryImageId() {
        EquipmentImage img1 = new EquipmentImage();
        img1.setId(501L);
        img1.setImageUrl("/api/uploads/equipment/photo1.jpg");
        img1.setIsPrimary(true);
        testEquipment.addImage(img1);

        EquipmentImage img2 = new EquipmentImage();
        img2.setId(502L);
        img2.setImageUrl("/api/uploads/equipment/photo2.jpg");
        img2.setIsPrimary(false);
        testEquipment.addImage(img2);

        when(equipmentRepository.findById(101L)).thenReturn(Optional.of(testEquipment));
        when(equipmentRepository.save(any(Equipment.class))).thenReturn(testEquipment);

        EquipmentUpdateRequest updateReq = new EquipmentUpdateRequest();
        updateReq.setName("Mahindra 575 DI Super");
        updateReq.setCategory("Tractors");
        updateReq.setPrice(new BigDecimal("500.00"));
        updateReq.setPriceUnit("hour");
        updateReq.setBookingType("instant");
        updateReq.setLocation("Punjab");
        updateReq.setPrimaryImageId(502L);

        EquipmentResponse response = equipmentService.updateEquipment(101L, updateReq, "ramesh@agrorent.com");

        assertNotNull(response);
        assertFalse(img1.getIsPrimary());
        assertTrue(img2.getIsPrimary());
        assertEquals("/api/uploads/equipment/photo2.jpg", testEquipment.getImageUrl());
        assertEquals("/api/uploads/equipment/photo2.jpg", response.getImageUrl());
    }

    @Test
    @DisplayName("Should reject updateEquipment when primaryImageId belongs to another equipment or does not exist")
    void testUpdateEquipmentRejectsForeignPrimaryImageId() {
        EquipmentImage img1 = new EquipmentImage();
        img1.setId(501L);
        img1.setImageUrl("/api/uploads/equipment/photo1.jpg");
        img1.setIsPrimary(true);
        testEquipment.addImage(img1);

        when(equipmentRepository.findById(101L)).thenReturn(Optional.of(testEquipment));

        EquipmentUpdateRequest updateReq = new EquipmentUpdateRequest();
        updateReq.setName("Mahindra 575 DI Super");
        updateReq.setCategory("Tractors");
        updateReq.setPrice(new BigDecimal("500.00"));
        updateReq.setPriceUnit("hour");
        updateReq.setBookingType("instant");
        updateReq.setLocation("Punjab");
        updateReq.setPrimaryImageId(999L); // ID 999 does not belong to this equipment

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> equipmentService.updateEquipment(101L, updateReq, "ramesh@agrorent.com"));

        assertTrue(ex.getMessage().contains("999"));
        assertTrue(ex.getMessage().contains("does not belong to this equipment listing"));
    }

    @Test
    @DisplayName("Should use deterministic first photo fallback when no photo is marked primary")
    void testDeterministicFallbackWhenNoPrimarySet() {
        EquipmentImage img1 = new EquipmentImage();
        img1.setId(501L);
        img1.setImageUrl("/api/uploads/equipment/photo1.jpg");
        img1.setIsPrimary(false);
        testEquipment.addImage(img1);

        EquipmentImage img2 = new EquipmentImage();
        img2.setId(502L);
        img2.setImageUrl("/api/uploads/equipment/photo2.jpg");
        img2.setIsPrimary(false);
        testEquipment.addImage(img2);

        testEquipment.setImageUrl(null);

        when(equipmentRepository.findById(101L)).thenReturn(Optional.of(testEquipment));

        EquipmentResponse response = equipmentService.getPublicEquipmentById(101L);

        assertNotNull(response);
        // First photo is deterministically designated as primary cover photo
        assertEquals("/api/uploads/equipment/photo1.jpg", response.getImageUrl());
        assertTrue(response.getImages().get(0).getIsPrimary());
        assertFalse(response.getImages().get(1).getIsPrimary());
    }
}
