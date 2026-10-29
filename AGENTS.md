<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep shared visual roles in src/styles.css and use the shared Button for inbox controls; this keeps the reference-inspired workspace consistent across pages.
- Keep inbox interactions in the existing client-side simulation; presentation changes must not imply real account connections.
- Reuse one customer-context renderer for the desktop pane and accessible Sheet drawer; this keeps contact content and pinned actions identical as screen width changes.
- Scope customer drawer backdrop styling through SheetContent's overlayClassName; other dialogs retain their existing appearance and motion.
- Collapse navigation independently of the conversation list and preserve the icon-rail toggle; users must always be able to reopen it.
- All chat data flows through the MessagingProvider interface in src/providers (exported `messagingProvider`); components never import mock data directly, so Beeper/Unipile providers can be swapped in.
- Tags, reminders and archive state live only in src/lib/organiser-store.ts (localStorage today); this keeps a later move to a database in one place.
- Inbox screens read provider data through the query hooks in src/hooks/use-inbox.ts and organiser state through useOrganiser; this keeps loading/error handling and cache refresh in one place.
- Sign-in is hidden for personal use: no UI links to /auth or /account, but the auth routes and profile backend stay intact so accounts can return for monetisation.
- Profile operations use authenticated server functions and owner-scoped RLS, with one root auth subscriber and cache teardown on sign-out; this prevents cross-user profile exposure.
- Beeper and Unipile remain setup-needed until secure per-user credentials and reachable endpoints exist; never substitute a shared provider account for individual connections.
- `messagingProvider` (src/providers/index.ts) delegates per call to BeeperProvider when a Beeper Desktop token is saved in this browser, else MockProvider; Unipile will join the same switch so the UI never changes.
