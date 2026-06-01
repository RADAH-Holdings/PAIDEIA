# Paideia — Technical Specification (PAI-TSD-001 v1.0)

> Auto-generated from the canonical HTML spec. This is the agent-readable copy. If anything here conflicts with a later human edit, the HTML in /spec-source is the visual master; this Markdown is the working reference.

---

PAIDEIA

Technical Spec · MVP

Doc IDPAI-TSD-001

Versionv1.0

StatusDRAFT

Pairs withPAI-FSD-001 v2

Foundation

01Purpose & Doc Map 02Architecture Overview 03Technology Stack 04Repository Structure

Data & Backend

05Data Layer 5.1 Schema & Indices 5.2 Migrations 06Backend Architecture 6.1 Django Apps 6.2 Async Model 6.3 Settings 07API Contract 7.1 Conventions 7.2 Identity 7.3 Accounts 7.4 Courses 7.5 Enrollment 7.6 Sessions 7.7 Progress 08Auth & Authorization

AI & Streaming

09AI Agent Layer 10Streaming Pipeline

Frontend

11Frontend Architecture 12Rendering Engine

Integration

13Interface Contracts 14Error Handling 15Security Architecture

Operations

16Deployment 17Observability 18Key Sequence Flows 19Implementation Sequence

Paideia · MVP · Technical Specification Document

System Technical Specification

How the system is built — architecture, contracts, and interfaces

Document ID

PAI-TSD-001

Version

1.0 — Draft

Pairs With

PAI-FSD-001 v2.0

Scope

MVP — Core Loop

Audience

Engineering

Classification

Internal — Confidential

01

## Purpose & Document Map

This Technical Specification Document (TSD) defines how the Paideia MVP is built. Where the Functional Specification (FSD, PAI-FSD-001 v2.0) defines what the system does and why, this document defines the architecture, the interfaces between components, the API contract, the data layer, and the implementation detail required to build it.

The two documents are read together. Every functional requirement in the FSD (identified by codes such as `SESS-02` or `REND-03`) is realised by one or more technical components specified here. Where this document references an FSD requirement, it does so by code.

**Governing Principle — Interfaces First** The central design rule of this TSD is that every boundary between two components has an explicit, versioned contract. The browser, the Next.js frontend, the Django API, the Anthropic API, and the PostgreSQL database each communicate only through defined contracts (Section 13). No component reaches across a boundary in an undefined way. This is what makes the system buildable by more than one person and debuggable when something breaks.

1.1The Four Boundaries

The MVP has exactly four interface boundaries. Every one is contracted in Section 13. If a behaviour is not described at the boundary it crosses, it is undefined and must not be relied upon. (Authentication is no longer a separate boundary — it is handled inside Django and travels over B2 as a Bearer token.)

#| Boundary| Protocol| Contract  
---|---|---|---  
B1| Browser ↔ Next.js| HTTPS, streamed fetch| Next.js pages and route handlers; a fetch streaming response for lesson delivery  
B2| Next.js ↔ Django API| HTTPS REST + stream, Bearer JWT| The API Contract (Section 7) — JSON request/response, a streamed response for session generation, and the /auth endpoints that issue Django JWTs  
B3| Django ↔ Anthropic| HTTPS, Anthropic SDK| Async streaming (lesson) + async non-streaming (assessment)  
B4| Django ↔ PostgreSQL| TCP, psycopg3 async| Django ORM async; private Railway networking  
  
02

## Architecture Overview

Paideia MVP is a three-service system on Railway: a Next.js frontend, a Django API backend, and a PostgreSQL database. It integrates one external service — the Anthropic API for content generation. Authentication is handled inside Django (no external identity provider). The architecture is deliberately conventional; the novelty of the product is in the AI agent loop, not in the infrastructure.

System Architecture — Runtime View

Student / Teacher / Admin Browser

│ HTTPS · B1

Next.js 14 — Railway Service 1

│ HTTPS REST + stream · Bearer JWT · B2 (includes /auth login & refresh)

Django 5 API — Railway Service 2 (owns auth: simplejwt + User model)

├─ B3 → Anthropic API (async stream + async call)

└─ B4 → PostgreSQL — Railway Service 3 (psycopg3, private net)

2.1Architectural Decisions

Decision| Choice| Rationale  
---|---|---  
Frontend / backend split| Decoupled — Next.js + Django API| Lesson rendering needs a reactive client (streaming, interactive iframes, assessment state machine). Django is API-only. The two never share a template layer.  
Backend concurrency model| ASGI async — Uvicorn workers| AI calls hold connections 15–30s. Async views let one worker handle many in-flight generations without thread exhaustion.  
Lesson delivery transport| Server-Sent Events (one-way stream)| Lesson generation is server→client only. SSE is simpler than WebSockets, survives proxies with one header, and maps directly to the Anthropic token stream.  
Identity ownership| Django owns identity and authorization| The User model is the single source of truth. simplejwt issues tokens; password hashing is Django's. No external provider, so no sync drift and no third-party child-data processor.  
Database| PostgreSQL with JSONB| Relational core for users/courses/sessions; JSONB for lesson blocks and assessment questions — structured but schema-flexible documents.  
Deployment| All three services on Railway| One platform, one dashboard, private networking between API and DB. Operational simplicity for a small team.  
  
2.2Module-to-Service Mapping

The eight functional modules from FSD Section 4 map onto the three services as follows. A module is not a deployable unit — it is a logical grouping. Several modules live in one service.

FSD Module| Service| Implemented As  
---|---|---  
M1 Auth & Identity| Django + Next.js| simplejwt + permission classes (Django) + route guard (Next.js)  
M2 Account Management| Django| `accounts` Django app  
M3 Course Brief| Django| `courses` Django app  
M4 Enrollment| Django| `courses` app — enrollment viewset  
M5 Session Orchestration| Django| `sessions` Django app — the orchestrator service class  
M6 Context Assembly| Django| `sessions` app — `context.py` module  
M7 AI Agent| Django| `agent` Django app — Anthropic client wrapper, prompts, parsers  
M8 Rendering Engine| Next.js| `components/lesson/*` — three renderers + block router  
  
03

## Technology Stack

Exact versions and packages. Versions are pinned at project start and upgraded deliberately, never incidentally. The model version is the one exception — it is an environment variable, not a pinned dependency.

3.1Backend — Django Service

**Python** 3.12 **Django** 5.x **djangorestframework** 3.15+ **psycopg** 3.x (binary) **anthropic** (latest SDK) **djangorestframework-simplejwt** **django-cors-headers** **gunicorn** **uvicorn** (worker class) **python-dotenv** **pydantic** 2.x (output validation)

**Pin Note — psycopg** The package is `psycopg` (version 3), installed as `psycopg[binary]`. It is NOT `psycopg2` and NOT a package literally named `psycopg3`. Installing the wrong one is the single most common setup error and causes `SynchronousOnlyOperation` failures inside async views.

3.2Frontend — Next.js Service

**Node.js** 20 LTS **Next.js** 14 (App Router) **React** 18 **TypeScript** 5.x **jwt-decode** (read role from token) **react-markdown** **remark-math** · **remark-gfm** **rehype-katex** · **rehype-highlight** **katex** **tailwindcss** **zod** (client-side response validation)

3.3Infrastructure & External

**Railway** — 3 services **PostgreSQL** 16 (Railway managed) **Anthropic API** — content generation **SMTP / email backend** — welcome & reset mail **GitHub** — source + CI

04

## Repository Structure

