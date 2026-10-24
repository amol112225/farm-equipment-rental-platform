-- ==============================================================================
-- AgroRent Platform — Milestone 2 Database Migration (V4__create_equipment_images_table.sql)
-- Target Database: MySQL 8.x
-- Description: Creates the equipment_images table to support multiple photos,
--              ordering, and primary photo management per equipment listing.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS `equipment_images` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `equipment_id` BIGINT NOT NULL,
    `image_url` VARCHAR(500) NOT NULL,
    `display_order` INT NOT NULL DEFAULT 0,
    `is_primary` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` DATETIME(6) NOT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_equipment_images_equipment_id` (`equipment_id`),
    KEY `idx_equipment_images_primary` (`equipment_id`, `is_primary`),
    CONSTRAINT `fk_equipment_images_equipment` FOREIGN KEY (`equipment_id`) REFERENCES `equipments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional backfill for existing equipment records that already have an image_url
-- (Hibernate will also auto-manage this in dev environments via ddl-auto=update)
INSERT INTO `equipment_images` (`equipment_id`, `image_url`, `display_order`, `is_primary`, `created_at`)
SELECT `id`, `image_url`, 0, TRUE, NOW(6)
FROM `equipments`
WHERE `image_url` IS NOT NULL AND `image_url` != ''
  AND NOT EXISTS (
    SELECT 1 FROM `equipment_images` WHERE `equipment_images`.`equipment_id` = `equipments`.`id`
  );
