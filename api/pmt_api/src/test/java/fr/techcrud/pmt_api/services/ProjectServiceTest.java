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
import fr.techcrud.pmt_api.model.HashedPassword;
import fr.techcrud.pmt_api.model.ProjectRole;
import fr.techcrud.pmt_api.model.TaskStatus;
import fr.techcrud.pmt_api.repositories.ProjectMemberRepository;
import fr.techcrud.pmt_api.repositories.ProjectRepository;
import fr.techcrud.pmt_api.repositories.TaskRepository;
import fr.techcrud.pmt_api.repositories.UsersRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("ProjectService")
class ProjectServiceTest {

    @Mock private ProjectRepository projectRepository;
    @Mock private ProjectMemberRepository projectMemberRepository;
    @Mock private UsersRepository usersRepository;
    @Mock private TaskRepository taskRepository;
    @Mock private ProjectAccessService access;

    @InjectMocks private ProjectService projectService;

    private Users alice;
    private Users bob;
    private Project project;
    private ProjectMember adminMembership;

    private static final String HASH = "$2a$10$" + "x".repeat(53);

    @BeforeEach
    void setUp() {
        alice = Users.create("Alice", "Durand", new Email("alice@pmt.fr"), new HashedPassword(HASH));
        bob = Users.create("Bob", "Membre", new Email("bob@pmt.fr"), new HashedPassword(HASH));
        project = Project.create("Refonte du site", "Angular 19", LocalDate.of(2026, 9, 15));
        adminMembership = ProjectMember.create(project, alice, ProjectRole.ADMIN);
    }

    @Test
    @DisplayName("le createur devient automatiquement administrateur")
    void creatorBecomesAdmin() {
        when(projectRepository.save(any(Project.class))).thenAnswer(i -> i.getArgument(0));

        ProjectResponse response = projectService.create(
                new CreateProjectRequest("Refonte", "Desc", LocalDate.of(2026, 9, 15)), alice);

        assertEquals(ProjectRole.ADMIN, response.myRole());
        assertEquals(1, response.memberCount());
        verify(projectMemberRepository).save(any(ProjectMember.class));
    }

    @Test
    @DisplayName("la liste part des appartenances : aucun projet d'une autre equipe ne peut fuir")
    void listsOnlyOwnProjects() {
        UUID userId = alice.getId();
        when(projectMemberRepository.findMembershipsOf(userId)).thenReturn(List.of(adminMembership));
        when(projectMemberRepository.findByProjectIdOrderByJoinedAtAsc(project.getId()))
                .thenReturn(List.of(adminMembership));
        when(taskRepository.countByProjectId(project.getId())).thenReturn(4L);
        when(taskRepository.countByProjectIdAndStatus(project.getId(), TaskStatus.DONE)).thenReturn(1L);

        List<ProjectResponse> list = projectService.listMine(userId);

        assertEquals(1, list.size());
        assertEquals(4L, list.get(0).taskCount());
        assertEquals(1L, list.get(0).doneTaskCount());
        verify(projectRepository, never()).findAll();
    }

    @Test
    @DisplayName("getOne passe par le controle d'appartenance")
    void getOneChecksMembership() {
        UUID userId = alice.getId();
        when(access.requireMember(project.getId(), userId)).thenReturn(adminMembership);
        when(projectMemberRepository.findByProjectIdOrderByJoinedAtAsc(project.getId()))
                .thenReturn(List.of(adminMembership));

        ProjectResponse response = projectService.getOne(project.getId(), userId);

        assertEquals("Refonte du site", response.name());
        verify(access).requireMember(project.getId(), userId);
    }

    @Test
    @DisplayName("inviter exige le role administrateur")
    void inviteRequiresAdmin() {
        UUID callerId = bob.getId();
        when(access.requireAdmin(project.getId(), callerId))
                .thenThrow(new ForbiddenActionException("refuse"));

        assertThrows(ForbiddenActionException.class, () -> projectService.invite(
                project.getId(), new InviteMemberRequest("x@pmt.fr", ProjectRole.MEMBER), callerId));

        verify(projectMemberRepository, never()).save(any());
    }

