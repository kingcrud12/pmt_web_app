CREATE DATABASE IF NOT EXISTS pmt_db DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_unicode_ci;
USE pmt_db;
CREATE TABLE IF NOT EXISTS users(
    id CHAR(36) NOT NULL DEFAULT (UUID()),
    first_name VARCHAR(250) NOT NULL,
    last_name VARCHAR(250) NOT NULL,
    email VARCHAR(250) NOT NULL,
    password VARCHAR(250) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uk_users_email UNIQUE (email)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 DEFAULT COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS projects (
    id          CHAR(36)     NOT NULL,
    name        VARCHAR(250) NOT NULL,
    description TEXT         NULL,
    start_date  DATE         NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_projects PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 DEFAULT COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS project_members (
    id         CHAR(36)    NOT NULL,
    project_id CHAR(36)    NOT NULL,
    user_id    CHAR(36)    NOT NULL,
    role       VARCHAR(20) NOT NULL,
    joined_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_project_members       PRIMARY KEY (id),
    CONSTRAINT uk_project_members       UNIQUE (project_id, user_id),
    CONSTRAINT fk_members_project       FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
    CONSTRAINT fk_members_user          FOREIGN KEY (user_id)    REFERENCES users (id)    ON DELETE CASCADE,
    CONSTRAINT ck_members_role          CHECK (role IN ('ADMIN', 'MEMBER', 'OBSERVER'))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 DEFAULT COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tasks (
    id          CHAR(36)     NOT NULL,
    project_id  CHAR(36)     NOT NULL,
    name        VARCHAR(250) NOT NULL,
    description TEXT         NULL,
    due_date    DATE         NULL,
    end_date    DATE         NULL,
    priority    VARCHAR(20)  NOT NULL,
    status      VARCHAR(20)  NOT NULL,
    assignee_id CHAR(36)     NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    NULL,
    CONSTRAINT pk_tasks           PRIMARY KEY (id),
    CONSTRAINT fk_tasks_project   FOREIGN KEY (project_id)  REFERENCES projects (id) ON DELETE CASCADE,
    CONSTRAINT fk_tasks_assignee  FOREIGN KEY (assignee_id) REFERENCES users (id)    ON DELETE SET NULL,
    CONSTRAINT ck_tasks_priority  CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
    CONSTRAINT ck_tasks_status    CHECK (status   IN ('TODO', 'IN_PROGRESS', 'DONE')),
    INDEX idx_tasks_project (project_id),
    INDEX idx_tasks_assignee (assignee_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 DEFAULT COLLATE utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Jeu de donnees de demonstration.
-- Mot de passe des quatre comptes : motdepasse123
--
-- Ces hachages ont ete PRODUITS par BCryptPasswordEncoder via POST
-- /api/auth/register, jamais ecrits a la main : un hachage BCrypt fait
-- exactement 60 caracteres et ne s'invente pas. Les anciennes valeurs de 13 et
-- 38 caracteres rendaient les comptes inutilisables.
-- ---------------------------------------------------------------------------
INSERT INTO users (id, first_name, last_name, email, password) VALUES
('792b41ce-c17f-4996-a8bd-1d04cf412996', 'Alice', 'Admin', 'alice@pmt.fr', '$2a$10$3z509TfC6LHi3nYt7s36Ne98DFRDhP3k7HDecVjbrcGPbfjocM6ra'),
    ('93092c48-e28f-4bf6-a465-076136c59135', 'Bob', 'Membre', 'bob@pmt.fr', '$2a$10$sSakaslgT/hSkXnSOXcTRuYYtMtSpjAvvGq1OTBJ2vrzt3CQUczIO'),
    ('58573422-c2fc-42bc-aecf-1ec6687feb4e', 'Chloe', 'Observatrice', 'chloe@pmt.fr', '$2a$10$Hudz/CseSJkeSYENvwxCiOPfw943fVaN/vchgHdoQhhPmO8D2UmrG'),
    ('4880439c-0c73-41af-b197-f382ecfb0934', 'Mallory', 'Intruse', 'mallory@pmt.fr', '$2a$10$2ZvXDBN5d1YWskpcLVKCSeAMa43V/W6r4T1X3pmarrD19DOz55PqO');
