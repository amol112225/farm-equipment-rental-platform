package com.agrorent.backend.repository;

import com.agrorent.backend.model.Equipment;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository for Equipment entity operations.
 */
@Repository
public interface EquipmentRepository extends JpaRepository<Equipment, Long> {

    List<Equipment> findByOwnerId(Long ownerId);

    List<Equipment> findByOwnerEmail(String ownerEmail);

    @Query("SELECT e FROM Equipment e WHERE e.isAvailable = true " +
           "AND (:category IS NULL OR :category = '' OR LOWER(e.category) = LOWER(:category)) " +
           "AND (:location IS NULL OR :location = '' OR LOWER(e.location) LIKE LOWER(CONCAT('%', :location, '%'))) " +
           "AND (:keyword IS NULL OR :keyword = '' OR (LOWER(e.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(e.description) LIKE LOWER(CONCAT('%', :keyword, '%'))))")
    List<Equipment> searchPublicEquipment(@Param("keyword") String keyword,
                                          @Param("category") String category,
                                          @Param("location") String location);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT e FROM Equipment e WHERE e.id = :id")
    Optional<Equipment> findByIdWithPessimisticLock(@Param("id") Long id);
}
