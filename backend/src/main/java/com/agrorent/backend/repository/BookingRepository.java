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


    List<Booking> findByRenterEmailOrderByCreatedAtDesc(String renterEmail);

    List<Booking> findByRenterIdOrderByIdDesc(Long renterId);

    List<Booking> findByOwnerEmailOrderByCreatedAtDesc(String ownerEmail);

    List<Booking> findByOwnerEmailAndStatusOrderByCreatedAtDesc(String ownerEmail, String status);

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
