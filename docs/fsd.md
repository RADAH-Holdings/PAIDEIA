# Paideia — Functional Specification (PAI-FSD-001 v2.0)

> Auto-generated from the canonical HTML spec. This is the agent-readable copy. If anything here conflicts with a later human edit, the HTML in /spec-source is the visual master; this Markdown is the working reference.

---

PAIDEIA

Functional Spec · MVP · v2.0

Doc IDPAI-FSD-001

Versionv2.0

StatusDRAFT

ScopeMVP Only

Foundation

01Purpose & MVP Aim 02Scope 03System Actors 04System Modules

Tech Stack

05Stack Decisions 5.1 Evaluation Criteria 5.2 Chosen Stack 5.3 Workarounds 5.4 Deployment

Functional Modules

06Auth & Identity 07Account Management 08Course Brief 09Enrollment 10Session Orchestration 11Context Assembly 12AI Agent Module 12.1 Lesson Generation 12.2 Assessment Generation 12.3 Streaming 13Rendering Engine 13.1 Architecture 13.2 Block Schema 13.3 Renderer 1 — Text 13.4 Renderer 2 — Interactive 13.5 Renderer 3 — Assessment 13.6 Security 13.7 Library Whitelist 14Assessment Engine 15Session History 16Progress View

Technical

17Data Models 18Non-Functional Req. 19Acceptance Criteria

Roadmap

20Full System Roadmap

Paideia · MVP · Functional Specification Document · v2.0

Core Loop Specification

Includes: System Modules · Tech Stack Decisions · Rendering Engine · Workarounds

Document ID

PAI-FSD-001

Version

2.0 — Draft

Supersedes

PAI-FSD-001 v1.0

New in v2.0

Stack · Modules · Rendering Engine

Deployment

Railway (full stack)

Classification

Internal — Confidential

01

## Purpose & MVP Aim

This document defines the complete functional specification for the Paideia MVP — updated to include the full system module breakdown, chosen technology stack with rationale, implementation workarounds, and the Rendering Engine specification. It supersedes v1.0.

The MVP answers one question. Everything in this document exists in service of answering it cleanly.

MVP Primary Hypothesis

An AI agent, given only a teacher's plain-language course brief and a student's accumulated session history, can generate coherent, sequential, and meaningfully personalised lessons — rendered beautifully including interactive visual blocks — that constitute a complete course over time.

If this is proven, the full product is buildable. If lessons are incoherent, shallow, or the rendering breaks — no amount of surrounding infrastructure saves the product. The loop and its rendering are the product.

**What Changed in v2.0** This version adds Section 4 (System Modules), Section 5 (Tech Stack Decisions including workarounds), and the full Rendering Engine specification in Section 13. All prior functional requirements from v1.0 are retained and renumbered.

02

## Scope

The MVP scope is unchanged from v1.0. The rendering engine is now explicitly named as an MVP deliverable — it was implicit before. Interactive visual generation is MVP scope because it is load-bearing for the hypothesis: that the system can generate a genuinely useful, personalised learning experience.

#### In Scope — MVP

Admin account creation and school setup

Teacher and student account management by admin

Teacher creates and edits a plain-text course brief

Teacher manages enrollment for their own courses (admin as fallback)

Teacher archives their own courses; admin can archive any course

Student initiates a learning session

AI agent generates one structured lesson per session

Lesson rendered via three-renderer engine (text/callout, interactive, assessment)

Interactive HTML blocks sandboxed via iframe

AI agent generates 4 MCQ questions per lesson

Question-by-question assessment with immediate feedback

Session history stored per student per course

History used as context for all subsequent generation

Teacher sees basic student completion list

Email/password auth via Django (simplejwt)

Web browser interface — desktop (Next.js)

#### Out of Scope — MVP

National curriculum standards mapping

Prerequisite / dependency graphs

Teacher content review and approval queue

Content moderation or safety layer

Parent portal or guardian visibility

Cohort analytics or class-level reporting

SSO / OAuth / third-party identity providers

Offline or low-connectivity mode

Video or external media embeds

Gamification, streaks, badges

Mobile application

Open-ended or manually graded assessments

Data export, compliance reporting, audit tools

Billing, licensing, or subscription management

03

## System Actors

Three human actors and one system actor. No other roles exist in this version.

Actor| Type| Primary Responsibility| System Access  
---|---|---|---  
**Administrator**|  Human| Creates and manages the school account. Creates teacher and student accounts. Enrolls students as a fallback for bulk setup. Deactivates accounts. Reassigns courses when a teacher leaves. Archives any course in the school.| Full admin panel. Enrollment access across all courses. Course reassignment. Cannot author courses or take lessons.  
**Teacher**|  Human| Authors the course brief. Manages enrollment for their own courses. Views student progress for their own courses only. Archives their own courses. One teacher per course in MVP — teacher_id is nullable to support unassigned state after deactivation.| Course brief editor. Enrollment management for own courses only. Read-only progress view scoped to own courses.  
**Student**|  Human| Takes lessons. Completes assessments. Cannot configure anything.| Learning interface only. Sees own progress. Cannot see other students.  
**AI Agent**|  System| Generates lesson content and assessment questions on demand. Reads session history. Produces no output outside lesson and assessment generation.| Internal service. Called by the Session Orchestration module.  
  
04

## System Modules Overview

Paideia MVP is composed of eight functional modules. Each module has a single responsibility, a defined set of inputs and outputs, and a clear boundary. This separation is intentional — modules can be tested, debugged, and replaced independently.

The diagram below shows how they connect. Sections 6–16 specify each module in full.

Module Interaction Map — MVP

Auth & Identity (M1)

→

Account Management (M2)

→

Course Brief (M3)

↓ Teacher enrolls student (Admin as fallback)

Enrollment (M4)

→

Session Orchestration (M5)

↓ Student opens session

Context Assembly (M6)

→

AI Agent (M7)

↓ Returns lesson JSON + assessment JSON

Rendering Engine (M8)

→

Student sees lesson

↓ Assessment complete

Session History Store (within M5)

→

Next session: feeds M6

MODULE 01 · M1

Auth & Identity

Manages authentication via Django's auth framework with simplejwt. Issues JWTs on login and validates them on every request. The User model is the identity source of truth — no external bridge. All requests pass through this module before reaching any other.

Layer: Cross-cutting · Django middleware

MODULE 02 · M2

Account Management

Admin-only module for creating and managing user accounts. Writes directly to the users table with a generated temporary password. Controls account activation, deactivation, and course reassignment when a teacher leaves. No self-service registration in MVP.

Depends on: M1

MODULE 03 · M3

Course Brief

Teacher-facing module for creating, editing, and managing course briefs. The brief is the AI agent's sole instructional input. Manages course lifecycle states: draft → active → archived.

Depends on: M1, M2

MODULE 04 · M4

Enrollment

Teacher-owned module for adding and removing students from their own courses. Teachers see all students in the school and manage their own class composition. Admins retain enrollment access as a fallback for bulk term setup. Each enrollment maintains an independent session history and generation context.

Depends on: M1, M2, M3

MODULE 05 · M5

Session Orchestration

The coordination hub of the system. Manages session state machine (pending → active → complete). Triggers context assembly, AI agent call, rendering, assessment delivery, and history writing in the correct sequence. Also houses the Session History Store.

Depends on: M4, M6, M7, M8 · Coordinates all

MODULE 06 · M6

Context Assembly

Reads the course brief and the enrollment's full session history and assembles them into a structured prompt context object. Applies the summarisation strategy for long histories. The quality of its output determines lesson quality.

Depends on: M3, M5 (history store)

MODULE 07 · M7

AI Agent

Makes two sequential calls to the Anthropic API: one for lesson generation (with streaming), one for assessment generation. Parses structured output. Validates schemas. Handles failures and fallbacks. Stores the agent plan, full prompt context, and raw outputs for diagnostics.

Depends on: M6 · External: Anthropic API

MODULE 08 · M8

Rendering Engine

Client-side module (Next.js). Routes lesson blocks to one of three sub-renderers: Markdown/text renderer, sandboxed interactive iframe renderer, and MCQ assessment state machine. Each renderer is isolated. Fallback logic prevents interactive block failures from breaking lesson delivery.

Layer: Frontend only · No Django dependency

05

## Technology Stack Decisions

Every technology choice in this stack was made against specific constraints: the system generates content via slow AI API calls, serves minors, runs on a single deployment platform, and must be buildable by a small team. This section documents what was chosen, why, and what workarounds were required.

5.1Evaluation Criteria

Before selecting any technology, the following criteria were established and weighted in order:

Criterion| Reason  
---|---  
**Async I/O support**|  AI generation calls hold a connection open for up to 30 seconds. Any framework that cannot handle async I/O without blocking a thread would require a separate task queue just to function correctly.  
**Single-platform deployment**|  The entire stack — API, frontend, database — must run on Railway to reduce operational complexity and cognitive overhead for a small build team.  
**Auth integration quality**|  The closed access model (admin-created accounts, no public sign-up, three roles, email/password only) is exactly what Django's built-in auth covers. Using it removes an external dependency, a third-party child-data processor, and per-seat cost — at the price of owning the login UI and password-reset emails, which Django provides battle-tested primitives for.  
**JSONB / structured data support**|  The lesson block schema and assessment questions are structured JSON. The database must support JSONB natively — querying within JSON fields without serialising entire documents.  
**Developer velocity**|  MVP must be buildable fast. Frameworks with strong conventions, good ORM support, and large ecosystems reduce decision fatigue and accelerate delivery.  
  
