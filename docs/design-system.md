# Paideia — Design System (PAI-DS-001 v1.0)

> Auto-generated from the canonical HTML spec. This is the agent-readable copy. If anything here conflicts with a later human edit, the HTML in /spec-source is the visual master; this Markdown is the working reference.

---

PAI _DEIA_

Design System · v1.0

Doc IDPAI-DS-001

StatusDraft

Pairs withFSD v2 · TSD v1

Foundation

01 — Overview 02 — Brand Voice

Tokens

03 — Color System 04 — Typography 05 — Layout & Spacing 06 — Elevation 07 — Shapes

Components

08 — Buttons 09 — Cards & Containers 10 — Inputs & Forms 11 — Tabs & Navigation 12 — Badges & Tags

Signatures

13 — The Lesson Card 14 — Interactive Frame 15 — Assessment Engine 16 — Subject Taxonomy

Role Surfaces

17 — Student Interface 18 — Teacher Interface 19 — Admin Interface

Reference

20 — Do's & Don'ts 21 — Responsive 22 — Iteration Guide 23 — Known Gaps

Paideia · Design System · v1.0

# The shape of _thinking_

A modern-classical design system for an AI-driven learning environment — built for students, teachers, and administrators in primary and secondary schools.

Document

PAI-DS-001

Version

1.0 — Draft

Stack

Next.js · Tailwind

Type Library

Fraunces · Geist · JetBrains Mono

Surfaces

Admin · Teacher · Student

Classification

Internal — Confidential

01

## Overview

Paideia presents itself as a quiet, intellectually serious learning environment — built around the idea that an AI agent generates an entire course one lesson at a time, shaped by each individual student. The design system carries that idea visually: parchment surfaces that feel like paper, a serif display face that says _this is serious work_ , and a restrained, editorial geometry that resists the bright primary saturation common in EdTech for children.

The system is built for three distinct surfaces — the student's learning interface, the teacher's authoring and progress views, and the admin's institutional console — that share one vocabulary but express it at different temperatures. Students see warm parchment, generous serif typography, and lesson cards that feel like reading. Teachers see a more functional, denser surface tuned for quick review. Admins see institutional clarity.

paideia

Three things distinguish Paideia from typical EdTech and SaaS systems:

Distinction| Why  
---|---  
**Parchment, not white**|  The canvas is warm cream (`#FAF6EE`) rather than pure white. Lessons feel like reading — a deliberate move away from the SaaS dashboard aesthetic, toward something that reads as _content_.  
**Serif display, sans body**|  Fraunces (a variable serif with personality) sets every headline and lesson title. Geist (a clean modern grotesque) handles UI labels and body. The serif signals intellectual seriousness; the sans keeps the interface scannable.  
**Ink-blue and ochre, not purple**|  The primary is deep ink-blue (`#1C2A4A`) — the colour of dried ink on a page. The accent is classical ochre gold (`#B8862C`). The system deliberately avoids the purple-on-white palette that dominates AI-product EdTech.  
  
**The Lesson is the Hero** Every component in this system is in service of one moment: a student opening a lesson and reading. The Lesson Card (Section 13) is the signature surface — every other surface exists to lead to it, configure it, or report on it. When making design decisions, ask: _does this serve the lesson?_

02

## Brand _voice_ & aesthetic direction

2.1Three Words

If the brand could only express three qualities, they would be these. Every visual decision is in service of at least one.

Serious

Trusted by educators

Editorial geometry, ink colours, restrained motion

Warm

Inviting to students

Parchment surfaces, serif headlines, soft hairlines

Considered

Built with care

Generous whitespace, tight typography, no clutter

2.2What We Are Not

It is sometimes easier to define a system by what it refuses to be.

Not this| Because  
---|---  
Saturated primary-colour playfulness (yellow buttons, comic-sans warmth)| It reads as childish to the older end of the student range (14–18) and undermines teacher and admin trust.  
Purple-on-white AI-product aesthetic| Crowded space, already owned by Notion in adjacent productivity. We need to look different to feel different.  
Dashboard-first SaaS minimalism| The student experience is reading, not scanning a dashboard. The visual hierarchy should reflect that.  
Heavy motion, animated illustrations, parallax| The hero of every interaction is text content. Motion competes with reading.  
Stock education imagery — pencils, apples, blocks| Visual clichés. The product is not "like school" — it's a new thing.  
  
