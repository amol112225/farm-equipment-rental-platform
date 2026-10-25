package com.agrorent.backend.controller;

import com.agrorent.backend.dto.ApiResponse;
import com.agrorent.backend.dto.EquipmentCreateRequest;
import com.agrorent.backend.dto.EquipmentResponse;
import com.agrorent.backend.dto.EquipmentUpdateRequest;
import com.agrorent.backend.service.EquipmentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;

/**
 * Controller handling Equipment Management REST APIs, including photo uploads.
 */
@RestController
@RequestMapping({"/api/equipment", "/equipment"})
public class EquipmentController {

    private final EquipmentService equipmentService;

    @Autowired
    public EquipmentController(EquipmentService equipmentService) {
        this.equipmentService = equipmentService;
    }

    /**
     * GET /api/equipment
     * Public search & browsing endpoint for available equipment listings.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<EquipmentResponse>>> searchPublicEquipment(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String location) {
        List<EquipmentResponse> listings = equipmentService.searchPublicEquipment(keyword, category, location);
        ApiResponse<List<EquipmentResponse>> response = ApiResponse.success("Equipment listings retrieved successfully", listings);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/equipment/my
     * Protected endpoint returning the authenticated farmer's own listings (including unavailable ones).
     */
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<EquipmentResponse>>> getFarmerOwnEquipment(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        List<EquipmentResponse> ownListings = equipmentService.getFarmerOwnEquipment(principal.getName());
        ApiResponse<List<EquipmentResponse>> response = ApiResponse.success("Your equipment listings retrieved successfully", ownListings);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/equipment/{id}
     * Public details endpoint for an available equipment listing.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EquipmentResponse>> getPublicEquipmentById(@PathVariable Long id) {
        EquipmentResponse equipment = equipmentService.getPublicEquipmentById(id);
        ApiResponse<EquipmentResponse> response = ApiResponse.success("Equipment details retrieved successfully", equipment);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/equipment (JSON)
     * Protected endpoint for authenticated farmers to list new equipment via JSON.
     */
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<EquipmentResponse>> createEquipment(
            @Valid @RequestBody EquipmentCreateRequest request,
            Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        EquipmentResponse created = equipmentService.createEquipment(request, principal.getName());
        ApiResponse<EquipmentResponse> response = ApiResponse.success("Equipment listing created successfully", created);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * POST /api/equipment (Multipart)
     * Protected endpoint for authenticated farmers to list new equipment with photo attachments.
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<EquipmentResponse>> createEquipmentWithPhotos(
            @Valid @ModelAttribute EquipmentCreateRequest request,
            @RequestParam(value = "photos", required = false) List<MultipartFile> photos,
            @RequestParam(value = "primaryIndex", required = false, defaultValue = "0") Integer primaryIndex,
            Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        int resolvedIndex = primaryIndex != null ? primaryIndex : 0;
        EquipmentResponse created = equipmentService.createEquipmentWithPhotos(request, photos, resolvedIndex, principal.getName());
        ApiResponse<EquipmentResponse> response = ApiResponse.success("Equipment listing created successfully", created);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    public ResponseEntity<ApiResponse<EquipmentResponse>> createEquipmentWithPhotos(
            EquipmentCreateRequest request,
            List<MultipartFile> photos,
            Principal principal) {
        return createEquipmentWithPhotos(request, photos, 0, principal);
    }

    /**
     * POST /api/equipment/{id}/photos
     * Protected endpoint for owners to upload additional photos to an existing equipment listing.
     */
    @PostMapping(value = "/{id}/photos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<EquipmentResponse>> uploadPhotos(
            @PathVariable Long id,
            @RequestParam("photos") List<MultipartFile> photos,
            Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        EquipmentResponse updated = equipmentService.uploadEquipmentPhotos(id, photos, principal.getName());
        ApiResponse<EquipmentResponse> response = ApiResponse.success("Equipment photos uploaded successfully", updated);
        return ResponseEntity.ok(response);
    }

    /**
     * DELETE /api/equipment/{id}/photos/{photoId}
     * Protected endpoint for owners to delete a specific photo from their equipment.
     */
    @DeleteMapping("/{id}/photos/{photoId}")
    public ResponseEntity<ApiResponse<EquipmentResponse>> deletePhoto(
            @PathVariable Long id,
            @PathVariable Long photoId,
            Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        EquipmentResponse updated = equipmentService.deleteEquipmentPhoto(id, photoId, principal.getName());
        ApiResponse<EquipmentResponse> response = ApiResponse.success("Photo removed successfully", updated);
        return ResponseEntity.ok(response);
    }

    /**
     * PUT /api/equipment/{id}/photos/{photoId}/primary
     * Protected endpoint for owners to designate a photo as the primary cover photo.
     */
    @PutMapping("/{id}/photos/{photoId}/primary")
    public ResponseEntity<ApiResponse<EquipmentResponse>> setPrimaryPhoto(
            @PathVariable Long id,
            @PathVariable Long photoId,
            Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        EquipmentResponse updated = equipmentService.setPrimaryPhoto(id, photoId, principal.getName());
        ApiResponse<EquipmentResponse> response = ApiResponse.success("Primary photo updated successfully", updated);
        return ResponseEntity.ok(response);
    }

    /**
     * PUT /api/equipment/{id}
     * Protected endpoint for owners to update their existing equipment listing.
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<EquipmentResponse>> updateEquipment(
            @PathVariable Long id,
            @Valid @RequestBody EquipmentUpdateRequest request,
            Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        EquipmentResponse updated = equipmentService.updateEquipment(id, request, principal.getName());
        ApiResponse<EquipmentResponse> response = ApiResponse.success("Equipment listing updated successfully", updated);
        return ResponseEntity.ok(response);
    }

    /**
     * DELETE /api/equipment/{id}
     * Protected endpoint for owners to delete their equipment listing.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> deleteEquipment(
            @PathVariable Long id,
            Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        equipmentService.deleteEquipment(id, principal.getName());
        ApiResponse<Object> response = ApiResponse.success("Equipment listing deleted successfully", null);
        return ResponseEntity.ok(response);
    }
}