5.2Chosen Stack

Django 5.x + DRF

API Backend · Business Logic · ORM

Django's ORM maps cleanly to the relational data model. DRF provides serialisers, viewsets, and permission classes that directly implement the role-based access model. The ecosystem (django-cors-headers, migrations, admin) reduces boilerplate. Django 5.x supports async views natively — critical for AI calls.

**Hard Rule: No User-Facing HTML** Django serves no HTML to students, teachers, or admins — every user-facing endpoint returns JSON, and the entire role experience is rendered by Next.js. The Django admin site is the one permitted exception: it stays enabled for internal engineering data inspection, which means django.contrib.staticfiles and a minimal TEMPLATES backend remain configured (the admin needs them to render). It is reachable only over Railway's private network or a protected path, never publicly. The rule is "no user-facing HTML" — not "no templates at all." This must be settled before the first view is written.

Django Auth + simplejwt

Authentication · Identity · Token Issuance

Django's built-in auth framework (django.contrib.auth) handles password hashing, the user model, and the password-reset flow. djangorestframework-simplejwt issues access and refresh tokens on login and validates them on every request. Because the access model is closed — admin creates every account, no public sign-up — none of Clerk's strengths (social login, self-registration, magic links) are needed. The User model is the single identity source of truth.

**The User Model IS the Identity** There is no external identity provider and therefore no bridge to maintain. The Django User model carries email, hashed password, role, school_id, is_active, and force_password_change directly. Authentication (who is this) and authorization (what may they do) both run against this one record. This is simpler than an external-provider setup: there is no risk of sync drift between two user stores because there is only one store. Password hashing uses Django's default (PBKDF2, or argon2 if the argon2-cffi package is added) — never store or log plaintext.

Next.js 14 (App Router)

Frontend · All Three Role Interfaces

Next.js was chosen for three reasons: the lesson experience needs a reactive client (streaming text, sandboxed interactive iframes, the assessment state machine) that server-rendered templates handle poorly. App Router route groups map cleanly to the three role interfaces. Server Components reduce client bundle size for content-heavy lesson pages. The login screen and token storage are built as first-class Paideia-styled screens rather than delegated to a hosted provider — which is more consistent with the design system.

**Streaming Lesson Delivery** The lesson generation call can take 15–25 seconds. Rather than waiting for the full response and then rendering, the AI agent streams tokens via the Anthropic SDK. Django reads the stream and re-streams it to the Next.js frontend via a Server-Sent Events (SSE) endpoint. The student sees the lesson build word by word — identical to how Claude responds in this interface. This must be built from the start; retrofitting streaming into a completed non-streaming implementation is a significant architectural change, not a feature addition.

PostgreSQL (Railway)

Primary Database

PostgreSQL is non-negotiable given the data model. The lesson blocks schema and assessment question arrays are JSONB fields — queried within Django using JSONField. Railway provides managed PostgreSQL with automatic backups, a connection pooler, and a dashboard for inspection during development. No separate database host needed.

**Async Driver Required** Standard psycopg2 is synchronous. Using it with Django async views causes a SynchronousOnlyOperation error. The driver must be psycopg3 (the package name is psycopg, not psycopg3). psycopg3 is async-native and works correctly with Django's async ORM. This must be set in requirements from day one — swapping drivers mid-project requires testing all ORM queries.

Anthropic Python SDK

AI Agent · Lesson & Assessment Generation

The official Anthropic SDK has a first-class async client (AsyncAnthropic) that integrates cleanly with Django async views. It supports streaming natively via the messages.stream() async context manager. The SDK handles retries, rate limiting, and API versioning automatically.

**Two Separate Calls** Lesson generation and assessment generation are two separate SDK calls, never combined. This is intentional: independent failure handling, independent prompt optimisation, and independent streaming (lessons stream to the student; assessment generation happens server-side after lesson delivery starts). The assessment call is non-streaming and runs concurrently with lesson streaming using asyncio.create_task().

Railway

Full-Stack Deployment · All Services

Railway hosts the Next.js frontend, Django API, and PostgreSQL database on a single platform. For a small team building an MVP, the operational simplicity of one dashboard, one billing account, and one place to read logs across all services outweighs any marginal performance gains from a multi-cloud setup. Railway supports Python (Django via Gunicorn + Uvicorn workers for async), Node.js, and PostgreSQL natively.

**Gunicorn + Uvicorn Workers** Standard Gunicorn workers are synchronous (WSGI). Django async views require ASGI workers. The Procfile must use: gunicorn paideia.asgi:application -k uvicorn.workers.UvicornWorker. Without this, async views silently fall back to synchronous execution — AI calls block threads and the system degrades under any concurrent load. This is the single most common Django async deployment mistake.

5.3Workarounds Summary

The following workarounds were identified during stack selection. Each one is a potential failure mode if ignored. They are collected here as a quick reference for the engineering team.

Workaround| Without it| Implementation  
---|---|---  
**Async views for AI calls**|  Each AI call holds a Django thread for up to 30 seconds. Under 10 concurrent students the server saturates.| All views that trigger AI calls must be defined as `async def`. Requires ASGI deployment.  
**ASGI deployment (Uvicorn workers)**|  Async views silently execute synchronously under WSGI, blocking threads despite the async keyword.| Procfile: `gunicorn paideia.asgi:application -k uvicorn.workers.UvicornWorker`  
**psycopg3 async driver**|  psycopg2 raises SynchronousOnlyOperation inside async views when any ORM query is made.| Install `psycopg[binary]` not `psycopg2`. Set DATABASE_URL accordingly.  
**Streaming lesson delivery**|  Students stare at a blank screen for 15–25 seconds. Perceived as broken. High abandonment on first session.| Django StreamingHttpResponse over a POST endpoint. The browser consumes it with `fetch()` \+ a ReadableStream reader — not EventSource, which is GET-only and cannot open a state-creating POST.  
**Concurrent assessment generation**|  A sequential assessment call after the lesson finishes makes the student wait a second time before they can be assessed.| `asyncio.create_task()` creates the assessment task when lesson streaming begins; the task blocks until the lesson body is complete, then generates. The benefit is overlap with the student's reading time — the assessment is ready by the time they finish reading, not concurrent with lesson generation itself.  
**JWT auth state on a stateless API**|  The async streaming endpoint and the sync REST endpoints all need the same identity check, cheaply, without a session lookup on every call.| simplejwt issues a signed access token on login; every request carries it as `Authorization: Bearer`. Validation is a signature check — no database hit for auth itself. A short access-token lifetime plus a refresh token balances security and convenience.  
**No user-facing HTML**|  A template-driven HTML layer creates pressure toward a mixed architecture that is hard to maintain.| No HTML is served to end users — all role UIs are Next.js. The Django admin remains for internal inspection, so staticfiles and a minimal TEMPLATES backend stay configured (note: templates are configured via the TEMPLATES setting, not INSTALLED_APPS). CORS is scoped to the Next.js domain only.  
  
5.4Deployment Architecture (Railway)

Production Architecture — All on Railway

SERVICE 1

Next.js Frontend

Railway Node.js service. App Router. Login screen + token storage. Stream client for streaming lessons. Static assets served via Railway CDN.

SERVICE 2

Django API

Railway Python service. Gunicorn + Uvicorn workers (ASGI). django-cors-headers scoped to frontend URL. Environment variable for model version.

SERVICE 3

PostgreSQL

Railway managed Postgres. Daily backups. Private networking between Django and DB (no public endpoint needed). psycopg3 driver.

Student browser

→

Next.js (Railway)

→ JWT →

Django API (Railway)

↓ async view triggered

Anthropic API

← stream →

Django streaming endpoint

→ stream →

Next.js fetch reader

↓ lesson stored + assessment generated concurrently

PostgreSQL (Railway)

← read/write →

Django ORM (psycopg3)

**Environment Variables** The following must be set in Railway environment config and never hardcoded: ANTHROPIC_API_KEY, ANTHROPIC_MODEL_VERSION, DATABASE_URL, DJANGO_SECRET_KEY, JWT_SIGNING_KEY (or reuse DJANGO_SECRET_KEY for simplejwt), JWT_ACCESS_LIFETIME, JWT_REFRESH_LIFETIME, ALLOWED_HOSTS, CORS_ALLOWED_ORIGINS, and the email-backend credentials for password-reset and welcome emails. Rotating ANTHROPIC_MODEL_VERSION without a code deploy is a deliberate design capability.

06

## Module 1 — Auth & Identity

Authentication is owned entirely by Django's auth framework. There is no external identity provider — the User model is the single source of truth for identity, role, and school membership. simplejwt issues tokens on login; a permission layer enforces authorization on every request.

6.1Django Authentication Class

