package com.agrorent.backend.controller;

import com.agrorent.backend.dto.ApiResponse;
import com.agrorent.backend.dto.BookingCreateRequest;
import com.agrorent.backend.dto.BookingResponse;
import com.agrorent.backend.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * REST Controller for Farmer Equipment Rental Bookings.
 * Handles booking creation, renter booking retrieval, detail lookup, cancellation, and advisory availability checks.
 */
@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    @Autowired
    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    /**
     * Create a new equipment rental booking request.
     * POST /api/bookings
     */
    @PostMapping
    public ResponseEntity<ApiResponse<BookingResponse>> createBooking(
            @Valid @RequestBody BookingCreateRequest request,
            Principal principal) {
        BookingResponse response = bookingService.createBooking(request, principal.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Rental booking request created successfully", response));
    }

    /**
     * Retrieve all bookings created by the authenticated renter.
     * GET /api/bookings/my
     */
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getMyBookings(Principal principal) {
        List<BookingResponse> bookings = bookingService.getRenterBookings(principal.getName());
        return ResponseEntity.ok(ApiResponse.success("Farmer bookings retrieved successfully", bookings));
    }

    /**
     * Retrieve details for a specific booking owned by the renter.
     * GET /api/bookings/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BookingResponse>> getBookingById(
            @PathVariable Long id,
            Principal principal) {
        BookingResponse booking = bookingService.getBookingById(id, principal.getName());
        return ResponseEntity.ok(ApiResponse.success("Booking details retrieved successfully", booking));
    }

    /**
     * Cancel an active or pending booking owned by the renter.
     * PUT /api/bookings/{id}/cancel
     */
    @PutMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<BookingResponse>> cancelBooking(
            @PathVariable Long id,
            Principal principal) {
        BookingResponse cancelledBooking = bookingService.cancelBooking(id, principal.getName());
        return ResponseEntity.ok(ApiResponse.success("Booking cancelled successfully", cancelledBooking));
    }

    /**
     * Advisory endpoint to check equipment availability for a requested period.
     * GET /api/bookings/check-availability
     */
    @GetMapping("/check-availability")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkAvailability(
            @RequestParam Long equipmentId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDateTime,
            @RequestParam Integer duration) {
        boolean available = bookingService.checkAvailability(equipmentId, startDateTime, duration);
        Map<String, Object> data = Map.of(
                "equipmentId", equipmentId,
                "available", available
        );
        return ResponseEntity.ok(ApiResponse.success("Availability checked successfully", data));
    }

    /**
     * Retrieve all bookings for equipment listings owned by the authenticated farmer.
     * GET /api/bookings/owner
     */
    @GetMapping("/owner")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getOwnerBookings(
            @RequestParam(required = false) String status,
            Principal principal) {
        List<BookingResponse> bookings = bookingService.getOwnerBookings(principal.getName(), status);
        return ResponseEntity.ok(ApiResponse.success("Owner bookings retrieved successfully", bookings));
    }

    /**
     * Retrieve details for a specific booking owned by the authenticated equipment owner.
     * GET /api/bookings/owner/{id}
     */
    @GetMapping("/owner/{id}")
    public ResponseEntity<ApiResponse<BookingResponse>> getOwnerBookingById(
            @PathVariable Long id,
            Principal principal) {
        BookingResponse booking = bookingService.getOwnerBookingById(id, principal.getName());
        return ResponseEntity.ok(ApiResponse.success("Owner booking details retrieved successfully", booking));
    }

    /**
     * Approve a PENDING equipment rental booking.
     * PUT /api/bookings/{id}/approve
     */
    @PutMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<BookingResponse>> approveBooking(
            @PathVariable Long id,
            Principal principal) {
        BookingResponse booking = bookingService.approveBooking(id, principal.getName());
        return ResponseEntity.ok(ApiResponse.success("Booking approved successfully", booking));
    }

    /**
     * Reject a PENDING equipment rental booking.
     * PUT /api/bookings/{id}/reject
     */
    @PutMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<BookingResponse>> rejectBooking(
            @PathVariable Long id,
            Principal principal) {
        BookingResponse booking = bookingService.rejectBooking(id, principal.getName());
        return ResponseEntity.ok(ApiResponse.success("Booking rejected successfully", booking));
    }

    /**
     * Mark an APPROVED booking as COMPLETED.
     * PUT /api/bookings/{id}/complete
     */
    @PutMapping("/{id}/complete")
    public ResponseEntity<ApiResponse<BookingResponse>> completeBooking(
            @PathVariable Long id,
            Principal principal) {
        BookingResponse booking = bookingService.completeBooking(id, principal.getName());
        return ResponseEntity.ok(ApiResponse.success("Booking completed successfully", booking));
    }
}