03

## Color _system_

Colour anchors the brand. The system has four layers — primary & accent, surfaces, text, and a subject taxonomy that ties courses to a warm earth palette rather than the bright primaries common in education software.

3.1Primary & Accent

The dominant brand colour is deep **ink-blue** — the colour of dried ink on parchment. It carries every primary CTA, every active state, every focused control. The accent is **ochre gold** , the classical reference. It appears sparingly, as emphasis: a key indicator, a context line, a single highlighted detail in a long list.

Ink Primary

\--ink-primary

#1C2A4A

Ink Primary Pressed

\--ink-primary-pressed

#14213E

Ink Primary Deep

\--ink-primary-deep

#0E1830

Ochre

\--ochre

#B8862C

Ochre Soft

\--ochre-soft

#D4A851

Ochre Deep

\--ochre-deep

#8B6520

3.2Surfaces

The canvas is the most important colour decision in the system. It is not white. It is warm parchment cream — paper, not pixels. Cards sit on it as a slightly cooler surface, creating the gentle separation that makes content legible without hard contrast.

Canvas

\--canvas

#FAF6EE · main page

Canvas Soft

\--canvas-soft

#F5EFE1 · section divisions

Surface

\--surface

#FFFFFF · cards

Surface Warm

\--surface-warm

#FBF7EF · alt cards

Surface Deep

\--surface-deep

#1C2A4A · sidebar / dark

Surface Deep Soft

\--surface-deep-soft

#243154 · dark sections

**Why parchment, not white** White SaaS surfaces read as _dashboard_. Cream parchment reads as _content_. Lessons are content. The canvas decision is structural — it tells the eye that this is something to read, not something to manage. 

3.3Text

Text colours are a six-step ladder from deepest emphasis to lightest disabled state. Body copy sits at `--ink` — a deep ink-black that is not pure black, warming slightly against the parchment canvas. Pure black would feel like a cold inkjet print; this feels like letterpress.

Ink Deepest

\--ink-deepest

#0A0E1F · highest emphasis

Ink

\--ink

#1A1F2E · primary text

Charcoal

\--charcoal

#2C3142 · body

Slate

\--slate

#525872 · secondary

Steel

\--steel

#767C92 · tertiary

Stone

\--stone

#9A9EB0 · muted labels

3.4Subject Taxonomy

Education software typically uses bright primary colours for subjects — red for math, blue for science, green for english. That palette reads as childish and clashes with the parchment canvas. The Paideia taxonomy uses a **warm earth palette** : terracotta, sage, plum, sienna, dusty blue, mustard, rose, teal. Each subject has a deep value (for the pill background) and a tint (for course-card surfaces). They harmonise with each other and with the canvas. A page showing eight different subjects should look _composed_ , not loud.

Mathematics

\--subj-math · terracotta

#9A4A3E

Science

\--subj-science · sage

#4A7359

English & Literature

\--subj-english · plum

#6E3E6E

History

\--subj-history · sienna

#A6611F

Geography

\--subj-geography · dusty blue

#4A6379

Languages

\--subj-languages · mustard

#94762A

Art & Music

\--subj-art · rose

#97506B

PE & Wellbeing

\--subj-pe · teal

#2F6C6C

Mathematics Science English History Geography Languages Art & Music PE

3.5Semantic

Semantic colours reuse the earth palette. Success borrows from `--subj-science` (sage), warning from `--subj-history` (sienna), error from a brick-red sibling. This keeps the palette cohesive — there are no fluorescent greens or screaming reds breaking the warmth.

Success

\--success

#4A7359 · sage

Warning

\--warning

#A6611F · sienna

Error

\--error

#9A3A2E · brick

04

## Typography

A serif display face for moments of weight; a clean grotesque for everything else; a monospace for system text. The combination signals intellectual seriousness without becoming stuffy — Fraunces in particular has a softness that pairs with the parchment canvas and keeps the system from feeling cold.

4.1Font Families

Fraunces

a variable serif with personality

Used for display, headlines, lesson titles, and italic emphasis throughout. Variable axes for optical size (`opsz`) and softness (`SOFT`) let it scale naturally from a 72px page title down to a 14px course-card label. Pulled from Google Fonts — free, open source.

Geist

a modern grotesque for the UI

