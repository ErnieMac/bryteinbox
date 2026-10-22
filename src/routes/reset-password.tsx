import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const Route = createFileRoute('/reset-password')({
  head: () => ({ meta: [
    { title: 'Reset password · BryteChat' }, { name: 'description', content: 'Set a new password for your BryteChat account.' },
    { property: 'og:title', content: 'Reset password · BryteChat' }, { property: 'og:description', content: 'Recover access to your personal workspace.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
  ] }), component: ResetPassword,
});
function ResetPassword() {
  const [recovery, setRecovery] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setRecovery(new URLSearchParams(window.location.hash.slice(1)).get('type') === 'recovery'); }, []);
  return <main className="min-h-screen bg-background px-6 py-16"><div className="mx-auto max-w-sm">
    <h1 className="text-2xl font-semibold">New password</h1>
    {!recovery ? <p className="mt-4 text-muted-foreground">Open the password reset link from your email. <Link to="/auth" className="underline">Request a new link</Link></p> : done ? <div role="status" className="mt-4">Password updated. <Link to="/account" className="underline">Go to your account</Link></div> :
      <form className="mt-6 space-y-4" onSubmit={async e => { e.preventDefault(); setBusy(true); setError(''); const result = await supabase.auth.updateUser({ password }); setBusy(false); if (result.error) setError(result.error.message); else setDone(true); }}>
        <Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" autoComplete="new-password" required value={password} onChange={e => setPassword(e.target.value)} />
        {error && <p role="alert" className="text-destructive">{error}</p>}<Button disabled={busy} type="submit">{busy ? 'Updating…' : 'Update password'}</Button>
      </form>}
  </div></main>;
}