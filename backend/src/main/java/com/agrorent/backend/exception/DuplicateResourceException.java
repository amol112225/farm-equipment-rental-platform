package com.agrorent.backend.exception;

/**
 * Custom Exception thrown when duplicate unique resources (email/phone) are detected.
 */
public class DuplicateResourceException extends RuntimeException {

    public DuplicateResourceException(String message) {
        super(message);
    }
}
