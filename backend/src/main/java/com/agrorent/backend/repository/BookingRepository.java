package com.agrorent.backend.repository;

import com.agrorent.backend.model.Booking;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository for Booking entity operations.
 */
@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM Booking b WHERE b.id = :id")
    Optional<Booking> findByIdWithPessimisticLock(@Param("id") Long id);


    /**
     * Finds bookings made by a renter, eagerly fetching equipment, renter, and owner.
     * Prevents N+1 queries when mapping booking lists.
     */
    @Query("SELECT b FROM Booking b " +
           "JOIN FETCH b.equipment e " +
           "JOIN FETCH b.renter r " +
           "JOIN FETCH b.owner o " +
           "WHERE r.email = :renterEmail ORDER BY b.createdAt DESC")
    List<Booking> findByRenterEmailOrderByCreatedAtDesc(@Param("renterEmail") String renterEmail);

    /**
     * Finds bookings made by a renter ID, eagerly fetching equipment, renter, and owner.
     */
    @Query("SELECT b FROM Booking b " +
           "JOIN FETCH b.equipment e " +
           "JOIN FETCH b.renter r " +
           "JOIN FETCH b.owner o " +
           "WHERE r.id = :renterId ORDER BY b.id DESC")
    List<Booking> findByRenterIdOrderByIdDesc(@Param("renterId") Long renterId);

    /**
     * Finds all bookings for equipment owned by an owner, eagerly fetching associations.
     */
    @Query("SELECT b FROM Booking b " +
           "JOIN FETCH b.equipment e " +
           "JOIN FETCH b.renter r " +
           "JOIN FETCH b.owner o " +
           "WHERE o.email = :ownerEmail ORDER BY b.createdAt DESC")
    List<Booking> findByOwnerEmailOrderByCreatedAtDesc(@Param("ownerEmail") String ownerEmail);

    /**
     * Finds bookings for equipment owned by an owner filtered by status, eagerly fetching associations.
     */
    @Query("SELECT b FROM Booking b " +
           "JOIN FETCH b.equipment e " +
           "JOIN FETCH b.renter r " +
           "JOIN FETCH b.owner o " +
           "WHERE o.email = :ownerEmail AND b.status = :status ORDER BY b.createdAt DESC")
    List<Booking> findByOwnerEmailAndStatusOrderByCreatedAtDesc(@Param("ownerEmail") String ownerEmail, @Param("status") String status);

    /**
     * Finds a single booking by ID with equipment, renter, and owner fetched eagerly.
     */
    @Query("SELECT b FROM Booking b " +
           "JOIN FETCH b.equipment e " +
           "JOIN FETCH b.renter r " +
           "JOIN FETCH b.owner o " +
           "WHERE b.id = :id")
    Optional<Booking> findByIdWithDetails(@Param("id") Long id);

    /**
     * Finds active bookings that overlap with a target time interval for a specific equipment listing.
     * Interval boundary rule: existingStart < newEnd AND existingEnd > newStart
     */
    @Query("SELECT b FROM Booking b WHERE b.equipment.id = :equipmentId " +
           "AND b.status IN (:activeStatuses) " +
           "AND b.startDateTime < :endDateTime " +
           "AND b.endDateTime > :startDateTime")
    List<Booking> findConflictingBookings(@Param("equipmentId") Long equipmentId,
                                         @Param("startDateTime") LocalDateTime startDateTime,
                                         @Param("endDateTime") LocalDateTime endDateTime,
                                         @Param("activeStatuses") List<String> activeStatuses);

    /**
     * Finds active conflicting bookings excluding the booking currently being updated/approved.
     */
    @Query("SELECT b FROM Booking b WHERE b.equipment.id = :equipmentId " +
           "AND b.id <> :bookingId " +
           "AND b.status IN (:activeStatuses) " +
           "AND b.startDateTime < :endDateTime " +
           "AND b.endDateTime > :startDateTime")
    List<Booking> findConflictingBookingsExcludingSelf(@Param("equipmentId") Long equipmentId,
                                                       @Param("bookingId") Long bookingId,
                                                       @Param("startDateTime") LocalDateTime startDateTime,
                                                       @Param("endDateTime") LocalDateTime endDateTime,
                                                       @Param("activeStatuses") List<String> activeStatuses);
}