models.py + auth — Django User model & simplejwt
    
    
    # The User model IS the identity. No external provider, no bridge.
    from django.contrib.auth.models import AbstractBaseUser
    from rest_framework_simplejwt.authentication import JWTAuthentication
    from rest_framework.permissions import BasePermission
    
    class User(AbstractBaseUser):
        email        = models.EmailField(unique=True)
        name         = models.CharField(max_length=200)
        role         = models.CharField(max_length=20)   # admin | teacher | student
        school       = models.ForeignKey(School, on_delete=models.PROTECT)
        is_active    = models.BooleanField(default=True)
        force_password_change = models.BooleanField(default=True)
        # password hash is managed by AbstractBaseUser (PBKDF2 by default)
        USERNAME_FIELD = 'email'
    
    # Authentication: simplejwt validates the signed token — no DB hit for auth.
    # Set as DEFAULT_AUTHENTICATION_CLASSES in DRF settings:
    #   'rest_framework_simplejwt.authentication.JWTAuthentication'
    # The token's user_id claim resolves request.user to the User row above.
    
    # Authorization: DRF permission classes run against request.user.
    class IsTeacher(BasePermission):
        def has_permission(self, request, view):
            return request.user.role == 'teacher'
    
    class IsSameSchool(BasePermission):
        # Applied to all viewsets — ensures no cross-school data access
        def has_object_permission(self, request, view, obj):
            return obj.school_id == request.user.school_id

Req ID| Requirement| Priority  
---|---|---  
AUTH-01| All API endpoints require a valid Django-issued JWT in the Authorization header. Requests without a token return 401. Expired access tokens return 401 with a code that prompts the client to use its refresh token; an invalid refresh token forces re-login.| MUST  
AUTH-02| simplejwt's JWTAuthentication is set as the default authentication class in DRF settings. No viewset declares authentication explicitly. The token's user_id claim resolves request.user.| MUST  
AUTH-03| POST /auth/login accepts email and password, verifies against the stored hash, and returns an access token and a refresh token. Invalid credentials return 401 with a generic message (never revealing whether the email exists). A deactivated account (is_active=False) cannot obtain tokens.| MUST  
AUTH-04| POST /auth/refresh exchanges a valid refresh token for a new access token. Access tokens are short-lived (e.g. 30 minutes); refresh tokens are longer-lived (e.g. 7 days). Both lifetimes are environment-configurable.| MUST  
AUTH-05| All viewsets apply the IsSameSchool permission. A student from School A must never be able to read, write, or infer the existence of data belonging to School B, even with a valid JWT.| MUST  
AUTH-06| On the Next.js side, a route guard checks for a valid token and the user's role (read from GET /me) before rendering any role route group (/admin/*, /teacher/*, /student/*). Unauthenticated users are redirected to /sign-in. This is a UX guard; the API is the real enforcement.| MUST  
AUTH-07| Passwords are hashed with Django's password hashers (PBKDF2 by default; argon2 if argon2-cffi is installed). Plaintext is never stored or logged. Password reset uses Django's built-in token-based reset flow, delivered by the configured email backend.| MUST  
  
07

## Module 2 — Account Management

Account creation is admin-only. No self-registration. When an admin creates an account, the system writes a User row directly with the assigned role and school, sets a generated temporary password, and flags force_password_change. Django's email backend sends the welcome message with the temporary password.

Req ID| Requirement| Priority  
---|---|---  
ACC-01| Admin creates a teacher or student account by providing name, email, and role. The system creates the User row with role and school set, generates a temporary password, sets force_password_change=True, and sends the welcome email with the temporary password via the configured email backend.| MUST  
ACC-02| A user whose force_password_change flag is True is required to set a new password before any other endpoint will serve them. The flag is cleared on successful password change. Enforced server-side: the API rejects non-password-change requests from such a user with a code the frontend redirects on.| MUST  
ACC-03| Admin can deactivate any account (teacher or student) by setting is_active=False. A deactivated user cannot log in or refresh tokens (AUTH-03). Data is retained in full.| MUST  
ACC-04| Admin sees a paginated list of all teachers and students in their school with status indicators (active / deactivated).| MUST  
ACC-05| Deactivating a teacher account must not archive, suspend, or alter any of their courses. All active courses remain active. Enrolled students retain full access and can continue taking sessions. The admin is shown a warning at deactivation time listing the teacher's active courses and enrolled student counts, and is prompted to reassign each course to another teacher or leave it unassigned. Unassigned courses remain fully functional — the teacher_id field is nullable for this reason.| MUST  
ACC-06| Admin can reassign a course's teacher_id to any active teacher in the school. This is the only operation that can change teacher_id on an active course. It requires an explicit confirmation step. The new teacher immediately gains progress view access and enrollment management for that course.| MUST  
  
08

## Module 3 — Course Brief

The course brief is the AI agent's sole instructional input. Its quality is the primary determinant of lesson quality. The interface must actively guide teachers to write useful briefs — field-level examples, character counts, and minimum guidance hints are functional requirements, not UI polish.

8.1Course Brief Fields

Field

Type

Notes for Engineering

course_title

VARCHAR(200)

Display name. Shown in all dashboards. E.g. "Biology — Year 10, Term 2".

subject

VARCHAR(100)

Subject area. Passed verbatim to agent system prompt. E.g. "Biology", "Mathematics".

target_level

VARCHAR(100)

Free text. Agent uses this to calibrate vocabulary and depth. E.g. "Year 10", "Age 12–13".

learning_outcomes

TEXT (4000)

What students must know by course end. Agent's primary success metric. Bullet list recommended. Minimum 100 chars enforced.

topic_sequence

TEXT (4000)

Rough topic order. Agent fills gaps. E.g. "1. Cell biology 2. Genetics 3. Evolution". Minimum 80 chars.

exam_context

TEXT (2000)

Optional. Exam being prepared for. Agent biases toward exam-relevant depth. E.g. "WAEC Biology — past topics include..."

special_instructions

TEXT (2000)

Optional. Hard constraints for agent. E.g. "Do not cover evolution — teacher-led only." Agent treats these as absolute rules.

approximate_lessons

INTEGER

Guides agent on pacing. Range 10–120. Stored and passed to agent as pacing context. Not a hard cap.

8.2Requirements

Req ID| Requirement| Priority  
---|---|---  
BRIEF-01| A teacher can create and activate a course only after all required fields pass minimum length validation. The UI shows field-level validation with a plain-language message (not just "too short").| MUST  
BRIEF-02| Courses can be saved as drafts without meeting minimum field lengths. Draft courses cannot be enrolled into. Drafts are not visible to students.| MUST  
BRIEF-03| A teacher can edit any brief field at any time. Edits apply to the next AI generation call only — previously delivered lessons are immutable. If the course has enrolled students with at least one completed session, the UI shows a warning: "Editing this brief will change how future lessons are generated. Lessons already delivered are not affected." The teacher must acknowledge before saving.| MUST  
BRIEF-04| Each text field in the UI displays: current character count, minimum required, and a collapsible example of a well-written entry for that field specifically.| MUST  
BRIEF-05| Course archiving: a teacher can archive their own course at any time. An admin can archive any course in their school. Once archived, no new sessions can start and no new enrollments are accepted. Enrolled students retain read access to their completed session history. Existing history is fully preserved.| MUST  
BRIEF-06| The full state of the course brief at the time of each lesson's generation is captured in lessons.prompt_context (this happens as part of context assembly). This is the authoritative record of what the agent was instructed with for any given lesson — essential for diagnosing quality issues when a brief has since been edited.| MUST  
BRIEF-07| teacher_id on an active course is immutable through the course brief editor. A teacher cannot transfer or reassign their own course. teacher_id can only be changed by an admin via the dedicated reassignment flow (ACC-06). Attempts to update teacher_id via the API without admin role return 403.| MUST  
  
09

## Module 4 — Enrollment

Enrollment links a student to a course. Ownership sits with the teacher — they know their class composition and should not need to route every enrollment change through an administrator. Admins retain enrollment access as a fallback for bulk term setup (e.g. importing a class list at the start of the year) and for situations where the teacher is unavailable.

Each enrollment is fully independent. Two students enrolled in the same course have completely separate generation contexts, session histories, and adaptation paths.

**RBAC Rule** Teachers can only enroll or unenroll students into courses where course.teacher_id = request.user.id. A teacher cannot touch another teacher's course enrollments. Admins can manage enrollments across all courses in their school. This is enforced in a single DRF permission class — not in view logic.

Req ID| Requirement| Priority  
---|---|---  
ENROL-01| A teacher can enroll one or more students into any of their own active courses from a multi-select list showing all active students in the school. Students already enrolled in the course are excluded from the picker.| MUST  
ENROL-02| A teacher can unenroll a student from their own course. The student loses course access immediately. Session history is retained. The teacher sees a confirmation dialog before the action completes.| MUST  
ENROL-03| An admin can enroll or unenroll students across any course in their school. This power exists for bulk term-start setup and teacher-absence scenarios — not as the primary enrollment workflow.| MUST  
ENROL-04| A student can be enrolled in multiple courses simultaneously across different teachers. Each enrollment is fully independent in terms of session history and generation context.| MUST  
ENROL-05| Re-enrolling a previously unenrolled student reactivates the existing enrollment record rather than creating a duplicate. The UNIQUE constraint on (course_id, student_id) is enforced at the database level. Prior session history is preserved and visible to the student and teacher on reactivation.| MUST  
ENROL-06| Only active courses can receive enrollments. Draft and archived courses do not appear in the enrollment picker for either teacher or admin.| MUST  
  
10

## Module 5 — Session Orchestration

The session orchestration module is the coordination hub. It manages the full session lifecycle and sequences every other module. A session is a state machine with five states.

