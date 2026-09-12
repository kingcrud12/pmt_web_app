package fr.techcrud.pmt_api.model;

public enum ProjectRole {
    ADMIN,

    MEMBER,

    OBSERVER;

    public boolean canManageMembers() {
        return this == ADMIN;
    }

    public boolean canWriteTasks() {
        return this == ADMIN || this == MEMBER;
    }

    public boolean canRead() {
        return true;
    }
}