A single Git repository with two top-level directories — `backend/` and `frontend/`. They deploy as two separate Railway services from the same repo using per-service root directories. This keeps the API contract changes and their consuming frontend changes in the same commit and pull request.
    
    
    paideia/
    ├── backend/                  # Django API — Railway Service 2
    │   ├── paideia/              # Django project root
    │   │   ├── settings.py       # env-driven config
    │   │   ├── asgi.py           # ASGI entrypoint — used by Uvicorn
    │   │   └── urls.py           # root URL conf
    │   ├── accounts/             # M2 — users, schools, account mgmt
    │   │   ├── models.py         # School, User
    │   │   ├── authentication.py # simplejwt config + /auth/login, /auth/refresh views
    │   │   ├── permissions.py    # IsAdmin, IsTeacher, IsCourseOwner, IsSameSchool
    │   │   ├── passwords.py       # temp-password generation, reset flow, force-change guard
    │   │   ├── serializers.py
    │   │   └── views.py
    │   ├── courses/              # M3 + M4 — course briefs, enrollment
    │   │   ├── models.py         # Course, Enrollment
    │   │   ├── serializers.py
    │   │   └── views.py
    │   ├── sessions/             # M5 + M6 — orchestration, context assembly
    │   │   ├── models.py         # Session, Lesson, Assessment, Response, SessionHistory
    │   │   ├── orchestrator.py  # the session state machine + sequencing
    │   │   ├── context.py       # context assembly + history summarisation
    │   │   ├── views.py         # async SSE view + sync endpoints
    │   │   └── serializers.py
    │   ├── agent/                # M7 — AI agent integration
    │   │   ├── client.py         # AsyncAnthropic wrapper
    │   │   ├── prompts.py        # versioned prompt templates
    │   │   ├── parsers.py        # tag extraction, JSON parsing
    │   │   ├── validators.py     # pydantic schemas, HTML block validation
    │   │   └── schemas.py        # Lesson, Block, Assessment pydantic models
    │   ├── common/               # shared — logging, errors, pagination
    │   ├── requirements.txt
    │   ├── Procfile             # gunicorn ... -k uvicorn.workers.UvicornWorker
    │   └── manage.py
    │
    ├── frontend/                 # Next.js — Railway Service 1
    │   ├── app/
    │   │   ├── (auth)/           # sign-in, sign-up — public
    │   │   ├── admin/            # admin role route group
    │   │   ├── teacher/          # teacher role route group
    │   │   ├── student/          # student role route group
    │   │   ├── layout.tsx        # auth context provider, global KaTeX CSS
    │   │   └── middleware.ts     # token-presence route protection
    │   ├── components/
    │   │   ├── lesson/           # M8 — the Rendering Engine
    │   │   │   ├── LessonRenderer.tsx   # block router
    │   │   │   ├── TextBlock.tsx       # renderer 1
    │   │   │   ├── InteractiveBlock.tsx# renderer 2 — sandboxed iframe
    │   │   │   ├── CalloutBlock.tsx
    │   │   │   └── AssessmentEngine.tsx # renderer 3 — state machine
    │   │   └── ui/
    │   ├── lib/
    │   │   ├── api.ts            # typed API client — wraps B2
    │   │   ├── stream.ts         # fetch + ReadableStream reader for lesson streaming
    │   │   └── schemas.ts        # zod schemas mirroring API responses
    │   ├── package.json
    │   └── next.config.js
    │
    ├── README.md
    └── .github/workflows/      # CI — lint, test, migrate-check
        

**Why a Monorepo** The API contract (Section 7) is the most fragile interface in the system. When an endpoint changes shape, the Django serializer and the TypeScript zod schema in `frontend/lib/schemas.ts` must change together. A monorepo forces both into the same commit and the same review. Two separate repos would let them drift.

05

## Data Layer

PostgreSQL 16. The schema below is the authoritative data model — it extends the FSD Section 17 schema with the indices, cascade rules, and constraints required for a correct and performant implementation.

5.1Schema with Indices & Constraints

PostgreSQL DDL — Indices and Cascade Rules
    
    
    -- Every query that the API makes is supported by an index below.
    -- Cascade rules reflect FSD immutability requirements (HIST-01).
    
    users
      INDEX  ix_users_school        (school_id)        -- admin lists users by school
      INDEX  ix_users_email         (email) UNIQUE     -- login lookup by email
      INDEX  ix_users_school_role   (school_id, role)  -- "all teachers in school"
    
    courses
      INDEX  ix_courses_teacher     (teacher_id)               -- teacher's course list
      INDEX  ix_courses_school_stat (school_id, status)        -- active courses in school
      ON DELETE  teacher_id SET NULL     -- FSD ACC-05: deactivation never deletes; nullable
    
    enrollments
      UNIQUE ux_enroll_course_stu   (course_id, student_id)    -- FSD ENROL-05: no duplicates
      INDEX  ix_enroll_student      (student_id, status)       -- student's course list
      INDEX  ix_enroll_course       (course_id, status)        -- course roster
      ON DELETE  course_id RESTRICT     -- archive, never delete a course with enrollments
    
    sessions
      UNIQUE ux_sess_enroll_number  (enrollment_id, session_number)
      INDEX  ix_sess_enroll_status  (enrollment_id, status)    -- single-active-session check
      -- partial index for the cleanup cron (FSD SESS-06):
      INDEX  ix_sess_abandoned      (status) WHERE status = 'abandoned'
    
    lessons
      UNIQUE ux_lesson_session      (session_id)   -- one lesson per session
      ON DELETE  session_id CASCADE    -- failed session cleanup removes its lesson
    
    assessments
      UNIQUE ux_assess_lesson       (lesson_id)
      ON DELETE  lesson_id CASCADE
    
    assessment_responses
      UNIQUE ux_resp_q              (assessment_id, session_id, question_index)
      INDEX  ix_resp_session        (session_id)   -- gather all answers for a session
    
    session_history          -- IMMUTABLE after write (FSD HIST-01)
      UNIQUE ux_hist_session        (session_id)
      INDEX  ix_hist_enroll_num     (enrollment_id, session_number)  -- context assembly read
      -- No ON DELETE cascade. History outlives sessions intentionally.
      -- Enforced immutable at the application layer — no UPDATE/DELETE in any code path.

**The Critical Read Path** The single most performance-sensitive query in the system is context assembly reading `session_history` for an enrollment (FSD HIST-04). The index `ix_hist_enroll_num` covers it exactly: filter by `enrollment_id`, order by `session_number` descending, take what the summarisation strategy needs. This query runs once per session generation and must never trigger a sequential scan.

5.2Migrations Strategy

Rule| Detail  
---|---  
Migration tool| Django's built-in migration framework. No third-party tool.  
Where migrations run| As a Railway release-phase command on the Django service, before the new version receives traffic. Never inside the web process at startup.  
Release command| `python manage.py migrate --noinput` declared as the Railway pre-deploy command for the Django service.  
Backwards compatibility| Each migration must be safe to run while the previous app version is still serving — additive changes first, destructive changes in a later deploy after code stops using the column.  
CI check| CI runs `makemigrations --check --dry-run`; the build fails if a model change has no corresponding migration committed.  
  
06

## Backend Architecture — Django

6.1Django Apps

Five Django apps, each owning a clear slice of the domain. Apps depend downward only — `sessions` may import from `courses` and `accounts`, but never the reverse.

App| Owns| Key Classes| May Import  
---|---|---|---  
`accounts`| Schools, users, auth, password flows| simplejwt config, /auth views, permission classes, password utilities| — (base)  
`courses`| Course briefs, enrollment| CourseViewSet, EnrollmentViewSet| accounts  
`agent`| Anthropic integration, prompts, parsing| AgentClient, prompt builders, parsers, validators| — (base, pure)  
`sessions`| Orchestration, context, lessons, assessments| SessionOrchestrator, ContextAssembler, SessionStreamView| accounts, courses, agent  
`common`| Shared utilities| Error envelope, pagination, structured logger| — (base)  
  
**Why`agent` is a Pure App**The `agent` app imports nothing from `accounts`, `courses`, or `sessions`. It receives plain data structures (a context dict) and returns plain data structures (a parsed Lesson object). It has no knowledge of Django models. This makes the AI integration independently testable — prompts can be exercised against fixture contexts with no database — and replaceable without touching domain logic.

6.2The Async Model

Django runs under ASGI. Most endpoints are ordinary synchronous DRF views — they are fast database reads and writes. Exactly one class of endpoint is async: session generation, because it holds a connection open for the duration of an Anthropic stream.

