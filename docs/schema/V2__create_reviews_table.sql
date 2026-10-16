-- ==============================================================================
-- AgroRent Platform — Database Migration (V2__create_reviews_table.sql)
-- Target Database: MySQL 8.x
-- Description: Creates the 'reviews' table for renter feedback and owner ratings.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS `reviews` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `booking_id` BIGINT NOT NULL,
    `equipment_id` BIGINT NOT NULL,
    `reviewer_id` BIGINT NOT NULL,
    `owner_id` BIGINT NOT NULL,
    `rating` INT NOT NULL,
    `feedback` TEXT DEFAULT NULL,
    `created_at` DATETIME(6) NOT NULL,
    `updated_at` DATETIME(6) DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_reviews_booking_id` (`booking_id`),
    KEY `idx_reviews_equipment_id` (`equipment_id`),
    KEY `idx_reviews_owner_id` (`owner_id`),
    KEY `idx_reviews_reviewer_id` (`reviewer_id`),
    CONSTRAINT `fk_reviews_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_reviews_equipment` FOREIGN KEY (`equipment_id`) REFERENCES `equipments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_reviews_reviewer` FOREIGN KEY (`reviewer_id`) REFERENCES `farmers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_reviews_owner` FOREIGN KEY (`owner_id`) REFERENCES `farmers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
