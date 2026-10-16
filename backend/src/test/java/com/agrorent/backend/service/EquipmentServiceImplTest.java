package com.agrorent.backend.service;

import com.agrorent.backend.dto.EquipmentCreateRequest;
import com.agrorent.backend.dto.EquipmentResponse;
import com.agrorent.backend.dto.EquipmentUpdateRequest;
import com.agrorent.backend.exception.ResourceNotFoundException;
import com.agrorent.backend.exception.UnauthorizedActionException;
import com.agrorent.backend.model.Equipment;
import com.agrorent.backend.model.Farmer;
import com.agrorent.backend.repository.EquipmentRepository;
import com.agrorent.backend.repository.FarmerRepository;
import com.agrorent.backend.repository.ReviewRepository;
import com.agrorent.backend.service.impl.EquipmentServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EquipmentServiceImplTest {

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private FarmerRepository farmerRepository;

    @Mock
    private ReviewRepository reviewRepository;

    @InjectMocks
    private EquipmentServiceImpl equipmentService;

    private Farmer mockFarmer1;
    private Farmer mockFarmer2;
    private Equipment mockEquipment;

    @BeforeEach
    void setUp() {
        mockFarmer1 = new Farmer();
        mockFarmer1.setId(1L);
        mockFarmer1.setFullName("John Farmer");
        mockFarmer1.setEmail("john@farm.com");
        mockFarmer1.setPhone("9876543210");
        mockFarmer1.setPassword("hashedpassword");

        mockFarmer2 = new Farmer();
        mockFarmer2.setId(2L);
        mockFarmer2.setFullName("Jane Farmer");
        mockFarmer2.setEmail("jane@farm.com");
        mockFarmer2.setPhone("9876543211");
        mockFarmer2.setPassword("hashedpassword");

        mockEquipment = new Equipment();
        mockEquipment.setId(100L);
        mockEquipment.setName("John Deere Tractor");
        mockEquipment.setCategory("Tractors");
        mockEquipment.setDescription("50 HP 4WD Tractor");
        mockEquipment.setPrice(new BigDecimal("500.00"));
        mockEquipment.setPriceUnit("hour");
        mockEquipment.setBookingType("instant");
        mockEquipment.setLocation("Punjab");
        mockEquipment.setImageUrl("https://example.com/tractor.jpg");
        mockEquipment.setIsAvailable(true);
        mockEquipment.setOwner(mockFarmer1);
    }

    @Test
    @DisplayName("Should create equipment for authenticated farmer")
    void testCreateEquipmentSuccess() {
        when(farmerRepository.findByEmail("john@farm.com")).thenReturn(Optional.of(mockFarmer1));
        when(equipmentRepository.save(any(Equipment.class))).thenAnswer(invocation -> {
            Equipment saved = invocation.getArgument(0);
            saved.setId(100L);
            return saved;
        });

        EquipmentCreateRequest request = new EquipmentCreateRequest();
        request.setName("John Deere Tractor");
        request.setCategory("Tractors");
        request.setDescription("50 HP 4WD Tractor");
        request.setPrice(new BigDecimal("500.00"));
        request.setPriceUnit("hour");
        request.setBookingType("instant");
        request.setLocation("Punjab");
        request.setImageUrl("https://example.com/tractor.jpg");

        EquipmentResponse response = equipmentService.createEquipment(request, "john@farm.com");

        assertNotNull(response);
        assertEquals(100L, response.getId());
        assertEquals("John Deere Tractor", response.getName());
        assertEquals("Tractors", response.getCategory());
        assertEquals(new BigDecimal("500.00"), response.getPrice());
        assertEquals("hour", response.getPriceUnit());
        assertEquals("instant", response.getBookingType());
        assertEquals("John Farmer", response.getOwnerName());
        assertEquals(1L, response.getOwnerId());
        assertTrue(response.getIsAvailable());

        verify(equipmentRepository).save(any(Equipment.class));
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when creating equipment with non-existent farmer")
    void testCreateEquipmentFarmerNotFound() {
        when(farmerRepository.findByEmail("unknown@farm.com")).thenReturn(Optional.empty());

        EquipmentCreateRequest request = new EquipmentCreateRequest();
        request.setName("Tractor");

        assertThrows(ResourceNotFoundException.class, () -> equipmentService.createEquipment(request, "unknown@farm.com"));
    }

    @Test
    @DisplayName("Should retrieve public equipment details if available")
    void testGetPublicEquipmentByIdSuccess() {
        when(equipmentRepository.findById(100L)).thenReturn(Optional.of(mockEquipment));

        EquipmentResponse response = equipmentService.getPublicEquipmentById(100L);

        assertNotNull(response);
        assertEquals(100L, response.getId());
        assertEquals("John Deere Tractor", response.getName());
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when public listing is unavailable or missing")
    void testGetPublicEquipmentByIdNotFoundOrUnavailable() {
        when(equipmentRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> equipmentService.getPublicEquipmentById(999L));

        mockEquipment.setIsAvailable(false);
        when(equipmentRepository.findById(100L)).thenReturn(Optional.of(mockEquipment));

        assertThrows(ResourceNotFoundException.class, () -> equipmentService.getPublicEquipmentById(100L));
    }

    @Test
    @DisplayName("Should return filtered available public equipment listings")
    void testSearchPublicEquipment() {
        when(equipmentRepository.searchPublicEquipment(anyString(), anyString(), anyString()))
                .thenReturn(List.of(mockEquipment));

        List<EquipmentResponse> results = equipmentService.searchPublicEquipment("Tractor", "Tractors", "Punjab");

        assertEquals(1, results.size());
        assertEquals("John Deere Tractor", results.get(0).getName());
    }

    @Test
    @DisplayName("Should return authenticated farmer's own equipment listings")
    void testGetFarmerOwnEquipment() {
        when(farmerRepository.existsByEmail("john@farm.com")).thenReturn(true);
        when(equipmentRepository.findByOwnerEmail("john@farm.com")).thenReturn(List.of(mockEquipment));

        List<EquipmentResponse> results = equipmentService.getFarmerOwnEquipment("john@farm.com");

        assertEquals(1, results.size());
        assertEquals("John Deere Tractor", results.get(0).getName());
    }

    @Test
    @DisplayName("Should update equipment when owner makes request")
    void testUpdateEquipmentSuccess() {
        when(equipmentRepository.findById(100L)).thenReturn(Optional.of(mockEquipment));
        when(equipmentRepository.save(any(Equipment.class))).thenReturn(mockEquipment);

        EquipmentUpdateRequest updateReq = new EquipmentUpdateRequest();
        updateReq.setName("Updated Tractor Name");
        updateReq.setCategory("Tractors");
        updateReq.setPrice(new BigDecimal("600.00"));
        updateReq.setPriceUnit("day");
        updateReq.setBookingType("request");
        updateReq.setLocation("Haryana");
        updateReq.setIsAvailable(false);

        EquipmentResponse response = equipmentService.updateEquipment(100L, updateReq, "john@farm.com");

        assertNotNull(response);
        verify(equipmentRepository).save(mockEquipment);
        assertEquals("Updated Tractor Name", mockEquipment.getName());
        assertEquals(new BigDecimal("600.00"), mockEquipment.getPrice());
        assertEquals("day", mockEquipment.getPriceUnit());
        assertEquals("request", mockEquipment.getBookingType());
        assertFalse(mockEquipment.getIsAvailable());
    }

    @Test
    @DisplayName("Should throw UnauthorizedActionException when non-owner attempts update")
    void testUpdateEquipmentNonOwnerForbidden() {
        when(equipmentRepository.findById(100L)).thenReturn(Optional.of(mockEquipment));

        EquipmentUpdateRequest updateReq = new EquipmentUpdateRequest();
        updateReq.setName("Malicious Update");

        assertThrows(UnauthorizedActionException.class, () -> equipmentService.updateEquipment(100L, updateReq, "jane@farm.com"));
        verify(equipmentRepository, never()).save(any(Equipment.class));
    }

    @Test
    @DisplayName("Should delete equipment when owner makes request")
    void testDeleteEquipmentSuccess() {
        when(equipmentRepository.findById(100L)).thenReturn(Optional.of(mockEquipment));

        equipmentService.deleteEquipment(100L, "john@farm.com");

        verify(equipmentRepository).delete(mockEquipment);
    }

    @Test
    @DisplayName("Should throw UnauthorizedActionException when non-owner attempts deletion")
    void testDeleteEquipmentNonOwnerForbidden() {
        when(equipmentRepository.findById(100L)).thenReturn(Optional.of(mockEquipment));

        assertThrows(UnauthorizedActionException.class, () -> equipmentService.deleteEquipment(100L, "jane@farm.com"));
        verify(equipmentRepository, never()).delete(any(Equipment.class));
    }

    @Test
    @DisplayName("Should populate owner rating and review count from reviewRepository")
    void testEquipmentResponseIncludesOwnerRatingAndReviewCount() {
        when(equipmentRepository.findById(100L)).thenReturn(Optional.of(mockEquipment));
        when(reviewRepository.countByOwnerId(1L)).thenReturn(5L);
        when(reviewRepository.getAverageRatingByOwnerId(1L)).thenReturn(4.6666);

        EquipmentResponse response = equipmentService.getPublicEquipmentById(100L);

        assertNotNull(response);
        assertEquals(4.7, response.getOwnerRating());
        assertEquals(5L, response.getOwnerTotalReviews());
    }
}
