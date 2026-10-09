package com.agrorent.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public class BookingCreateRequest {

    @NotNull(message = "Equipment ID is required")
    private Long equipmentId;

    @NotNull(message = "Start date time is required")
    private LocalDateTime startDateTime;

    @NotNull(message = "Duration is required")
    @Min(value = 1, message = "Duration must be at least 1")
    private Integer duration;

    @Size(max = 1000, message = "Notes must not exceed 1000 characters")
    private String notes;

    @Pattern(regexp = "^(?i)(instant|request)$", message = "Booking mode must be either 'instant' or 'request'")
    private String bookingMode;

    public BookingCreateRequest() {
    }

    public BookingCreateRequest(Long equipmentId, LocalDateTime startDateTime, Integer duration, String notes, String bookingMode) {
        this.equipmentId = equipmentId;
        this.startDateTime = startDateTime;
        this.duration = duration;
        this.notes = notes;
        this.bookingMode = bookingMode;
    }

    public Long getEquipmentId() {
        return equipmentId;
    }

    public void setEquipmentId(Long equipmentId) {
        this.equipmentId = equipmentId;
    }

    public LocalDateTime getStartDateTime() {
        return startDateTime;
    }

    public void setStartDateTime(LocalDateTime startDateTime) {
        this.startDateTime = startDateTime;
    }

    public Integer getDuration() {
        return duration;
    }

    public void setDuration(Integer duration) {
        this.duration = duration;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getBookingMode() {
        return bookingMode;
    }

    public void setBookingMode(String bookingMode) {
        this.bookingMode = bookingMode;
    }
}
