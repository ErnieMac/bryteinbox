# Roadmap

- [x] Add local desktop packaging and tagged GitHub macOS release workflow.
- [x] Document Mac downloads, installation and unsigned-release limitations.
- [x] Verify release scripts and existing app tests (14 passing); workflow includes native packaged-app smoke check.
- [ ] Run the first GitHub macOS release — requires pushing a version tag to the user's GitHub repository; macOS artifacts cannot be executed in this Linux sandbox.

- [x] Remove application backend/auth/profile dependencies and database tooling.
- [x] Verify local onboarding and Settings without cloud requests.
- [x] Remove hosted database connection — workspace now reports no connected backend.

- [x] Add sign-in, sign-out, password recovery and a private personal profile.
- [x] Add Beeper and Unipile setup-needed pages without implying sample accounts are live.
- [x] Verify password sign-in, profile save/reload, cross-user isolation and sign-out.
- [ ] Connect live Unipile messaging — blocked on Unipile subscription, API endpoint and private key.
- [x] Remove sample conversations from the personal app; messages come from Beeper rather than local demo memory.
- [ ] Connect live Beeper messaging — blocked on Beeper Desktop token and an approved secure relay approach.
- [x] Remove confirmation-email, recovery and social-sign-in flows from the personal app.

- [x] Increase UI text size across inbox, drawer, integrations
- [x] Verify larger text scales cleanly on mobile + desktop: no clipping, no overlapping controls
- [x] Confirm font-size changes applied consistently on desktop and mobile (audit both)
- [x] Fix clipped timestamp labels ("Rem", "Yest") in conversation list and customer context
