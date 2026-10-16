-- ==============================================================================
-- AgroRent Platform — Database Migration (V3__add_equipment_to_reviews.sql)
-- Target Database: MySQL 8.x
-- Description: Adds equipment_id column to 'reviews' table and backfills from bookings.
-- ==============================================================================

ALTER TABLE `reviews` ADD COLUMN `equipment_id` BIGINT DEFAULT NULL AFTER `booking_id`;

-- Backfill equipment_id using the completed booking relationship
UPDATE `reviews` r
JOIN `bookings` b ON r.booking_id = b.id
SET r.equipment_id = b.equipment_id
WHERE r.equipment_id IS NULL;

-- Enforce NOT NULL and referential integrity constraints
ALTER TABLE `reviews` MODIFY COLUMN `equipment_id` BIGINT NOT NULL;

ALTER TABLE `reviews` ADD CONSTRAINT `fk_reviews_equipment`
FOREIGN KEY (`equipment_id`) REFERENCES `equipments` (`id`)
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX `idx_reviews_equipment_id` ON `reviews` (`equipment_id`);
