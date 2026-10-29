# BryteInbox

Build a pixel-faithful personal clone of Quicker Chat matching the provided reference screenshot and product concept (quicker.chat).

Design & Layout (Cream/warm editorial Mac aesthetic matching the screenshot):
1. Three-plus-one pane Mac-style layout:
   - Left Navigation Rail (warm off-white/beige tint):
     - Top brand badge with Quicker Chat icon + text.
     - Section 1: Inbox (with unread badge '8'), Triage ('2'), Reminders ('1'), Requests ('37'), Archive, Muted, Media.
     - Section 2: Platforms with original brand badges and counts: iMessage (1), LinkedIn (25), Slack (1), WhatsApp (2), X (15).
     - Section 3: Tags with pills/icons: Client (2), Hot lead (1), Sponsors, Investors, Hiring, Team (1), Personal (1), "+ New tag", Hidden (2).
     - Bottom: Settings, Send Feedback.
   - Conversation List Pane:
     - Header: "Inbox" heading with "Focus" toggle switch and filter icon button.
     - Quick-access avatar strip at the top with status labels ("Sounds great...", badges for LinkedIn, Slack, WhatsApp: Sarah Lim, Design crew, Mum).
     - Categorized groups ("Reminders", "Today", etc.) with conversation cards showing avatar, platform badge overlay, sender name, timestamp, message preview, tag badge (e.g. "Sponsors", "Team", "Client", "Hot lead", "Personal", "Suggested: Hot lead"), and unread orange indicators.
   - Message Thread Pane (main conversation view):
     - Header: conversation title (#launch-week / contact name), participants list, search/details/action buttons.
     - Message feed with timestamps, avatar groupings, rich attachments (like the quicker.chat promo card with banner, beehiiv cross-promo link card, thread reply cards, emoji reactions pill like 👍2 🤝1 👏1 🔥3).
     - Inline AI draft bar: "Tab Perfect timing. I'll go through the brief today and get our assets over to the beehiiv team!" with Tab-to-accept or edit, formatting tools (emoji, bullet, clean draft), and a send button with delivery timing indicator.
   - Right Context / Inspector Sidebar:
     - Header: Channel/Contact badge + Team/Platform badge, action icons (bell mute, pin, note, hash, settings).
     - Collapsible sections:
       - Members (with avatars, names, roles e.g. Jess Park - Design lead, Andre Ruiz - Partnerships, Leo Tanaka - Editor).
       - Threads (Unread threads list with previews, timestamps, reply counts).
       - Media (shared links, attachments).
       - AI Summary (auto-generated bullets: "Landing page went live this morning.", "Graphic v2 posted, beehiiv cross-promo confirmed.", "Final email pass waits on you.").
       - Actions.

Interactions & Features:
- Filter conversations by clicking any Platform (Slack, LinkedIn, WhatsApp, X, iMessage) or Tag (Client, Hot lead, Team, Personal).
- Search bar across all DMs.
- Focus mode toggle (filters down to high-priority/VIP messages).
- Keyboard shortcuts: Tab to insert AI draft, ⌘K for quick switcher, J/K navigation between threads, ⌘Z undo send toast notification.
- Simulated message send & receive, tagging, archiving, and snoozing/reminders.
- An "Integrations & Connectors" view accessible from Settings to set up real accounts (e.g. Slack bot webhook/OAuth, LinkedIn via connector, WhatsApp Cloud API) with helpful setup guides.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://bryteinbox.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4e1013fc-59e7-40ab-a1f9-ea9cdf95b068).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
