package com.agrorent.backend.repository;

import com.agrorent.backend.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository for Review entity operations.
 */
@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    /**
     * Checks if a review has already been submitted for the specified booking.
     */
    boolean existsByBookingId(Long bookingId);

    /**
     * Finds a review by its linked booking ID.
     */
    Optional<Review> findByBookingId(Long bookingId);

    /**
     * Finds all reviews received by a specific equipment owner, ordered newest first.
     * Uses LEFT JOIN FETCH on reviewer, owner, equipment, and booking to prevent N+1 queries.
     */
    @Query("SELECT r FROM Review r " +
           "LEFT JOIN FETCH r.reviewer " +
           "LEFT JOIN FETCH r.owner " +
           "LEFT JOIN FETCH r.equipment " +
           "LEFT JOIN FETCH r.booking " +
           "WHERE r.owner.id = :ownerId ORDER BY r.createdAt DESC")
    List<Review> findByOwnerIdOrderByCreatedAtDesc(@Param("ownerId") Long ownerId);

    /**
     * Finds all booking IDs that have already been reviewed by a given reviewer.
     * Useful for batch-checking reviewed state on renter dashboard and bookings list.
     */
    @Query("SELECT r.booking.id FROM Review r WHERE r.reviewer.id = :reviewerId")
    List<Long> findReviewedBookingIdsByReviewerId(@Param("reviewerId") Long reviewerId);

    /**
     * Counts the total number of reviews for a given owner.
     */
    long countByOwnerId(Long ownerId);

    /**
     * Calculates the average rating given to a specific equipment owner.
     * Returns null if no reviews exist.
     */
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.owner.id = :ownerId")
    Double getAverageRatingByOwnerId(@Param("ownerId") Long ownerId);

    /**
     * Finds all reviews for a specific equipment item, ordered newest first.
     * Uses LEFT JOIN FETCH on reviewer, owner, equipment, and booking to prevent N+1 queries.
     */
    @Query("SELECT r FROM Review r " +
           "LEFT JOIN FETCH r.reviewer " +
           "LEFT JOIN FETCH r.owner " +
           "LEFT JOIN FETCH r.equipment " +
           "LEFT JOIN FETCH r.booking " +
           "WHERE r.equipment.id = :equipmentId ORDER BY r.createdAt DESC")
    List<Review> findByEquipmentIdOrderByCreatedAtDesc(@Param("equipmentId") Long equipmentId);

    /**
     * Counts the total number of reviews for a specific equipment item.
     */
    long countByEquipmentId(Long equipmentId);

    /**
     * Calculates the average rating for a specific equipment item.
     * Returns null if no reviews exist.
     */
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.equipment.id = :equipmentId")
    Double getAverageRatingByEquipmentId(@Param("equipmentId") Long equipmentId);

    /**
     * Aggregates review count and average rating across a collection of equipment IDs.
     * Returns a list of rows: [Long equipmentId, Long count, Double averageRating].
     * Avoids running separate count and average rating queries for each equipment in listings.
     */
    @Query("SELECT r.equipment.id, COUNT(r.id), AVG(r.rating) FROM Review r WHERE r.equipment.id IN :equipmentIds GROUP BY r.equipment.id")
    List<Object[]> findRatingSummariesByEquipmentIds(@Param("equipmentIds") java.util.Collection<Long> equipmentIds);
}
