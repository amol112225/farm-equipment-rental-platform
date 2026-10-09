package com.agrorent.backend.service.impl;

import com.agrorent.backend.dto.EquipmentCreateRequest;
import com.agrorent.backend.dto.EquipmentResponse;
import com.agrorent.backend.dto.EquipmentUpdateRequest;
import com.agrorent.backend.exception.ResourceNotFoundException;
import com.agrorent.backend.exception.UnauthorizedActionException;
import com.agrorent.backend.model.Equipment;
import com.agrorent.backend.model.Farmer;
import com.agrorent.backend.repository.EquipmentRepository;
import com.agrorent.backend.repository.FarmerRepository;
import com.agrorent.backend.service.EquipmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service implementation for Equipment management.
 * Enforces server-side owner assignment, ownership verification for mutations,
 * and filtering for public and owner-managed listings.
 */
@Service
public class EquipmentServiceImpl implements EquipmentService {

    private final EquipmentRepository equipmentRepository;
    private final FarmerRepository farmerRepository;

    @Autowired
    public EquipmentServiceImpl(EquipmentRepository equipmentRepository, FarmerRepository farmerRepository) {
        this.equipmentRepository = equipmentRepository;
        this.farmerRepository = farmerRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<EquipmentResponse> searchPublicEquipment(String keyword, String category, String location) {
        String trimmedKeyword = keyword != null ? keyword.trim() : null;
        String trimmedCategory = category != null ? category.trim() : null;
        String trimmedLocation = location != null ? location.trim() : null;

        List<Equipment> equipmentList = equipmentRepository.searchPublicEquipment(trimmedKeyword, trimmedCategory, trimmedLocation);
        return equipmentList.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public EquipmentResponse getPublicEquipmentById(Long id) {
        Equipment equipment = equipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment listing not found with ID: " + id));

        if (!Boolean.TRUE.equals(equipment.getIsAvailable())) {
            throw new ResourceNotFoundException("Equipment listing is currently unavailable or not found.");
        }

        return mapToResponse(equipment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<EquipmentResponse> getFarmerOwnEquipment(String farmerEmail) {
        String normalizedEmail = farmerEmail != null ? farmerEmail.trim().toLowerCase() : "";
        if (!farmerRepository.existsByEmail(normalizedEmail)) {
            throw new ResourceNotFoundException("Farmer profile not found.");
        }

        List<Equipment> ownEquipment = equipmentRepository.findByOwnerEmail(normalizedEmail);
        return ownEquipment.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public EquipmentResponse createEquipment(EquipmentCreateRequest request, String farmerEmail) {
        String normalizedEmail = farmerEmail != null ? farmerEmail.trim().toLowerCase() : "";
        Farmer owner = farmerRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated farmer profile not found."));

        Equipment equipment = new Equipment(
                request.getName().trim(),
                request.getCategory().trim(),
                request.getDescription() != null ? request.getDescription().trim() : null,
                request.getPrice(),
                request.getPriceUnit().trim().toLowerCase(),
                request.getBookingType().trim().toLowerCase(),
                request.getLocation().trim(),
                request.getImageUrl() != null ? request.getImageUrl().trim() : null,
                request.getIsAvailable() != null ? request.getIsAvailable() : true,
                owner
        );

        Equipment savedEquipment = equipmentRepository.save(equipment);
        return mapToResponse(savedEquipment);
    }

    @Override
    @Transactional
    public EquipmentResponse updateEquipment(Long id, EquipmentUpdateRequest request, String farmerEmail) {
        Equipment equipment = equipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment listing not found with ID: " + id));

        String normalizedEmail = farmerEmail != null ? farmerEmail.trim().toLowerCase() : "";

        // Ownership Enforcement: Only the owner farmer can update the listing
        if (!equipment.getOwner().getEmail().equalsIgnoreCase(normalizedEmail)) {
            throw new UnauthorizedActionException("You are not authorized to update this equipment listing because you do not own it.");
        }

        equipment.setName(request.getName().trim());
        equipment.setCategory(request.getCategory().trim());
        equipment.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        equipment.setPrice(request.getPrice());
        equipment.setPriceUnit(request.getPriceUnit().trim().toLowerCase());
        equipment.setBookingType(request.getBookingType().trim().toLowerCase());
        equipment.setLocation(request.getLocation().trim());
        equipment.setImageUrl(request.getImageUrl() != null ? request.getImageUrl().trim() : null);
        if (request.getIsAvailable() != null) {
            equipment.setIsAvailable(request.getIsAvailable());
        }

        Equipment updatedEquipment = equipmentRepository.save(equipment);
        return mapToResponse(updatedEquipment);
    }

    @Override
    @Transactional
    public void deleteEquipment(Long id, String farmerEmail) {
        Equipment equipment = equipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment listing not found with ID: " + id));

        String normalizedEmail = farmerEmail != null ? farmerEmail.trim().toLowerCase() : "";

        // Ownership Enforcement: Only the owner farmer can delete the listing
        if (!equipment.getOwner().getEmail().equalsIgnoreCase(normalizedEmail)) {
            throw new UnauthorizedActionException("You are not authorized to delete this equipment listing because you do not own it.");
        }

        equipmentRepository.delete(equipment);
    }

    private EquipmentResponse mapToResponse(Equipment equipment) {
        return new EquipmentResponse(
                equipment.getId(),
                equipment.getName(),
                equipment.getCategory(),
                equipment.getDescription(),
                equipment.getPrice(),
                equipment.getPriceUnit(),
                equipment.getBookingType(),
                equipment.getLocation(),
                equipment.getImageUrl(),
                equipment.getIsAvailable(),
                equipment.getOwner().getId(),
                equipment.getOwner().getFullName(),
                equipment.getCreatedAt(),
                equipment.getUpdatedAt()
        );
    }
}