    @Test
    @DisplayName("inviter une adresse inconnue renvoie introuvable")
    void inviteUnknownEmail() {
        UUID callerId = alice.getId();
        when(access.requireAdmin(project.getId(), callerId)).thenReturn(adminMembership);
        when(usersRepository.findByEmail(new Email("inconnu@pmt.fr"))).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> projectService.invite(
                project.getId(), new InviteMemberRequest("inconnu@pmt.fr", null), callerId));
    }

    @Test
    @DisplayName("inviter deux fois la meme personne est un conflit")
    void inviteTwiceConflicts() {
        UUID callerId = alice.getId();
        when(access.requireAdmin(project.getId(), callerId)).thenReturn(adminMembership);
        when(usersRepository.findByEmail(new Email("bob@pmt.fr"))).thenReturn(Optional.of(bob));
        when(projectMemberRepository.existsByProjectIdAndUserId(project.getId(), bob.getId()))
                .thenReturn(true);

        assertThrows(ConflictException.class, () -> projectService.invite(
                project.getId(), new InviteMemberRequest("bob@pmt.fr", null), callerId));
    }

    @Test
    @DisplayName("sans role precise, l'invite entre comme MEMBRE")
    void inviteDefaultsToMember() {
        UUID callerId = alice.getId();
        when(access.requireAdmin(project.getId(), callerId)).thenReturn(adminMembership);
        when(usersRepository.findByEmail(new Email("bob@pmt.fr"))).thenReturn(Optional.of(bob));
        when(projectMemberRepository.existsByProjectIdAndUserId(project.getId(), bob.getId()))
                .thenReturn(false);
        when(projectMemberRepository.save(any(ProjectMember.class))).thenAnswer(i -> i.getArgument(0));

        MemberResponse response = projectService.invite(
                project.getId(), new InviteMemberRequest("bob@pmt.fr", null), callerId);

        assertEquals(ProjectRole.MEMBER, response.role());
        assertEquals("bob@pmt.fr", response.email());
    }

    @Test
    @DisplayName("le dernier administrateur ne peut pas se retrograder")
    void lastAdminCannotStepDown() {
        UUID callerId = alice.getId();
        when(access.requireAdmin(project.getId(), callerId)).thenReturn(adminMembership);
        when(projectMemberRepository.findByProjectIdAndUserId(project.getId(), alice.getId()))
                .thenReturn(Optional.of(adminMembership));
        when(projectMemberRepository.countByProjectIdAndRole(project.getId(), ProjectRole.ADMIN))
                .thenReturn(1L);

        ForbiddenActionException thrown = assertThrows(ForbiddenActionException.class,
                () -> projectService.changeRole(project.getId(), alice.getId(),
                        new ChangeRoleRequest(ProjectRole.MEMBER), callerId));

        assertEquals("Le projet doit conserver au moins un administrateur", thrown.getMessage());
        verify(projectMemberRepository, never()).save(any());
    }

    @Test
    @DisplayName("un administrateur peut se retrograder s'il en reste un autre")
    void adminCanStepDownWhenAnotherRemains() {
        UUID callerId = alice.getId();
        when(access.requireAdmin(project.getId(), callerId)).thenReturn(adminMembership);
        when(projectMemberRepository.findByProjectIdAndUserId(project.getId(), alice.getId()))
                .thenReturn(Optional.of(adminMembership));
        when(projectMemberRepository.countByProjectIdAndRole(project.getId(), ProjectRole.ADMIN))
                .thenReturn(2L);
        when(projectMemberRepository.save(any(ProjectMember.class))).thenAnswer(i -> i.getArgument(0));

        MemberResponse response = projectService.changeRole(project.getId(), alice.getId(),
                new ChangeRoleRequest(ProjectRole.MEMBER), callerId);

        assertEquals(ProjectRole.MEMBER, response.role());
    }

    @Test
    @DisplayName("changer le role d'un non-membre renvoie introuvable")
    void changeRoleOfNonMember() {
        UUID callerId = alice.getId();
        UUID inconnu = UUID.randomUUID();
        when(access.requireAdmin(project.getId(), callerId)).thenReturn(adminMembership);
        when(projectMemberRepository.findByProjectIdAndUserId(project.getId(), inconnu))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> projectService.changeRole(
                project.getId(), inconnu, new ChangeRoleRequest(ProjectRole.ADMIN), callerId));
    }

    @Test
    @DisplayName("lister les membres exige d'etre membre")
    void listMembersRequiresMembership() {
        UUID callerId = alice.getId();
        when(access.requireMember(project.getId(), callerId)).thenReturn(adminMembership);
        when(projectMemberRepository.findByProjectIdOrderByJoinedAtAsc(project.getId()))
                .thenReturn(List.of(adminMembership));

        List<MemberResponse> members = projectService.listMembers(project.getId(), callerId);

        assertEquals(1, members.size());
        assertEquals("alice@pmt.fr", members.get(0).email());
    }
}
