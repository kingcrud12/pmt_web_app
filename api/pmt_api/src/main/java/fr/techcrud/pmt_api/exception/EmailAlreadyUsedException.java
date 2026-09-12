package fr.techcrud.pmt_api.exception;

import fr.techcrud.pmt_api.model.Email;

public class EmailAlreadyUsedException extends BusinessException {
    public EmailAlreadyUsedException(Email email) {
        super("Cet email est deja utilise : " + email.value());
    }
}
