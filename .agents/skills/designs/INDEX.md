# Design Index

Maps each page or component to its approved design. Paths are relative to `.agents/skills/designs/Pages/`. Read `../design-fidelity.md` before implementing any of these.

Edit the "Route" column to match the real app routes. Rows marked `TODO` need your input.

| Page / component | Route | Design file(s) | Notes |
| --- | --- | --- | --- |
| Nav menu (shared) | all pages | `common/nav_menu.png` | One nav, same everywhere. Do not restyle per page. Already implemented; reuse the existing component. |
| Dashboard overview | TODO | `dashboard/overview/overview.png` | IMPLEMENTED. Do not rebuild or restyle unless the task says so. Use it as the reference for turning a design into code here. |
| Status box | dashboard overview | `dashboard/overview/common/status_box.png` | Component used inside overview. Already implemented. |
| Config | TODO | none in `Pages/` | IMPLEMENTED. No design file here; leave it as is unless the task says otherwise. |
| Certificates | TODO | `certificates/Cert 1.png`, `certificates/Cert 2.png` | Implement both as parts or states of one page unless told otherwise. |
| Experiences | TODO | `experiences/EXP 1.png`, `experiences/EXP 2.png`, `experiences/EXP 3.png` | Implement the full set. |
| Logs | TODO | `logs/Log - compact.png`, `logs/Log - detail.png` | Likely two views (compact list and detail) of the same page. |
| Skills and achievements | `/admin/skills-achievements` | `skills and achivements/Skill and achivement.png`, `Skill and achivement 2.png`, `Skill and achivement 3.png` | IMPLEMENTED. Complete 3-state management (base, skill edit, achievement edit) with PatternWaves background, custom scrollbars, and ASCII reveal loading. |
| Projects | TODO | none yet | `projects/` is empty. Ask before building. |
| 400 Bad Request | n/a | `err/40X/400.png` | |
| 401 Unauthorized | n/a | `err/40X/401.png` | |
| 403 Forbidden | n/a | `err/40X/403.png` | |
| 404 Not Found | n/a | `err/40X/404.png` | |
| 500 Server Error | n/a | `err/50X/500.png` | |
| 502 Bad Gateway | n/a | `err/50X/502.png` | |
| 503 Service Unavailable | n/a | `err/50X/503.png` | |
| 504 Gateway Timeout | n/a | `err/50X/504.png` | |

## Not designs

`../ascii-reveal/skill.md` and `../Imported components/*.md` are effect and component libraries. They never override the layout or look in the PNGs above.

## Image descriptions (optional but recommended)

If the agent can't reliably read PNGs, add a short text description under each page here: layout regions, key elements, colors, and which text is UI copy versus placeholder data. A text description gives it something to follow even when it skips the image.