# Roadmap

- [x] Remove application backend/auth/profile dependencies and database tooling.
- [x] Verify local onboarding and Settings without cloud requests.
- [ ] Remove hosted database and managed keys/environment configuration — requires workspace admin's Remove Database action.

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
