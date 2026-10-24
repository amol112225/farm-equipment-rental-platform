package com.agrorent.backend.service;

import com.agrorent.backend.dto.EquipmentCreateRequest;
import com.agrorent.backend.dto.EquipmentResponse;
import com.agrorent.backend.dto.EquipmentUpdateRequest;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Service interface for Equipment management operations.
 */
public interface EquipmentService {

    List<EquipmentResponse> searchPublicEquipment(String keyword, String category, String location);

    EquipmentResponse getPublicEquipmentById(Long id);

    List<EquipmentResponse> getFarmerOwnEquipment(String farmerEmail);

    EquipmentResponse createEquipment(EquipmentCreateRequest request, String farmerEmail);

    EquipmentResponse createEquipmentWithPhotos(EquipmentCreateRequest request, List<MultipartFile> photos, String farmerEmail);

    EquipmentResponse createEquipmentWithPhotos(EquipmentCreateRequest request, List<MultipartFile> photos, Integer primaryIndex, String farmerEmail);

    EquipmentResponse updateEquipment(Long id, EquipmentUpdateRequest request, String farmerEmail);

    void deleteEquipment(Long id, String farmerEmail);

    EquipmentResponse uploadEquipmentPhotos(Long equipmentId, List<MultipartFile> photos, String farmerEmail);

    EquipmentResponse deleteEquipmentPhoto(Long equipmentId, Long photoId, String farmerEmail);

    EquipmentResponse setPrimaryPhoto(Long equipmentId, Long photoId, String farmerEmail);
}
