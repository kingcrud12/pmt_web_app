package fr.techcrud.pmt_api.controllers;

import fr.techcrud.pmt_api.dto.TaskResponse;
import fr.techcrud.pmt_api.dto.UpdateTaskRequest;
import fr.techcrud.pmt_api.security.CurrentUser;
import fr.techcrud.pmt_api.services.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;
    private final CurrentUser currentUser;

    /** Visualisation unitaire — accessible a tous les membres, observateurs compris. */
    @GetMapping("/{taskId}")
    public TaskResponse getOne(@PathVariable UUID taskId) {
        return taskService.getOne(taskId, currentUser.id());
    }

    @PutMapping("/{taskId}")
    public TaskResponse update(@PathVariable UUID taskId,
                               @Valid @RequestBody UpdateTaskRequest request) {
        return taskService.update(taskId, request, currentUser.id());
    }
}
