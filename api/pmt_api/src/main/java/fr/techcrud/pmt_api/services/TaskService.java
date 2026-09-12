package fr.techcrud.pmt_api.services;

import fr.techcrud.pmt_api.dto.CreateTaskRequest;
import fr.techcrud.pmt_api.dto.TaskResponse;
import fr.techcrud.pmt_api.dto.UpdateTaskRequest;
import fr.techcrud.pmt_api.entities.ProjectMember;
import fr.techcrud.pmt_api.entities.Task;
import fr.techcrud.pmt_api.entities.Users;
import fr.techcrud.pmt_api.exception.BusinessRuleException;
import fr.techcrud.pmt_api.exception.ResourceNotFoundException;
import fr.techcrud.pmt_api.repositories.ProjectMemberRepository;
import fr.techcrud.pmt_api.repositories.TaskRepository;
import fr.techcrud.pmt_api.repositories.UsersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TaskService {
    private final TaskRepository taskRepository;
    private final UsersRepository usersRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final ProjectAccessService access;

    @Transactional
    public TaskResponse create(UUID projectId, CreateTaskRequest request, UUID callerId) {
        ProjectMember membership = access.requireTaskWriter(projectId, callerId);

        Task task = Task.create(
                membership.getProject(),
                request.name(),
                request.description(),
                request.dueDate(),
                request.priority());

        task.setAssignee(resolveAssignee(projectId, request.assigneeId()));

        return TaskResponse.of(taskRepository.save(task));
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> listByProject(UUID projectId, UUID callerId) {
        access.requireMember(projectId, callerId);
        return taskRepository.findByProjectIdOrderByCreatedAtDesc(projectId).stream()
                .map(TaskResponse::of)
                .toList();
    }

    @Transactional(readOnly = true)
    public TaskResponse getOne(UUID taskId, UUID callerId) {
        return TaskResponse.of(loadReadableTask(taskId, callerId));
    }

    @Transactional
    public TaskResponse update(UUID taskId, UpdateTaskRequest request, UUID callerId) {
        Task task = loadTask(taskId);

        access.requireTaskWriter(task.getProject().getId(), callerId);

        if (request.endDate() != null && request.dueDate() != null
                && request.endDate().isBefore(request.dueDate())) {
            throw new BusinessRuleException(
                    "La date de fin ne peut pas preceder la date d'echeance");
        }

        task.setName(request.name().trim());
        task.setDescription(request.description() == null ? null : request.description().trim());
        task.setDueDate(request.dueDate());
        task.setEndDate(request.endDate());
        task.setPriority(request.priority());
        task.setStatus(request.status());
        task.setAssignee(resolveAssignee(task.getProject().getId(), request.assigneeId()));
        task.touch();

        return TaskResponse.of(taskRepository.save(task));
    }

    private Task loadTask(UUID taskId) {
        return taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Tache introuvable"));
    }

    private Task loadReadableTask(UUID taskId, UUID callerId) {
        Task task = loadTask(taskId);
        access.requireMember(task.getProject().getId(), callerId);
        return task;
    }

    private Users resolveAssignee(UUID projectId, String assigneeId) {
        if (assigneeId == null || assigneeId.isBlank()) {
            return null;
        }

        UUID id;
        try {
            id = UUID.fromString(assigneeId);
        } catch (IllegalArgumentException e) {
            throw new ResourceNotFoundException("Assigne introuvable");
        }

        if (!projectMemberRepository.existsByProjectIdAndUserId(projectId, id)) {
            throw new ResourceNotFoundException(
                    "L'assigne doit etre membre du projet");
        }

        return usersRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assigne introuvable"));
    }
}