Endpoint Class| View Type| Reason  
---|---|---  
Account, course, enrollment, progress, assessment-answer| Sync DRF ViewSet| Sub-100ms database operations. Async adds complexity with no benefit.  
Session generation (`POST /enrollments/{id}/sessions`)| Async view, StreamingHttpResponse| Holds an Anthropic stream for 15–30s. Must not occupy a worker thread for that duration.  
  
**Async/Sync ORM Discipline** Inside the async session view, every database operation uses the async ORM (`await Model.objects.aget(...)`, `await obj.asave()`) or is wrapped in `sync_to_async`. A single synchronous ORM call inside the async view raises `SynchronousOnlyOperation` at runtime. The orchestrator exposes async methods only; its sync callers (none in MVP) would wrap it, not the reverse.

6.3Settings & Environment

Settings are environment-driven. `settings.py` reads every deployment-specific value from the environment with no hardcoded fallbacks for secrets. Configuration differs only by environment variables — never by code branches.

Variable| Purpose| Example / Note  
---|---|---  
`DJANGO_SECRET_KEY`| Django cryptographic signing| Distinct per environment  
`DATABASE_URL`| PostgreSQL connection (psycopg3)| Injected by Railway; private network host  
`ANTHROPIC_API_KEY`| Anthropic authentication| Separate keys for staging vs production  
`ANTHROPIC_MODEL_VERSION`| Model identifier for all agent calls| Changeable without a code deploy (FSD AGENT-03)  
`JWT_SIGNING_KEY`| simplejwt token signing (may reuse DJANGO_SECRET_KEY)| —  
`JWT_ACCESS_LIFETIME` / `JWT_REFRESH_LIFETIME`| Token lifetimes| e.g. 30 min / 7 days  
`EMAIL_HOST` / `EMAIL_*`| SMTP backend for welcome & password-reset mail| —  
`CORS_ALLOWED_ORIGINS`| The Next.js service URL — the only allowed origin| Exact match, no wildcards  
`ALLOWED_HOSTS`| Django host header allowlist| The Django service domain  
`AGENT_TIMEOUT_SECONDS`| Hard ceiling on a generation call (FSD AGENT-07)| Default 30  
`LOG_LEVEL`| Structured log verbosity| INFO in production  
  
**The "No User-Facing HTML" Rule** Per FSD Section 5.2, Django serves no HTML to end users — every role UI is Next.js. The Django admin is the one deliberate exception: it stays enabled for internal data inspection, which means `django.contrib.staticfiles` and a minimal `TEMPLATES` backend remain configured, because the admin needs them to render. Templates are configured through the `TEMPLATES` setting, not `INSTALLED_APPS`. The admin is never exposed publicly — it is reachable only over Railway's private network or behind a protected path.

07

## API Contract

This is the contract for boundary B2 — every call the Next.js frontend makes to the Django API. It is the most important interface in the system. Both sides are bound to it: Django serializers produce these shapes, and the zod schemas in `frontend/lib/schemas.ts` validate them on receipt.

7.1Conventions

Aspect| Rule  
---|---  
Base path| All endpoints under `/api/v1/`. The version prefix exists from day one.  
Authentication| Every endpoint except `/auth/login` requires `Authorization: Bearer <access_jwt>`. No other anonymous endpoints.  
Content type| `application/json` for all request and response bodies, except the session SSE stream (`text/event-stream`).  
IDs| All resource IDs are UUIDs, returned as strings.  
Timestamps| ISO 8601 with timezone (UTC), e.g. `2026-05-25T14:30:00Z`.  
Success codes| `200` read/update, `201` create, `202` accepted (stream starting), `204` delete.  
Error envelope| All errors return a consistent JSON shape (Section 14.1). Never a bare string or HTML.  
Pagination| List endpoints return `{ results: [], count, next, previous }`. Page size 25.  
  
7.2Identity & Auth

POST/api/v1/auth/loginPublic

Accepts email and password, verifies against the stored hash, returns an access and refresh token (FSD AUTH-03). Invalid credentials or a deactivated account return `401` with a generic message that never reveals whether the email exists.

Request
    
    
    { "email": "amara@school.edu", "password": "..." }

Response 200
    
    
    { "access": "<jwt>", "refresh": "<jwt>",
      "force_password_change": false }

POST/api/v1/auth/refreshValid refresh token

Exchanges a valid refresh token for a fresh access token (FSD AUTH-04). An invalid or expired refresh token returns `401`, forcing re-login.

Request
    
    
    { "refresh": "<jwt>" }

Response 200
    
    
    { "access": "<jwt>" }

POST/api/v1/auth/change-passwordAny authenticated

Sets a new password and clears the `force_password_change` flag (FSD ACC-02). Required as the first action for any account created with a temporary password — the API rejects other requests from such a user with a code the frontend redirects on.

GET/api/v1/meAny authenticated

Returns the current user's Paideia profile, resolved from the access token's user_id claim. The frontend calls this once after login to determine which role interface to route into. The user always already exists in the database — there is no lazy creation.

Response 200
    
    
    {
      "id": "uuid",
      "name": "Amara Okafor",
      "email": "amara@school.edu",
      "role": "student",
      "school": { "id": "uuid", "name": "Lagos Model Secondary" },
      "is_active": true
    }

7.3Account Management

POST/api/v1/admin/usersAdmin only

Creates a teacher or student. Writes the User row with role and school set, generates a temporary password, sets `force_password_change=True`, and sends the welcome email via the configured email backend (FSD ACC-01).

Request
    
    
    { "name": "John Bello", "email": "john@school.edu", "role": "teacher" }

Response 201
    
    
    { "id": "uuid", "name": "John Bello", "email": "john@school.edu",
      "role": "teacher", "is_active": true }

GET/api/v1/admin/usersAdmin only

Paginated list of all users in the admin's school with status (FSD ACC-04). Optional `?role=` and `?status=` filters.

PATCH/api/v1/admin/users/{id}/deactivateAdmin only

Deactivates a user by setting `is_active=false` (FSD ACC-03). A deactivated user can no longer log in or refresh tokens. If the target is a teacher, the response includes their active courses so the admin UI can prompt for reassignment (FSD ACC-05). Courses are not modified by this call.

Response 200
    
    
    { "id": "uuid", "is_active": false,
      "affected_courses": [
        { "id": "uuid", "title": "Biology Year 10", "enrolled_count": 28 }
      ] }

POST/api/v1/admin/courses/{id}/reassignAdmin only

Reassigns a course to a different active teacher (FSD ACC-06). The only operation that can change `teacher_id` on an active course. The new teacher immediately gains progress and enrollment access.

Request
    
    
    { "new_teacher_id": "uuid" }

7.4Courses

POST/api/v1/coursesTeacher

Creates a course brief. Created as `draft`. `teacher_id` is set to the requesting teacher — it cannot be set to anyone else (FSD BRIEF-07).

Request
    
    
    {
      "title": "Biology — Year 10, Term 2",
      "subject": "Biology",
      "target_level": "Year 10 / Age 14-15",
      "learning_outcomes": "Students will be able to ...",
      "topic_sequence": "1. Cell biology  2. Genetics  3. Evolution ...",
      "exam_context": "WAEC Biology — past topics include ...",
      "special_instructions": "Do not cover evolution — teacher-led only.",
      "approximate_lessons": 40
    }

Response 201
    
    
    { "id": "uuid", "status": "draft", ...all fields,
      "teacher": { "id": "uuid", "name": "John Bello" } }

GET/api/v1/coursesTeacher / Admin

Teachers see only their own courses. Admins see all courses in the school. Scoping is enforced by the `IsCourseOwner` queryset filter, not by a request parameter (FSD PROG-01).

PATCH/api/v1/courses/{id}Course owner

Edits brief fields (FSD BRIEF-03). Any subset of editable fields. `teacher_id` and `status` are rejected here — they have dedicated endpoints. The response includes `has_active_sessions` so the frontend knows whether to have shown the edit warning.

POST/api/v1/courses/{id}/activateCourse owner

Transitions `draft → active`. Rejects with `422` if required fields fail minimum-length validation (FSD BRIEF-01).

POST/api/v1/courses/{id}/archiveCourse owner / Admin

