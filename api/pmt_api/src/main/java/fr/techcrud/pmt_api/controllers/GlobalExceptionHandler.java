package fr.techcrud.pmt_api.controllers;

import fr.techcrud.pmt_api.exception.BusinessException;
import fr.techcrud.pmt_api.exception.ConflictException;
import fr.techcrud.pmt_api.exception.EmailAlreadyUsedException;
import fr.techcrud.pmt_api.exception.ForbiddenActionException;
import fr.techcrud.pmt_api.exception.InvalidCredentialsException;
import fr.techcrud.pmt_api.exception.ResourceNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Traduit le monde metier en monde HTTP.
 *
 * Principe de sécurité : le client ne recoit JAMAIS de trace d'exception ni de
 * detail technique. Les erreurs inattendues sont journalisees cote serveur et
 * renvoyees sous forme d'un message generique — une trace exposerait les noms
 * de classes, la structure interne et les versions de bibliotheques.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /** 401 — identifiants refuses. */
    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidCredentials(
            InvalidCredentialsException ex, HttpServletRequest request) {
        return build(HttpStatus.UNAUTHORIZED, ex.getMessage(), request, null);
    }

    /** 403 — membre du projet, mais role insuffisant pour cette action. */
    @ExceptionHandler(ForbiddenActionException.class)
    public ResponseEntity<Map<String, Object>> handleForbidden(
            ForbiddenActionException ex, HttpServletRequest request) {
        return build(HttpStatus.FORBIDDEN, ex.getMessage(), request, null);
    }

    /** 404 — inexistant, OU invisible pour l'appelant (anti-IDOR). */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(
            ResourceNotFoundException ex, HttpServletRequest request) {
        return build(HttpStatus.NOT_FOUND, ex.getMessage(), request, null);
    }

    /** 409 — conflit avec l'etat actuel. */
    @ExceptionHandler({EmailAlreadyUsedException.class, ConflictException.class})
    public ResponseEntity<Map<String, Object>> handleConflict(
            BusinessException ex, HttpServletRequest request) {
        return build(HttpStatus.CONFLICT, ex.getMessage(), request, null);
    }

    /** 400 — toute autre regle metier violee. */
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<Map<String, Object>> handleBusiness(
            BusinessException ex, HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, ex.getMessage(), request, null);
    }

    /** 400 — echec de @Valid, avec le detail par champ. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(
            MethodArgumentNotValidException ex, HttpServletRequest request) {

        Map<String, String> fields = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(e -> fields.putIfAbsent(e.getField(), e.getDefaultMessage()));

        return build(HttpStatus.BAD_REQUEST, "Requete invalide", request, fields);
    }

    /** 400 — UUID mal forme dans l'URL, ou enum inconnu. */
    @ExceptionHandler({MethodArgumentTypeMismatchException.class, HttpMessageNotReadableException.class})
    public ResponseEntity<Map<String, Object>> handleMalformed(
            Exception ex, HttpServletRequest request) {
        // On ne renvoie PAS ex.getMessage() : il contient le nom des classes Java.
        return build(HttpStatus.BAD_REQUEST, "Requete illisible ou parametre invalide", request, null);
    }

    /** 500 — filet de securite. Detaille dans les logs, generique pour le client. */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleUnexpected(
            Exception ex, HttpServletRequest request) {
        log.error("Erreur inattendue sur {} {}", request.getMethod(), request.getRequestURI(), ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "Une erreur interne est survenue", request, null);
    }

    private ResponseEntity<Map<String, Object>> build(HttpStatus status,
                                                      String message,
                                                      HttpServletRequest request,
                                                      Map<String, String> fields) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);
        body.put("path", request.getRequestURI());
        if (fields != null && !fields.isEmpty()) {
            body.put("fields", fields);
        }
        return ResponseEntity.status(status).body(body);
    }
}