Body text, button labels, form fields, navigation, table cells — every UI element that is not a headline or a lesson title. By Vercel, free and open source. Pairs cleanly with Fraunces because both share a slightly elevated x-height and the same modern proportions.

JetBrains Mono

system text · codes · metadata

Document IDs, session numbers, requirement codes, eyebrow labels, all-caps metadata. Used at small sizes with letter-spacing for label-style typography.

4.2Typographic Scale

Token| Family| Size| Weight| Line| Use  
---|---|---|---|---|---  
`type.display`| Fraunces| 72px| 400| 0.98| Doc headers, hero titles. Variable axes `opsz` 144, `SOFT` 30.  
`type.heading-1`| Fraunces| 48px| 500| 1.05| Page-level headlines, section openers.  
`type.heading-2`| Fraunces| 36px| 400| 1.10| Subsection headlines.  
`type.heading-3`| Fraunces| 26px| 500| 1.15| Lesson titles, course-card titles.  
`type.heading-4`| Fraunces| 20px| 500| 1.25| Subsection titles, card titles.  
`type.heading-5`| Fraunces| 17px| 500| 1.3| FAQ questions, small heads.  
`type.subtitle`| Fraunces italic| 22px| 300| 1.4| Page subtitle, lesson context line.  
`type.body-lg`| Geist| 17px| 400| 1.65| Lesson body text — student reading.  
`type.body`| Geist| 15px| 400| 1.65| UI body, descriptions.  
`type.body-medium`| Geist| 15px| 500| 1.55| Body emphasis.  
`type.body-sm`| Geist| 13px| 400| 1.55| Captions, secondary copy.  
`type.button`| Geist| 14px| 500| 1.3| Button labels.  
`type.label-mono`| JetBrains Mono| 10–11px| 500| 1.4| Eyebrow labels, metadata, ID codes. Letter-spacing 0.18–0.22em.  
  
4.3Principles

Principle| Detail  
---|---  
Italics carry meaning| Fraunces italic is the one place the system permits visual flourish — used for subtitles, context lines, and a single emphasized word in a long headline. Never for body text.  
Tight headlines, generous body| Display sizes use negative letter-spacing (-0.02em) and tight leading (0.98–1.10). Body uses default tracking and 1.65 leading — readability is the priority.  
Variable axes are used| Fraunces' `opsz` axis adjusts contrast for size; `SOFT` rounds the terminals. Larger sizes get higher `opsz` and lower `SOFT`; smaller sizes the inverse.  
Mono is a label, not content| JetBrains Mono is only used for short metadata strings — document IDs, codes, eyebrow labels. Never for paragraphs of code or content.  
One emphasis per headline| Italicising one word in a long headline is the system's signature move (_The shape of thinking_). Never two words in one headline.  
  
05

## Layout & _spacing_

The spacing system uses a 4px base. Eight tokens cover the full range, from `--s-xxs` (4px) up to `--s-section-lg` (120px). Marketing pages and document layouts use the larger end of the range; UI surfaces use the smaller end.

5.1Spacing Scale

\--s-xxs · 4

\--s-xs · 8

\--s-sm · 12

\--s-md · 16

\--s-lg · 24

\--s-xl · 32

\--s-xxl · 48

\--s-section · 80

\--s-section-lg · 120

5.2Grid & Container

Surface| Max width| Gutter| Section rhythm  
---|---|---|---  
Student lesson view| 720px (reading measure)| 32px| \--s-xxl (48px) between blocks  
Teacher dashboard| 1280px| 32px| \--s-xl (32px) between cards  
Admin console| 1440px| 32px| \--s-lg (24px) between rows  
Course brief editor| 880px| 32px| \--s-xl (32px) between fields  
Documents (FSD/TSD/this)| 1100px| 72px| \--s-section (80px) between sections  
  
5.3Whitespace Philosophy

The student lesson view is the most generous of all surfaces — a 720px reading measure with 48px between blocks. The reading measure (~65 characters per line) is a deliberate constraint that tells the eye _this is a text to read_. Wider would feel like a document; narrower would feel cramped.

The teacher dashboard is denser. Information is the product. Whitespace exists to separate logical groups, not to feel airy.

06

## Elevation & depth

Five levels. The system uses elevation sparingly — most surfaces are flat with hairline borders, because the parchment canvas already creates atmospheric depth. Shadows are reserved for surfaces that need to feel _above_ the page — the Lesson Card, modals, dropdowns.