Transitions `active → archived` (FSD BRIEF-05). Course owner or any admin in the school. No new sessions or enrollments after this; history preserved.

7.5Enrollment

POST/api/v1/courses/{id}/enrollmentsCourse owner / Admin

Enrolls one or more students into the course (FSD ENROL-01/03). Teacher must own the course; admin may enroll into any course. Re-enrolling a previously unenrolled student reactivates the existing record (FSD ENROL-05).

Request
    
    
    { "student_ids": ["uuid", "uuid", "uuid"] }

Response 201
    
    
    { "enrolled": 3, "reactivated": 1, "already_enrolled": 0 }

GET/api/v1/courses/{id}/enrollmentsCourse owner / Admin

Course roster — active enrollments with student name and session count.

DELETE/api/v1/enrollments/{id}Course owner / Admin

Unenrolls a student (FSD ENROL-02). Sets enrollment `status=unenrolled`. Session history is retained — this is a soft delete, not a row deletion.

7.6Sessions — The Core Endpoints

These endpoints drive the core loop. The first is the only streaming endpoint in the system.

POST/api/v1/enrollments/{id}/sessionsStudent (own enrollment)

Starts or resumes a session. This is an SSE endpoint — it responds with `text/event-stream`, not JSON. If a non-complete session already exists it is resumed (the stored lesson is replayed, not regenerated, FSD SESS-01). Otherwise a new session is created and the lesson is generated and streamed token by token (FSD SESS-02). The assessment is generated concurrently server-side.

Response — SSE event sequence
    
    
    # Each line is one SSE message: "data: {json}\n\n"
    data: { "event": "session_started", "session_id": "uuid",
            "session_number": 8, "resumed": false }
    
    data: { "event": "lesson_meta", "lesson_title": "Osmosis",
            "key_concepts": ["osmosis","gradient","membrane"],
            "estimated_read_minutes": 6, "context_line": "Session 8 of ~40" }
    
    data: { "event": "token", "text": "## What is " }
    data: { "event": "token", "text": "Osmosis?\n\n" }
    # ... many token events ...
    
    data: { "event": "lesson_complete", "session_id": "uuid",
            "blocks_url": "/api/v1/sessions/uuid/lesson" }
    
    data: { "event": "assessment_ready", "session_id": "uuid" }
    
    data: { "event": "done" }

Error during stream
    
    
    data: { "event": "error", "code": "agent_failure",
            "message": "Lesson generation failed. Please try again." }
    # On this event the client returns the student to the course home.
    # The session row has been deleted server-side (FSD SESS-03).

Student streams own lesson

**Why`token` events stream raw markdown, but `blocks` are fetched separately**During streaming, the agent emits the lesson as text — the frontend renders it progressively as raw markdown for the live "building" effect. Once `lesson_complete` fires, the server has parsed the full response into the structured block array (text / interactive / callout). The client then fetches the parsed blocks via `GET /sessions/{id}/lesson` and swaps the streamed view for the fully rendered block view, including interactive iframes. This two-stage approach gives both the live feel and the structured final render (FSD REND-04).

GET/api/v1/sessions/{id}/lessonSession's student / Course owner

Returns the parsed, structured lesson — the block array the Rendering Engine consumes. Also used for re-reading past lessons (FSD PROG-05) and teacher diagnostic review (FSD PROG-03).

Response 200
    
    
    {
      "lesson_title": "Osmosis and Diffusion",
      "key_concepts": ["osmosis", "concentration gradient", "membrane"],
      "estimated_read_minutes": 6,
      "has_interactive": true,
      "blocks": [
        { "type": "text", "content": "## What is Osmosis?\n\n..." },
        { "type": "interactive", "description": "Gradient simulation",
          "height": 380, "html": "<!DOCTYPE html>..." },
        { "type": "callout", "variant": "definition", "content": "..." }
      ]
    }

GET/api/v1/sessions/{id}/assessmentSession's student

Returns the assessment questions for the session. Correct answers and explanations are NOT included in this response — they are withheld until each answer is submitted (FSD ASMT-04). Returns `409` if the assessment could not be generated after the mandated retry (FSD AGENT-06); the client then shows the "assessment unavailable" state.

Response 200
    
    
    {
      "assessment_id": "uuid",
      "questions": [
        { "index": 0, "question_text": "...", "concept_tag": "osmosis",
          "options": [ {"id":"A","text":"..."}, {"id":"B","text":"..."},
                       {"id":"C","text":"..."}, {"id":"D","text":"..."} ] }
      ]
    }

POST/api/v1/sessions/{id}/responsesSession's student

Submits one answer. Posted immediately on each confirmation, never batched (FSD REND-06). The response reveals correctness and explanations for that question only. Submitting the final question's answer triggers session completion: the orchestrator writes the immutable history record and sets `status=complete` (FSD SESS-05).

Request
    
    
    { "question_index": 0, "selected_option": "B" }

Response 200
    
    
    {
      "question_index": 0,
      "is_correct": false,
      "correct_option_id": "A",
      "correct_explanation": "Osmosis specifically refers to water ...",
      "wrong_explanation": "Option B describes diffusion of solutes ...",
      "session_complete": false,
      "session_summary": null
    }
    # On the final question, session_complete=true and session_summary
    # carries score, outcome, and per-concept correctness.

7.7Progress

GET/api/v1/courses/{id}/progressCourse owner / Admin

The teacher progress table (FSD PROG-01) — one row per enrolled student with session count, last session date, and most recent outcome. Returns `404` if the requesting teacher does not own the course — the course is outside their visible scope (FSD AC-13, PROG-03; see §14.1).

GET/api/v1/enrollments/{id}/historyEnrollment's student / Course owner / Admin

Ordered session history for one enrollment (FSD PROG-02, PROG-05). Student sees their own; teacher sees it for their own courses only.

GET/api/v1/students/me/coursesStudent

The student home screen (FSD PROG-04) — enrolled active courses with session counter and last session date.

08

## Authentication & Authorization

Authentication answers "who is this request from" and authorization answers "may they do this" — both owned by Django. simplejwt handles the first; DRF permission classes handle the second. They are separate concerns in separate code, but no longer separate systems.

8.1The Token Flow

Authentication Flow — Login to Authorized Request

1User submits email + password to `POST /auth/login` (boundary B2). Django verifies against the stored hash and returns an access token and a refresh token.

2Next.js stores the tokens and attaches the access token as `Authorization: Bearer ...` on every subsequent call to the Django API (boundary B2).

3simplejwt's `JWTAuthentication` (DRF default auth class) verifies the token's signature and expiry locally — no database hit for the auth check itself.

4The token's `user_id` claim resolves `request.user` to the existing User row. The user always already exists — accounts are admin-created (FSD ACC-01), so there is no lazy creation.

5DRF permission classes run against `request.user.role` and the target object's `school_id` / `teacher_id`. The view executes only if all pass.

6When the access token expires, the client silently calls `POST /auth/refresh` with the refresh token to obtain a new access token, without forcing the user to log in again.

8.2Permission Classes

Authorization is expressed entirely through DRF permission classes — never as inline `if` checks in view bodies. Four classes cover the whole system.

Class| Grants when| Applied to  
---|---|---  
`IsAdmin`| `user.role == 'admin'`| All `/admin/*` endpoints  
`IsTeacher`| `user.role == 'teacher'`| Course creation  
`IsSameSchool`| `obj.school_id == user.school_id`| Every object-level access — universal guard (FSD AUTH-05)  
`IsCourseOwnerOrAdmin`| `course.teacher_id == user.id` OR `user.role == 'admin'`| Course edit, enrollment, progress (FSD PROG-01, ENROL-03)  
  
**Queryset Scoping, Not Just Object Permission** Object-level permissions block access to a known object. But a list endpoint must never even return objects the user cannot see. Every list viewset overrides `get_queryset()` to filter to the user's school, and for teachers, to their own courses. A teacher requesting `GET /courses` receives a queryset already filtered to `teacher_id = self` — the permission class is the second line of defence, not the first.

8.3Frontend Route Protection

Next.js mirrors the authorization model at the routing layer. This is a UX guard — the API is the real enforcement — but it prevents a student ever seeing an admin screen shell.

