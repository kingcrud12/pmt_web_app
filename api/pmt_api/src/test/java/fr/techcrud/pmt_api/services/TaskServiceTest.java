package fr.techcrud.pmt_api.services;

import fr.techcrud.pmt_api.dto.CreateTaskRequest;
import fr.techcrud.pmt_api.dto.TaskResponse;
import fr.techcrud.pmt_api.dto.UpdateTaskRequest;
import fr.techcrud.pmt_api.entities.Project;
import fr.techcrud.pmt_api.entities.ProjectMember;
import fr.techcrud.pmt_api.entities.Task;
import fr.techcrud.pmt_api.entities.Users;
import fr.techcrud.pmt_api.exception.BusinessRuleException;
import fr.techcrud.pmt_api.exception.ForbiddenActionException;
import fr.techcrud.pmt_api.exception.ResourceNotFoundException;
import fr.techcrud.pmt_api.model.Email;
import fr.techcrud.pmt_api.model.HashedPassword;
import fr.techcrud.pmt_api.model.ProjectRole;
import fr.techcrud.pmt_api.model.TaskPriority;
import fr.techcrud.pmt_api.model.TaskStatus;
import fr.techcrud.pmt_api.repositories.ProjectMemberRepository;
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
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("TaskService")
class TaskServiceTest {

    @Mock private TaskRepository taskRepository;
    @Mock private UsersRepository usersRepository;
    @Mock private ProjectMemberRepository projectMemberRepository;
    @Mock private ProjectAccessService access;

    @InjectMocks private TaskService taskService;

    private Users bob;
    private Project project;
    private ProjectMember membership;
    private Task task;

    private static final String HASH = "$2a$10$" + "x".repeat(53);

    @BeforeEach
    void setUp() {
        bob = Users.create("Bob", "Membre", new Email("bob@pmt.fr"), new HashedPassword(HASH));
        project = Project.create("Refonte du site", null, LocalDate.of(2026, 9, 15));
        membership = ProjectMember.create(project, bob, ProjectRole.MEMBER);
        task = Task.create(project, "Maquetter", "Figma", LocalDate.of(2026, 10, 1), TaskPriority.HIGH);
    }

    private CreateTaskRequest creation(String assigneeId) {
        return new CreateTaskRequest("Nouvelle", "Desc", LocalDate.of(2026, 10, 1),
                TaskPriority.MEDIUM, assigneeId);
    }

    @Test
    @DisplayName("une tache neuve demarre a faire")
    void newTaskStartsTodo() {
        UUID callerId = bob.getId();
        when(access.requireTaskWriter(project.getId(), callerId)).thenReturn(membership);
        when(taskRepository.save(any(Task.class))).thenAnswer(i -> i.getArgument(0));

        TaskResponse response = taskService.create(project.getId(), creation(null), callerId);

        assertEquals(TaskStatus.TODO, response.status());
        assertNull(response.assigneeId());
    }

    @Test
    @DisplayName("un observateur ne peut pas creer de tache")
    void observerCannotCreate() {
        UUID callerId = bob.getId();
        when(access.requireTaskWriter(project.getId(), callerId))
                .thenThrow(new ForbiddenActionException("refuse"));

        assertThrows(ForbiddenActionException.class,
                () -> taskService.create(project.getId(), creation(null), callerId));

        verify(taskRepository, never()).save(any());
    }

    @Test
    @DisplayName("on ne peut assigner qu'a un membre du projet")
    void assigneeMustBeMember() {
        UUID callerId = bob.getId();
        UUID etranger = UUID.randomUUID();
        when(access.requireTaskWriter(project.getId(), callerId)).thenReturn(membership);
        when(projectMemberRepository.existsByProjectIdAndUserId(project.getId(), etranger))
                .thenReturn(false);

        ResourceNotFoundException thrown = assertThrows(ResourceNotFoundException.class,
                () -> taskService.create(project.getId(), creation(etranger.toString()), callerId));

        assertEquals("L'assigne doit etre membre du projet", thrown.getMessage());
        verify(taskRepository, never()).save(any());
    }

    @Test
    @DisplayName("un identifiant d'assigne mal forme est refuse proprement")
    void malformedAssigneeId() {
        UUID callerId = bob.getId();
        when(access.requireTaskWriter(project.getId(), callerId)).thenReturn(membership);

        assertThrows(ResourceNotFoundException.class,
                () -> taskService.create(project.getId(), creation("pas-un-uuid"), callerId));
    }

