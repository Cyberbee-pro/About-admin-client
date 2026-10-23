# Design Fidelity (mandatory for any UI work)

The PNGs in `.agents/skills/designs/` are the approved source of truth for how the UI looks. Your job is to implement them, not to redesign them. Making your own design decisions where a design exists is the single most common failure here, so this file overrides your default taste.

## When this applies

Any task that creates or edits a page, screen, component, layout, error page, nav, or visual style. Before writing any markup or CSS, check whether a design exists for it.

## Step 1: Find the design (before writing code)

1. Read `.agents/skills/designs/INDEX.md` if it exists. It maps each route or component to its design file(s).
2. If there is no index, list `.agents/skills/designs/Pages/` and match by folder name. All page designs live under `Pages/`:
   - `Pages/common/nav_menu.png`: the shared nav menu, used on every page
   - `Pages/dashboard/overview/overview.png`: dashboard overview page
   - `Pages/dashboard/overview/common/status_box.png`: status box used on the overview
   - `Pages/certificates/`: certificates page (Cert 1.png, Cert 2.png)
   - `Pages/experiences/`: experiences page (EXP 1.png, EXP 2.png, EXP 3.png)
   - `Pages/logs/`: logs page (`Log - compact.png`, `Log - detail.png`)
   - `Pages/skills and achivements/`: skills and achievements page (3 images). The folder name is spelled "achivements"; use the path exactly as it is on disk.
   - `Pages/projects/`: currently empty, so there is no design yet. Ask the user before building it.
   - `Pages/err/40X/` and `Pages/err/50X/`: error pages (400, 401, 403, 404, 500, 502, 503, 504), one design per status code
3. Open and look at every relevant PNG. Do not code from the file name alone. A page design and its `common/` component designs are all relevant together.
4. Numbered variants (Cert 1/2, EXP 1/2/3, Skill and achivement 1/2/3, Log compact/detail) are usually states, sections, or views of the same page, not alternatives. Look at all of them and implement the whole set. If it's unclear whether two images are alternatives or parts of one page, ask.
5. If a task touches UI and you cannot find a matching design, stop and ask which design to use. Do not invent one.
6. `INDEX.md` marks which pages are already implemented (currently dashboard overview and config). Don't rebuild, restyle, or "improve" them while working on other pages. Touch them only when the task says so, and then keep them matching their designs.

## Project layout (reuse before creating)

The app is a Next.js project in `web/`.

- Pages and routes: `web/src/app`. Shared components: `web/src/components`. Utilities: `web/src/lib`.
- Static assets already exported or added for the designs live in `web/public/` (`common`, `Errs`, `eva dash`). Look there first and use those files instead of redrawing icons, illustrations, or error graphics. If a design needs an asset that isn't there, say so rather than substituting your own.
- Before creating a component, check `web/src/components` for an existing one (nav, status box, cards, layout shells). Reuse or extend it so shared pieces like the nav stay identical across pages. The already implemented overview page is the reference for how this project turns a design into code.
- Add tests next to the existing ones in `web/tests` (`components`, `lib`, `api`) following their patterns.
- Commands and conventions for this repo are in `web/AGENTS.md`. Follow them alongside this file.

## Step 2: Write a short spec from the image (before writing code)

State, in a few lines, what you read from the design:

- Layout structure: regions, order, alignment, columns, spacing rhythm
- Every visible element: icons, buttons, badges, images, and text. Label each piece of text as UI copy (copy exactly) or placeholder data (replace with a real data binding)
- Colors, font sizes and weights, border radii, shadows, borders as you can read them from the image
- States visible in the design (active nav item, status colors, etc.)

Where a value is unclear, measure it from the image instead of guessing. If you can run code, sample pixel colors and measure element sizes from the PNG. Prefer the project's existing Tailwind tokens when they match the design; use arbitrary values (`w-[272px]`, `bg-[#1a1b1e]`) when they don't.

