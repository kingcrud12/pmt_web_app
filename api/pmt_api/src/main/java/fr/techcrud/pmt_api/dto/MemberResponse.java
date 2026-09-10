package fr.techcrud.pmt_api.dto;

import fr.techcrud.pmt_api.entities.ProjectMember;
import fr.techcrud.pmt_api.model.ProjectRole;

import java.time.Instant;

public record MemberResponse(
        String userId,
        String firstName,
        String lastName,
        String email,
        ProjectRole role,
        Instant joinedAt
) {
    public static MemberResponse of(ProjectMember member) {
        return new MemberResponse(
                member.getUser().getId().toString(),
                member.getUser().getFirstName(),
                member.getUser().getLastName(),
                member.getUser().getEmail().value(),
                member.getRole(),
                member.getJoinedAt()
        );
    }
}
