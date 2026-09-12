package fr.techcrud.pmt_api.controllers;

import fr.techcrud.pmt_api.dto.ChangeRoleRequest;
import fr.techcrud.pmt_api.dto.CreateProjectRequest;
import fr.techcrud.pmt_api.dto.CreateTaskRequest;
import fr.techcrud.pmt_api.dto.InviteMemberRequest;
import fr.techcrud.pmt_api.dto.MemberResponse;
import fr.techcrud.pmt_api.dto.ProjectResponse;
import fr.techcrud.pmt_api.dto.TaskResponse;
import fr.techcrud.pmt_api.security.CurrentUser;
import fr.techcrud.pmt_api.services.ProjectService;
import fr.techcrud.pmt_api.services.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {
    private final ProjectService projectService;
    private final TaskService taskService;
    private final CurrentUser currentUser;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProjectResponse create(@Valid @RequestBody CreateProjectRequest request) {
        return projectService.create(request, currentUser.entity());
    }

    @GetMapping
    public List<ProjectResponse> listMine() {
        return projectService.listMine(currentUser.id());
    }

    @GetMapping("/{projectId}")
    public ProjectResponse getOne(@PathVariable UUID projectId) {
        return projectService.getOne(projectId, currentUser.id());
    }

    @GetMapping("/{projectId}/members")
    public List<MemberResponse> listMembers(@PathVariable UUID projectId) {
        return projectService.listMembers(projectId, currentUser.id());
    }

    @PostMapping("/{projectId}/members")
    @ResponseStatus(HttpStatus.CREATED)
    public MemberResponse invite(@PathVariable UUID projectId,
                                 @Valid @RequestBody InviteMemberRequest request) {
        return projectService.invite(projectId, request, currentUser.id());
    }

    @PutMapping("/{projectId}/members/{userId}/role")
    public MemberResponse changeRole(@PathVariable UUID projectId,
                                     @PathVariable UUID userId,
                                     @Valid @RequestBody ChangeRoleRequest request) {
        return projectService.changeRole(projectId, userId, request, currentUser.id());
    }

    @GetMapping("/{projectId}/tasks")
    public List<TaskResponse> listTasks(@PathVariable UUID projectId) {
        return taskService.listByProject(projectId, currentUser.id());
    }

    @PostMapping("/{projectId}/tasks")
    @ResponseStatus(HttpStatus.CREATED)
    public TaskResponse createTask(@PathVariable UUID projectId,
                                   @Valid @RequestBody CreateTaskRequest request) {
        return taskService.create(projectId, request, currentUser.id());
    }
}
