import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_BEEPER_URL, readBeeperConfig, saveBeeperConfig, testBeeper } from "@/providers";

export function BeeperConnect() {
  const qc = useQueryClient();
  const [connected, setConnected] = useState(false);
  const [url, setUrl] = useState(DEFAULT_BEEPER_URL);
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const cfg = readBeeperConfig();
    if (cfg) { setConnected(true); setUrl(cfg.baseUrl); }
  }, []);

  async function connect() {
    setBusy(true);
    try {
      const accounts = await testBeeper({ baseUrl: url, token: token.trim() });
      saveBeeperConfig({ baseUrl: url, token: token.trim() });
      setConnected(true); setToken("");
      qc.invalidateQueries();
      toast.success(`Connected to Beeper — ${accounts.length} account${accounts.length === 1 ? "" : "s"} found`);
    } catch {
      toast.error("Couldn't reach Beeper. Check Beeper Desktop is open, the API is switched on, and the token is right.");
    } finally { setBusy(false); }
  }

  function disconnect() {
    saveBeeperConfig(null); setConnected(false);
    qc.invalidateQueries();
    toast("Disconnected — showing sample chats again");
  }

  return (
    <section className="mt-10 rounded-lg border bg-card p-5" aria-labelledby="beeper-heading">
      <div className="flex items-center justify-between gap-4">
        <h2 id="beeper-heading" className="text-xl font-semibold">Beeper (this computer)</h2>
        <span className="text-sm text-muted-foreground">{connected ? "Connected" : "Not connected"}</span>
      </div>
      {connected ? (
        <div className="mt-3 flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">Your inbox now shows your real Beeper chats from {url}.</p>
          <Button variant="outline" onClick={disconnect}>Disconnect</Button>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Open Beeper Desktop → Settings → Developers and switch on the API.</li>
            <li>Create an access token and paste it below.</li>
            <li>Keep Beeper open while you use BryteInbox on this computer.</li>
          </ol>
          <Input aria-label="Beeper address" value={url} onChange={(e) => setUrl(e.target.value)} />
          <Input aria-label="Beeper access token" type="password" placeholder="Access token" value={token} onChange={(e) => setToken(e.target.value)} />
          <Button onClick={connect} disabled={busy || !token.trim()}>{busy ? "Connecting…" : "Connect Beeper"}</Button>
          <p className="text-xs text-muted-foreground">The token stays on this computer only and is never sent to our servers.</p>
        </div>
      )}
    </section>
  );
}