Route group| Guard  
---|---  
`(auth)/*`| Public. The Paideia-styled sign-in page (and password-change / reset screens).  
`admin/*`| Layout checks `role === 'admin'` from `/me`; redirects otherwise.  
`teacher/*`| Layout checks `role === 'teacher'`.  
`student/*`| Layout checks `role === 'student'`.  
  
The Next.js middleware (`middleware.ts`) protects all non-auth routes — a request with no stored access token is redirected to `/sign-in` before any layout runs. Role is read from the token (or `/me`) at the layout level.

09

## AI Agent Integration Layer

The `agent` app is the boundary B3 implementation. It is a pure module — given a context dictionary, it returns a validated `Lesson` or `Assessment` object. It knows nothing of Django models, HTTP, or sessions.

9.1Internal Structure

File| Responsibility  
---|---  
`client.py`| Wraps `AsyncAnthropic`. Exposes `stream_lesson(context)` (async generator of text) and `generate_assessment(lesson)` (async, returns parsed object). Reads `ANTHROPIC_MODEL_VERSION` and `AGENT_TIMEOUT_SECONDS` from settings.  
`prompts.py`| Versioned prompt templates. Each template has a version string logged with every call. Prompt changes are version bumps.  
`parsers.py`| Extracts `<plan>`, `<blocks>`, `<meta>` tags from the raw lesson response. Parses the assessment JSON. Pure string functions.  
`validators.py`| Validates parsed output against pydantic schemas. Validates interactive-block HTML (complete document, no disallowed calls, ≤15k chars, CDN whitelist) per FSD AGENT-05.  
`schemas.py`| Pydantic models — `Lesson`, `TextBlock`, `InteractiveBlock`, `CalloutBlock`, `Assessment`, `Question`. The single source of truth for output shape.  
  
9.2Lesson Generation — Internal Sequence

agent.stream_lesson(context) — Internal Flow

1`prompts.build_lesson_prompt(context)` assembles the system prompt from the context dict (course brief + summarised history).

2`client` opens `AsyncAnthropic.messages.stream(...)` with the configured model. An `asyncio.wait_for` wraps it at `AGENT_TIMEOUT_SECONDS`.

3Each text delta is yielded upward to the caller (the orchestrator) AND accumulated into a full-response buffer.

4On stream end, `parsers.parse_lesson(buffer)` extracts the three tag sections.

5`validators.validate_lesson(...)` checks against the pydantic `Lesson` schema. Each interactive block's HTML is validated; a failing block is replaced with a text fallback block, not rejected wholesale (FSD AGENT-05).

6A validated `Lesson` object is returned to the orchestrator alongside the raw response and the plan text for storage.

**Parse Failure Handling** If step 4 or 5 fails — the model returned output that cannot be parsed into valid blocks — the agent raises `AgentParseError`. The orchestrator catches it, treats it identically to an API failure (delete the session, emit the SSE `error` event), and logs the full raw response for prompt debugging. A lesson is never delivered from an unparseable response (FSD AGENT-04).

9.3Concurrent Assessment Generation

The assessment call runs concurrently with lesson streaming so it is ready by the time the student finishes reading (FSD ASMT-01). The orchestrator dispatches it as an `asyncio` task at the moment lesson streaming begins.

orchestrator.py — concurrent dispatch (simplified)
    
    
    async def run_generation(session, context):
        # Assessment depends on the finished lesson, so it is dispatched
        # as a task that internally awaits the lesson result.
        lesson_holder = {}
    
        async def assessment_task():
            lesson = await lesson_ready.wait_and_get()
            # FSD AGENT-06: a malformed response triggers exactly one retry.
            # 'unavailable' only after a second consecutive failure.
            for attempt in (1, 2):
                try:
                    assessment = await agent.generate_assessment(lesson)
                    await store_assessment(session, assessment)
                    return
                except (AgentError, AgentParseError):
                    if attempt == 2:
                        await mark_assessment_unavailable(session)  # FSD AGENT-06
                    # attempt 1 falls through to the retry
    
        task = asyncio.create_task(assessment_task())
    
        # stream the lesson — yields tokens to the SSE response
        async for token in agent.stream_lesson(context):
            yield token
        lesson = await finalize_and_store_lesson(session, ...)
        lesson_ready.set(lesson)        # unblocks assessment_task
    
        await task                       # ensure assessment finishes before 'done'

**Failure Isolation** The assessment task has its own try/except. An assessment failure never aborts the lesson — the student still receives a complete lesson and simply sees the "assessment unavailable" state. Conversely, a lesson failure happens before the assessment can use the lesson, so the assessment task is cancelled cleanly. The two failure domains do not contaminate each other.

10

## Streaming Pipeline

The streaming pipeline is the most technically intricate path in the system. It connects four components across three boundaries: the browser's `fetch()` stream reader, the Django async view, the agent's Anthropic stream, and the PostgreSQL writes — all within a single long-lived HTTP response.

10.1End-to-End Pipeline

Lesson Streaming — Full Pipeline

fetch() reader (browser)

→

Next.js route

→

Django async view

↓ view delegates to orchestrator.run_generation()

SessionOrchestrator

→

agent.stream_lesson()

→

Anthropic stream

↓ each token flows back up and out as an SSE 'token' event

Anthropic

→ token →

agent

→

orchestrator

→

SSE → browser

↓ on stream end

parse + validate

→

store lesson

→

SSE 'lesson_complete'

10.2Step Sequence

POST /enrollments/{id}/sessions — Step by Step

1Async view authenticates the request and loads the enrollment with `await ...aget()`. Verifies the requesting student owns the enrollment.

2Orchestrator checks for an existing non-complete session. **If found** → emit `session_started (resumed:true)`, replay the stored lesson, skip generation. **If not** → continue.

3Create the `Session` row with `status=generating`. Emit `session_started`.

4`ContextAssembler` reads the course brief and the summarised `session_history` for this enrollment, builds the context dict.

5Dispatch the concurrent assessment task (Section 9.3). The `IncrementalLessonParser` begins consuming the raw token stream; once the `<meta>` section is parsed, emit `lesson_meta`.

6Stream lesson content — the parser emits **only clean text-block markdown** as SSE `token` events; the `<plan>` and JSON scaffolding are suppressed and never reach the client. A buffer accumulates the full raw response.

7On stream end: parse + validate the full raw buffer into the block array (Section 9.2). Persist the `Lesson` row including blocks, plan, prompt_context, raw_response. Set `status=active`.

8Emit `lesson_complete` with the `blocks_url`. Await the assessment task. Emit `assessment_ready` (or the unavailable state). Emit `done`. Close the stream. The session stays `active` while the student reads.

9When the student starts the assessment — first question fetch or first answer POST — the orchestrator transitions the session to `assessing` (FSD SESS-04). A browser close in this state makes the session `abandoned` and resumable.

10On the final answer, the orchestrator writes the immutable history row and sets `status=complete` (FSD SESS-05).

10.3Pipeline Hazards & Mitigations

Hazard| Mitigation  
---|---  
Proxy buffers the stream — student sees nothing then everything at once| `X-Accel-Buffering: no` and `Cache-Control: no-cache` headers on the StreamingHttpResponse. Confirmed against Railway's proxy during the first deploy.  
Client disconnects mid-stream (closes tab)| The async generator detects the broken connection on the next yield. Generation continues to completion server-side so the lesson is still stored — the resumed session (step 2) will replay it. No orphaned `generating` rows.  
Anthropic call exceeds timeout| `asyncio.wait_for` at `AGENT_TIMEOUT_SECONDS` raises `TimeoutError` → treated as agent failure → session deleted, `error` event emitted (FSD AGENT-07).  
Database write fails after a successful generation| The lesson is not delivered. `error` event emitted, session deleted. Generation is idempotent on retry — a fresh session starts clean (FSD AGENT-08).  
Two rapid session-start requests (double-click)| Step 2's existing-session check plus the `ux_sess_enroll_number` unique constraint. The second request resumes the first's session rather than creating a duplicate.  
Worker restart mid-stream| Stream dies; client receives connection close without `done`. Client treats absence of `done` as failure and returns to course home. The half-written session is a stale `generating` row, swept by the daily cleanup task — which sweeps both stale `generating` and old `abandoned` rows (FSD SESS-06).  
  