## Step 3: Implement faithfully

- Reproduce the layout, hierarchy, copy, colors, and component structure from the design.
- Reuse the shared component designs: the nav in `common/nav_menu.png` is the nav everywhere it appears. Don't restyle it per page.
- Do not add elements that aren't in the design (extra sections, cards, gradients, animations, illustrations, taglines, icons). Do not remove elements that are.
- Do not substitute your own palette, fonts, spacing scale, corner radii, or "improved" layout.
- Use real data and real routes for content, but keep the design's structure and visual treatment around it.

## Design content is placeholder data, never hardcode it

The designs are mockups. Names, numbers, dates, statuses, counts, percentages, list rows, usernames, avatars, chart values, and sample paragraphs shown in a PNG are dummy content. They show where data goes and how it looks, not what it is. Copy the design's layout and styling exactly, but fill it with real data.

- Render dynamic values from the real source: API responses, props, state, the database, or the existing data layer. Never type a mockup value like `1,248 users`, `Online`, `John Doe`, or `Last updated 2 min ago` into JSX.
- Lists and tables: build them with `.map()` over real data. Don't write out the sample rows from the design as separate elements.
- Status colors and badges: derive them from the real status value (a mapping from status to style), not from the one state the mockup happened to show.
- If the data source doesn't exist yet, add a clearly named typed placeholder (a fixture or mock in one obvious place, such as `mocks/` or a `// TODO: replace with API` constant), wire the component to it through props, and tell the user it's mocked. Do not scatter literals through the markup.
- Loading, empty, and error states: handle them even if the design doesn't show them, using the project's existing patterns and styling that stays close to the design.

Still copy exactly from the design: static UI copy that is genuinely part of the interface, such as headings, nav labels, button text, column headers, and error page messages. Those are the interface, not sample data.

Quick test for each text or number in the design: "Would this change for a different user, time, or record?" If yes, it's data and must come from a variable. If no, it's UI copy and stays literal.

## Allowed deviations (small)

You may adjust, without asking:

- Sizing and spacing within roughly 4 to 8 px, or a few percent, to fit the real viewport or the project's spacing scale
- Responsive behavior the design doesn't show (stacking, wrapping, collapsing), as long as the desktop result matches the design
- Accessibility basics: semantic tags, alt text, focus states, contrast tweaks that don't visibly change the look
- Font fallbacks when the exact font isn't available

## Not allowed without asking

- Changing the layout structure, element order, or number of columns
- Changing the color palette, typography style, or component shapes
- Adding or removing visible sections or components
- Replacing a design element with a library component that looks different

If something in the design is impossible, ambiguous, or conflicts with a requirement, ask the user. Do not resolve it silently with your own design.

## Step 4: Verify against the design (before saying you're done)

1. Run the app and view the page (use `browserqa.md` if available) at a desktop width matching the design.
2. Compare your result to the PNG side by side: structure, spacing, colors, copy, states.
3. Fix mismatches. Then report:
   - Which design file(s) you implemented
   - Any deviations you made and why (one line each)
   - Anything in the design you could not match
   - Where each piece of dynamic data comes from, and anything still mocked
4. Search your diff for mockup values copied from the design (sample names, numbers, dates, statuses). Any that remain as literals in markup are bugs. Replace them with data bindings.

If you cannot view the rendered page, say so explicitly and list what remains unverified. Do not claim it matches.

## Imported components are not designs

`designs/ascii-reveal/skill.md` and the files in `designs/Imported components/` (`pattern-waves`, `pixel-blast`, `slide-commit`, `target-cursor`) are effect and component libraries, not page designs. Only the images under `designs/Pages/` are page designs. Use them only where a design or the user calls for them. They don't override the layout or look in the PNGs.

## Conflicts with other skills

When a generic skill (react patterns, tailwind, SEO, etc.) conflicts with the visual design, the PNG wins on how it looks. The other skills still govern code quality, structure, performance, and security.