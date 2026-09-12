package fr.techcrud.pmt_api.repositories;

import fr.techcrud.pmt_api.entities.ProjectMember;
import fr.techcrud.pmt_api.model.ProjectRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectMemberRepository extends JpaRepository<ProjectMember, UUID> {
    Optional<ProjectMember> findByProjectIdAndUserId(UUID projectId, UUID userId);

    boolean existsByProjectIdAndUserId(UUID projectId, UUID userId);

    List<ProjectMember> findByProjectIdOrderByJoinedAtAsc(UUID projectId);

    @Query("""
            SELECT m FROM ProjectMember m
            JOIN FETCH m.project p
            WHERE m.user.id = :userId
            ORDER BY p.createdAt DESC
            """)
    List<ProjectMember> findMembershipsOf(@Param("userId") UUID userId);

    long countByProjectIdAndRole(UUID projectId, ProjectRole role);
}