11

## Frontend Architecture — Next.js

Next.js App Router. Three role-scoped route groups, a typed API client wrapping boundary B2, and the Rendering Engine (Section 12). The frontend holds no business logic — it renders state and calls the API.

11.1The Typed API Client

`lib/api.ts` is the single place the frontend talks to Django. No component calls `fetch` directly. The client attaches the stored access token as a Bearer header, transparently refreshes it via `/auth/refresh` on a `401`, sends and receives JSON, and validates every response against a zod schema from `lib/schemas.ts` before returning it.

**Zod as the Contract Mirror** The zod schemas in `lib/schemas.ts` are the frontend's copy of the API contract from Section 7. When the API client validates a response, it is asserting the contract held. A backend change that alters a response shape without a matching zod update fails loudly at the first call in development — not silently three components deep. This is how the monorepo's "change both sides together" rule is enforced in practice.

11.2The Stream Client

`lib/stream.ts` handles the one streaming endpoint. It cannot use the browser `EventSource` API — `EventSource` is GET-only and exposes no way to set an HTTP method or body, while the session endpoint is a state-creating `POST`. Instead it issues a `fetch()` with the Bearer JWT and reads the response body as a `ReadableStream`, decoding the SSE-formatted frames itself. It exposes a typed event stream so the student lesson page reacts to each event from Section 7.6 — `session_started`, `lesson_meta`, `token`, `lesson_complete`, `assessment_ready`, `error`, `done` — without parsing raw frames.

**Why fetch + ReadableStream, not EventSource** The session endpoint is `POST /enrollments/{id}/sessions` — correct REST for an action that creates a session. `EventSource` can only issue GET requests, so it cannot open this endpoint at all. The `fetch()` \+ `ReadableStream` reader pattern supports POST, custom headers (the Bearer JWT), and the same incremental consumption EventSource would give. It is the standard approach for an authenticated, body-carrying server stream.

Stream event| Frontend reaction  
---|---  
`session_started`| Show the lesson shell. If `resumed`, skip straight to fetching stored blocks.  
`lesson_meta`| Render the lesson header — title, read time, key-concepts preview, context line (FSD REND-03, PROG-06).  
`token`| Append clean text-block markdown to the live buffer; render progressively. Only text streams live — interactive blocks arrive via the block fetch on completion (FSD REND-04).  
`lesson_complete`| Fetch `GET /sessions/{id}/lesson`; swap the streamed markdown for the structured block render, including interactive iframes.  
`assessment_ready`| Enable the "Start Assessment" button.  
`error`| Show the error state; route back to course home (FSD AC-09).  
`done`| Release the stream reader. Streaming complete.  
  
11.3State Management

No global state library. State is local and scoped: React component state for UI, a lightweight auth context holding the current user and tokens, and server-fetched data held in the component that needs it. The assessment engine is the only component with non-trivial state — a state machine (Section 12.4) implemented with `useReducer`. Tokens are held in memory with the refresh token in an `HttpOnly` cookie where the deployment allows; no lesson or assessment data uses browser storage.

12

## Rendering Engine — Implementation

The Rendering Engine (FSD Module M8) consumes the structured lesson block array from `GET /sessions/{id}/lesson` and produces the student's lesson experience. It is three renderers behind one block router. This section specifies their implementation and how they interface with the lesson data.

12.1Block Router

`LessonRenderer.tsx` receives `blocks: LessonBlock[]` and maps each to its renderer by `type`. Unknown types are skipped silently (FSD REND-01) — this keeps the frontend forward-compatible with future block types a newer prompt version might emit.

Block `type`| Renderer Component| Mechanism  
---|---|---  
`text`| `TextBlock.tsx`| react-markdown + remark/rehype plugin chain  
`callout`| `CalloutBlock.tsx`| Styled container by `variant`, markdown body  
`interactive`| `InteractiveBlock.tsx`| Sandboxed `iframe` via `srcDoc`  
_unknown_|  —| Returns `null`, logged client-side  
  
12.2Renderer 1 — Text & Callout

Markdown is rendered with a fixed plugin chain: `remark-math` \+ `rehype-katex` (equations for maths, physics, chemistry), `rehype-highlight` (code blocks for CS), `remark-gfm` (tables, lists). KaTeX CSS is loaded globally in the root layout — never lazily — so the first equation in a lesson renders without a flash of unstyled math (FSD REND-07). Callout blocks wrap the same markdown renderer in a variant-styled container (definition / note / example / warning).

12.3Renderer 2 — Interactive Sandbox

The interactive block's `html` string is injected into an `iframe` via `srcDoc` with `sandbox="allow-scripts"` and no `allow-same-origin`. The iframe is a sealed execution environment with no access to the parent page, cookies, or any other student's data. This is the exact mechanism specified in FSD Section 13.4.

Attribute| Value| Effect  
---|---|---  
`srcDoc`| The block's `html` string| Renders the self-contained document  
`sandbox`| `allow-scripts`| JS runs; everything else denied  
_omitted_| `allow-same-origin`| Iframe cannot reach the parent — the key security property  
CSP meta tag| Injected into the HTML string at server-side validation| A real `<meta http-equiv="Content-Security-Policy">` restricting script-src to the CDN whitelist. The non-standard iframe `csp` attribute is NOT used — it is not implemented in shipping browsers.  
postMessage handshake| Generated HTML posts `paideia:ready` on init| Parent shows the text fallback if no handshake arrives within 4s. Replaces `onError`, which does not fire for srcDoc content.  
  
**Two Mechanisms the Naive Design Got Wrong** An earlier draft listed an iframe `csp` attribute and an `onError` fallback. Neither works: the iframe `csp` attribute came from a never-standardised proposal and no shipping browser implements it; and `onError` does not fire for `srcDoc` content — there is no network load to fail, and JS errors inside a sandbox do not cross to the parent. The corrected mechanisms are an injected CSP `<meta>` tag (real, travels with the stored HTML) and a `postMessage` readiness handshake with a 4-second timeout. Both are reflected in the FSD InteractiveBlock implementation.

**Three-Layer Trust** The iframe sandbox is the runtime guarantee — even hostile generated JS cannot escape it. Server-side HTML validation (Section 9.2, FSD AGENT-05) is the storage-time guarantee — malformed or oversized blocks never reach the database. The postMessage handshake is the third layer: a block that stores cleanly but fails to initialise in the browser still degrades to a text fallback rather than showing broken, because the absence of a `paideia:ready` message within the timeout triggers the fallback.

12.4Renderer 3 — Assessment Engine

`AssessmentEngine.tsx` is a `useReducer` state machine. It is not a renderer of AI output — it is a structured UI driven by the assessment data from `GET /sessions/{id}/assessment` and writing to `POST /sessions/{id}/responses`.

State| Renders| Transition  
---|---|---  
`IDLE`| "Start Assessment" button| → `ANSWERING` on click  
`ANSWERING`| Question N, four options, Confirm button| → `REVEALED` on confirm — posts the answer immediately (FSD REND-06)  
`REVEALED`| Correct/incorrect, explanations| → `ANSWERING` (next) or → `COMPLETE` (last)  
`COMPLETE`| Session summary — score, per-concept breakdown| Terminal  
  
Each answer is POSTed on confirmation, and the API response carries the correctness reveal. Because answers are never batched, a browser close after question 2 of 4 leaves those two answers persisted server-side; on return the resumed session restores the engine to question 3 (FSD SESS-04, REND-06).

12.5Rendering Engine Data Interface

The Rendering Engine's entire input is the lesson block array and the assessment object. It interfaces with the rest of the system through exactly two API responses — it has no other dependency.

Input| Source| Consumed by  
---|---|---  
Lesson block array| `GET /sessions/{id}/lesson`| LessonRenderer → three renderers  
Live token stream| SSE `token` events| Progressive markdown view (pre-block-swap)  
Assessment questions| `GET /sessions/{id}/assessment`| AssessmentEngine  
Answer reveal| `POST /sessions/{id}/responses` response| AssessmentEngine `REVEALED` state  
  
