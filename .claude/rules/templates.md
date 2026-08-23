---
paths:
  - 'src/templates/**'
  - 'src/components/Preview/**'
---

# PDF templates

**Use the `resume-pdf-templates` skill before editing any template**, even for a
change that looks purely cosmetic. These files carry structural rules that are
invisible in review and easy to undo by accident:

- A section heading is rendered _inside_ its first entry
  (`templates/pagination.tsx`) so react-pdf can't strand it at the foot of a
  page.
- Each section must be wrapped in a `View`, never a `Fragment`, or entries get
  pushed wholesale to the next page instead of splitting.
- `minPresenceAhead` does **not** solve either of the above.

Background on the registry, accents, and margins is in
`docs/architecture/templates.md`.