    @Test
    @DisplayName("assigner a un membre du projet fonctionne")
    void assignsToMember() {
        UUID callerId = bob.getId();
        when(access.requireTaskWriter(project.getId(), callerId)).thenReturn(membership);
        when(projectMemberRepository.existsByProjectIdAndUserId(project.getId(), bob.getId()))
                .thenReturn(true);
        when(usersRepository.findById(bob.getId())).thenReturn(Optional.of(bob));
        when(taskRepository.save(any(Task.class))).thenAnswer(i -> i.getArgument(0));

        TaskResponse response = taskService.create(
                project.getId(), creation(bob.getId().toString()), callerId);

        assertEquals(bob.getId().toString(), response.assigneeId());
        assertEquals("Bob Membre", response.assigneeName());
    }

    @Test
    @DisplayName("lire une tache passe par le controle d'appartenance de son projet")
    void readingChecksProjectMembership() {
        UUID callerId = bob.getId();
        when(taskRepository.findById(task.getId())).thenReturn(Optional.of(task));
        when(access.requireMember(project.getId(), callerId)).thenReturn(membership);

        assertEquals("Maquetter", taskService.getOne(task.getId(), callerId).name());
        verify(access).requireMember(project.getId(), callerId);
    }

    @Test
    @DisplayName("une tache inexistante renvoie introuvable")
    void unknownTask() {
        UUID id = UUID.randomUUID();
        when(taskRepository.findById(id)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> taskService.getOne(id, bob.getId()));
    }

    @Test
    @DisplayName("lister les taches d'un projet exige d'en etre membre")
    void listingRequiresMembership() {
        UUID callerId = bob.getId();
        when(access.requireMember(project.getId(), callerId)).thenReturn(membership);
        when(taskRepository.findByProjectIdOrderByCreatedAtDesc(project.getId()))
                .thenReturn(List.of(task));

        assertEquals(1, taskService.listByProject(project.getId(), callerId).size());
    }

    @Test
    @DisplayName("la date de fin ne peut pas preceder l'echeance")
    void endDateCannotPrecedeDueDate() {
        UUID callerId = bob.getId();
        when(taskRepository.findById(task.getId())).thenReturn(Optional.of(task));
        when(access.requireTaskWriter(project.getId(), callerId)).thenReturn(membership);

        UpdateTaskRequest request = new UpdateTaskRequest("Titre", null,
                LocalDate.of(2026, 10, 1), LocalDate.of(2026, 9, 1),
                TaskPriority.LOW, TaskStatus.DONE, null);

        assertThrows(BusinessRuleException.class,
                () -> taskService.update(task.getId(), request, callerId));

        verify(taskRepository, never()).save(any());
    }

    @Test
    @DisplayName("la mise a jour ecrit les champs et horodate la modification")
    void updateWritesFieldsAndTimestamps() {
        UUID callerId = bob.getId();
        when(taskRepository.findById(task.getId())).thenReturn(Optional.of(task));
        when(access.requireTaskWriter(project.getId(), callerId)).thenReturn(membership);
        when(taskRepository.save(any(Task.class))).thenAnswer(i -> i.getArgument(0));

        UpdateTaskRequest request = new UpdateTaskRequest("Titre modifie", "Nouvelle desc",
                LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 5),
                TaskPriority.LOW, TaskStatus.DONE, null);

        TaskResponse response = taskService.update(task.getId(), request, callerId);

        assertEquals("Titre modifie", response.name());
        assertEquals(TaskStatus.DONE, response.status());
        assertEquals(LocalDate.of(2026, 10, 5), response.endDate());
        assertEquals(project.getId().toString(), response.projectId());
    }

    @Test
    @DisplayName("modifier une tache d'un projet dont on n'est pas membre est refuse")
    void cannotUpdateForeignTask() {
        UUID intruse = UUID.randomUUID();
        when(taskRepository.findById(task.getId())).thenReturn(Optional.of(task));
        when(access.requireTaskWriter(project.getId(), intruse))
                .thenThrow(new ResourceNotFoundException("Projet introuvable"));

        UpdateTaskRequest request = new UpdateTaskRequest("X", null, null, null,
                TaskPriority.LOW, TaskStatus.TODO, null);

        assertThrows(ResourceNotFoundException.class,
                () -> taskService.update(task.getId(), request, intruse));

        verify(taskRepository, never()).save(any());
    }
}
