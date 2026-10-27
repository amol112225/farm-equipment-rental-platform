package com.agrorent.backend.service.impl;

import com.agrorent.backend.dto.EquipmentCreateRequest;
import com.agrorent.backend.dto.EquipmentImageResponse;
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
import com.agrorent.backend.service.EquipmentService;
import com.agrorent.backend.service.FileValidationService;
import com.agrorent.backend.service.ImageStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Service implementation for Equipment management.
 * Enforces server-side owner assignment, ownership verification for mutations,
 * photo upload, storage management, and filtering for public and owner-managed listings.
 */
@Service
public class EquipmentServiceImpl implements EquipmentService {

    private final EquipmentRepository equipmentRepository;
    private final FarmerRepository farmerRepository;
    private ReviewRepository reviewRepository;
    private final EquipmentImageRepository equipmentImageRepository;
    private final ImageStorageService imageStorageService;
    private final FileValidationService fileValidationService;

    @Autowired
    public EquipmentServiceImpl(EquipmentRepository equipmentRepository,
                                FarmerRepository farmerRepository,
                                @Autowired(required = false) ReviewRepository reviewRepository,
                                @Autowired(required = false) EquipmentImageRepository equipmentImageRepository,
                                @Autowired(required = false) ImageStorageService imageStorageService,
                                @Autowired(required = false) FileValidationService fileValidationService) {
        this.equipmentRepository = equipmentRepository;
        this.farmerRepository = farmerRepository;
        this.reviewRepository = reviewRepository;
        this.equipmentImageRepository = equipmentImageRepository;
        this.imageStorageService = imageStorageService;
        this.fileValidationService = fileValidationService;
    }

    public EquipmentServiceImpl(EquipmentRepository equipmentRepository,
                                FarmerRepository farmerRepository,
                                ReviewRepository reviewRepository) {
        this(equipmentRepository, farmerRepository, reviewRepository, null, null, null);
    }

