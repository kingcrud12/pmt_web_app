package fr.techcrud.pmt_api.services;

import fr.techcrud.pmt_api.entities.ProjectMember;
import fr.techcrud.pmt_api.exception.ForbiddenActionException;
import fr.techcrud.pmt_api.exception.ResourceNotFoundException;
import fr.techcrud.pmt_api.repositories.ProjectMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * LE POINT DE PASSAGE OBLIGE DE TOUTE AUTORISATION.
 *
 * Chaque service metier commence par appeler une de ces methodes. Centraliser
 * la verification evite l'erreur classique : un endpoint sur dix qui oublie de
 * controler l'appartenance, et toute la protection tombe.
 *
 * Deux niveaux :
 *   requireMember(...)      -> l'appelant appartient-il au projet ?
 *   requireTaskWriter(...)  -> et son role l'autorise-t-il a ecrire ?
 */
@Service
@RequiredArgsConstructor
public class ProjectAccessService {

    private final ProjectMemberRepository projectMemberRepository;

    /**
     * Renvoie l'appartenance, ou leve 404.
     *
     * ANTI-IDOR : on repond « introuvable » et non « interdit » quand
     * l'utilisateur n'est pas membre. Un 403 confirmerait l'existence du projet
     * et permettrait de balayer les identifiants pour cartographier les donnees
     * des autres equipes.
     */
    @Transactional(readOnly = true)
    public ProjectMember requireMember(UUID projectId, UUID userId) {
        return projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Projet introuvable"));
    }

    /** L'appelant doit pouvoir gerer les membres et les roles : ADMIN seul. */
    @Transactional(readOnly = true)
    public ProjectMember requireAdmin(UUID projectId, UUID userId) {
        ProjectMember membership = requireMember(projectId, userId);
        if (!membership.getRole().canManageMembers()) {
            // 403 assume : l'appelant est membre, il SAIT que le projet existe.
            throw new ForbiddenActionException(
                    "Seul un administrateur du projet peut effectuer cette action");
        }
        return membership;
    }

    /** L'appelant doit pouvoir creer ou modifier des taches : ADMIN ou MEMBER. */
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