Session State Machine
    
    
    PENDING ──► GENERATING ──► ACTIVE ──► ASSESSING ──► COMPLETE
                                              │
                                              ▼
                                          ABANDONED
    
    PENDING:    enrollment exists, student has not yet triggered generation
    GENERATING: AI agent call in progress — lesson streaming to client
    ACTIVE:     lesson delivered, student reading — assessment not yet started
    ASSESSING:  student answering questions
    COMPLETE:   all questions answered, history record written
    ABANDONED:  student closed browser during ASSESSING — resumable within 24h
    
    There is no FAILED state. A failed generation deletes the session row
    entirely (SESS-03) — no trace is persisted and no status records it.
    A GENERATING row that is never finished (e.g. a worker restart) is a
    stale row, swept by the cleanup task in SESS-06.

**Single Active Session Rule** A student may have at most one session per enrollment that is not COMPLETE. Attempting to start a new session while one is GENERATING, ACTIVE, or ASSESSING returns the existing session. This prevents duplicate generation calls and duplicate history entries.

Req ID| Requirement| Priority  
---|---|---  
SESS-01| When a student triggers a new session, the orchestrator checks for an existing non-complete session. If found, it resumes it. If not found, it creates a new PENDING session and begins the generation sequence.| MUST  
SESS-02| The generation sequence is: (1) create session record with status=GENERATING, (2) call Context Assembly module, (3) initiate AI Agent call with streaming, (4) concurrently dispatch assessment generation as asyncio.create_task(), (5) on lesson stream complete, set status=ACTIVE, (6) store lesson + assessment.| MUST  
SESS-03| If the AI lesson generation call fails, the session row is deleted entirely — there is no FAILED status and no persisted trace. The student sees an error and is returned to the course home; their session count does not increment. Failure is logged with full context.| MUST  
SESS-04| The session transitions to ASSESSING when the student begins the assessment (first question fetch or first answer submitted). A session in ASSESSING whose browser is closed becomes ABANDONED and is resumable: on next login the student sees the lesson again with their already-answered questions preserved, and unanswered questions continue from where they left off.| MUST  
SESS-05| When all assessment questions are answered, the orchestrator: writes the session history record, sets session status=COMPLETE, and updates the enrollment's last_session_at timestamp. This is a single atomic database operation.| MUST  
SESS-06| A scheduled cleanup task (Django management command + Railway cron) runs daily and sweeps two stale states: (a) ABANDONED sessions older than 24 hours are written as COMPLETE with assessment_outcome='not_taken' for unanswered questions; (b) GENERATING sessions older than 1 hour — orphaned by a worker restart mid-stream — are deleted, consistent with SESS-03. The supporting index covers both statuses.| SHOULD  
  
11

## Module 6 — Context Assembly

The context assembly module builds the structured object that becomes the AI agent's prompt. It reads from two sources: the course brief (M3) and the enrollment's session history. The quality of its output is the most controllable determinant of lesson quality.

11.1Context Object Structure

Context Object — Assembled per Session
    
    
    {
      "course_brief": {
        // All fields from the course brief verbatim. Never truncated.
        "title": "Biology — Year 10",
        "subject": "Biology",
        "target_level": "Year 10 / Age 14-15",
        "learning_outcomes": "...",
        "topic_sequence": "...",
        "exam_context": "...",
        "special_instructions": "...",
        "approximate_lessons": 40
      },
      "student": {
        "name": "Amara"         // First name only
      },
      "session_count": 7,  // Total completed sessions for this enrollment
      "history": {
        "recent": [          // Last 5 sessions — full detail
          {
            "session_number": 7,
            "lesson_title": "Mitosis — Stages and Cell Division",
            "key_concepts": ["prophase", "metaphase", "anaphase", "telophase"],
            "assessment_outcome": "needs_reinforcement",
            "concepts_missed": ["anaphase"]
          }
          // ... sessions 3–6
        ],
        "earlier": [         // Sessions 1–2 — compressed
          { "session_number": 2, "lesson_title": "Cell Structure", "assessment_outcome": "strong" },
          { "session_number": 1, "lesson_title": "Introduction to Cell Biology", "assessment_outcome": "adequate" }
        ]
      }
    }

11.2Summarisation Strategy

As session count grows, raw history will exceed model context limits. The summarisation rule is applied during context assembly, before any AI call is made.

Session Range| Detail Level| Fields Included  
---|---|---  
Last 5 sessions| Full| session_number, lesson_title, key_concepts, assessment_outcome, concepts_missed  
Sessions 6–20 ago| Compressed| session_number, lesson_title, assessment_outcome only  
Sessions older than 20| Title only| session_number, lesson_title only — breadcrumb for topic coverage  
  
**Build This First** The summarisation utility must be written and tested before the AI integration, not after. It is a pure Python function with no external dependencies. Its output directly determines how well the agent adapts over time. Deferring it to post-MVP means the first real test sessions have no meaningful adaptation.

12

## Module 7 — AI Agent

The AI Agent module makes two sequential Anthropic API calls per session: one for lesson generation (streaming) and one for assessment generation (non-streaming, concurrent). Prompt engineering is first-class engineering work in this module — the prompts are versioned, tested, and tunable without code changes.

12.1Lesson Generation — Prompt & Output

Lesson Generation System Prompt Template
    
    
    You are an expert educational content designer creating lessons for {target_level} students.
    Your task is to generate the next lesson in an ongoing course for one specific student.
    You have access to everything they have already been taught and how well they understood it.
    
    COURSE BRIEF
    ━━━━━━━━━━━━
    Subject:              {course.subject}
    Level:                {course.target_level}
    Learning Outcomes:    {course.learning_outcomes}
    Topic Sequence:       {course.topic_sequence}
    Exam Context:         {course.exam_context | "Not provided"}
    Special Instructions: {course.special_instructions | "None"}
    Target Lessons:       Approx. {course.approximate_lessons} total
    
    STUDENT HISTORY
    ━━━━━━━━━━━━━━━
    Student:              {student.name}
    Sessions completed:   {session_count}
    {formatted_history_block}
    
    STEP 1 — PLAN (required before writing):
    Wrap your reasoning in <plan></plan> tags. Reason through:
    - What topics have been covered? What remains in the sequence?
    - Are there concepts marked needs_reinforcement to revisit?
    - What is the right depth and scope for session {session_count + 1}?
    - What teaching approach fits this student's performance pattern?
    - Should this lesson include an interactive visual? If so, what type and why?
    Do not skip this step. The plan is not shown to the student.
    
    STEP 2 — LESSON BLOCKS (delivered to student):
    Return a JSON array of blocks inside <blocks></blocks> tags.
    Each block is one of:
    
    { "type": "text", "content": "markdown string" }
    { "type": "interactive", "description": "label shown above iframe", "height": 380,
      "html": "complete self-contained HTML document as a string" }
    { "type": "callout", "variant": "definition|note|example|warning", "content": "markdown" }
    
    Rules for text blocks:
    - Use markdown: ## headings, **bold**, bullet lists, numbered lists
    - 400–700 words total across all text blocks. Do not pad.
    - Age-appropriate vocabulary for {target_level}
    - Do not repeat content from prior sessions at the same depth
    
    Rules for interactive blocks:
    - Only include if it genuinely aids understanding of a process, system, or concept
    - HTML must be fully self-contained (inline CSS and JS)
    - Libraries allowed only from: cdn.jsdelivr.net, unpkg.com (specific list below)
    - No fetch(), no localStorage, no external API calls, no form submissions
    - Must work at 100% container width
    - Include clear labels explaining what the visual shows
    
    STEP 3 — METADATA:
    Return inside <meta></meta> tags — valid JSON only:
    {
      "lesson_title": "string — specific and descriptive",
      "key_concepts": ["3 to 5 concept strings"],
      "estimated_read_minutes": integer,
      "has_interactive": boolean
    }

**Allowed CDN Libraries for Interactive Blocks** p5.js (cdn.jsdelivr.net/npm/p5), Chart.js (cdn.jsdelivr.net/npm/chart.js), D3.js (cdn.jsdelivr.net/npm/d3), Three.js (cdn.jsdelivr.net/npm/three), Mermaid.js (cdn.jsdelivr.net/npm/mermaid). Desmos is embedded via their official API script tag. Any library not on this list must be rejected server-side before the lesson is stored.

12.2Assessment Generation

Assessment Generation System Prompt Template
    
    
    You are generating a multiple choice assessment for a student lesson.
    The responses will be used to adapt future lessons — not to grade the student.
    
    Lesson Title:  {lesson.title}
    Key Concepts:  {lesson.key_concepts as comma-separated list}
    Lesson Body:   {lesson.text_blocks_only}  // interactive HTML is stripped
    
    Generate exactly 4 MCQ questions following these rules:
    - Test understanding and application, not memorisation of exact wording
    - Each question maps to exactly one key concept
    - Cover at least 3 distinct key concepts across 4 questions
    - 4 answer options per question (A B C D), exactly one correct
    - Wrong options must be plausible — misconceptions that real students hold
    - No trick questions, no double negatives, no ambiguous phrasing
    - Appropriate difficulty for {target_level}
    
    Return ONLY valid JSON, no preamble, no markdown fences:
    [
      {
        "question_text": "string",
        "concept_tag": "string — must match one of the key_concepts exactly",
        "options": [{"id":"A","text":"..."},{"id":"B","text":"..."},
                    {"id":"C","text":"..."},{"id":"D","text":"..."}],
        "correct_option_id": "A|B|C|D",
        "correct_explanation": "string — why this is correct",
        "wrong_explanations": {
          "B": "string — the common misconception this option represents",
          "C": "string",
          "D": "string"
        }
      }
    ]

