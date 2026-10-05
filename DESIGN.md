# GuardianWay Design System

This document defines the visual and interaction direction for GuardianWay. It is the design source of truth for the web administration portal and future parent and driver applications.

GuardianWay is a multi-school transportation and student-safety platform. Its interfaces must feel dependable under operational pressure: precise, calm, durable, and easy to scan. The intended visual language is industrial, not decorative.

## Sources of truth

- Product scope and architecture: [`README.md`](README.md)
- Brand identity and logo masters: [GuardianWay in Figma](https://www.figma.com/design/fRu0bGg9VwBYKg0wcoEC74/Guardian-Way?node-id=5-76)
- This file: product UI principles, tokens, patterns, and implementation guidance

When the sources conflict, use the Figma file for logo geometry and brand colors, this file for interface behavior and visual rules, and the README for product scope.

## Design principles

### Operational clarity

Prioritize the next decision over decoration. Status, ownership, time, location, and required action should be visible without opening another surface.

### Industrial restraint

Use strong geometry, compact information density, clear separators, and limited color. Avoid playful gradients, glass effects, excessive rounding, ornamental illustrations, and soft consumer-app styling.

### Safety without alarm fatigue

Reserve urgent colors and high-contrast treatments for conditions that require attention. Routine operations should remain visually quiet so warnings retain their meaning.

### Accountable actions

Make changes attributable and reversible when possible. Destructive actions require explicit labels, consequences, and confirmation. Audit information should be easy to locate.

### Multi-tenant confidence

Always make the current school or platform scope visible. A user should not be able to mistake which tenant, route, trip, or student record they are editing.

## Brand identity

The GuardianWay symbol combines a shield, a front-facing bus, and a uniformed driver. It represents protected transportation with accountable human operation.

- Use the horizontal logo when space permits.
- Use the shield symbol for app icons, favicons, compact navigation, and loading marks.
- Do not redraw, recolor, stretch, rotate, outline, or add effects to the logo.
- Keep surrounding clear space of at least one quarter of the shield width.
- At 16–32 px, the symbol is expected to read primarily as a protected vehicle. Uniform details resolve fully from 48 px.
- Use full-color artwork on White or Mist. Use the approved dark, monochrome, or reverse variants on other surfaces.

## Color system

### Brand palette

| Token | Hex | Primary role |
| --- | --- | --- |
| Industrial Navy | `#18242F` | Primary text, navigation, dark surfaces, strong actions |
| Guardian Orange | `#C65A24` | Brand accent, active indicators, selected details, emphasis |
| Steel Grey | `#5F6B73` | Secondary text, icons, metadata, structural details |
| Mist | `#EEF1F2` | Page backgrounds, quiet sections, disabled surfaces |
| White | `#FFFFFF` | Main surfaces and reverse content |

The interface uses a restrained color strategy. Navy and neutral surfaces should carry most of the UI; orange should normally occupy less than 10% of a screen.

### Usage rules

- Prefer Industrial Navy with White text for primary buttons. This pairing has strong contrast and a more industrial character than an orange-filled button.
- Use Guardian Orange for active navigation markers, focus accents, key icons, large display text, charts, and small areas of emphasis.
- Do not use White text at normal body size on Guardian Orange. The contrast is approximately `4.30:1`, just below WCAG AA for normal text.
- Steel Grey may be used for secondary text on White or Mist, but not on Navy and not as text on Orange.
- Do not use color alone to communicate status. Pair it with an icon, label, shape, or pattern.

### Functional colors

Functional colors are separate from the brand palette and should appear only when their meaning is required.

| Role | Suggested base | Meaning |
| --- | --- | --- |
| Success | `#2F6B4F` | Completed, active, healthy |
| Warning | `#8A5A12` | Degraded, attention required |
| Danger | `#B42318` | Failed, unsafe, destructive |
| Information | `#2F5F8F` | Informational system state |

Provide lighter surface tints and darker text variants for badges and alerts. Validate every foreground/background pair against WCAG before implementation.

### Semantic token direction

Use semantic names in code rather than raw brand names:

```css
--background: #EEF1F2;
--surface: #FFFFFF;
--foreground: #18242F;
--muted-foreground: #5F6B73;
--border: color-mix(in srgb, #5F6B73 28%, #FFFFFF);
--primary: #18242F;
--primary-foreground: #FFFFFF;
--brand-accent: #C65A24;
--focus-ring: #C65A24;
```

Dark mode should use Navy-derived surfaces rather than neutral black. It must preserve the same semantic hierarchy and should be designed as an operational theme, not produced by mechanically inverting colors.

## Typography

### Families

- **Interface:** Noto Sans
- **Brand wordmark and display use:** Noto Sans Display, following the Figma master
- **Operational data and code:** JetBrains Mono or another clearly distinguishable monospace font

Noto Sans is the default because it supports Vietnamese well, remains readable at dense UI sizes, and avoids a generic startup aesthetic.

### Type scale

| Role | Size / line height | Weight |
| --- | --- | --- |
| Display | `40 / 48` | 700 |
| Page title | `32 / 40` | 700 |
| Section title | `24 / 32` | 700 |
| Component title | `20 / 28` | 600 |
| Body | `16 / 24` | 400 |
| Compact body | `14 / 20` | 400 or 500 |
| Label / metadata | `12 / 16` | 500 or 600 |

- Use sentence case for headings and controls.
- Use uppercase only for short operational labels, with restrained letter spacing.
- Use tabular numerals for times, distances, counts, license plates, and telemetry.
- Keep prose between 45 and 75 characters per line.
- Do not use font weight alone to indicate interactive or status meaning.

## Spacing and sizing

Use a 4 px base unit.

| Token | Value | Typical use |
| --- | --- | --- |
| `space-1` | `4px` | Icon gaps, dense alignment |
| `space-2` | `8px` | Inline elements, compact controls |
| `space-3` | `12px` | Form groups, compact cells |
| `space-4` | `16px` | Default component padding |
| `space-5` | `24px` | Section groups |
| `space-6` | `32px` | Major component separation |
| `space-8` | `48px` | Page sections |
| `space-10` | `64px` | Large composition breaks |

- Minimum pointer target: `44 × 44px`.
- Default desktop control height: `40px`; compact table control height: `32px` only where density is necessary.
- Align related fields and numeric columns to a shared grid.
- Prefer fewer, larger spacing changes over identical padding on every container.

## Shape, borders, and elevation

- Radius scale: `4px`, `6px`, `8px`, and `12px`.
- Use `6px` for controls and `8px` for standard surfaces.
- Reserve pill shapes for statuses, tags, and compact segmented controls.
- Use 1 px borders and background contrast before adding shadows.
- Shadows should be rare, shallow, and reserved for true overlays or raised navigation.
- Avoid nested cards. Group content with headings, spacing, separators, or table structure first.

## Layout

### Administration surfaces

- Optimize for desktop workstations first, then adapt to tablets and mobile review flows.
- Use persistent navigation for frequent modules: schools, users, students, buses, stops, routes, trips, and audit logs.
- Keep the current tenant and user role visible in the application shell.
- Prefer tables for comparable operational records and lists for heterogeneous content.
- Keep filters close to the dataset they affect and make active filters visible.
- Use sticky headers or key columns only when they materially improve long-table scanning.

### Responsive behavior

- Do not compress desktop tables into unreadable columns. On narrow screens, prioritize essential fields and move secondary details into an inline expansion or dedicated detail view.
- Preserve primary actions near the relevant record.
- Maps and real-time trip surfaces should retain status and recency indicators at every breakpoint.

## Components and interaction patterns

### Buttons

- Primary: Navy background, White label.
- Secondary: White or transparent background, Navy label, visible border.
- Accent: Orange detail or icon, not an orange fill by default.
- Destructive: explicit danger treatment with a verb that names the consequence.
- Icon-only buttons require an accessible name and tooltip.

### Forms

- Keep labels visible; placeholders are examples, not labels.
- Place validation next to the affected field and explain how to recover.
- Mark optional fields rather than marking every required field.
- Group fields by operational task, not by database schema.
- Preserve entered data after recoverable errors.

### Tables and lists

- Left-align text; right-align numeric values and durations.
- Use monospace or tabular numerals where alignment improves comparison.
- Keep row actions predictable and avoid hiding the only primary action in an overflow menu.
- Empty states should explain why no records are shown and offer the most relevant next action.

### Statuses and alerts

- Every status includes a concise text label.
- Use badges for stable state and alerts for conditions requiring attention.
- Distinguish data recency from entity state. For example, a bus may be active while its last GPS update is stale.
- Critical safety events should state severity, affected entity, timestamp, and available action.

### Dialogs

Use dialogs for short, focused decisions and confirmations. Use full pages, drawers, or inline editing for complex forms and multi-step tasks.

### Loading and failure

- Use skeletons only when the final layout is known.
- Show progress for long-running operations.
- Preserve last-known data during transient refresh failures and clearly mark it as stale.
- Error messages should identify what failed, what remains safe, and what the user can do next.

## Maps and real-time data

- Display the timestamp or age of location data near the status it qualifies.
- Use consistent vehicle, stop, route, and school symbols.
- Do not rely on marker color alone; use shape, icon, or label differences.
- Keep map controls high contrast and usable over both light and dark map imagery.
- Reduce visual noise at wide zoom levels through clustering and progressive detail.
- Treat lost connectivity, stale GPS, and partial route data as designed states, not generic errors.

## Motion

Motion should explain change, not decorate the interface.

- Use `120–180ms` for control feedback and `180–240ms` for panels or view transitions.
- Prefer ease-out curves for entering elements and ease-in for exits.
- Avoid bounce, elastic movement, continuous ambient animation, and movement on live data that distracts from status changes.
- Respect `prefers-reduced-motion` on web and the platform accessibility setting on mobile.

## Accessibility

- Target WCAG 2.2 AA.
- Maintain at least `4.5:1` contrast for normal text and `3:1` for large text and essential UI graphics.
- Provide visible keyboard focus and logical focus order.
- Support keyboard operation for all web workflows.
- Do not encode meaning using only color, position, or motion.
- Associate errors and help text with their fields programmatically.
- Use Vietnamese-first labels where the current product audience requires them; allow layouts to expand for longer localized content.

## Voice and content

The product voice is calm, direct, and accountable.

- Use concrete verbs: “Assign bus”, “End trip”, “Invite administrator”.
- Name objects consistently with the domain model.
- Avoid promotional language inside operational workflows.
- State consequences before destructive actions.
- Dates, times, and units must include enough context to prevent ambiguity.

## Implementation status and known drift

The current code predates this brand system. The following items should be treated as migration work, not accepted design precedent:

1. `frontend/src/app/layout.tsx` currently loads Inter. Replace it with Noto Sans when implementing the brand system.
2. `frontend/src/app/globals.css` currently contains a warm orange and green accent palette that does not match the approved five-color identity.
3. The mobile theme currently uses generic black, white, and grey values and has not been aligned to the brand palette.
4. Existing shadcn/ui components may retain their structure, but their tokens, radius, density, states, and typography need review against this document.

Migrate semantic tokens first, then typography, application shell, core controls, data displays, and finally marketing surfaces. Do not replace raw colors component by component without establishing shared tokens.

## Review checklist

Before accepting a new screen or component, verify:

- Does it make the current tenant, entity, and state clear?
- Is the primary action obvious without overusing orange?
- Are safety and failure states distinct but not alarmist?
- Can the workflow be completed with keyboard and assistive technology?
- Does the layout remain usable with long Vietnamese labels and real data?
- Are timestamps, location freshness, and ownership shown where operationally relevant?
- Are shared tokens and existing components used instead of local one-off styling?
- Does the result feel precise and durable rather than playful or decorative?
