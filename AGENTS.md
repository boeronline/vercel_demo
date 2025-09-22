# Development Plan: Brain Training Transformation

## Vision
We are evolving the original "Launch Code Lab" number guessing toy into a lightweight homage to Dr. Kawashima's Brain Training series. The end state is a browser-based training suite with a dual-screen inspired interface, multiple bite-sized exercises, daily tracking, and friendly coaching copy that channels the Nintendo DS classic.

## Roadmap
1. **Step 1 – Re-skin the experience.** Rebrand the UI, copy, and layout to evoke the DS dual-screen look while keeping the existing guessing mechanics intact. Introduce a calmer color palette, typographic hierarchy reminiscent of Brain Training, and copy that frames the game as a warm-up exercise.
2. **Step 2 – Modular exercise framework.** Extract the guessing logic into a reusable exercise module system that can support multiple mini-games, and prepare navigation for switching between exercises.
3. **Step 3 – Daily training loop.** Add a daily check-in flow with streak tracking, timestamps, and summary cards stored in localStorage. Present a "Today's Training" summary on load.
4. **Step 4 – Additional exercises.** Implement at least two new mini-games (e.g., rapid calculations and memory matrix), each integrating with the shared stats system and DS-style presentation.
5. **Step 5 – Coach persona and insights.** Layer in Dr. Kawashima-inspired guidance: animated coach avatar, post-session insights, and light-hearted progress assessments based on recent performance.

## Working agreements
- Maintain an up-to-date task list in `TODO.md`, reflecting in-progress and future steps.
- When modifying UI code, align styles and language with the DS Brain Training aesthetic introduced in Step 1.
- Preserve existing accessibility considerations (semantic headings, ARIA attributes) while evolving the interface.
