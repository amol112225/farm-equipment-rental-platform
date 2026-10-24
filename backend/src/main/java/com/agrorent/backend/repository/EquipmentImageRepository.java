package com.agrorent.backend.repository;

import com.agrorent.backend.model.EquipmentImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EquipmentImageRepository extends JpaRepository<EquipmentImage, Long> {

    List<EquipmentImage> findByEquipmentIdOrderByDisplayOrderAscIdAsc(Long equipmentId);

    long countByEquipmentId(Long equipmentId);
}