Level| Token| Treatment| Use  
---|---|---|---  
0| flat| 1px `--hairline` border, no shadow| Default cards, table rows, list items  
1| `--shadow-1`| `0 1px 2px rgba(28,42,74,0.05)`| Hover-elevated tiles, subtle lift  
2| `--shadow-2`| `0 4px 16px rgba(28,42,74,0.08)`| Feature cards, popovers  
3| `--shadow-3`| `0 24px 56px -12px rgba(28,42,74,0.22)`| The Lesson Card — signature elevation  
4| `--shadow-4`| `0 16px 48px -8px rgba(28,42,74,0.18)`| Modals, dropdown menus  
  
**Shadow Colour Note** All shadows are tinted with the ink-primary blue (`rgba(28,42,74,...)`), not pure black. Black shadows on a cream canvas read as cold and grey-out. Tinted shadows feel like depth in a warm-lit space — which is what the system is.

07

## Shapes

The geometry is editorial — less rounded than Notion, more rounded than brutalist systems. Buttons are 6px, cards are 10px, larger feature surfaces are 14–20px. Pills (`--r-full`) are reserved for status badges and subject pills, never used for buttons.

\--r-xs · 3px

\--r-sm · 5px

\--r-md · 6px

\--r-lg · 10px

\--r-xl · 14px

\--r-xxl · 20px

\--r-full · pill

Token| Value| Use  
---|---|---  
`--r-xs`| 3px| Token codes, inline chips, tiny tags  
`--r-sm`| 5px| Concept tags, small badges  
`--r-md`| 6px| Buttons, text inputs, search bar  
`--r-lg`| 10px| Cards, lesson card, course tiles  
`--r-xl`| 14px| Larger feature panels, modals  
`--r-xxl`| 20px| Showcase surfaces (rare)  
`--r-full`| 9999px| Subject pills, status badges, avatars  
  
08

## Buttons

Buttons are rectangles with 6px radius — sober, editorial, intentionally less rounded than the Notion-style pill aesthetic. Five variants cover every interaction.

Continue lesson Accent action Save draft Cancel

Sign in Learn more

Variant| Use| Background| Text  
---|---|---|---  
`btn-primary`| Dominant CTA — one per surface| `--ink-primary`| `--on-primary`  
`btn-ochre`| Accent action — used sparingly, signals importance distinct from primary| `--ochre`| `--on-primary`  
`btn-secondary`| Outlined secondary action| transparent| `--ink-primary`  
`btn-ghost`| Tertiary, dismiss, cancel| transparent| `--charcoal`  
`btn-on-dark`| Primary on dark surfaces (sidebar, footer)| `--on-dark`| `--ink-primary-deep`  
  
**Hierarchy Rule** There is one `btn-primary` per surface. If a screen seems to need two, one of them is not actually primary — re-classify it as `btn-ochre` or `btn-secondary`. Two ink-blue primaries side by side create visual confusion about which is the intended action. 

09

## Cards & containers

Cards sit on the parchment canvas as cooler surfaces with hairline borders. Most are flat — elevation is reserved for the Lesson Card (Section 13) and modals.

Course · Year 10

Cell Biology & Genetics

An introduction to the cell, DNA, and inheritance.

Science

Course · Year 9

Geometric Foundations

Lines, angles, triangles, and the start of proof.

Mathematics

Course · Year 11

The Romantics

Wordsworth, Coleridge, and the long century.

English

Variant| Use| Surface| Border| Padding  
---|---|---|---|---  
`card-base`| Standard content card| `--surface`| 1px `--hairline`| `--s-lg` (24px)  
`card-course`| Course tile on student/teacher home| `--surface`| 1px `--hairline`| `--s-lg`  
`card-warm`| Alternate surface against canvas| `--surface-warm`| 1px `--hairline`| `--s-lg`  
`card-elevated`| Lifted card with subtle shadow| `--surface`| 1px `--hairline`| `--s-xl` (32px); `--shadow-2`  
`card-deep`| Card on dark sections (footer, sign-in)| `--surface-deep`| 1px `--hairline-deep`| `--s-xl`  
`card-lesson`| Signature lesson surface — see §13| `--surface`| 1px `--hairline`| `--s-xxl` (48px); `--shadow-3`  
  
10

## Inputs & forms

