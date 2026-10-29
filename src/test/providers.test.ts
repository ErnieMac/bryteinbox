import { describe, it, expect, beforeEach } from "vitest";
import { MockProvider } from "@/providers/MockProvider";
import { OrganiserStore, reminderPreset } from "@/lib/organiser-store";

describe("MockProvider", () => {
  it("has about 40 chats across the platforms", async () => {
    const p = new MockProvider();
    const chats = await p.listChats();
    expect(chats.length).toBe(40);
    expect(new Set(chats.map((c) => c.platform)).size).toBe(7);
  });
  it("filters by platform and search", async () => {
    const p = new MockProvider();
    expect((await p.listChats({ platforms: ["telegram"] })).every((c) => c.platform === "telegram")).toBe(true);
    expect((await p.listChats({ search: "dinner" })).map((c) => c.title)).toEqual(["Mum"]);
  });
  it("sends and marks read", async () => {
    const p = new MockProvider();
    const chat = (await p.listChats({ unreadOnly: true }))[0]!;
    await p.sendMessage(chat.id, "hi");
    await p.markRead(chat.id);
    const after = (await p.listChats({ chatIds: [chat.id] }))[0]!;
    expect(after.lastMessage?.text).toBe("hi");
    expect(after.unreadCount).toBe(0);
  });
});

describe("OrganiserStore", () => {
  beforeEach(() => localStorage.clear());
  it("starts with Leads, Clients, Team, Personal, Noise", () => {
    expect(new OrganiserStore(localStorage).sortedTags().map((t) => t.name)).toEqual(["Leads", "Clients", "Team", "Personal", "Noise"]);
  });
  it("persists tagging, reorder and archive across reloads", () => {
    const s = new OrganiserStore(localStorage);
    s.toggleChatTag("c1", "leads");
    s.reorderTags(["noise", "leads"]);
    s.archive("c1");
    const r = new OrganiserStore(localStorage);
    expect(r.tagsFor("c1")).toEqual(["leads"]);
    expect(r.sortedTags()[0]!.id).toBe("noise");
    expect(r.isArchived("c1")).toBe(true);
  });
  it("carries state saved under the old brytechat key into the new one", () => {
    localStorage.setItem("brytechat.organiser.v1", JSON.stringify({ tags: [], chatTags: { c1: ["leads"] }, reminders: {}, archived: ["c1"] }));
    const s = new OrganiserStore(localStorage);
    expect(s.tagsFor("c1")).toEqual(["leads"]);
    expect(s.isArchived("c1")).toBe(true);
    expect(localStorage.getItem("brytechat.organiser.v1")).toBeNull();
    expect(localStorage.getItem("bryteinbox.organiser.v1")).not.toBeNull();
  });
  it("tomorrow preset is 9am next day", () => {
    const d = reminderPreset("tomorrow", new Date(2026, 9, 22, 15));
    expect([d.getDate(), d.getHours()]).toEqual([23, 9]);
  });
});
