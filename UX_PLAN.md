# Synapse Studio UX Redesign Plan

## Goal Analysis
- **Purpose**: Deliver a playful but credible suite of daily brain-training drills that mirrors the friendly coaching tone of the Nintendo DS Brain Training series while keeping all logic client-side.
- **Primary tasks**:
  - Choose a cognitive exercise and start training quickly.
  - Review streaks, session counts, and recent performance logs.
  - Switch languages without losing context.
- **Usage context**: Tablet-size or desktop browsers where the dual-screen metaphor can shine. Interactions should feel tactile and stylus-friendly, with generous tap targets and a soft palette that invites daily returns.

## Interface Audit
- The existing layout feels like a modern glassmorphism dashboard rather than a DS handheld, relying on floating cards and neon gradients.
- Navigation and stats live in the same vertical stack, so the metaphor of an upper "briefing" screen and lower "action" screen is diluted.
- Buttons resemble web tabs more than console buttons, and the background lacks the signature hinge/console framing.

## Rebuild Strategy
1. **Dual-screen console frame** – Wrap the experience in a stylised handheld shell with two stacked screens separated by a hinge element. The upper screen houses the briefing and status, the lower screen handles interactions.
2. **Typographic & colour language** – Swap the high-contrast glass aesthetic for a cream-and-umber palette with orange accent inspired by Brain Training menus. Introduce a rounded, readable face reminiscent of DS system fonts.
3. **Interaction styling** – Replace pill-like tabs with chunkier, tactile buttons and inset panels so controls feel like touch targets on a handheld. Reinforce focus states and maintain ARIA semantics for accessibility.
4. **Responsive behaviour** – Ensure the console scales to smaller widths without breaking the stacked-screen illusion, keeping scrollable content inside each screen if necessary.
5. **Implementation steps**
   - Restructure `index.html` into explicit upper and lower screen sections while preserving existing IDs for the JS framework.
   - Rebuild `styles.css` from scratch with the new console framing, controls, and typography.
   - Keep JavaScript logic intact so exercises, localisation, and stats continue to function with the refreshed layout.

## Execution Checklist
- [x] Update markup to reflect the new console framing.
- [x] Apply the redesigned visual system in CSS.
- [x] Verify localisation hooks and interactive elements still work.
- [x] Capture a refreshed UI screenshot once the new skin is in place.