Form fields are 44px tall with 6px radius, hairline-strong borders, and an ink-primary focus ring. The course brief editor uses larger text inputs with serif-friendly leading for long-form writing.

Course title

Used by the agent to label every generated lesson 24 / 200

Learning outcomes Students will be able to describe the structure of plant and animal cells, explain the role of DNA in inheritance, and predict offspring genotypes using Punnett squares.

Variant| Surface| Border (rest)| Border (focus)| Height  
---|---|---|---|---  
`input-text`| `--surface`| 1px `--hairline-strong`| 2px `--ink-primary`| 44px  
`input-textarea`| `--surface`| 1px `--hairline-strong`| 2px `--ink-primary`| min 120px  
`input-brief`| `--surface-warm`| 1px `--hairline`| 2px `--ink-primary`| min 200px · serif body  
`search-pill`| `--canvas-soft`| 1px `--hairline`| 2px `--ink-primary`| 40px  
  
11

## Tabs & _navigation_

Two tab variants and one nav. The segmented underline-tab is the system's default — quiet, editorial. The pill tab is reserved for filters and switchable views. The top nav is parchment with a hairline bottom border; the sidebar (this document's left panel) is the deep ink-primary surface.

Lessons

Progress

Course brief

Settings

All courses

Active

Drafts

Archived

Variant| Use  
---|---  
`tab-segmented`| Primary navigation within a surface — Lessons / Progress / Brief / Settings. Default style.  
`tab-pill`| Filter switcher — All / Active / Drafts / Archived. Used for scoping or sorting lists.  
`nav-top`| Top navigation bar — parchment surface, hairline bottom border, height 64px.  
`nav-side`| Vertical role-scoped nav — admin surfaces use deep ink-primary; teacher and student use parchment.  
  
12

## Badges & tags

Three kinds: status badges (semantic), concept tags (lesson key concepts), and subject pills (the taxonomy). Each has a distinct radius — pills are `--r-full`, concept tags are `--r-sm`, status badges are `--r-sm`. The shape difference helps the eye categorise them at a glance.

Strong · 4 of 4 Adequate · 3 of 4 Needs reinforcement · 2 of 4 Not taken

osmosis concentration gradient semi-permeable membrane diffusion

Variant| Use| Shape  
---|---|---  
`badge-outcome-strong`| Assessment outcome — 4/4| `--r-sm` with `--success-tint`  
`badge-outcome-adequate`| Assessment outcome — 3/4| `--r-sm` with ochre tint  
`badge-outcome-reinforce`| Assessment outcome — ≤2/4| `--r-sm` with `--warning-tint`  
`badge-outcome-not-taken`| Session abandoned during assessment| `--r-sm` with neutral tint  
`concept-tag`| Lesson key concept chip| `--r-sm` · ink-primary on tinted background  
`subject-pill`| Subject taxonomy indicator| `--r-full` · dot + label · uses the subject's tint and value  
`badge-status-active`| Course status pill| `--r-full` · sage on cream  
`badge-status-draft`| Draft course| `--r-full` · stone on cream  
  
13

## The _Lesson Card_ — signature surface

The Lesson Card is the single most important surface in the system. Every other surface exists to lead to it. It is where the student does the thing the product was built for — reading a lesson generated for them, just then, by an AI agent. Its visual language was designed before anything else and constrains everything that surrounds it.

Session 8 of ~40 · Year 10 Biology

### Osmosis & the Semi-Permeable Membrane

Today's lesson revisits _concentration gradient_ from your last session.

osmosis concentration gradient semi-permeable membrane water potential

Osmosis is the movement of water molecules across a semi-permeable membrane — a barrier that lets some molecules through but not others. It always moves water from a region where there is _more_ water to a region where there is _less_.

Think of a cell sitting in a glass of pure water. Inside the cell, the water is mixed with salts and sugars — so there is, in a sense, less water per unit volume. Outside, the water is undiluted. Water will move _into_ the cell, swelling it.

13.1Anatomy