13

## Interface Contracts

This section makes the governing principle concrete. Each of the four boundaries from Section 1.1 is specified as a contract: what crosses it, in what shape, how errors propagate, and what each side may assume. If a behaviour is not in the contract, it is undefined.

B1Browser ↔ Next.jsHTTPS · streamed fetch

Transport

HTTPS for pages and route handlers. A `fetch()` streaming response (consumed via a `ReadableStream` reader) over HTTPS for the lesson stream.

Crosses

Rendered React pages; the typed stream events proxied from B2.

Auth

The access token is held client-side and sent on B2 calls. The login screen and token storage are Paideia-built — no external auth widget.

Errors

Page-level error boundaries. A failed stream surfaces as the stream `error` event, not an HTTP error.

Assumptions

Browser supports the `fetch()` streaming response body (`ReadableStream`) and sandboxed iframes — both covered by the FSD's supported-browser list.

B2Next.js ↔ Django APIREST + stream · Bearer JWT

Transport

HTTPS. JSON for all endpoints except session generation, which is `text/event-stream`.

Crosses

The full API Contract — Section 7 — including the `/auth` endpoints that issue and refresh Django JWTs.

Auth

`Authorization: Bearer <access_jwt>` on every request except `/auth/login`. Missing/invalid/expired → `401`.

Errors

Consistent error envelope (Section 14.1). Frontend validates every response with zod; a contract mismatch throws in development.

Versioning

`/api/v1/` prefix. A breaking change is a new version prefix, never a silent shape change.

Assumptions

Django verifies the JWT signature locally (no external call). Next.js assumes any `2xx` body matches its zod schema.

B3Django ↔ AnthropicAnthropic SDK

Transport

HTTPS via `AsyncAnthropic`. Streaming for lessons; non-streaming for assessments.

Crosses

**Out:** system prompt + context. **In:** token stream (lesson) / completion (assessment).

Contract shape

Output shape is defined by the prompt and enforced by pydantic validation (Section 9.2). The model is told the exact tag and JSON structure to return.

Errors

API error, timeout, or unparseable output → `AgentError`/`AgentParseError` → session deleted, SSE `error` event. The full raw response is logged.

Assumptions

The agent app assumes nothing about model internals — only that the prompt contract produces parseable output most of the time, and that the failure path is safe when it does not.

B4Django ↔ PostgreSQLpsycopg3 async

Transport

TCP over Railway private networking. `psycopg` v3, async-capable.

Crosses

All persistence. Sync ORM from sync views; async ORM (`aget`/`asave`) from the session view.

Contract shape

The schema in Section 5.1. Constraints (unique, FK, cascade) are enforced by the database, not only by application code.

Errors

A constraint violation surfaces as an integrity error → mapped to `409` or `422` by the error layer. A connection failure → `503`.

Assumptions

No code path issues a synchronous ORM call inside the async view. Migrations have run before the app version serves traffic (Section 5.2).

14

## Error Handling

Errors are handled consistently across every boundary. A failure anywhere produces a predictable shape, is logged with enough context to diagnose, and degrades the user experience gracefully rather than breaking it.

14.1The Error Envelope

Every non-streaming error response from the Django API uses one shape. Never a bare string, never raw HTML, never a stack trace. Implemented as a DRF custom exception handler in `common/`.

Standard Error Envelope — all non-2xx JSON responses
    
    
    {
      "error": {
        "code": "course_not_active",        // stable machine-readable string
        "message": "This course is not active and cannot be enrolled into.",
        "detail": { "course_id": "uuid" }   // optional structured context
      }
    }

HTTP| Used for| Example `code`  
---|---|---  
`400`| Malformed request body| `invalid_request`  
`401`| Missing / invalid / expired JWT| `unauthenticated`  
`403`| Authenticated but not permitted to perform this action on a visible resource| `forbidden_action`  
`404`| Resource absent or not in user's scope| `not_found`  
`409`| State conflict| `assessment_unavailable`  
`422`| Valid JSON, failed business validation| `brief_incomplete`  
`502`| Upstream failure — Anthropic| `agent_failure`  
`503`| Database unreachable| `service_unavailable`  
  
**404 over 403 for Out-of-Scope Resources** When a teacher requests a course belonging to another teacher, the API returns `404`, not `403` — the queryset scoping (Section 8.2) means the object is simply not in their visible set, and returning `404` avoids confirming the resource exists. `403` is reserved for an explicitly forbidden action on a resource the user _can_ see. The FSD agrees: AC-13 and PROG-03 were updated to expect `404` for cross-course reads, so the two documents are consistent — a teacher probing another teacher's course endpoints receives `404` across the board.

14.2Streaming Errors

The SSE endpoint cannot use HTTP error codes once the `200` stream has opened. Errors after stream open are delivered as an SSE `error` event (Section 7.6). The client treats receipt of `error` — or a stream that closes without `done` — identically: show the error state, return to course home, do not increment session count.

14.3Failure Matrix

Failure| Detected by| System response| User sees  
---|---|---|---  
Anthropic API down / errors| agent `client.py`| Session deleted; failure logged with context| SSE `error` → course home; can retry  
Anthropic timeout (>30s)| `asyncio.wait_for`| Same as API failure| Same as above  
Unparseable lesson output| `parsers`/`validators`| Session deleted; raw response logged| Same as above  
One interactive block invalid| `validators`| Block replaced with text fallback; lesson delivered| Complete lesson, fallback in place of one visual  
Assessment generation fails| assessment task| Session marked assessment-unavailable; lesson unaffected| Lesson normal; "assessment unavailable" state  
DB write fails post-generation| ORM error| Session deleted; logged| SSE `error` → course home  
Invalid login credentials| `accounts` /auth/login| No token issued; generic 401 (does not reveal whether email exists)| User sees "email or password incorrect"  
Client disconnects mid-stream| async generator| Generation completes; lesson stored for resume| On return: lesson resumed, not regenerated  
  
15

## Security Architecture

Security is layered across every boundary. No single control is load-bearing alone. The model assumes any one layer can fail and the next still holds.

Layer| Control| Protects against  
---|---|---  
Transport| HTTPS/TLS 1.2+ on all boundaries; HTTP redirected| Interception, tampering in transit  
Identity| Django-issued short-lived JWTs (simplejwt); signature verified server-side every request| Forged or stale identity  
Authorization| DRF permission classes + queryset scoping (Section 8)| Privilege escalation, cross-school and cross-course access  
Input| DRF serializer validation; pydantic for agent output| Malformed input, injection via request body  
CORS| `CORS_ALLOWED_ORIGINS` = the Next.js URL only, exact match| Calls from unauthorized origins  
Generated content| Server-side HTML validation before storage (Section 9.2)| Malformed / oversized / disallowed interactive blocks  
Generated content| iframe `sandbox="allow-scripts"`, no `allow-same-origin`| Generated JS reaching the parent page or other students' data  
Generated content| iframe CSP — script-src limited to CDN whitelist| Generated code loading arbitrary external scripts  
Secrets| All secrets in Railway env vars; never in source or logs| Credential leakage  
Data isolation| Every model school-scoped; `IsSameSchool` universal| One school ever seeing another's data  
Database| Private Railway networking; no public DB endpoint| Direct external database access  
Audit| All AI calls and auth events logged (Section 17)| Undetected misuse; inability to investigate  
  
**Minors & Generated Content**The system serves children and delivers AI-generated content to them. The MVP's defence is the sandbox plus server-side validation — content cannot harm the application or leak data. Content _appropriateness_ (a dedicated moderation layer) is explicitly post-MVP per the FSD. This is a known, accepted MVP limitation: the pilot runs with a small, supervised cohort, and teacher diagnostic review (PROG-03) is the human check until the moderation layer ships.

16

## Deployment

Three Railway services from one GitHub repository. Deployment is push-to-deploy on the main branch, gated by CI.

16.1Services

