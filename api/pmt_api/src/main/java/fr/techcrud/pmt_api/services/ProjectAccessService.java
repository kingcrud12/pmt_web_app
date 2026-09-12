package fr.techcrud.pmt_api.services;

import fr.techcrud.pmt_api.entities.ProjectMember;
import fr.techcrud.pmt_api.exception.ForbiddenActionException;
import fr.techcrud.pmt_api.exception.ResourceNotFoundException;
import fr.techcrud.pmt_api.repositories.ProjectMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProjectAccessService {
    private final ProjectMemberRepository projectMemberRepository;

    @Transactional(readOnly = true)
    public ProjectMember requireMember(UUID projectId, UUID userId) {
        return projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Projet introuvable"));
    }

    @Transactional(readOnly = true)
    public ProjectMember requireAdmin(UUID projectId, UUID userId) {
        ProjectMember membership = requireMember(projectId, userId);
        if (!membership.getRole().canManageMembers()) {
            throw new ForbiddenActionException(
                    "Seul un administrateur du projet peut effectuer cette action");
        }
        return membership;
    }

    @Transactional(readOnly = true)
    public ProjectMember requireTaskWriter(UUID projectId, UUID userId) {
        ProjectMember membership = requireMember(projectId, userId);
        if (!membership.getRole().canWriteTasks()) {
            throw new ForbiddenActionException(
                    "Un observateur ne peut pas modifier les taches");
        }
        return membership;
    }
}
