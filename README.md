# BryteInbox

One calm inbox for all your direct messages — iMessage, WhatsApp, LinkedIn, Instagram, Telegram, Slack and X — on your own Mac or Windows PC.

BryteInbox is a fast, keyboard-first web app for personal use. It reads your chats from [Beeper Desktop](https://www.beeper.com), a free app that unifies your messaging accounts, and presents them in a clean three-column workspace with tags, reminders, archiving and AI-suggested replies.

> **Private by design:** BryteInbox runs entirely in your browser on your computer. It talks directly to the Beeper Desktop app running on the same machine. Your Beeper access token and your messages never leave your computer — there is no server that stores them.

![BryteInbox](public/icon-512.png)

## What it does

- **One inbox for 7 platforms** — every conversation shows a small platform icon so you always know where a message came from. Filter the list by platform or tag, and search across all chats.
- **Three-column workspace** — navigation rail and tag folders on the left, conversation list in the middle, full message thread with a contact-details panel on the right. Collapses cleanly to smaller screens.
- **Organise your way** — create tags (Leads, Clients, Team, Personal, or your own), give them colours, drag a chat onto a tag to retag it, set reminders ("later today", "tomorrow", "next week", or a custom time), and archive anything you're done with. All of it is saved on your computer and survives a refresh.
- **AI suggested replies (optional)** — turn on "AI suggested drafts" for a tag, and chats with that tag show a greyed "Suggested reply" card above the composer with Use / Edit / Dismiss. Nothing ever sends automatically.
- **Keyboard-first** — `J`/`K` move between chats, `Enter` opens one, `R` jumps to reply, `E` archives, `H` sets a reminder, `T` opens the tag picker, `/` jumps to search, `⌘K`/`Ctrl+K` opens quick search, and `⌘Z`/`Ctrl+Z` undoes a send within a 5-second send window.
- **Installable app** — works as a PWA, so you can install it to your dock or taskbar and run it like a native desktop app.

## Requirements

1. **Beeper Desktop** — free, from [beeper.com](https://www.beeper.com). Sign in and add the messaging accounts you want in BryteInbox.
2. **Node.js 20 or newer** — only needed to run BryteInbox itself (see below).

No BryteInbox account, cloud service or environment file is needed. The only credential required is your Beeper Desktop access token, entered locally during setup.

## Run it on your computer

```sh
git clone https://github.com/YOUR_USERNAME/bryteinbox.git
cd bryteinbox
npm install
npm run dev
```

Then open the printed address (by default `http://localhost:8080`) in your browser.

### Connect your first account

1. In **Beeper Desktop**, open **Settings → Developers** and switch on the API.
2. Create an **access token** there and copy it.
3. BryteInbox opens with a short **Get started** walkthrough — paste the token in, and your real chats appear.
4. Once connected, use the **install** option in your browser (Chrome: *Install app*; Safari/Edge: *Add to Dock / Install*) to run BryteInbox like a normal desktop app.

Notes:

- The connection is per-computer: Beeper Desktop must stay open while you use BryteInbox, and you connect once on each computer you use.
- The token is stored only in your browser on that computer and is sent nowhere except your own machine.

### Optional: production build

```sh
npm run build
npm run preview
```

## Roadmap

- **Now** — personal use via Beeper Desktop, everything local.
- **Next** — [Unipile](https://unipile.com) as a second connection option (hosted, no desktop app needed), which also unlocks multi-user and hosted setups.
- **Later** — accounts, plans and team features for a hosted, monetised product. The code already separates providers (`MessagingProvider` interface) from the UI, so switching or adding a provider doesn't change how the app looks or works.

## Technical notes

- Built with [TanStack Start](https://tanstack.com/start) (React 19), Tailwind CSS v4 and TanStack Query.
- All chats and messages flow through a single `MessagingProvider` interface (`src/providers`); `BeeperProvider` talks to Beeper Desktop's local API.
- Tags, reminders and archived state live in a separate `OrganiserStore` (`src/lib/organiser-store.ts`) using browser localStorage, ready to move to a database later.
- No application sign-in, profile storage or database connection is included in the personal-use app. Hosted accounts can be added later alongside Unipile.

## Privacy

- Messages, accounts and your Beeper token stay on your computer.
- No analytics, no message storage on any server.
- Disconnect Beeper at any time in Settings; BryteInbox then shows nothing and sends nothing.

## Feedback & contributing

This started as a personal project. Ideas and pull requests are welcome — open an issue to discuss what you'd like to see.

## Build with Lovable

This project was built with [Lovable](https://lovable.dev). Continue developing it in the [Lovable editor](https://lovable.dev/projects/4e1013fc-59e7-40ab-a1f9-ea9cdf95b068).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.
