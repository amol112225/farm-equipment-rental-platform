package com.agrorent.backend.service;

import com.agrorent.backend.dto.BookingCreateRequest;
import com.agrorent.backend.dto.BookingResponse;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Service interface for Booking operations.
 */
public interface BookingService {

    BookingResponse createBooking(BookingCreateRequest request, String renterEmail);

    List<BookingResponse> getRenterBookings(String renterEmail);

    BookingResponse getBookingById(Long id, String renterEmail);

    BookingResponse cancelBooking(Long id, String renterEmail);

    boolean checkAvailability(Long equipmentId, LocalDateTime startDateTime, Integer duration);

    List<BookingResponse> getOwnerBookings(String ownerEmail, String status);

    BookingResponse getOwnerBookingById(Long id, String ownerEmail);

    BookingResponse approveBooking(Long id, String ownerEmail);

    BookingResponse rejectBooking(Long id, String ownerEmail);

    BookingResponse completeBooking(Long id, String ownerEmail);
}

