-- ==============================================================================
-- AgroRent Platform — Production Baseline Database Migration (V1__init_schema.sql)
-- Target Database: MySQL 8.x
-- Description: Creates baseline tables for Farmers, Equipments, and Bookings.
-- ==============================================================================

-- 1. Farmers Table (Registered Users & Equipment Owners)
CREATE TABLE IF NOT EXISTS `farmers` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `full_name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(120) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `village` VARCHAR(100) NOT NULL,
    `district` VARCHAR(100) NOT NULL,
    `state` VARCHAR(100) NOT NULL,
    `created_at` DATETIME(6) NOT NULL,
    `updated_at` DATETIME(6) DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_farmers_email` (`email`),
    UNIQUE KEY `uk_farmers_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Equipments Table (Machinery & Farm Tool Listings)
CREATE TABLE IF NOT EXISTS `equipments` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `category` VARCHAR(50) NOT NULL,
    `description` TEXT DEFAULT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `price_unit` VARCHAR(20) NOT NULL,
    `booking_type` VARCHAR(30) NOT NULL,
    `location` VARCHAR(200) NOT NULL,
    `image_url` VARCHAR(500) DEFAULT NULL,
    `is_available` BOOLEAN NOT NULL DEFAULT TRUE,
    `owner_id` BIGINT NOT NULL,
    `created_at` DATETIME(6) NOT NULL,
    `updated_at` DATETIME(6) DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_equipments_owner_id` (`owner_id`),
    KEY `idx_equipments_category` (`category`),
    KEY `idx_equipments_location` (`location`),
    CONSTRAINT `fk_equipments_owner` FOREIGN KEY (`owner_id`) REFERENCES `farmers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bookings Table (Rental Transactions & Status Workflow)
CREATE TABLE IF NOT EXISTS `bookings` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `equipment_id` BIGINT NOT NULL,
    `renter_id` BIGINT NOT NULL,
    `owner_id` BIGINT NOT NULL,
    `start_date_time` DATETIME(6) NOT NULL,
    `end_date_time` DATETIME(6) NOT NULL,
    `duration` INT NOT NULL,
    `price_unit` VARCHAR(20) NOT NULL,
    `rate_snapshot` DECIMAL(10, 2) NOT NULL,
    `total_price` DECIMAL(10, 2) NOT NULL,
    `status` VARCHAR(30) NOT NULL,
    `notes` TEXT DEFAULT NULL,
    `created_at` DATETIME(6) NOT NULL,
    `updated_at` DATETIME(6) DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_bookings_equipment_id` (`equipment_id`),
    KEY `idx_bookings_renter_id` (`renter_id`),
    KEY `idx_bookings_owner_id` (`owner_id`),
    KEY `idx_bookings_status` (`status`),
    KEY `idx_bookings_time_range` (`start_date_time`, `end_date_time`),
    CONSTRAINT `fk_bookings_equipment` FOREIGN KEY (`equipment_id`) REFERENCES `equipments` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_bookings_renter` FOREIGN KEY (`renter_id`) REFERENCES `farmers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_bookings_owner` FOREIGN KEY (`owner_id`) REFERENCES `farmers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