12.3Streaming Implementation

Django async view — incremental parse, streams clean text only
    
    
    from django.http import StreamingHttpResponse
    import asyncio, json
    
    async def generate_session(request, enrollment_id):
        enrollment = await get_enrollment_or_404(enrollment_id, request.user)
        session = await create_or_resume_session(enrollment)
        context = await assemble_context(enrollment)
    
        # Assessment task is created now but blocks until the lesson body
        # is finalised — it overlaps the student's READING time, not generation.
        assessment_task = asyncio.create_task(
            generate_assessment_when_ready(session)
        )
    
        async def event_stream():
            # The agent emits tagged output: <plan>...</plan> then a JSON
            # <blocks> array then <meta>. The raw stream is NOT renderable.
            # An incremental parser consumes the raw token stream and emits
            # ONLY clean text-block content outward — plan and JSON syntax
            # are suppressed and never reach the client.
            parser = IncrementalLessonParser()
            full_raw = ""
            async with anthropic_client.messages.stream(
                model=settings.ANTHROPIC_MODEL_VERSION,
                system=build_lesson_prompt(context),
                messages=[{"role": "user", "content": "Generate the next lesson."}],
                max_tokens=8000   # budget: plan + text + one ≤15k-char block + meta
            ) as stream:
                async for raw in stream.text_stream:
                    full_raw += raw
                    # parser yields clean markdown only when inside a text block;
                    # returns nothing while inside <plan> or JSON scaffolding.
                    for clean in parser.feed(raw):
                        yield sse("token", {"text": clean})
                    if parser.meta_ready and not parser.meta_sent:
                        yield sse("lesson_meta", parser.meta)
    
            # Stream done — parse the full raw output into the block array
            lesson = parse_lesson_output(full_raw)        # AGENT-04
            await store_lesson(session, lesson)
            await set_session_status(session, 'ACTIVE')
            yield sse("lesson_complete", {"session_id": str(session.id)})
    
            await assessment_task
            yield sse("assessment_ready", {"session_id": str(session.id)})
            yield sse("done", {})
    
        return StreamingHttpResponse(
            event_stream(),
            content_type='text/event-stream',
            headers={'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no'}
        )

**The Streaming Model — Read This** The agent's raw output is tagged JSON: a `<plan>` reasoning block, a JSON `<blocks>` array, and a `<meta>` block. This raw form is not renderable and the plan must never reach a student. The server runs an incremental parser over the token stream and emits outward only the clean markdown found inside text blocks — the plan and all JSON scaffolding are suppressed. Interactive blocks are large embedded HTML strings; they do not stream as live tokens. Instead, after `lesson_complete`, the client fetches the fully parsed block array and renders interactive blocks in place. The live "building" effect therefore applies to text only; interactive blocks appear on completion. This is the single streaming model — REND-04 and AC-03 describe exactly this and nothing more.

**X-Accel-Buffering: no** Railway's proxy buffers responses by default. Without this header the stream is held and delivered all at once. It must be set on every streaming endpoint.