Region| Token| Note  
---|---|---  
Surface| `--surface` · `--r-lg` · `--shadow-3`| The signature elevation — Level 3 shadow against the parchment canvas.  
Padding| `--s-xxl` (48px) horizontal · `--s-xl` (32px) vertical| Generous reading whitespace. Reading measure ~65ch.  
Eyebrow line| `type.label-mono` · `--ochre-deep`| Session number + subject metadata. The only mono on the card.  
Title| `type.heading-3` Fraunces 26/1.15| The lesson title, generated by the agent. Italic emphasis on one word only.  
Context line| `type.subtitle` Fraunces italic 22/1.4 · `--slate`| The line that makes adaptation visible to the student (FSD PROG-06).  
Concept tags| `concept-tag` chips| 3–5 key concepts the lesson covers.  
Body| `type.body-lg` Geist 17/1.65 · `--charcoal`| The student's reading text. Italic Fraunces inline for inline emphasis (rare).  
  
**Decisions Made Here Cascade** The Lesson Card's choices — generous padding, the eyebrow line in ochre mono, the italic context line, the concept tags above the body — set the visual vocabulary every other surface follows. If you are designing a new component and unsure what tone to take, look at the Lesson Card first. 

14

## Interactive Frame

The Interactive Frame is the sandboxed iframe wrapper for interactive lesson blocks (the simulations, graphs, and explorables generated as part of a lesson per the FSD §13.4). It is technically just a frame around an iframe — but visually it needs to belong to the Lesson Card it sits inside.

Interactive · Concentration gradient simulation

drag the slider

[ sandboxed iframe content — simulation renders here ]

Region| Token| Note  
---|---|---  
Container| `--surface` · `--r-lg` · 1px `--hairline`| Sits inside the Lesson Card. No additional elevation — it inherits the card's shadow.  
Header bar| `--canvas-soft` background · 1px `--hairline` bottom| Carries the ochre dot + interactive label (mono) and a hint. Establishes that this is a different kind of content.  
Frame| `sandbox="allow-scripts"`, no `allow-same-origin`| Per TSD §12.3 — security is non-negotiable.  
Fallback state| `--canvas-soft` background · italic Fraunces message · ~120px height| When the iframe fails to handshake within 4s (TSD §12.3 / FSD REND-02).  
  
15

## Assessment Engine

The post-lesson MCQ runs in a state machine of four states (FSD §13.5): IDLE, ANSWERING, REVEALED, COMPLETE. Each state has a distinct visual signature. The engine sits inside the same card surface as the Lesson — there is no jarring transition between reading and assessment.

Question 3 of 4

If a plant cell is placed in pure water, what is most likely to happen?

concept: osmosis

**A** Water will move out of the cell, causing it to shrink.

**B** Water will move into the cell, causing it to swell.

**C** Nothing will happen — the membrane blocks water entirely.

**D** Salts will move out of the cell into the water.

Confirm answer

State| Signature  
---|---  
IDLE| Just the primary CTA — "Start assessment" — at the bottom of the Lesson Card. Sticky position so it's reachable while reading.  
ANSWERING| Question card with the progress stepper (4 pills), question in Fraunces 22, concept line in italic, four answer options at `--r-md`. Selected option gets 2px `--ink-primary` border and tinted background.  
REVEALED| Correct answer outlined in `--success` with explanation in italic Fraunces below; wrong selection (if any) outlined in `--error` with its specific explanation.  
COMPLETE| Session summary card — outcome badge, score, per-concept correctness, "Continue to next session" primary CTA.  
  
16

## Subject taxonomy — _in use_

The eight subject colours from §3.4 form a taxonomy that runs through the entire system. Every course, every lesson, every assessment carries its subject identity. The taxonomy is used in three places consistently:

Surface| Treatment  
---|---  
Course card| Subject pill in the bottom-left of the card. Tint version (e.g. `--subj-science-tint`) as a 4px left-edge stripe.  
Lesson Card eyebrow| Subject name appears after the session number in the ochre mono eyebrow ("Session 8 of ~40 · Year 10 Biology").  
Progress views| Per-course rows carry the subject's tint as a faint background fill (4% opacity) so cohorts are visually grouped.  
  
**When a Subject Doesn't Fit** Teachers may create courses in subjects outside the eight taxonomy entries — "Critical Thinking", "Study Skills", "Computing". The system uses `--steel` as the default neutral when no taxonomy match exists. The teacher can pick a subject from the taxonomy at brief creation time; if they don't, the neutral is used. Adding new subjects to the taxonomy is a design system version change, not a user setting. 

17

## Student interface

The student surface is the warmest expression of the system. Pure parchment, generous whitespace, Lesson Cards centered in a 720px reading column. The student should feel they are in a quiet room with a book in front of them — not a dashboard.