Service| Root| Build| Run  
---|---|---|---  
Frontend| `frontend/`| `next build`| `next start`  
API| `backend/`| `pip install -r requirements.txt`| `gunicorn paideia.asgi:application -k uvicorn.workers.UvicornWorker`  
Database| —| Railway managed PostgreSQL 16| —  
  
**The Run Command Is Non-Negotiable** The API run command must use the Uvicorn worker class. With the default sync worker the async session view silently runs synchronously, holding a worker for the full 30s generation and collapsing under concurrency. The pre-deploy command for the API service is `python manage.py migrate --noinput` (Section 5.2).

16.2Environments & CI

Two Railway environments: **staging** and **production** , each with its own three services, its own database, and its own Anthropic API key. Production's `ANTHROPIC_MODEL_VERSION` is set independently of staging's, allowing a model to be validated on staging before promotion.

CI runs on every pull request: backend lint + unit tests + `makemigrations --check`; frontend lint + type-check + build. A merge to `main` deploys to staging automatically; promotion to production is a manual action after staging verification.

17

## Observability

For an AI-driven product, logs are the primary tool for understanding content quality, not just uptime. The logging strategy is built around being able to answer "why did this student get this lesson."

Signal| Captured| Purpose  
---|---|---  
AI call log| Per call: timestamp, session_id, enrollment_id, model version, prompt version, prompt + completion token counts, latency, outcome| Cost tracking; the primary content-quality diagnostic (FSD NFR Logging)  
Lesson diagnostics| Stored on the lesson row: `prompt_context`, `agent_plan`, `raw_response`| Exactly reproduce any lesson's generation (FSD AC-11)  
Auth events| Sign-in, account create, deactivate, reassign — actor, target, timestamp| Security audit trail  
Error log| Every error envelope emission + every SSE `error`, with full context| Failure investigation  
Request log| Method, path, status, latency, user role| Performance baseline; anomaly detection  
  
Logs are structured JSON, retained 90 days (FSD), and viewed through the Railway dashboard for MVP. No external observability platform is introduced in this phase.

**The "Why This Lesson" Query** When a teacher reports a poor lesson, an engineer takes the `session_id`, pulls the lesson row's `prompt_context` (the exact course brief state and summarised history at generation time), `agent_plan` (the model's reasoning), and `raw_response`. Together these reconstruct the generation completely — no guesswork. This is why those three fields are stored on every lesson, even though they are never shown to a user.

18

## Key Sequence Flows

Three end-to-end flows traced across every component and boundary they touch. These verify that the components specified above interface correctly to deliver the FSD's core requirements.

18.1Flow A — Student Takes a Lesson

Flow A — Session start to completion

1Student clicks "Continue" on a course. Next.js issues a streaming `fetch()` POST to `/enrollments/{id}/sessions` and reads the response body via a `ReadableStream` reader (B1→B2).

2Django async view verifies the access token locally (simplejwt — no external call), confirms enrollment ownership, hands to `SessionOrchestrator`.

3Orchestrator finds no open session → creates `Session(status=generating)` (B4). `ContextAssembler` reads brief + summarised history (B4).

4Orchestrator dispatches the concurrent assessment task, then calls `agent.stream_lesson(context)` (B3).

5Anthropic tokens flow agent → orchestrator → SSE `token` events → browser. The Rendering Engine shows markdown building live.

6Stream ends. Agent parses + validates → `Lesson` object. Orchestrator persists the lesson (B4), sets `status=active`, emits `lesson_complete`.

7Frontend fetches `GET /sessions/{id}/lesson`, swaps the streamed view for the structured block render — interactive iframes now appear.

8Assessment task has finished; `assessment_ready` \+ `done` emitted. Student reads, clicks "Start Assessment".

9AssessmentEngine fetches questions, posts each answer to `POST /sessions/{id}/responses`, reveals correctness per question.

10Final answer posted → orchestrator writes the immutable `session_history` row, sets `status=complete`, updates `enrollment.last_session_at` (B4). Summary shown.

Touches all four boundaries. Realises FSD SESS-01 through SESS-06, AGENT-01 through AGENT-09, ASMT-*, REND-*.

18.2Flow B — Teacher Creates & Populates a Course

Flow B — Draft to active class

1Teacher logs in via `POST /auth/login` (B2), receives tokens. Next.js calls `GET /me` → role `teacher` → routes into `teacher/*`.

2Teacher fills the brief form. `POST /api/v1/courses` creates a `draft` course with `teacher_id` = self (B2→B4).

3Teacher clicks Activate. `POST /courses/{id}/activate` validates required fields; on pass → `status=active`.

4Teacher opens enrollment, selects students. `POST /courses/{id}/enrollments` — `IsCourseOwnerOrAdmin` confirms ownership, creates/reactivates enrollment rows (B4).

5Students appear on their home screen on next `GET /students/me/courses`. The course is now live.

Realises FSD BRIEF-01/05/07, ENROL-01/05 — and the approved change putting enrollment in the teacher's hands.

18.3Flow C — Teacher Leaves Mid-Term

Flow C — Deactivation without disruption

1Admin calls `PATCH /admin/users/{id}/deactivate` on the departing teacher.

2Django sets the user's `is_active=false` (B4); the account can no longer log in or refresh. Courses are **not** touched.

3Response returns `affected_courses` with enrolled counts. Admin UI prompts for reassignment.

4Meanwhile a student in one of those courses starts a session — it works. `teacher_id` being `NULL` does not block generation; the course brief and history are intact.

5Admin calls `POST /admin/courses/{id}/reassign` with a new teacher. `teacher_id` updates; the new teacher immediately has progress + enrollment access.

Realises FSD ACC-05/06, AC-14 — and proves the nullable `teacher_id` decision (Section 5.1) holds end to end.

19

## Implementation Sequence

A build order that keeps the system integrable at every step. Each phase ends with something demonstrable. The core loop is proven as early as possible — because if it fails, everything after it is wasted effort.

01

Foundation

Monorepo, both Railway services, PostgreSQL, CI. Django ASGI skeleton with the Uvicorn run command verified. The accounts app with the User model, `/auth/login` \+ `/auth/refresh`, and simplejwt. Next.js shell with the login screen and token storage. The `/me` endpoint and end-to-end authenticated routing working.

Demo: a user signs in and is routed to a role-correct empty dashboard.

02

Accounts & Courses

Full data layer with migrations and indices. `accounts` and `courses` apps — account management, course brief CRUD, the four permission classes, enrollment endpoints with teacher ownership scoping.

Demo: admin creates users; teacher creates a course and enrolls students (Flow B).

03

The AI Agent — Isolated

The `agent` app, built and tested with no database and no HTTP. Prompts, parsers, pydantic schemas, HTML validation. Exercised against fixture context dicts until lesson and assessment output parse reliably.

Demo: a fixture context produces a validated `Lesson` object in a test run.

04

The Core Loop

Context assembly with summarisation, the session orchestrator and state machine, the async SSE view, concurrent assessment dispatch. The session history write. This phase proves the MVP's central hypothesis.

Demo: a student streams a generated lesson and a second session adapts from the first (Flow A).

05

The Rendering Engine

Block router and the three renderers. Progressive streaming render, the sandboxed interactive iframe with its fallback, the assessment state machine. Lesson now looks and feels complete.

Demo: a lesson with an interactive visual renders; the assessment runs to a summary.

06

Progress, Resilience & Hardening

Progress views for teacher and student. Session resume, abandoned-session cleanup cron, the full failure matrix. Observability logging. Every acceptance criterion AC-01 to AC-14 verified.

Demo: all FSD acceptance criteria pass; the system is pilot-ready.

**Why the Agent Is Built Before the Loop** Phase 3 builds the AI agent in isolation, before it is wired into sessions. This is deliberate. The agent's output quality is the single biggest unknown in the project. Proving it against fixtures — with no database, no streaming, no UI in the way — surfaces prompt and parsing problems while they are cheap to fix. By Phase 4 the agent is a known quantity and the loop is just plumbing around it.

PAIDEIA · PAI-TSD-001 · v1.0 Draft · Technical Specification

Pairs with PAI-FSD-001 v2.0 · Internal — Confidential
