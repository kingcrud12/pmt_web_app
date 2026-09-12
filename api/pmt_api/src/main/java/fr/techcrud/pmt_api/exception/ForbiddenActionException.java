package fr.techcrud.pmt_api.exception;

public class ForbiddenActionException extends BusinessException {
    public ForbiddenActionException(String message) {
        super(message);
    }
}
