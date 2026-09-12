package fr.techcrud.pmt_api.model;

import fr.techcrud.pmt_api.exception.WeakPasswordException;

public record RawPassword(String value) {
    private static final int MIN_LENGTH = 8;

    public RawPassword {
        if (value == null || value.length() < MIN_LENGTH) {
            throw new WeakPasswordException(
                    "Le mot de passe doit faire au moins " + MIN_LENGTH + " caracteres");
        }
    }

    @Override
    public String toString() {
        return "RawPassword[****]";
    }
}
