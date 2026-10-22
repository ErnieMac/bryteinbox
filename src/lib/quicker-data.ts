export type Platform = "imessage" | "linkedin" | "slack" | "whatsapp" | "x";
export type Tag = "Client" | "Hot lead" | "Sponsors" | "Investors" | "Hiring" | "Team" | "Personal";

export const PLATFORMS: { id: Platform; label: string; count: number; color: string }[] = [
  { id: "imessage", label: "iMessage", count: 1, color: "#34C759" },
  { id: "linkedin", label: "LinkedIn", count: 25, color: "#0A66C2" },
  { id: "slack", label: "Slack", count: 1, color: "#4A154B" },
  { id: "whatsapp", label: "WhatsApp", count: 2, color: "#25D366" },
  { id: "x", label: "X", count: 15, color: "#0F1419" },
];

export const TAGS: { id: Tag; count?: number; hue: number }[] = [
  { id: "Client", count: 2, hue: 250 },
  { id: "Hot lead", count: 1, hue: 30 },
  { id: "Sponsors", hue: 80 },
  { id: "Investors", hue: 150 },
  { id: "Hiring", hue: 300 },
  { id: "Team", count: 1, hue: 200 },
  { id: "Personal", count: 1, hue: 350 },
];

export type Msg = {
  id: string;
  from: string;
  me?: boolean;
  text: string;
  time: string;
  card?: "promo" | "beehiiv";
  reactions?: string[];
  threadReplies?: number;
};

export type Convo = {
  id: string;
  name: string;
  platform: Platform;
  preview: string;
  time: string;
  group: "Reminders" | "Today" | "Yesterday";
  unread: boolean;
  tag?: Tag;
  suggested?: Tag | undefined;
  vip?: boolean;
  archived?: boolean;
  snoozed?: boolean;
  participants: string[];
  hue: number;
  draft: string;
  messages: Msg[];
};

export const MEMBERS = [
  { name: "Jess Park", role: "Design lead", hue: 20 },
  { name: "Andre Ruiz", role: "Partnerships", hue: 200 },
  { name: "Leo Tanaka", role: "Editor", hue: 120 },
];

export const INITIAL_CONVOS: Convo[] = [
  {
    id: "launch",
    name: "#launch-week",
    platform: "slack",
    preview: "Andre: beehiiv confirmed the cross-promo for Thursday 🎉",
    time: "9:41",
    group: "Today",
    unread: true,
    tag: "Sponsors",
    vip: true,
    participants: ["Jess Park", "Andre Ruiz", "Leo Tanaka"],
    hue: 330,
    draft: "Perfect timing. I'll go through the brief today and get our assets over to the beehiiv team!",
    messages: [
      { id: "m1", from: "Jess Park", text: "Landing page is live 🚀 quicker.chat is officially out in the wild.", time: "8:02", card: "promo", reactions: ["👍 2", "🔥 3"] },
      { id: "m2", from: "Leo Tanaka", text: "Graphic v2 is up in the thread — tightened the headline and swapped the hero crop.", time: "8:30", threadReplies: 4, reactions: ["👏 1"] },
      { id: "m3", from: "Andre Ruiz", text: "beehiiv confirmed the cross-promo for Thursday 🎉 Brief attached.", time: "9:41", card: "beehiiv", reactions: ["🤝 1", "👍 2"] },
      { id: "m4", from: "Andre Ruiz", text: "Final email pass is waiting on you whenever you're ready.", time: "9:41" },
    ],
  },
  {
    id: "sarah",
    name: "Sarah Lim",
    platform: "linkedin",
    preview: "Sounds great — can we lock in a call next Tuesday?",
    time: "Rem",
    group: "Reminders",
    unread: true,
    tag: "Hot lead",
    vip: true,
    participants: ["Sarah Lim"],
    hue: 40,
    draft: "Tuesday works! Sending a calendar invite for 2pm your time.",
    messages: [
      { id: "s1", from: "Sarah Lim", text: "Loved the demo of Quicker. Our team lives in 5 inboxes.", time: "Mon" },
      { id: "s2", from: "Sarah Lim", text: "Sounds great — can we lock in a call next Tuesday?", time: "Mon" },
    ],
  },
  {
    id: "design",
    name: "Design crew",
    platform: "slack",
    preview: "Jess: new icon set dropped in Figma",
    time: "9:12",
    group: "Today",
    unread: true,
    tag: "Team",
    participants: ["Jess Park", "Leo Tanaka"],
    hue: 200,
    draft: "These look sharp — ship it!",
    messages: [{ id: "d1", from: "Jess Park", text: "New icon set dropped in Figma, take a look ✨", time: "9:12" }],
  },
  {
    id: "mum",
    name: "Mum",
    platform: "whatsapp",
    preview: "Are you coming for dinner on Sunday? ❤️",
    time: "8:50",
    group: "Today",
    unread: true,
    tag: "Personal",
    vip: true,
    participants: ["Mum"],
    hue: 350,
    draft: "Wouldn't miss it! I'll bring dessert 🍰",
    messages: [{ id: "u1", from: "Mum", text: "Are you coming for dinner on Sunday? ❤️", time: "8:50" }],
  },
  {
    id: "acme",
    name: "Marco · Acme Co",
    platform: "imessage",
    preview: "Invoice looks good, paying today.",
    time: "8:14",
    group: "Today",
    unread: false,
    tag: "Client",
    participants: ["Marco"],
    hue: 250,
    draft: "Thanks Marco, appreciate it!",
    messages: [{ id: "a1", from: "Marco", text: "Invoice looks good, paying today.", time: "8:14" }],
  },
  {
    id: "dev",
    name: "Priya Shah",
    platform: "x",
    preview: "Would love to chat about a pilot for our agency",
    time: "Yest",
    group: "Yesterday",
    unread: true,
    suggested: "Hot lead",
    participants: ["Priya Shah"],
    hue: 280,
    draft: "Hey Priya! Happy to — what does your week look like?",
    messages: [{ id: "p1", from: "Priya Shah", text: "Would love to chat about a pilot for our agency", time: "Yest" }],
  },
  {
    id: "wa2",
    name: "Tom Becker",
    platform: "whatsapp",
    preview: "Contract signed, sending over now",
    time: "Yest",
    group: "Yesterday",
    unread: false,
    tag: "Client",
    participants: ["Tom Becker"],
    hue: 100,
    draft: "Received, thanks Tom!",
    messages: [{ id: "t1", from: "Tom Becker", text: "Contract signed, sending over now", time: "Yest" }],
  },
];
