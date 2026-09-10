package fr.techcrud.pmt_api.repositories;

import fr.techcrud.pmt_api.entities.Project;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ProjectRepository extends JpaRepository<Project, UUID> {
}
