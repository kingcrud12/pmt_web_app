package fr.techcrud.pmt_api.model;

/**
 * Le role d'un utilisateur SUR UN PROJET DONNE.
 *
 * Ce n'est deliberement pas un role Spring Security global : un meme
 * utilisateur peut etre ADMIN du projet A et OBSERVER du projet B. Toute
 * autorisation doit donc etre evaluee par couple (utilisateur, projet), jamais
 * a partir du seul jeton.
 */
public enum ProjectRole {

    /** Gere le projet : invite, change les roles, tout ce que fait un MEMBER. */
    ADMIN,

    /** Cree et modifie les taches, mais ne gere ni les membres ni les roles. */
    MEMBER,

    /** Lecture seule. */
    OBSERVER;

    public boolean canManageMembers() {
        return this == ADMIN;
    }

    /** Creation, modification et assignation de taches. */
    public boolean canWriteTasks() {
        return this == ADMIN || this == MEMBER;
    }

    public boolean canRead() {
        return true;
    }
}
