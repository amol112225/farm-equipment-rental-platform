package com.agrorent.backend.repository;

import com.agrorent.backend.model.Farmer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data JPA Repository interface for Farmer entity operations.
 */
@Repository
public interface FarmerRepository extends JpaRepository<Farmer, Long> {

    Optional<Farmer> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);
}