Element| Treatment  
---|---  
Canvas| `--canvas` · pure parchment edge to edge. No coloured banners, no decorative illustrations.  
Top nav| Parchment with hairline bottom. School wordmark left; student name + course switcher right. Height 64px.  
Course home| Course cards in a 2-up grid. Each card shows session count, last session date, subject pill, and a single primary CTA: _Continue lesson_.  
Lesson view| 720px reading column centered on canvas. Lesson Card with Level-3 shadow. No sidebar — the lesson is the whole surface.  
Streaming state| While the lesson generates, the Lesson Card shell is drawn (header, concept-tag skeletons) and text appears progressively as it streams.  
Assessment view| Same column width as the lesson. The question card replaces the lesson body in the same surface — no modal, no navigation away.  
Progress view| An ordered list of past sessions with title, date, and outcome badge. Re-readable; not re-assessable (FSD PROG-05).  
  
18

## Teacher interface

The teacher surface is denser. The teacher's primary mode is review — they look at their courses, scan student progress, write or edit briefs, and occasionally diagnose a lesson the agent generated. The surface gives them a 1280px workspace with a left sidebar of courses and the main area for whichever course is selected.

Element| Treatment  
---|---  
Canvas| `--canvas` with a `--canvas-soft` left sidebar (280px). The sidebar is parchment-on-parchment, never dark.  
Course sidebar| List of the teacher's own courses, grouped by status (Active / Drafts / Archived), each item showing subject pill + title + student count.  
Main area tabs| Segmented tabs (§11): Lessons · Progress · Course brief · Settings.  
Progress view| Table of enrolled students with sessions-completed sparkline, last session date, most recent outcome badge. Sortable, filterable.  
Course brief editor| Long-form form with serif-friendly large text inputs. Field-level guidance shown inline. The "active sessions warning" (FSD BRIEF-03) appears as a callout above the save button.  
Lesson review| Teacher can open any delivered lesson via the progress view — the Lesson Card renders identically to the student view, with an additional "diagnostic" footer showing the agent's plan and the prompt context (TSD §17).  
  
19

## Admin interface

The admin surface is the most institutional of the three — closer to a quiet operations console than the warm student environment. Same parchment canvas, but with a deep ink-primary left sidebar that signals authority. The admin is configuring the institution, not learning or teaching — the surface reflects that role.

Element| Treatment  
---|---  
Canvas| `--canvas` main area with a `--surface-deep` left sidebar (260px) — the same dark surface as this document's left panel.  
Sidebar nav| School wordmark in `--ochre-soft`; nav groups (Users · Courses · Settings); items in muted parchment text; active item with ochre left border.  
Users view| Paginated table of all users — name, email, role, status. Action menu per row: deactivate, reset password (Clerk), reassign courses (if teacher).  
Courses view| All school courses by teacher, including unassigned courses (deactivated teacher). Unassigned courses flagged with an ochre indicator and quick "Reassign" action.  
Deactivation confirm| Modal at `--shadow-4`. Lists the teacher's active courses and enrolled student counts. Reassignment picker per course before confirmation.  
Empty state| For a freshly licensed school — a single ochre-bordered card guiding through Phase 1: create teachers → create students → teachers create courses.  
  
20

## Do's & _don'ts_

20.1Do

  * ✓Use Fraunces for every headline and every lesson title. The serif is the brand's voice — it carries everywhere.
  * ✓Keep the parchment canvas. It is the most distinctive choice in the system — replacing it with white would make Paideia look like every other SaaS product.
  * ✓Use ochre sparingly — for the eyebrow line, key accents, and where you want the eye to find a single detail. One ochre moment per surface.
  * ✓Italicise one word per headline for emphasis. Fraunces italic is the signature move.
  * ✓Use the subject taxonomy on every course-identifying surface. The pills and tints tie the system together.
  * ✓Apply `--r-md` (6px) to buttons consistently — Paideia uses rectangles, not pills.
  * ✓Apply `--r-lg` (10px) to all card families.

