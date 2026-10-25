Implement the **Experiences** admin page in the Next.js app (`web/`).

## Read first (in order)
1. `web/AGENTS.md` and `agents.md` (repo conventions)
2. `.agents/skills/designs/design-fidelity.md` (mandatory: follow it strictly)
3. `.agents/skills/designs/INDEX.md`
4. All wireframes in `.agents/skills/designs/Pages/experiences/` (`EXP 1.png`, `EXP 2.png`, `EXP 3.png`). Open each and look at it. EXP 1 = base page; EXP 2 = edit drawer with one position. If EXP 3 shows a drawer with two stacked positions and a scrolling area, use it as the reference for the stacked layout; if it is identical to EXP 2, use EXP 2's block styling and stack extra blocks vertically in the same visual language. Tell me which case it is.
5. `.agents/skills/designs/Pages/common/nav_menu.png` and the implemented pages (overview, skills-achievements, certificates) for the nav, layout shell, fonts, colors, scrollbar, hazard stripe footer, upload boxes, notices, error states and the side drawer
6. `.agents/skills/designs/ascii-reveal/skill.md`
7. `.agents/backend mem/api-handoff.md`, `architecture-spec.md`, `cloudinary.md`, and `api_working.md` if present
8. The backend repo (about-core): use the local checkout if accessible, otherwise https://github.com/Cyberbee-pro/about-core. Read `src/models/Experience.ts`, `src/controllers/experienceController.ts`, `src/routes/experienceRoutes.ts`, `src/middlewares/uploadMiddleware.ts`, `tests/experiences-tests.test.ts`.

