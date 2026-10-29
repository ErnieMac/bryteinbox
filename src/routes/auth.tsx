import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState, type FormEvent } from 'react';
import { MessagesSquare, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import '@lovable.dev/cloud-auth-js/styles.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/providers/auth';

export const Route = createFileRoute('/auth')({
  head: () => ({ meta: [
    { title: 'Sign in · BryteInbox' }, { name: 'description', content: 'Sign in to your personal BryteInbox account.' },
    { property: 'og:title', content: 'Sign in · BryteInbox' }, { property: 'og:description', content: 'Your personal messaging workspace.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Auth,
});

function Auth() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  useEffect(() => { if (user) void navigate({ to: '/account', replace: true }); }, [user, navigate]);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      if (mode === 'forgot') {
        const result = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (result.error) throw result.error;
        setNotice('If an account exists, a password reset link is on its way.');
      } else if (mode === 'signup') {
        const result = await supabase.auth.signUp({ email, password, options: { data: { display_name: name.trim() }, emailRedirectTo: `${window.location.origin}/auth` } });
        if (result.error) throw result.error;
        if (!result.data.session) setNotice('Check your email to confirm your account, then sign in.');
      } else {
        const result = await supabase.auth.signInWithPassword({ email, password });
        if (result.error) throw result.error;
        await navigate({ to: '/account', replace: true });
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'Please try again.'); }
    finally { setBusy(false); }
  };
  const social = async (provider: 'google' | 'lovable') => {
    setBusy(true); setError('');
    try {
      const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: `${window.location.origin}/auth` });
      if (result.error) throw result.error;
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not sign in.'); }
    finally { setBusy(false); }
  };
  return <main className="min-h-screen bg-background px-6 py-12">
    <div className="mx-auto max-w-sm">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft size={16} /> Inbox</Link>
      <MessagesSquare className="mt-12 h-9 w-9 text-primary" />
      <h1 className="mt-4 text-3xl font-semibold">BryteInbox</h1>
      <h2 className="mt-2 text-lg text-muted-foreground">{mode === 'signup' ? 'Create your account' : mode === 'forgot' ? 'Reset your password' : 'Welcome back'}</h2>
      <form onSubmit={submit} className="mt-8 space-y-5">
        {mode === 'signup' && <div className="space-y-2"><Label htmlFor="display-name">Display name</Label><Input id="display-name" value={name} onChange={e => setName(e.target.value)} required maxLength={100} autoComplete="name" /></div>}
        <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
        {mode !== 'forgot' && <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} required /></div>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {notice && <p role="status" className="text-sm text-foreground">{notice}</p>}
        <Button type="submit" disabled={busy} className="w-full">{busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : mode === 'forgot' ? 'Send reset link' : 'Sign in'}</Button>
      </form>
      {mode !== 'forgot' && <div className="mt-5 space-y-3 border-t pt-5">
        <Button variant="outline" className="w-full" disabled={busy} onClick={() => social('google')}>Continue with Google</Button>
        <Button className="lovable-auth-button w-full" disabled={busy} onClick={() => social('lovable')}>Continue with Lovable</Button>
      </div>}
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError(''); setNotice(''); }}>{mode === 'signup' ? 'Already have an account? Sign in' : 'Create an account'}</Button>
        <Button variant="ghost" size="sm" onClick={() => { setMode(mode === 'forgot' ? 'signin' : 'forgot'); setError(''); setNotice(''); }}>{mode === 'forgot' ? 'Back to sign in' : 'Forgot password?'}</Button>
      </div>
    </div>
  </main>;
}