package fr.techcrud.pmt_api.dto;

import fr.techcrud.pmt_api.entities.Users;

import java.time.Instant;

public record UserResponse(
        String id,
        String firstName,
        String lastName,
        String email,
        Instant createdAt
) {
    public static UserResponse from(Users user) {
        return new UserResponse(
                user.getId().toString(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail().value(),
                user.getCreatedAt()
        );
    }
}