Req ID| Requirement| Priority  
---|---|---  
AGENT-01| Lesson generation and assessment generation are separate API calls. Never combined. The lesson call streams; the assessment call does not.| MUST  
AGENT-02| Assessment generation is dispatched as asyncio.create_task() when lesson streaming begins. The task blocks until the lesson body is finalised, then generates — so it overlaps the student's reading time. It is ready by the time the student finishes the lesson.| MUST  
AGENT-03| The model version is read from the ANTHROPIC_MODEL_VERSION environment variable. Never hardcoded. Changing the model requires only an environment variable update.| MUST  
AGENT-04| The full prompt context, raw agent response, and parsed output are stored against the session before the lesson is delivered. If storage fails, the lesson is not delivered.| MUST  
AGENT-05| Interactive block HTML is validated server-side before storage: must be a complete HTML document, must not contain fetch() or XMLHttpRequest calls to non-whitelisted domains, and must not exceed 15,000 characters. This ceiling is set deliberately against the AGENT-09 token budget so a lesson with one interactive block cannot exceed max_tokens. A block failing validation is dropped and replaced in the block array with a plain text fallback block; the lesson is delivered with all other blocks intact.| MUST  
AGENT-06| The assessment JSON response is validated against the expected schema. A malformed response triggers exactly one retry of the assessment generation call. Only on a second consecutive failure is the lesson delivered with no assessment (the session's assessment_outcome is recorded as 'not_taken'). The retry is mandatory — it must appear in the implementation.| MUST  
AGENT-07| A single lesson generation call must complete within AGENT_TIMEOUT_SECONDS (default 30). The call is wrapped in an enforced timeout. If exceeded, it is treated identically to an API failure: the session row is deleted (SESS-03) and an error is surfaced to the student. A loading state is shown during generation.| MUST  
AGENT-08| Lesson generation is idempotent with respect to retries. A failed generation leaves no partial lesson, no partial assessment, and no session row. A student re-attempting after a failure starts a completely fresh session — there is no half-written state to recover or collide with.| MUST  
AGENT-09| The lesson generation call uses an explicit, documented token budget. max_tokens is set to 8,000, sized to cover: the <plan> reasoning block, 400–700 words of lesson text, one interactive block at the AGENT-05 ceiling of 15,000 characters (~4,000–5,000 tokens), and the <meta> block, with margin. The AGENT-05 character ceiling and this token budget are a single coordinated decision — neither may be changed without re-checking the other.| MUST  
  
13

## Module 8 — Rendering Engine

The Rendering Engine is a client-side module — it lives entirely in Next.js and has no Django dependency. It receives a structured lesson JSON object and routes each block to one of three sub-renderers. The student sees one cohesive lesson. They never know they are seeing three different rendering systems.

This module is the part of Paideia that most directly shapes the student's experience. It is the difference between "an AI generated me some text" and "I just had a genuinely interactive learning experience." The interactive renderer in particular is what elevates Paideia beyond a chatbot wrapper.

**The Claude Model** This rendering architecture is directly modelled on how Claude renders interactive artifacts in this interface. Claude generates a self-contained HTML string. That string is injected into a sandboxed iframe via srcDoc. The iframe runs in a completely isolated environment with no access to the parent page. The content just works. Paideia uses this exact mechanism — extended with a block-routing system for multi-part lessons.

13.1Rendering Engine Architecture

01

Text Renderer

TYPE: "text" · TYPE: "callout"

Receives markdown strings. Renders via react-markdown with a plugin chain: remark-math + rehype-katex for equations, rehype-highlight for code, remark-gfm for tables and task lists. Callout blocks render as styled containers (definition, note, example, warning variants).

02

Interactive Renderer

TYPE: "interactive"

Receives a self-contained HTML string. Injects it into a sandboxed iframe via srcDoc. The sandbox attribute isolates execution completely. The student can interact with the visual — manipulate parameters, see animations, explore data — without any risk to the parent page or other students' data.

03

Assessment Engine

Post-lesson state machine

A pure React state machine. Not a renderer of AI output — a structured UI component. Displays questions one at a time, captures answers, shows immediate feedback per question, and produces the session summary. The most interaction-dense part of the interface.

LessonRenderer.tsx — Block Router
    
    
    export function LessonRenderer({ blocks }: { blocks: LessonBlock[] }) {
      return (
        <div className="lesson-body">
          {blocks.map((block, i) => {
            switch (block.type) {
              case 'text':
                return <TextBlock key={i} content={block.content} />
              case 'interactive':
                return <InteractiveBlock key={i} block={block} />
              case 'callout':
                return <CalloutBlock key={i} variant={block.variant} content={block.content} />
              default:
                return null  // Unknown block types are silently skipped
            }
          })}
        </div>
      )
    }

13.2Block Schema

Lessons are structured arrays of typed blocks. This schema is the contract between the AI Agent (producer) and the Rendering Engine (consumer). Both sides must agree on it exactly.

TypeScript — Lesson Block Types
    
    
    type TextBlock = {
      type: 'text'
      content: string  // Markdown string
    }
    
    type InteractiveBlock = {
      type: 'interactive'
      description: string  // Label shown above the iframe, e.g. "Concentration gradient simulation"
      height: number       // Pixel height. Agent sets this based on content complexity.
      html: string         // Complete self-contained HTML document as a string
    }
    
    type CalloutBlock = {
      type: 'callout'
      variant: 'definition' | 'note' | 'example' | 'warning'
      content: string  // Markdown string
    }
    
    type LessonBlock = TextBlock | InteractiveBlock | CalloutBlock
    
    type Lesson = {
      lesson_title: string
      key_concepts: string[]        // 3–5 concepts
      estimated_read_minutes: number
      has_interactive: boolean
      blocks: LessonBlock[]
    }

13.3Renderer 1 — Text & Callout

TextBlock.tsx — react-markdown with plugin chain
    
    
    import ReactMarkdown from 'react-markdown'
    import remarkMath from 'remark-math'
    import rehypeKatex from 'rehype-katex'
    import rehypeHighlight from 'rehype-highlight'
    import remarkGfm from 'remark-gfm'
    import 'katex/dist/katex.min.css'
    
    export function TextBlock({ content }: { content: string }) {
      return (
        <div className="lesson-text-block">
          <ReactMarkdown
            remarkPlugins={[remarkMath, remarkGfm]}
            rehypePlugins={[rehypeKatex, rehypeHighlight]}
          >
            {content}
          </ReactMarkdown>
        </div>
      )
    }
    
    // Callout variants map to styled containers:
    // 'definition' → blue left border, Definition label
    // 'note'       → amber left border, Note label  
    // 'example'    → green left border, Worked Example label
    // 'warning'    → red left border, Important label

13.4Renderer 2 — Interactive Sandbox

The HTML string from the AI agent is injected into a sandboxed iframe via srcDoc. The iframe is completely isolated from the parent application. Because the sandbox isolates the iframe, the parent cannot observe failures inside it directly — so failure detection uses a postMessage handshake, not the iframe's onError event.

**Why Not onError** A srcDoc iframe has no network resource to load, so its onError event does not fire for the realistic failure mode — broken generated JavaScript. JS errors inside a sandbox do not propagate to the parent. Relying on onError would leave a malfunctioning interactive showing as a broken visual with no fallback. The handshake below is the correct mechanism.

InteractiveBlock.tsx — sandboxed iframe with handshake
    
    
    export function InteractiveBlock({ block }: { block: InteractiveBlock }) {
      const [state, setState] = useState<'loading'|'ready'|'failed'>('loading')
      const frameRef = useRef<HTMLIFrameElement>(null)
    
      useEffect(() => {
        // The server injects a small bootstrap into every interactive
        // HTML string during validation: on successful init it calls
        // parent.postMessage({type:'paideia:ready', id}, '*').
        const onMsg = (e: MessageEvent) => {
          if (e.source === frameRef.current?.contentWindow
              && e.data?.type === 'paideia:ready') setState('ready')
        }
        window.addEventListener('message', onMsg)
        // No handshake within 4s → treat the block as failed.
        const timer = setTimeout(() => {
          setState(s => s === 'loading' ? 'failed' : s)
        }, 4000)
        return () => { window.removeEventListener('message', onMsg); clearTimeout(timer) }
      }, [])
    
      if (state === 'failed') {
        // Graceful degradation — lesson continues without the visual
        return <div className="interactive-fallback">
                 <p>Interactive visual unavailable for this lesson.</p>
               </div>
      }
    
      return (
        <div className="interactive-container">
          <div className="interactive-label">{block.description}</div>
          <iframe
            ref={frameRef}
            srcDoc={block.html}
            sandbox="allow-scripts"
            // allow-scripts: JS runs inside the iframe.
            // No allow-same-origin: cannot reach the parent window.
            // No allow-forms / allow-top-navigation.
            style={{ width: '100%', height: `${block.height}px`, border: 'none' }}
            title={block.description}
          />
        </div>
      )
    }

**Why sandbox="allow-scripts" Only** The omission of allow-same-origin is the critical security attribute. With it, injected content could reach the parent window's cookies and DOM. Without it the iframe is sealed — generated JavaScript has no path to the parent application or to any other student's data. The failure handshake operates over postMessage, which the sandbox permits while still blocking same-origin access.

13.5Renderer 3 — Assessment State Machine

Assessment state machine — states and transitions
    
    
    States:
      IDLE         → waiting, "Start Assessment" button visible
      ANSWERING    → question N of 4 displayed, options shown
      REVEALED     → answer confirmed, correct/wrong shown with explanation
      COMPLETE     → all 4 answered, session summary displayed
    
    Transitions:
      IDLE       → ANSWERING:  student clicks "Start Assessment"
      ANSWERING  → REVEALED:   student selects an option and clicks "Confirm"
      REVEALED   → ANSWERING:  student clicks "Next Question" (if questions remain)
      REVEALED   → COMPLETE:   student clicks "Finish" (on last question)
    
    Constraints:
      - Student cannot go back to change a confirmed answer
      - Student cannot skip questions
      - Correct answer is never shown before student confirms
      - All answer events are posted to the API immediately on confirmation
        (not batched at end) — prevents data loss if browser closes

13.6Security Layer

Layer| Mechanism| What it prevents  
---|---|---  
**iframe sandbox**|  sandbox="allow-scripts" only — no allow-same-origin| Generated JS cannot access parent window, cookies, localStorage, or other students' data  
**CSP via injected meta tag**|  During server-side validation, a `<meta http-equiv="Content-Security-Policy">` tag restricting script-src to the CDN whitelist is injected into the interactive HTML before storage| Generated code cannot load scripts from arbitrary external sources. Uses a real, browser-supported CSP mechanism — not the non-standard iframe csp attribute.  
**Server-side HTML validation**|  Django validates interactive block HTML before storage| Catches malformed output, oversized blocks, and attempted calls to non-whitelisted domains before the lesson is stored  
**No allow-same-origin**|  Deliberate iframe attribute omission| Even if generated JS attempts document.cookie or window.parent.document, it throws a security error — no access possible  
**Max block size**|  15,000 character limit enforced server-side (coordinated with the AGENT-09 token budget)| Prevents oversized HTML blocks and guarantees a lesson with one interactive block fits within max_tokens  
  
13.7Library Whitelist & Subject Mapping

The AI agent is only permitted to load libraries from the following CDN whitelist. This list is included verbatim in the generation system prompt and enforced server-side during HTML validation.

p5.js

Animations, simulations, particle systems, canvas drawing

Biology, Physics, Chemistry

Chart.js

Bar charts, line charts, scatter plots, histograms

Mathematics, Geography, Statistics

D3.js

Data visualisations, SVG diagrams, force graphs

Biology diagrams, Geography, Data Science

Three.js

3D models, molecular structures, geometric solids

Chemistry, Mathematics, Physics

Mermaid.js

Flowcharts, sequence diagrams, process maps

Computer Science, Biology (cycles)

Desmos API

Interactive graphing calculator, function plotting

Mathematics, Physics (graphs)

**Adding Libraries** New libraries must be added in three coordinated places: the system prompt whitelist, the server-side validation allowlist, and the script-src directive of the injected CSP meta tag. Updating one without the others creates drift — the agent generates valid code the validator rejects, or the CSP blocks an approved library. Whitelist changes are treated as a prompt version change and tested against representative course briefs.

Req ID| Requirement| Priority  
---|---|---  
REND-01| The LessonRenderer iterates blocks in order. Unknown block types are silently skipped without throwing an error. Lesson delivery must be resilient to unexpected block types from future prompt versions.| MUST  
REND-02| Interactive block failure is detected via a postMessage handshake, not the iframe onError event (which does not fire for srcDoc content). The generated HTML posts a 'paideia:ready' message on successful initialisation; if the parent receives no handshake within 4 seconds, the block is replaced with a plain text fallback. The rest of the lesson renders normally and the failure is logged client-side.| MUST  
REND-03| The lesson header (title, estimated read time, key concepts preview) renders immediately from the lesson metadata before any blocks are rendered. Students know what they are about to learn before the content appears.| MUST  
REND-04| During lesson generation the client renders streamed text progressively — clean markdown from text blocks appears as it arrives, giving a live "building" effect (the plan and JSON scaffolding are suppressed server-side and never reach the client). Interactive blocks are large embedded HTML and do not stream as live tokens; after the lesson_complete event the client fetches the fully parsed block array and renders interactive blocks in place. The student sees text build live and interactive visuals appear on completion. This is the only streaming behaviour — no other model is implied anywhere in this document.| SHOULD  
REND-05| The "Start Assessment" button is visible and accessible at all times during lesson reading — fixed position or sticky at the bottom. Students can proceed to assessment without finishing the lesson. This is their choice and is not penalised.| MUST  
REND-06| The assessment state machine posts each answer to the API immediately on confirmation. Answers are never batched. A student who closes their browser after answering 2 of 4 questions has those 2 answers preserved on reconnect.| MUST  
REND-07| KaTeX CSS (for equation rendering) is loaded as a global stylesheet in the Next.js app layout. It must not be lazy-loaded — equations in the first text block of a lesson must render correctly without a flash of unstyled math.| MUST  
  
14

## Module — Assessment Engine

Assessments serve one purpose: generating a signal about student understanding that feeds the next lesson's generation context. They are not grades. They are the adaptation mechanism. MVP uses MCQ only — 4 questions per lesson, auto-evaluated, with immediate per-question feedback.

Req ID| Requirement| Priority  
---|---|---  
ASMT-01| Assessment is generated concurrently with lesson streaming (asyncio.create_task). It is stored before the student reaches the assessment screen. The assessment call is never made on-demand when the student clicks "Start Assessment".| MUST  
ASMT-02| Each assessment has exactly 4 MCQ questions. Each question has exactly 4 options. Exactly one correct answer. Questions test understanding and application, not memorisation of exact wording from the lesson.| MUST  
ASMT-03| Each question maps to one of the lesson's key_concepts. At least 3 distinct key concepts must be covered across the 4 questions. This is validated server-side before storage.| MUST  
ASMT-04| After the student confirms each answer, they immediately see: correct/incorrect indicator, which option was correct (if they got it wrong), the correct explanation, and the explanation for why their wrong answer was incorrect. This is shown before they proceed to the next question.| MUST  
ASMT-05| A score of 2 or fewer correct (out of 4) flags the session as assessment_outcome='needs_reinforcement'. The concepts_missed list is populated with the key concepts for incorrectly answered questions. This data is carried forward into the Context Assembly module.| MUST  
ASMT-06| If assessment generation failed (fallback per AGENT-06), the student sees a message explaining the assessment is unavailable for this lesson and can proceed. Session is recorded as assessment_outcome='not_taken'.| MUST  
  
15

## Session History Store

The session history store is the memory of the system. Without it, the AI Agent generates blind — no adaptation, no personalisation, no course coherence across sessions. It is the most critical data in the system and must be treated accordingly.

15.1History Entry Written Per Completed Session

Field

Type

Description

session_number

Integer

Sequential within enrollment. Starts at 1. Never reused.

lesson_title

String

Title of the generated lesson.

key_concepts_covered

String[]

The 3–5 key concept terms from the lesson metadata.

had_interactive

Boolean

Whether this lesson included an interactive block. Tracked for quality analysis.

assessment_outcome

Enum

"strong" (4/4), "adequate" (3/4), "needs_reinforcement" (≤2/4), "not_taken".

concepts_missed

String[]

Key concepts for which the student answered incorrectly. Empty array if strong/adequate.

time_on_lesson_secs

Integer

Time from lesson display to "Start Assessment" click. Stored but not used in MVP generation context.

completed_at

Timestamp

When the session reached COMPLETE state.

Req ID| Requirement| Priority  
---|---|---  
HIST-01| History records are immutable once written. No actor — including admins — can alter a completed session's history record.| MUST  
HIST-02| The full lesson body (all blocks including interactive HTML) is stored permanently even though it is summarised in the generation context. Available for teacher diagnostic review.| MUST  
HIST-03| The agent's reasoning plan (from the <plan> tags) is stored against every lesson. Not shown to any user in MVP. Available to the engineering team for generation quality review.| MUST  
HIST-04| The Context Assembly module applies the summarisation strategy (Section 11.2) before every generation call. This is a pure function that must be unit-tested independently of the AI integration.| MUST  
  
16

## Progress View

Minimal progress visibility for MVP. Teachers need enough visibility to know whether students are using the system and to diagnose generation quality. Students need enough to stay motivated.

Req ID| Requirement| Priority  
---|---|---  
PROG-01| Teacher sees a progress table for each of their own courses only (courses where course.teacher_id = request.user.id). Table shows: student name, sessions completed, last session date, most recent assessment outcome. Sortable by each column. A teacher must never see progress data for a course they do not own.| MUST  
PROG-02| Clicking a student row shows their full ordered session list: session number, lesson title, date, assessment outcome, and whether the lesson had an interactive block. Scoped to the teacher's own course only.| MUST  
PROG-03| Teacher can read the full rendered lesson content of any lesson delivered to any student in their own courses. This exists for generation quality review — not student grading. A request for a lesson in a course the teacher does not own returns 404 at the API level (the resource is outside their visible scope; see the error-handling policy in the TSD), not merely hidden in the UI.| SHOULD  
PROG-04| Student home screen shows all enrolled active courses with a session counter ("7 sessions completed") and last session date per course.| MUST  
PROG-05| Within a course, the student sees an ordered session list with lesson title and assessment outcome per session. They can re-read any past lesson but cannot re-take its assessment.| MUST  
PROG-06| At the top of each lesson, the student sees a simple context line that makes the adaptation visible rather than opaque. If the session is a reinforcement session (i.e. it revisits a concept from concepts_missed in a prior session), the line reads: "Today's lesson revisits [concept] from your last session." For a regular progression session it reads: "Session [N] of approx. [approximate_lessons]." This is generated from session metadata — it does not require an additional AI call.| SHOULD  
  
17

## Data Models

Core relational model for the MVP. All tables include created_at and updated_at unless noted. Field names use snake_case. PostgreSQL JSONB is used for structured sub-documents (lesson blocks, assessment questions).

**Canonical Field Names** To prevent the database, the block schema, the context object, and the API contract from drifting apart, the following names are canonical and used identically everywhere: `lesson_title` (not `title`), `estimated_read_minutes` (not `estimated_read_mins`), `key_concepts_covered` for the session-history field, and `assessment_outcome` for the outcome field in every context — including the summarised-history JSON. Any deliberate database-to-API rename must be documented explicitly in the TSD API contract; there are none in MVP.

PostgreSQL Schema — MVP
    
    
    -- Root entity. All data is school-scoped.
    TABLE schools {
      id               UUID PRIMARY KEY DEFAULT gen_random_uuid()
      name             VARCHAR(200) NOT NULL
      created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
    }
    
    -- All human actors. Role determines access. Django owns identity and authorisation.
    TABLE users {
      id               UUID PRIMARY KEY DEFAULT gen_random_uuid()
      school_id        UUID NOT NULL REFERENCES schools(id)
      password_hash    VARCHAR(255) NOT NULL   -- Django-managed (PBKDF2/argon2)
      force_password_change  BOOLEAN NOT NULL DEFAULT TRUE
      name             VARCHAR(200) NOT NULL
      email            VARCHAR(320) UNIQUE NOT NULL
      role             VARCHAR(20) NOT NULL CHECK (role IN ('admin','teacher','student'))
      is_active        BOOLEAN NOT NULL DEFAULT TRUE
      created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
      updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
    }
    
    -- Teacher-authored course briefs. One teacher per course in MVP.
    TABLE courses {
      id               UUID PRIMARY KEY DEFAULT gen_random_uuid()
      school_id        UUID NOT NULL REFERENCES schools(id)
      teacher_id       UUID REFERENCES users(id)                -- Nullable: NULL when teacher is deactivated and course is unassigned
      title            VARCHAR(200) NOT NULL
      subject          VARCHAR(100) NOT NULL
      target_level     VARCHAR(100) NOT NULL
      learning_outcomes        TEXT NOT NULL
      topic_sequence           TEXT NOT NULL
      exam_context             TEXT
      special_instructions     TEXT
      approximate_lessons      INTEGER NOT NULL CHECK (approximate_lessons BETWEEN 10 AND 120)
      status           VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','archived'))
      created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
      updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
    }
    
    -- Links students to courses. Independent context per enrollment.
    TABLE enrollments {
      id               UUID PRIMARY KEY DEFAULT gen_random_uuid()
      course_id        UUID NOT NULL REFERENCES courses(id)
      student_id       UUID NOT NULL REFERENCES users(id)
      status           VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','unenrolled'))
      last_session_at  TIMESTAMPTZ
      enrolled_at      TIMESTAMPTZ NOT NULL DEFAULT now()
      UNIQUE (course_id, student_id)
    }
    
    -- Session lifecycle. State machine per Section 10.
    TABLE sessions {
      id               UUID PRIMARY KEY DEFAULT gen_random_uuid()
      enrollment_id    UUID NOT NULL REFERENCES enrollments(id)
      session_number   INTEGER NOT NULL
      status           VARCHAR(20) NOT NULL DEFAULT 'pending'
                       -- CHECK (status IN ('pending','generating','active','assessing','complete','abandoned'))
                       -- No 'failed' value: a failed generation deletes the row (SESS-03).
      started_at       TIMESTAMPTZ
      completed_at     TIMESTAMPTZ
      time_on_lesson_secs  INTEGER
      UNIQUE (enrollment_id, session_number)
    }
    
    -- Generated lesson content. One per session. Immutable after creation.
    TABLE lessons {
      id               UUID PRIMARY KEY DEFAULT gen_random_uuid()
      session_id       UUID UNIQUE NOT NULL REFERENCES sessions(id)
      lesson_title     VARCHAR(300) NOT NULL
      blocks           JSONB NOT NULL             -- Array of block objects per Section 13.2
      key_concepts     JSONB NOT NULL             -- String array, 3-5 items
      estimated_read_minutes  INTEGER
      has_interactive  BOOLEAN NOT NULL DEFAULT FALSE
      agent_plan       TEXT NOT NULL             -- Contents of <plan> tags. Never shown to users.
      prompt_context   JSONB NOT NULL             -- Full context object passed to agent. Diagnostics.
      raw_response     TEXT NOT NULL             -- Full raw agent response before parsing.
      generated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
    }
    
    -- MCQ assessment for each lesson.
    TABLE assessments {
      id               UUID PRIMARY KEY DEFAULT gen_random_uuid()
      lesson_id        UUID UNIQUE NOT NULL REFERENCES lessons(id)
      questions        JSONB NOT NULL
        -- Array of: { question_text, concept_tag, options:[{id,text}],
      --   correct_option_id, correct_explanation, wrong_explanations:{id:text} }
      generated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
    }
    
    -- Student responses. One row per question. Posted immediately on confirmation.
    TABLE assessment_responses {
      id               UUID PRIMARY KEY DEFAULT gen_random_uuid()
      assessment_id    UUID NOT NULL REFERENCES assessments(id)
      session_id       UUID NOT NULL REFERENCES sessions(id)
      question_index   INTEGER NOT NULL CHECK (question_index BETWEEN 0 AND 3)
      selected_option  VARCHAR(5) NOT NULL
      is_correct       BOOLEAN NOT NULL
      answered_at      TIMESTAMPTZ NOT NULL DEFAULT now()
      UNIQUE (assessment_id, session_id, question_index)
    }
    
    -- Session history summary. Written on session COMPLETE. Immutable. Read by Context Assembly.
    TABLE session_history {
      id               UUID PRIMARY KEY DEFAULT gen_random_uuid()
      enrollment_id    UUID NOT NULL REFERENCES enrollments(id)
      session_id       UUID UNIQUE NOT NULL REFERENCES sessions(id)
      session_number   INTEGER NOT NULL
      lesson_title     VARCHAR(300) NOT NULL
      key_concepts_covered  JSONB NOT NULL      -- String array; matches the §15.1 field name
      had_interactive  BOOLEAN NOT NULL DEFAULT FALSE
      assessment_outcome   VARCHAR(30) NOT NULL
                           -- CHECK (assessment_outcome IN ('strong','adequate','needs_reinforcement','not_taken'))
      concepts_missed  JSONB NOT NULL DEFAULT '[]'   -- String array
      time_on_lesson_secs  INTEGER
      completed_at     TIMESTAMPTZ NOT NULL
    }

18

## Non-Functional Requirements

Category| Requirement| Priority  
---|---|---  
**Security**|  All traffic served over HTTPS. HTTP redirected. TLS 1.2 minimum. Enforced by Railway's proxy layer.| MUST  
**Security**|  All API endpoints require a valid Django-issued JWT. Student data is only accessible to: the student themselves, their course teacher, and the school admin. No cross-school data access at any layer.| MUST  
**Security**|  Interactive HTML blocks are sandboxed via iframe with sandbox="allow-scripts" only — no allow-same-origin. Server-side validation before storage per AGENT-05.| MUST  
**Performance**|  All UI interactions excluding AI generation calls respond within 1 second. AI generation displays a streaming lesson (tokens visible within 3 seconds of session start) rather than a blank loading screen.| SHOULD  
**Deployment**|  Django runs under Gunicorn with Uvicorn workers (ASGI). Procfile: gunicorn paideia.asgi:application -k uvicorn.workers.UvicornWorker. Minimum 2 workers for MVP. This is non-negotiable for async views to function correctly.| MUST  
**Streaming**|  Railway nginx proxy buffering is disabled via X-Accel-Buffering: no header on all SSE endpoints. Without this, streaming is silently degraded to batch delivery.| MUST  
**Browser Support**|  Desktop web only. Chrome, Firefox, Safari, Edge — last 2 major versions each. Mobile browser support not required for MVP.| MUST  
**Data**|  Daily automated database backups via Railway. 30-day retention. Restore procedure documented and tested before pilot school goes live.| MUST  
**Logging**|  All Anthropic API calls logged with: timestamp, session_id, enrollment_id, model version, prompt token count, completion token count, response time, success/failure. Retained 90 days. Primary diagnostic tool for content quality issues.| MUST  
**Scale**|  MVP targets: 1 pilot school, up to 5 active courses, up to 200 enrolled students, up to 50 concurrent sessions. No horizontal scaling required beyond this for MVP phase.| SHOULD  
**Environment**|  Separate Railway environments for development, staging, and production. Staging uses a separate Anthropic API key with usage alerts. Production ANTHROPIC_MODEL_VERSION is independently configurable from staging.| SHOULD  
  
19

## Acceptance Criteria

The MVP is complete when every criterion below is verifiably demonstrated. These are tests, not aspirations. Each must be shown working — not asserted.

  * AC-01An administrator can create a school account, create one teacher account, create five student accounts, and assign all five to a single course — completing the full setup flow without technical assistance.
  * AC-02A teacher can create a complete course brief, activate it, enroll five students directly from the teacher interface, and see those students in the progress view — without requiring any admin action beyond initial account creation.
  * AC-03A student can initiate a session and see the first streamed text appear within 3 seconds. Text content renders progressively as it streams; interactive blocks appear once the lesson completes and the parsed block array is fetched. Total lesson delivery completes within 30 seconds.
  * AC-04A lesson containing an interactive block renders the iframe correctly. The student can interact with the visual. Closing the interactive does not affect the rest of the lesson. The interactive block has no access to the parent page (verified by attempting window.parent.document access in browser console — must throw security error).
  * AC-05A student completes the 4-question assessment question by question. Each answer confirmation immediately shows correct/incorrect feedback and explanation. The session summary is correct and the session is marked complete.
  * AC-06A student who completes 5 sequential sessions receives lessons that do not meaningfully repeat already-covered content at the same depth. Verified by independent review of 5 lesson titles and key concept lists.
  * AC-07A student who scores ≤2/4 on Session N receives a lesson in Session N+1 or N+2 that demonstrably revisits one or more missed concepts from Session N. Verified by comparing concepts_missed from history to key_concepts in subsequent lesson.
  * AC-08A student who closes their browser mid-lesson returns to find the same lesson loaded — not regenerated. A student who closes during the assessment returns to find their already-answered questions preserved.
  * AC-09If the Anthropic API returns an error, the student sees a clean error message and returns to their course home. Their session count does not increment. No partial or broken lesson is shown.
  * AC-10No student can access another student's lessons, history, or assessment results. Verified by attempting cross-student data access via authenticated API calls with a different student's token — all must return 403.
  * AC-11The full prompt context for any session is retrievable from logs by session_id with enough information to exactly reproduce the generation call that produced the lesson.
  * AC-12An interactive block whose HTML fails server-side validation is replaced in the block array with a plain text fallback block. The lesson is delivered with all other blocks intact and the fallback in the failed block's place. The failure is logged. No error is shown to the student.
  * AC-13A teacher authenticated with a valid JWT cannot access the progress view, lesson content, or enrollment list of a course they do not own. Such requests return 404 — the resource is outside the teacher's visible scope, and 404 (not 403) is the deliberate anti-enumeration policy. Verified by direct API call with the teacher's token against another teacher's course endpoints.
  * AC-14When a teacher account is deactivated, their active courses remain accessible to enrolled students. Students can open sessions and receive generated lessons without interruption. The admin sees the deactivated teacher's courses flagged for reassignment in the admin panel.

Section 20 — Post-MVP Capabilities

## Full System Capability Roadmap

These capabilities are outside MVP scope and must not be built in this phase. They are catalogued here to ensure MVP architecture decisions leave room for them, and to define the full product vision beyond the core loop.

Curriculum

#### National Curriculum Standards Mapping

Structured integration of regional frameworks (WAEC, Common Core, UK NC, IB, IGCSE, CBC). Agent anchors lessons to specific learning objectives. Standards coverage tracked per student.

Curriculum

#### Prerequisite & Dependency Graphs

Subject-level knowledge graph enforcing pedagogical sequencing. Prevents the agent from generating content that requires knowledge the student hasn't been exposed to.

Teacher Tools

#### Content Review & Approval Queue

Pre-delivery teacher review of AI-generated lessons. Configurable per course: pre-delivery approval, post-delivery audit, or full trust. Annotation tools and override capability.

Teacher Tools

#### Concept Struggle Maps

Visual per-student and per-class maps of concepts consistently missed. Identifies students needing in-class intervention. Bridges AI-generated learning with teacher-led instruction.

Safety

#### Content Moderation Layer

Automated age-appropriateness filtering and harmful content detection in the generation pipeline. Hard-block and soft-flag modes with escalation to teacher and admin.

Safety

#### Fact Confidence Scoring

Heuristic layer flagging low-confidence factual claims in generated content for teacher review. Critical for science, history, and current affairs subjects.

Assessment

#### Open-Ended & Short-Answer Assessment

AI-evaluated open-ended questions testing higher-order thinking beyond MCQ. Rubric generation, answer evaluation, and qualitative feedback per response.

Assessment

#### Exam Simulation Mode

Course-end full mock exam aligned to the exam_context from the course brief. Timed and invigilated mode with post-submission detailed review per question.

Personalisation

#### Teaching Style Adaptation

Beyond content difficulty — the agent adapts its pedagogical approach (Socratic, worked examples, analogy-led, direct instruction) based on inferred student preference signals.

Rendering

#### Video & External Media Embeds

Agent-sourced or teacher-approved video embeds for subjects where motion and narration are essential to understanding. Requires a content sourcing strategy separate from generation.

Stakeholders

#### Parent Portal

Guardian-facing progress digests in plain language. Parental consent management, data rights dashboard, and opt-in weekly summaries. Handles COPPA and GDPR-K consent flows.

Stakeholders

#### Admin Analytics Console

School-wide reporting: standards coverage compliance, cohort performance comparisons, AI content quality metrics, and licence utilisation. The dashboard that sells renewals.

Infrastructure

#### SSO & Identity Provider Integration

Google Workspace, Microsoft 365, and SAML 2.0 via a library such as python-social-auth or django-allauth. Eliminates school-managed credentials. Maps existing identity to Paideia roles automatically.

Infrastructure

#### Offline / Low-Connectivity Mode

Pre-generation of lesson batches for low-connectivity environments. Lessons cached to device. Assessment responses queued locally and synced on reconnection. Critical for emerging market adoption.

Infrastructure

#### Data Residency & Compliance Controls

Regional storage for strict localisation markets (EU GDPR, POPIA, UK DPA). Configurable anonymisation for AI API calls. Required before entering regulated markets at scale.

Engagement

#### Engagement & Motivation Layer

Progress milestones, streak tracking, concept mastery badges, and optional peer challenge modes. Designed for younger learners who need motivation mechanics beyond content quality alone.

Engagement

#### Mobile Application

Native iOS and Android with full lesson delivery, assessment, and progress. Push notifications for session reminders. Full offline support via cached lesson bundles.

Platform

#### Paideia API

Exposed curriculum generation as a standalone API product for EdTech developers. Standards-aligned, age-appropriate lesson and assessment generation for third-party integrations.

PAIDEIA · PAI-FSD-001 · v2.0 Draft · MVP Functional Specification

Internal — Confidential