## Reuse these (do not rewrite them)
`useLatestRequest` (latest-request-wins loading), `normalizeWeight` / `WeightSelect` (plain numbers, minimum 1, no "lv", no 0 option), the UTC date helpers in the certificates utils (use `getUTC*`; run date tests under a timezone west of UTC), the shared side drawer including its slide-in/out animation, the tabless upload box (extend it with tabs; don't duplicate it), the delete confirmation modal, the inline error + retry pattern.
Lessons already learned on the other pages, apply them here from the start:
- Load errors go in the section's own error state only, never the global notice; a successful retry clears them.
- After a successful create, reload the list through `useLatestRequest` instead of prepending locally; if that reload fails, keep the old list visible and show a "created" notice with retry.
- Clearing an optional field must send an empty string, not `undefined` (which gets dropped).
- A nested button inside an element with `role="button"` must not trigger the outer keyboard handler: guard with `e.target !== e.currentTarget`.

## Backend facts (verify against the repo; report any mismatch)
- Experience: `organization` (required, unique case-insensitive, 409 on duplicate), `tag` (`focus` | `extracurricular`), `type` (required: `internship` | `contract` | `freelance` | `full_time` | `part_time` | `club` | `volunteering`), `iconUrl` (required), `skills` (ObjectId[] from `/api/v1/skills`), `weight`.
- Position: `position`, `description`, `startDate`, `endDate?`, `isCurrent`, `mediaUrls[]`, `certificateUrls[]`, `_id`.
- Endpoints: `GET/POST /experiences`, `PUT/DELETE /experiences/:id`, `POST /experiences/:organization/positions` (URL-encode the organization).
- Upload fields (images only, 100 MB each; confirm accepted MIME types in `uploadMiddleware.ts`): `iconUrl` (max 1), `mediaUrls` (max 10), `certificateUrls` (max 10). On `POST /experiences` uploaded media and certs attach to `positions[0]`. On the append endpoint they attach to the new position.
- `PUT /experiences/:id` uses `findByIdAndUpdate` with the update payload, so sending `positions` replaces the whole array.
- `isCurrent` single-truth (resetting other positions) is enforced only by the append endpoint. Enforce it client-side everywhere else.
- Send `skills` and `positions` as JSON strings in FormData; don't set the Content-Type header manually. All calls go through the admin proxy.

## Upload tabs
The upload box has three tabs; the active tab decides what is uploaded:
- **Icon** (orange): organization icon, one file, field `iconUrl`.
- **Cert** (green): certificates, up to 10 files, field `certificateUrls`.
- **Media** (dark red): media, up to 10 files, field `mediaUrls`.
Files are staged client-side and sent with the form on Save/Create. Enforce type, size and count limits client-side. Show staged and existing files for the active tab as small previews in the box (addition; report it). Default tab: Icon.

## Upload rules for multiple positions (no backend change)
1. Read the PUT controller and report exactly how uploaded `mediaUrls` / `certificateUrls` are assigned on PUT (expected: not per position).
2. **First position:** its Media/Cert uploads go through PUT (or POST on create) as the backend supports.
3. **New positions** (added in the drawer or base form): after the experience is created or saved, append each with `POST /experiences/:organization/positions`, with its own files in that request.
4. **Existing positions after the first:** show their existing media/cert files read-only; disable adding new files to them and show a short note in the design's style. Report this limitation so I can extend the backend if I want per-position uploads.
5. When sending `positions` in PUT, include every existing position with its `_id`, `mediaUrls` and `certificateUrls` unchanged so nothing is lost.
6. Create flow: create the experience with its first position, icon and files; then append the remaining positions. If an append fails, keep the created experience, show which positions failed and let me retry only those. Never recreate the experience.
7. `iconUrl` and `organization` are shared by the whole experience. In stacked blocks after the first, show the organization read-only (mirrored) and make the Icon tab show the shared icon with changes disabled and a short note. Report both as deviations.

## Base page (EXP 1)
Breadcrumb "Dashboard > experiences", active nav item "experiences".
- **Add Experience. . . .** (left): Position, Description, organization, tag (select), skills (multi-select from the real skills API; removable chips like "Linux x"), weight (`WeightSelect`), start date, end date with a "present" toggle, and "+ Add Position".
- **Upload** (right): purple box with Icon / Cert / Media tabs (orange / green / dark red) across the top, upload icon, text "Drag and drop or click to upload", and a small external-link icon at the top right.
- **Past Experiences** (below): two-column grid of full-width bars, each with the org icon (placeholder when none), "Org | Latest position" (organization, then the latest position), and an external-link icon at the right. Styled scrollbar as drawn.
- **Row color:** lime = the experience has a position with `isCurrent`; red = none. Put the mapping in one small function.
Match spacing, colors, typography, headings and the hazard stripe footer. Only small sizing fixes.

## Edit drawer (EXP 2, stacked per your choice)
Same shared side drawer as certificates (including the slide animation):
- Heading "Edit Experience [org]. . . ." ("Edit Experience" literal; org from the real record).
- One block per existing position, pre-filled. Experience-level fields (tag, skills, weight) appear once on the first block as drawn. "+ Add Position" appends a new blank block below. Blocks after the first get a Remove control (confirmation if the position is already saved).
- Each block has its own tabbed upload box (blue in the drawer, as drawn), following the upload rules above.
- With two or more blocks the drawer content scrolls with the styled green scrollbar.
- **Save** stays pinned at the bottom-left of the drawer (as in EXP 2), including while the content scrolls. Report the pinned/scrolling behavior as a deviation.
- Save updates the record, closes the drawer and refreshes the row. Esc and backdrop click close it (no new close button). Closing is blocked during save. Warn on unsaved changes before the exit animation starts.
- Accessibility: dialog semantics, focus in and trapped, focus returned to the trigger, reduced motion respected.

## Functionality
- **Create validation:** organization, tag, type, icon required; at least one position with position title, description and start date; end date not before start; end date required unless "present". Inline messages in the design's style. Handle 409 duplicate organization.
- **Present toggle:** on = empty, disabled end date and `isCurrent: true`; turning it on for one position turns it off for the others.
- **Dates:** show and enter dd/mm/yy; send ISO dates; interpret two-digit years as 20yy and note it. Use UTC helpers so dates never shift a day.
- **Type select:** the backend requires `type` but the wireframes don't show it. Add a select with the seven values (readable labels), styled like `tag`, default `full_time`.
- **Latest position:** the `isCurrent` one, otherwise the latest end/start date. Derive it; never hardcode.
- **Link icons:** an experience has no URL field. Row icon: opens the edit drawer. Upload-box icon: opens the most recent staged or uploaded file of the active tab in a new tab (`target="_blank"`, `rel="noopener noreferrer"`), disabled when there is none. Report both as assumptions.
- **Skills multi-select:** keyboard accessible, removable chips, keeps skills already on a record even if they are missing from the options.
- **Links:** only `http://` or `https://`.

## Approved additions (report each as a deviation)
`type` select; Delete on each row (existing modal; mention that Cloudinary files are kept); Remove position; upload previews; Esc/backdrop close; unsaved-changes warning; the read-only existing-position upload note.

## Data rules
- Wireframe content ("Org", "Latest_pos", "Linux", "[org]", "[present]") is placeholder. Never hardcode it. Don't invent endpoints or fields; ask me if something is missing.
- Keep real UI copy from the designs (headings, labels, button and tab names).
- Handle empty, error, validation, 409 and failed-upload states.

## Loading states (ascii-reveal)
`AsciiSkeleton` / `AsciiReveal` for every fetch and upload state: the list with `<AsciiReveal loading={...} revealOnMount={false}>`; saving, deleting, uploading and per-position appends with an ASCII loading state and progress inside the upload box. Wrap only the list, rows and previews, never forms, inputs or the drawer shell. `data-ascii="skip"` on anything interactive, `surface` on panels, `fade` on buttons and tabs. Theme via the existing `--ascii-*` variables.

## Engineering
- Reuse components from `web/src/components` and the other admin pages. Route under `web/src/app/admin/` structured like the others. Client components only where needed. All calls through the admin proxy, never exposing `ADMIN_SECRET`. Follow `.agents/skills/react js/` and `bettercode/code-standards.md`.
- Tests in `web/tests`: service methods (FormData fields, JSON-string `skills`/`positions`, URL-encoded organization, `""` clearing), drawer open/close/focus return, dirty-close warning, present toggle and single-current enforcement, date validation under a west-of-UTC timezone, add/remove positions, latest-position derivation, row color mapping, tab-to-field mapping, upload limits, partial append failure, stale-load handling.
- Don't modify other pages except shared pieces you extend.

## Before you say you're done
1. Run lint, type check, tests (also once with `TZ=America/Los_Angeles`) and build.
2. Run the page and compare it to the PNGs: base page, one-position drawer, stacked scrolling drawer. Check empty, error and loading states.
3. Final report: files changed; endpoints used; how PUT assigns uploaded files (item 1 of the upload rules); every deviation and assumption; anything mocked or unverified. Update the Experiences row in `INDEX.md` (status, route, wireframe files).