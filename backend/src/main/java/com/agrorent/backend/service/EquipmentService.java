package com.agrorent.backend.service;

import com.agrorent.backend.dto.EquipmentCreateRequest;
import com.agrorent.backend.dto.EquipmentResponse;
import com.agrorent.backend.dto.EquipmentUpdateRequest;

import java.util.List;

/**
 * Service interface for Equipment management operations.
 */
public interface EquipmentService {

    List<EquipmentResponse> searchPublicEquipment(String keyword, String category, String location);

    EquipmentResponse getPublicEquipmentById(Long id);

    List<EquipmentResponse> getFarmerOwnEquipment(String farmerEmail);

    EquipmentResponse createEquipment(EquipmentCreateRequest request, String farmerEmail);

    EquipmentResponse updateEquipment(Long id, EquipmentUpdateRequest request, String farmerEmail);

    void deleteEquipment(Long id, String farmerEmail);
}