20.2Don't

  * ✕Don't use pure white (`#FFFFFF`) as a page background. Cards can be white; the canvas cannot.
  * ✕Don't pair Fraunces with another serif. It must always sit alongside Geist (or JetBrains Mono for metadata).
  * ✕Don't use bright primary colours for subjects (no #FF0000 red for math, no #00FF00 green for science). The warm earth palette is the taxonomy.
  * ✕Don't use stock education imagery — pencils, apples, blocks, cartoon students. The product is not literal school.
  * ✕Don't use the ink-primary blue as a background for large regions of content. It is a CTA colour and a dark-surface colour, never a tint.
  * ✕Don't use Fraunces italic for body paragraphs. Italics carry emphasis — body italics dilute the signal.
  * ✕Don't add motion to the Lesson Card beyond text streaming. The card is for reading; animation competes with that.

21

## Responsive behaviour

Paideia is desktop-first for MVP (FSD §2). The system below is forward-looking — mobile breakpoints are specified so future iteration follows a consistent pattern, even though the MVP does not ship mobile views.

Breakpoint| Width| Key changes  
---|---|---  
Mobile (small)| < 480px| Single column. Display 36px. Course cards 1-up. Sidebar becomes a top sheet.  
Mobile (large)| 480 – 767px| Display 44px. Course cards 1-up still. Tabs scroll horizontally.  
Tablet| 768 – 1023px| Display 56px. Course cards 2-up. Sidebar collapses to icon strip.  
Desktop| 1024 – 1279px| Display 64px. Course cards 2-up. Full sidebar visible.  
Wide| ≥ 1280px| Display 72px. Course cards 3-up on teacher home. Full layout.  
Surface| Reading measure / column behaviour  
---|---  
Lesson view| Maintains 720px reading column at all sizes ≥ 768px. Below, expands to fill the viewport with 24px margins. The reading measure is sacred — narrower is worse, wider is worse.  
Teacher progress table| Below 1024px, columns collapse: outcome badge moves under the student name; sparkline drops out.  
Admin tables| Below 1024px, the table becomes a card list — each user/course is a card, not a row.  
Course brief editor| Always 720px–880px depending on viewport. Never narrower than 480px — below that, the editor isn't usable.  
  
22

## Iteration guide

  1. Focus on ONE component at a time. The Lesson Card was designed first; everything else descends from it. Take that approach with future additions.
  2. Reference tokens directly (`--ink-primary`, `--r-lg`, `type.heading-3`). Never hardcode values.
  3. Add new components as separate entries with anatomy + token references. Avoid implicit reliance on existing components looking a particular way.
  4. Default body to `type.body` (Geist 15/1.65). Default headlines to Fraunces. Default radius to `--r-md` for buttons, `--r-lg` for cards.
  5. When introducing a new colour, ask: does it fit the warm earth palette? If it would clash with the existing taxonomy, redesign rather than add.
  6. When designing a new surface, look at the Lesson Card first. The vocabulary it sets — generous padding, ochre eyebrow, italic context line, concept tags above content — is the system's grammar.

23

## Known gaps

Documented honestly so future iteration knows where to start.

Gap| Note  
---|---  
Dark mode| Not specified beyond the deep surface used for sidebars and footers. A full dark theme would invert the parchment-canvas philosophy and likely needs its own design pass — not a token flip.  
Motion / transitions| Specific timings not captured. Default recommendation: 150–200ms ease-out for state changes; lesson streaming uses natural Anthropic token cadence (no animation timing).  
Iconography| The system does not specify an icon set in v1. Recommendation: a single-weight, slightly-rounded stroke icon set (Lucide or Phosphor regular weight) — never filled icons, never multi-colour.  
Illustrations| The system avoids decorative illustrations by design. If illustrations become necessary (empty states, marketing pages), they should be line drawings in `--ink-primary` on `--canvas`, never multi-colour.  
Mobile patterns| Specified at the layout level only. Component-level mobile behaviour (e.g. how the assessment engine handles touch on small screens) is post-MVP work.  
Accessibility tokens| Colour contrast was checked at design time but a formal WCAG audit is not part of this document. Done as part of build acceptance.  
  
**Where to Start Next** The most valuable post-v1 work is an illustration system — specifically, the empty states for "no courses yet", "no students enrolled", and "lesson generating". These are moments where Paideia could express character beyond typography. They are intentionally absent from v1 to avoid premature decoration. 

_PAIDEIA_ · Design System · PAI-DS-001 · v1.0 Draft

Pairs with PAI-FSD-001 v2.0 · PAI-TSD-001 v1.0
