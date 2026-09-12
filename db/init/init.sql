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

INSERT INTO users (id, first_name, last_name, email, password) VALUES
('792b41ce-c17f-4996-a8bd-1d04cf412996', 'Alice', 'Admin', 'alice@pmt.fr', '$2a$10$3z509TfC6LHi3nYt7s36Ne98DFRDhP3k7HDecVjbrcGPbfjocM6ra'),
    ('93092c48-e28f-4bf6-a465-076136c59135', 'Bob', 'Membre', 'bob@pmt.fr', '$2a$10$sSakaslgT/hSkXnSOXcTRuYYtMtSpjAvvGq1OTBJ2vrzt3CQUczIO'),
    ('58573422-c2fc-42bc-aecf-1ec6687feb4e', 'Chloe', 'Observatrice', 'chloe@pmt.fr', '$2a$10$Hudz/CseSJkeSYENvwxCiOPfw943fVaN/vchgHdoQhhPmO8D2UmrG'),
    ('4880439c-0c73-41af-b197-f382ecfb0934', 'Mallory', 'Intruse', 'mallory@pmt.fr', '$2a$10$2ZvXDBN5d1YWskpcLVKCSeAMa43V/W6r4T1X3pmarrD19DOz55PqO');

INSERT INTO projects (id, name, description, start_date) VALUES
    ('9c4adcf1-4891-436d-bd42-690dbd9779d6', 'Refonte du site vitrine', 'Migration de la vitrine vers Angular 19 et reprise du parcours d''inscription.', '2026-09-15'),
    ('691da9db-bcbf-4245-8ace-f060f8c7e3da', 'Migration MySQL 8', 'Passage de la base en utf8mb4 et reprise des scripts d''initialisation.', '2026-09-01'),
    ('2130d3a5-4f28-462c-9914-8052ca5e0d83', 'Audit de securite', 'Revue des acces, des roles projet et du parcours d''authentification.', '2026-09-22');

INSERT INTO project_members (id, project_id, user_id, role) VALUES
    ('0cc6155e-f93a-48ea-8c25-c68860acbfa6', '9c4adcf1-4891-436d-bd42-690dbd9779d6', '792b41ce-c17f-4996-a8bd-1d04cf412996', 'ADMIN'),
    ('7cb0bdc4-e8a0-45ab-8be8-c5a791fb7b14', '9c4adcf1-4891-436d-bd42-690dbd9779d6', '93092c48-e28f-4bf6-a465-076136c59135',   'MEMBER'),
    ('615553a9-210b-4da5-a805-086b8a53da5f', '9c4adcf1-4891-436d-bd42-690dbd9779d6', '58573422-c2fc-42bc-aecf-1ec6687feb4e', 'OBSERVER'),
    ('092632f2-52b2-4092-ba39-86f2aecf4175', '691da9db-bcbf-4245-8ace-f060f8c7e3da', '93092c48-e28f-4bf6-a465-076136c59135',   'ADMIN'),
    ('5a87d4f0-2592-4f84-8267-5abec254dd87', '691da9db-bcbf-4245-8ace-f060f8c7e3da', '792b41ce-c17f-4996-a8bd-1d04cf412996', 'MEMBER'),
    ('bedafec8-d023-49ef-887c-cbeb10f81c2f', '2130d3a5-4f28-462c-9914-8052ca5e0d83', '792b41ce-c17f-4996-a8bd-1d04cf412996', 'ADMIN'),
    ('b80f516e-e801-4d9f-ad4d-33107b08aeef', '2130d3a5-4f28-462c-9914-8052ca5e0d83', '58573422-c2fc-42bc-aecf-1ec6687feb4e', 'OBSERVER');

INSERT INTO tasks (id, project_id, name, description, due_date, end_date, priority, status, assignee_id) VALUES
    ('3865f3d5-f6b7-4201-8c46-42d56fb051b6', '9c4adcf1-4891-436d-bd42-690dbd9779d6', 'Maquetter le tableau de bord', 'Trois cartes de projet, avancement en barre, taches en retard remontees.', '2026-10-01', NULL, 'HIGH',   'IN_PROGRESS', '93092c48-e28f-4bf6-a465-076136c59135'),
    ('e903675b-0a73-401f-894a-138da6b09798', '9c4adcf1-4891-436d-bd42-690dbd9779d6', 'Reprendre le tunnel d''inscription', 'Validation champ par champ et messages d''erreur explicites.',          '2026-09-28', NULL, 'HIGH',   'TODO',        NULL),
    ('52844ff4-838a-4509-9225-f616c2041e1c', '9c4adcf1-4891-436d-bd42-690dbd9779d6', 'Brancher l''intercepteur JWT', 'Attacher le jeton et deconnecter sur 401.',                                  '2026-09-20', '2026-09-19', 'MEDIUM', 'DONE',   '792b41ce-c17f-4996-a8bd-1d04cf412996'),
    ('f5c9578e-527a-464d-9599-86bdcaa4b6db', '9c4adcf1-4891-436d-bd42-690dbd9779d6', 'Ecrire les tests du service projet', 'Couvrir les regles d''autorisation par role.',                          '2026-10-05', NULL, 'MEDIUM', 'TODO',        '792b41ce-c17f-4996-a8bd-1d04cf412996'),
    ('3d78c7ff-61c5-40a8-a9fc-28f321a20bcf', '9c4adcf1-4891-436d-bd42-690dbd9779d6', 'Uniformiser les messages d''erreur', NULL,                                                                    '2026-10-12', NULL, 'LOW',    'TODO',        NULL),
    ('8312e305-90f0-4d49-8648-c95a84d42a0f', '691da9db-bcbf-4245-8ace-f060f8c7e3da', 'Convertir les tables en utf8mb4', 'Verifier les collations et les index uniques.',                            '2026-09-10', '2026-09-09', 'HIGH',   'DONE',   '93092c48-e28f-4bf6-a465-076136c59135'),
    ('4c816110-f49e-43d6-8c65-e568904e2855', '691da9db-bcbf-4245-8ace-f060f8c7e3da', 'Rejouer init.sql sur volume vierge', NULL,                                                                    '2026-09-25', NULL, 'MEDIUM', 'IN_PROGRESS', '792b41ce-c17f-4996-a8bd-1d04cf412996'),
    ('42e62c23-dcd1-4f67-b3d9-011102e4e452', '2130d3a5-4f28-462c-9914-8052ca5e0d83', 'Verifier les acces inter-projets', 'Un non-membre doit recevoir 404 et non 403.',                             '2026-10-02', NULL, 'HIGH',   'TODO',        '792b41ce-c17f-4996-a8bd-1d04cf412996'),
    ('0ce38af4-2095-4a77-b50a-dd688d4bf9ea', '2130d3a5-4f28-462c-9914-8052ca5e0d83', 'Controler l''absence de fuite de trace', 'Aucune trace d''exception ne doit sortir vers le client.',           '2026-10-08', NULL, 'MEDIUM', 'TODO',        NULL);
