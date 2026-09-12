package fr.techcrud.pmt_api.services;

import fr.techcrud.pmt_api.dto.ChangeRoleRequest;
import fr.techcrud.pmt_api.dto.CreateProjectRequest;
import fr.techcrud.pmt_api.dto.InviteMemberRequest;
import fr.techcrud.pmt_api.dto.MemberResponse;
import fr.techcrud.pmt_api.dto.ProjectResponse;
import fr.techcrud.pmt_api.entities.Project;
import fr.techcrud.pmt_api.entities.ProjectMember;
import fr.techcrud.pmt_api.entities.Users;
import fr.techcrud.pmt_api.exception.ConflictException;
import fr.techcrud.pmt_api.exception.ForbiddenActionException;
import fr.techcrud.pmt_api.exception.ResourceNotFoundException;
import fr.techcrud.pmt_api.model.Email;
import fr.techcrud.pmt_api.model.ProjectRole;
import fr.techcrud.pmt_api.repositories.ProjectMemberRepository;
import fr.techcrud.pmt_api.model.TaskStatus;
import fr.techcrud.pmt_api.repositories.ProjectRepository;
import fr.techcrud.pmt_api.repositories.TaskRepository;
import fr.techcrud.pmt_api.repositories.UsersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProjectService {
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final UsersRepository usersRepository;
    private final TaskRepository taskRepository;
    private final ProjectAccessService access;

    @Transactional
    public ProjectResponse create(CreateProjectRequest request, Users creator) {
        Project project = projectRepository.save(
                Project.create(request.name(), request.description(), request.startDate()));

        projectMemberRepository.save(ProjectMember.create(project, creator, ProjectRole.ADMIN));

        return ProjectResponse.of(project, ProjectRole.ADMIN, 1, 0, 0);
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> listMine(UUID userId) {
        return projectMemberRepository.findMembershipsOf(userId).stream()
                .map(m -> describe(m.getProject(), m.getRole()))
                .toList();
    }

    @Transactional(readOnly = true)
    public ProjectResponse getOne(UUID projectId, UUID userId) {
        ProjectMember membership = access.requireMember(projectId, userId);
        return describe(membership.getProject(), membership.getRole());
    }

    private ProjectResponse describe(Project project, ProjectRole myRole) {
        UUID id = project.getId();
        return ProjectResponse.of(
                project,
                myRole,
                projectMemberRepository.findByProjectIdOrderByJoinedAtAsc(id).size(),
                taskRepository.countByProjectId(id),
                taskRepository.countByProjectIdAndStatus(id, TaskStatus.DONE));
    }

    @Transactional(readOnly = true)
    public List<MemberResponse> listMembers(UUID projectId, UUID userId) {
        access.requireMember(projectId, userId);
        return projectMemberRepository.findByProjectIdOrderByJoinedAtAsc(projectId).stream()
                .map(MemberResponse::of)
                .toList();
    }

    @Transactional
    public MemberResponse invite(UUID projectId, InviteMemberRequest request, UUID callerId) {
        ProjectMember callerMembership = access.requireAdmin(projectId, callerId);

        Email email = new Email(request.email());

        Users invited = usersRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Aucun utilisateur inscrit avec cette adresse"));

        if (projectMemberRepository.existsByProjectIdAndUserId(projectId, invited.getId())) {
            throw new ConflictException("Cet utilisateur est deja membre du projet");
        }

        ProjectRole role = request.role() == null ? ProjectRole.MEMBER : request.role();

        ProjectMember member = projectMemberRepository.save(
                ProjectMember.create(callerMembership.getProject(), invited, role));

        return MemberResponse.of(member);
    }

    @Transactional
    public MemberResponse changeRole(UUID projectId, UUID targetUserId,
                                     ChangeRoleRequest request, UUID callerId) {
        access.requireAdmin(projectId, callerId);

        ProjectMember target = projectMemberRepository
                .findByProjectIdAndUserId(projectId, targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Membre introuvable"));

        boolean retiringAnAdmin =
                target.getRole() == ProjectRole.ADMIN && request.role() != ProjectRole.ADMIN;
        if (retiringAnAdmin
                && projectMemberRepository.countByProjectIdAndRole(projectId, ProjectRole.ADMIN) <= 1) {
            throw new ForbiddenActionException(
                    "Le projet doit conserver au moins un administrateur");
        }

        target.setRole(request.role());
        return MemberResponse.of(projectMemberRepository.save(target));
    }
}
