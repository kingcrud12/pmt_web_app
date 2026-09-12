package fr.techcrud.pmt_api.model;

public record HashedPassword(String value) {
    private static final int BCRYPT_LENGTH = 60;

    public HashedPassword {
        if (value == null) {
            throw new IllegalArgumentException("Le hachage est obligatoire");
        }
        if (value.length() != BCRYPT_LENGTH) {
            throw new IllegalArgumentException(
                    "Un hachage BCrypt fait exactement " + BCRYPT_LENGTH
                            + " caracteres, recu : " + value.length());
        }
    }

    @Override
    public String toString() {
        return "HashedPassword[****]";
    }
}