    public EquipmentServiceImpl(EquipmentRepository equipmentRepository, FarmerRepository farmerRepository) {
        this(equipmentRepository, farmerRepository, null, null, null, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<EquipmentResponse> searchPublicEquipment(String keyword, String category, String location) {
        String trimmedKeyword = keyword != null ? keyword.trim() : null;
        String trimmedCategory = category != null ? category.trim() : null;
        String trimmedLocation = location != null ? location.trim() : null;

        List<Equipment> equipmentList = equipmentRepository.searchPublicEquipment(trimmedKeyword, trimmedCategory, trimmedLocation);
        Map<Long, RatingData> ratingMap = fetchRatingSummaries(equipmentList);
        return equipmentList.stream().map(e -> mapToResponse(e, ratingMap)).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public EquipmentResponse getPublicEquipmentById(Long id) {
        Equipment equipment = equipmentRepository.findByIdWithOwner(id)
                .or(() -> equipmentRepository.findById(id))
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
        Map<Long, RatingData> ratingMap = fetchRatingSummaries(ownEquipment);
        return ownEquipment.stream().map(e -> mapToResponse(e, ratingMap)).collect(Collectors.toList());
    }

    private void validateImageUrl(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) {
            return;
        }
        String trimmed = imageUrl.trim();
        if (trimmed.startsWith("data:") || trimmed.toLowerCase().contains(";base64,")) {
            throw new IllegalArgumentException("Base64-encoded images cannot be stored directly in the database. Please upload images through the image upload API to obtain a hosted URL.");
        }
        if (trimmed.length() > 500) {
            throw new IllegalArgumentException("Image URL length exceeds the maximum limit of 500 characters.");
        }
    }

    @Override
    @Transactional
    public EquipmentResponse createEquipment(EquipmentCreateRequest request, String farmerEmail) {
        String normalizedEmail = farmerEmail != null ? farmerEmail.trim().toLowerCase() : "";
        Farmer owner = farmerRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated farmer profile not found."));

        validateImageUrl(request.getImageUrl());

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

        if (request.getImageUrls() != null && !request.getImageUrls().isEmpty()) {
            int order = 0;
            for (String urlItem : request.getImageUrls()) {
                if (urlItem != null && !urlItem.trim().isBlank()) {
                    String trimmedUrl = urlItem.trim();
                    validateImageUrl(trimmedUrl);
                    boolean isPrimary = (order == 0);
                    EquipmentImage image = new EquipmentImage(equipment, trimmedUrl, order, isPrimary);
                    equipment.addImage(image);
                    if (isPrimary && (equipment.getImageUrl() == null || equipment.getImageUrl().isBlank())) {
                        equipment.setImageUrl(trimmedUrl);
                    }
                    order++;
                }
            }
        } else if (request.getImageUrl() != null && !request.getImageUrl().trim().isBlank()) {
            EquipmentImage image = new EquipmentImage(equipment, request.getImageUrl().trim(), 0, true);
            equipment.addImage(image);
        }

        Equipment savedEquipment = equipmentRepository.save(equipment);
        return mapToResponse(savedEquipment);
    }

    @Override
    @Transactional
    public EquipmentResponse createEquipmentWithPhotos(EquipmentCreateRequest request, List<MultipartFile> photos, String farmerEmail) {
        return createEquipmentWithPhotos(request, photos, 0, farmerEmail);
    }

    @Override
    @Transactional
    public EquipmentResponse createEquipmentWithPhotos(EquipmentCreateRequest request, List<MultipartFile> photos, Integer primaryIndex, String farmerEmail) {
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

        if (photos != null && !photos.isEmpty()) {
            List<MultipartFile> validPhotos = photos.stream()
                    .filter(p -> p != null && !p.isEmpty())
                    .collect(Collectors.toList());

            if (!validPhotos.isEmpty()) {
                if (fileValidationService != null) {
                    fileValidationService.validatePhotosQuantity(0, validPhotos.size());
                    for (MultipartFile photo : validPhotos) {
                        fileValidationService.validateImageFile(photo);
                    }
                }

                int targetPrimaryIndex = (primaryIndex != null && primaryIndex >= 0 && primaryIndex < validPhotos.size()) ? primaryIndex : 0;
                int order = 0;
                for (MultipartFile photo : validPhotos) {
                    if (imageStorageService != null) {
                        String storedUrl = imageStorageService.storeImage(photo);
                        boolean isPrimary = (order == targetPrimaryIndex);
                        EquipmentImage image = new EquipmentImage(equipment, storedUrl, order, isPrimary);
                        equipment.addImage(image);
                        if (isPrimary) {
                            equipment.setImageUrl(storedUrl);
                        }
                    }
                    order++;
                }

                // Ensure primary URL is populated if any images were added
                if (equipment.getImageUrl() == null && equipment.getImages() != null && !equipment.getImages().isEmpty()) {
                    EquipmentImage first = equipment.getImages().get(0);
                    first.setIsPrimary(true);
                    equipment.setImageUrl(first.getImageUrl());
                }
            }
        }

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

        validateImageUrl(request.getImageUrl());

        equipment.setName(request.getName().trim());
        equipment.setCategory(request.getCategory().trim());
        equipment.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        equipment.setPrice(request.getPrice());
        equipment.setPriceUnit(request.getPriceUnit().trim().toLowerCase());
        equipment.setBookingType(request.getBookingType().trim().toLowerCase());
        equipment.setLocation(request.getLocation().trim());

        // Handle Primary Image Selection & Image Synchronization
        if (request.getPrimaryImageId() != null) {
            if (equipment.getImages() == null || equipment.getImages().isEmpty()) {
                throw new IllegalArgumentException("Selected primary photo with ID " + request.getPrimaryImageId() + " does not belong to this equipment listing.");
            }

            EquipmentImage targetImage = equipment.getImages().stream()
                    .filter(img -> img.getId() != null && img.getId().equals(request.getPrimaryImageId()))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Selected primary photo with ID " + request.getPrimaryImageId() + " does not belong to this equipment listing."));

            for (EquipmentImage img : equipment.getImages()) {
                img.setIsPrimary(img.getId() != null && img.getId().equals(request.getPrimaryImageId()));
            }
            equipment.setImageUrl(targetImage.getImageUrl());
        } else if (request.getImageUrl() != null && !request.getImageUrl().trim().isBlank()) {
            String newUrl = request.getImageUrl().trim();
            equipment.setImageUrl(newUrl);
            if (equipment.getImages() != null && !equipment.getImages().isEmpty()) {
                boolean matched = false;
                for (EquipmentImage img : equipment.getImages()) {
                    if (newUrl.equalsIgnoreCase(img.getImageUrl())) {
                        img.setIsPrimary(true);
                        matched = true;
                    } else {
                        img.setIsPrimary(false);
                    }
                }
                if (!matched) {
                    for (EquipmentImage img : equipment.getImages()) {
                        img.setIsPrimary(false);
                    }
                    EquipmentImage newImg = new EquipmentImage(equipment, newUrl, equipment.getImages().size(), true);
                    equipment.addImage(newImg);
                }
            } else {
                EquipmentImage newImg = new EquipmentImage(equipment, newUrl, 0, true);
                equipment.addImage(newImg);
            }
        } else if (equipment.getImages() != null && !equipment.getImages().isEmpty()) {
            // Equipment has photos: preserve or establish deterministic primary photo
            EquipmentImage primaryImg = equipment.getImages().stream()
                    .filter(img -> Boolean.TRUE.equals(img.getIsPrimary()))
                    .findFirst()
                    .orElse(null);

            if (primaryImg != null) {
                equipment.setImageUrl(primaryImg.getImageUrl());
            } else {
                EquipmentImage firstImg = equipment.getImages().get(0);
                firstImg.setIsPrimary(true);
                equipment.setImageUrl(firstImg.getImageUrl());
            }
        } else if (request.getImageUrl() != null && request.getImageUrl().trim().isBlank()) {
            equipment.setImageUrl(null);
        }

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

        // Delete associated files from storage if present
        if (imageStorageService != null && equipment.getImages() != null) {
            for (EquipmentImage img : equipment.getImages()) {
                try {
                    imageStorageService.deleteImage(img.getImageUrl());
                } catch (Exception ignored) {
                }
            }
        }

        equipmentRepository.delete(equipment);
    }

    @Override
    @Transactional
    public EquipmentResponse uploadEquipmentPhotos(Long equipmentId, List<MultipartFile> photos, String farmerEmail) {
        Equipment equipment = equipmentRepository.findById(equipmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment listing not found with ID: " + equipmentId));

        String normalizedEmail = farmerEmail != null ? farmerEmail.trim().toLowerCase() : "";

        // Ownership Enforcement
        if (!equipment.getOwner().getEmail().equalsIgnoreCase(normalizedEmail)) {
            throw new UnauthorizedActionException("You are not authorized to upload photos for this equipment because you do not own it.");
        }

        if (photos == null || photos.isEmpty()) {
            throw new IllegalArgumentException("Please select at least one photo to upload.");
        }

        List<MultipartFile> nonEmptyPhotos = photos.stream()
                .filter(p -> p != null && !p.isEmpty())
                .collect(Collectors.toList());

        if (nonEmptyPhotos.isEmpty()) {
            throw new IllegalArgumentException("Uploaded files cannot be empty. Please select valid photos.");
        }

        int currentCount = equipment.getImages() != null ? equipment.getImages().size() : 0;
        if (fileValidationService != null) {
            fileValidationService.validatePhotosQuantity(currentCount, nonEmptyPhotos.size());
            for (MultipartFile photo : nonEmptyPhotos) {
                fileValidationService.validateImageFile(photo);
            }
        }

        int nextOrder = currentCount;
        boolean hasPrimary = equipment.getImages() != null && equipment.getImages().stream().anyMatch(img -> Boolean.TRUE.equals(img.getIsPrimary()));

        for (MultipartFile photo : nonEmptyPhotos) {
            if (imageStorageService != null) {
                String storedUrl = imageStorageService.storeImage(photo);
                boolean isPrimary = (!hasPrimary && nextOrder == currentCount);
                EquipmentImage image = new EquipmentImage(equipment, storedUrl, nextOrder, isPrimary);
                equipment.addImage(image);
                if (isPrimary) {
                    equipment.setImageUrl(storedUrl);
                    hasPrimary = true;
                }
                nextOrder++;
            }
        }

        Equipment saved = equipmentRepository.save(equipment);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public EquipmentResponse deleteEquipmentPhoto(Long equipmentId, Long photoId, String farmerEmail) {
        Equipment equipment = equipmentRepository.findById(equipmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment listing not found with ID: " + equipmentId));

        String normalizedEmail = farmerEmail != null ? farmerEmail.trim().toLowerCase() : "";

        // Ownership Enforcement
        if (!equipment.getOwner().getEmail().equalsIgnoreCase(normalizedEmail)) {
            throw new UnauthorizedActionException("You are not authorized to delete photos from this equipment because you do not own it.");
        }

        EquipmentImage targetPhoto = equipment.getImages().stream()
                .filter(img -> img.getId() != null && img.getId().equals(photoId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Photo with ID " + photoId + " not found on equipment listing " + equipmentId));

        boolean wasPrimary = Boolean.TRUE.equals(targetPhoto.getIsPrimary());
        String photoUrl = targetPhoto.getImageUrl();

        equipment.removeImage(targetPhoto);

        if (wasPrimary) {
            if (!equipment.getImages().isEmpty()) {
                EquipmentImage newPrimary = equipment.getImages().get(0);
                newPrimary.setIsPrimary(true);
                equipment.setImageUrl(newPrimary.getImageUrl());
            } else {
                equipment.setImageUrl(null);
            }
        } else {
            boolean hasPrimary = equipment.getImages().stream().anyMatch(img -> Boolean.TRUE.equals(img.getIsPrimary()));
            if (!hasPrimary && !equipment.getImages().isEmpty()) {
                EquipmentImage newPrimary = equipment.getImages().get(0);
                newPrimary.setIsPrimary(true);
                equipment.setImageUrl(newPrimary.getImageUrl());
            } else if (equipment.getImages().isEmpty()) {
                equipment.setImageUrl(null);
            }
        }

        // Re-index display orders
        int order = 0;
        for (EquipmentImage img : equipment.getImages()) {
            img.setDisplayOrder(order++);
        }

        Equipment saved = equipmentRepository.save(equipment);

        if (imageStorageService != null && photoUrl != null) {
            try {
                imageStorageService.deleteImage(photoUrl);
            } catch (Exception ignored) {
            }
        }

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public EquipmentResponse setPrimaryPhoto(Long equipmentId, Long photoId, String farmerEmail) {
        Equipment equipment = equipmentRepository.findById(equipmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment listing not found with ID: " + equipmentId));

        String normalizedEmail = farmerEmail != null ? farmerEmail.trim().toLowerCase() : "";

        // Ownership Enforcement
        if (!equipment.getOwner().getEmail().equalsIgnoreCase(normalizedEmail)) {
            throw new UnauthorizedActionException("You are not authorized to modify photos on this equipment because you do not own it.");
        }

        EquipmentImage targetPhoto = equipment.getImages().stream()
                .filter(img -> img.getId() != null && img.getId().equals(photoId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Photo with ID " + photoId + " not found on equipment listing " + equipmentId));

        for (EquipmentImage img : equipment.getImages()) {
            img.setIsPrimary(img.getId() != null && img.getId().equals(photoId));
        }

        equipment.setImageUrl(targetPhoto.getImageUrl());

        Equipment saved = equipmentRepository.save(equipment);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public String uploadImage(MultipartFile file, String farmerEmail) {
        String normalizedEmail = farmerEmail != null ? farmerEmail.trim().toLowerCase() : "";
        if (!farmerRepository.existsByEmail(normalizedEmail)) {
            throw new ResourceNotFoundException("Authenticated farmer profile not found.");
        }

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Please select an image file to upload.");
        }

        if (fileValidationService != null) {
            fileValidationService.validateImageFile(file);
        }

        if (imageStorageService == null) {
            throw new IllegalStateException("Image storage service is not configured.");
        }

        return imageStorageService.storeImage(file);
    }

    private static class RatingData {
        final long count;
        final Double avgRating;

        RatingData(long count, Double avgRating) {
            this.count = count;
            this.avgRating = avgRating;
        }
    }

    private Map<Long, RatingData> fetchRatingSummaries(List<Equipment> equipmentList) {
        if (reviewRepository == null || equipmentList == null || equipmentList.isEmpty()) {
            return Collections.emptyMap();
        }
        List<Long> equipmentIds = equipmentList.stream()
                .map(Equipment::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        if (equipmentIds.isEmpty()) {
            return Collections.emptyMap();
        }

        try {
            List<Object[]> summaries = reviewRepository.findRatingSummariesByEquipmentIds(equipmentIds);
            Map<Long, RatingData> map = new HashMap<>();
            if (summaries != null) {
                for (Object[] row : summaries) {
                    if (row != null && row.length >= 3 && row[0] != null) {
                        Long eqId = ((Number) row[0]).longValue();
                        long count = row[1] != null ? ((Number) row[1]).longValue() : 0L;
                        Double avg = row[2] != null ? ((Number) row[2]).doubleValue() : null;
                        map.put(eqId, new RatingData(count, avg));
                    }
                }
            }
            return map;
        } catch (Exception ex) {
            // Fallback gracefully to individual lookup if aggregate query fails
            return Collections.emptyMap();
        }
    }

    private EquipmentResponse mapToResponse(Equipment equipment) {
        return mapToResponse(equipment, null);
    }

    private EquipmentResponse mapToResponse(Equipment equipment, Map<Long, RatingData> batchRatingMap) {
        Double avgRating = 0.0;
        long totalReviews = 0L;

        if (batchRatingMap != null) {
            RatingData data = batchRatingMap.get(equipment.getId());
            if (data != null) {
                totalReviews = data.count;
                if (data.avgRating != null) {
                    avgRating = Math.round(data.avgRating * 10.0) / 10.0;
                }
            }
        } else if (reviewRepository != null && equipment.getId() != null) {
            Long equipmentId = equipment.getId();
            totalReviews = reviewRepository.countByEquipmentId(equipmentId);
            if (totalReviews > 0) {
                Double rawAvg = reviewRepository.getAverageRatingByEquipmentId(equipmentId);
                if (rawAvg != null) {
                    avgRating = Math.round(rawAvg * 10.0) / 10.0;
                }
            }
        }

        List<EquipmentImageResponse> imageResponses = new ArrayList<>();
        String primaryImageUrl = equipment.getImageUrl();

        if (equipment.getImages() != null && !equipment.getImages().isEmpty()) {
            EquipmentImage primaryImg = equipment.getImages().stream()
                    .filter(img -> Boolean.TRUE.equals(img.getIsPrimary()))
                    .findFirst()
                    .orElse(equipment.getImages().get(0));

            primaryImageUrl = primaryImg.getImageUrl();

            for (EquipmentImage img : equipment.getImages()) {
                boolean isPrimary = img.getId() != null ? img.getId().equals(primaryImg.getId()) : (img == primaryImg);
                imageResponses.add(new EquipmentImageResponse(
                        img.getId(),
                        img.getImageUrl(),
                        isPrimary,
                        img.getDisplayOrder(),
                        img.getCreatedAt()
                ));
            }
        } else if (primaryImageUrl != null && !primaryImageUrl.isBlank()) {
            // Graceful fallback for legacy records that only have image_url
            imageResponses.add(new EquipmentImageResponse(
                    null,
                    primaryImageUrl,
                    true,
                    0,
                    equipment.getCreatedAt()
            ));
        }

        return new EquipmentResponse(
                equipment.getId(),
                equipment.getName(),
                equipment.getCategory(),
                equipment.getDescription(),
                equipment.getPrice(),
                equipment.getPriceUnit(),
                equipment.getBookingType(),
                equipment.getLocation(),
                primaryImageUrl,
                imageResponses,
                equipment.getIsAvailable(),
                equipment.getOwner().getId(),
                equipment.getOwner().getFullName(),
                avgRating,
                totalReviews,
                equipment.getCreatedAt(),
                equipment.getUpdatedAt()
        );
    }
}
