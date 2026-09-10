package fr.techcrud.pmt_api.exception;

public class InvalidEmailException extends BusinessException {

    public InvalidEmailException(String message) {
        super(message);
    }
}
