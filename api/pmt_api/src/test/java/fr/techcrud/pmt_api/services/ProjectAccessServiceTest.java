package fr.techcrud.pmt_api.services;

import fr.techcrud.pmt_api.entities.Project;
import fr.techcrud.pmt_api.entities.ProjectMember;
import fr.techcrud.pmt_api.entities.Users;
import fr.techcrud.pmt_api.exception.ForbiddenActionException;
import fr.techcrud.pmt_api.exception.ResourceNotFoundException;
import fr.techcrud.pmt_api.model.Email;
import fr.techcrud.pmt_api.model.HashedPassword;
import fr.techcrud.pmt_api.model.ProjectRole;
import fr.techcrud.pmt_api.repositories.ProjectMemberRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("ProjectAccessService")
class ProjectAccessServiceTest {

    @Mock
    private ProjectMemberRepository projectMemberRepository;

    @InjectMocks
    private ProjectAccessService access;

    private static final UUID PROJECT_ID = UUID.randomUUID();
    private static final UUID USER_ID = UUID.randomUUID();

    private static ProjectMember membership(ProjectRole role) {
        Users user = Users.create("Alice", "Durand", new Email("alice@pmt.fr"),
                new HashedPassword("$2a$10$" + "x".repeat(53)));
        Project project = Project.create("Refonte", null, LocalDate.of(2026, 9, 15));
        return ProjectMember.create(project, user, role);
    }

    @Test
    @DisplayName("un non-membre recoit 404 et non 403, pour ne pas reveler l'existence du projet")
    void hidesProjectsFromNonMembers() {
        when(projectMemberRepository.findByProjectIdAndUserId(PROJECT_ID, USER_ID))
                .thenReturn(Optional.empty());

        ResourceNotFoundException thrown = assertThrows(ResourceNotFoundException.class,
                () -> access.requireMember(PROJECT_ID, USER_ID));

        assertEquals("Projet introuvable", thrown.getMessage());


    }

    @Test
    @DisplayName("un membre obtient son appartenance")
    void returnsMembershipForMember() {
        when(projectMemberRepository.findByProjectIdAndUserId(PROJECT_ID, USER_ID))
                .thenReturn(Optional.of(membership(ProjectRole.MEMBER)));

        assertEquals(ProjectRole.MEMBER, access.requireMember(PROJECT_ID, USER_ID).getRole());
    }

    @Test
    @DisplayName("seul un administrateur passe requireAdmin")
    void onlyAdminManagesMembers() {
        when(projectMemberRepository.findByProjectIdAndUserId(PROJECT_ID, USER_ID))
                .thenReturn(Optional.of(membership(ProjectRole.ADMIN)));
        assertDoesNotThrow(() -> access.requireAdmin(PROJECT_ID, USER_ID));
    }

    @Test
    @DisplayName("un membre simple se voit refuser la gestion des membres, en 403")
    void memberCannotManageMembers() {
        when(projectMemberRepository.findByProjectIdAndUserId(PROJECT_ID, USER_ID))
                .thenReturn(Optional.of(membership(ProjectRole.MEMBER)));

        assertThrows(ForbiddenActionException.class, () -> access.requireAdmin(PROJECT_ID, USER_ID));
    }

    @Test
    @DisplayName("administrateur et membre peuvent ecrire des taches")
    void adminAndMemberCanWriteTasks() {
        when(projectMemberRepository.findByProjectIdAndUserId(PROJECT_ID, USER_ID))
                .thenReturn(Optional.of(membership(ProjectRole.ADMIN)));
        assertDoesNotThrow(() -> access.requireTaskWriter(PROJECT_ID, USER_ID));
    }

    @Test
    @DisplayName("un observateur ne peut pas ecrire de tache")
    void observerCannotWriteTasks() {
        when(projectMemberRepository.findByProjectIdAndUserId(PROJECT_ID, USER_ID))
                .thenReturn(Optional.of(membership(ProjectRole.OBSERVER)));

        ForbiddenActionException thrown = assertThrows(ForbiddenActionException.class,
                () -> access.requireTaskWriter(PROJECT_ID, USER_ID));

        assertEquals("Un observateur ne peut pas modifier les taches", thrown.getMessage());
    }
}
