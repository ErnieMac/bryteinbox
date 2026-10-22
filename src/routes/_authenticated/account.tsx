import { createFileRoute, Link } from '@tanstack/react-router';
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { useState } from 'react';
import { ArrowLeft, LogOut, UserRound, Plug, Check } from 'lucide-react';
import { getProfile, saveProfile } from '@/lib/profile.functions';
import { profileSchema } from '@/lib/profile-schema';
import { useAuth } from '@/providers/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const profileQuery = () => queryOptions({ queryKey: ['personal-profile'], queryFn: () => getProfile() });
export const Route = createFileRoute('/_authenticated/account')({
  head: () => ({ meta: [
    { title: 'Your account · BryteChat' }, { name: 'description', content: 'Manage your private BryteChat profile and messaging providers.' },
    { property: 'og:title', content: 'Your account · BryteChat' }, { property: 'og:description', content: 'Your personal profile and messaging connections.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(profileQuery()),
  errorComponent: ({ reset }) => <div role="alert" className="p-8">Could not load your account. <Button variant="outline" onClick={reset}>Try again</Button></div>,
  pendingComponent: () => <div role="status" className="p-8">Loading your account…</div>,
  component: Account,
});

function Account() {
  const { data: profile } = useSuspenseQuery(profileQuery());
  const { user, signOut } = useAuth();
  const save = useServerFn(saveProfile);
  const queryClient = useQueryClient();
  const [name, setName] = useState(profile.display_name);
  const [avatar, setAvatar] = useState(profile.avatar_url);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const mutation = useMutation({ mutationFn: save, onSuccess: (result) => { queryClient.setQueryData(['personal-profile'], result); setSaved(true); }, onError: (e) => setError(e.message) });
  return <main className="settings-page min-h-screen bg-background px-6 py-10"><div className="mx-auto max-w-3xl">
    <div className="flex flex-wrap items-center justify-between gap-3"><Link to="/" className="inline-flex items-center gap-2 text-muted-foreground"><ArrowLeft size={16} /> Sample inbox</Link><Button variant="outline" onClick={() => { void signOut().catch(e => setError(e.message)); }}><LogOut size={16} /> Sign out</Button></div>
    <h1 className="mt-8 text-3xl font-semibold">Your account</h1><p className="mt-2 break-all text-sm text-muted-foreground">{user?.email}</p>
    <section className="mt-10" aria-labelledby="profile-heading"><h2 id="profile-heading" className="flex items-center gap-2 text-xl font-semibold"><UserRound size={20} /> Personal profile</h2>
      <form className="mt-5 max-w-lg space-y-5" onSubmit={e => { e.preventDefault(); setError(''); setSaved(false); const parsed = profileSchema.safeParse({ displayName: name, avatarUrl: avatar }); if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? 'Check your profile.'); return; } mutation.mutate({ data: parsed.data }); }}>
        <div className="space-y-2"><Label htmlFor="profile-name">Display name</Label><Input id="profile-name" required maxLength={100} value={name} onChange={e => { setName(e.target.value); setSaved(false); }} /></div>
        <div className="space-y-2"><Label htmlFor="profile-avatar">Avatar image URL</Label><Input id="profile-avatar" type="url" placeholder="https://" value={avatar} onChange={e => { setAvatar(e.target.value); setSaved(false); }} /></div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}{saved && <p role="status" className="flex items-center gap-2 text-sm"><Check size={16} /> Profile saved</p>}
        <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Saving…' : 'Save profile'}</Button>
      </form>
    </section>
    <section className="mt-12 border-t pt-8" aria-labelledby="providers-heading"><h2 id="providers-heading" className="flex items-center gap-2 text-xl font-semibold"><Plug size={20} /> Messaging providers</h2>
      <div className="mt-5 divide-y border-y">{['Beeper', 'Unipile'].map(provider => <div key={provider} className="flex flex-wrap items-center justify-between gap-3 py-5"><h3 className="font-semibold">{provider}</h3><span className="text-sm text-muted-foreground">Not connected</span></div>)}</div>
      <Button className="mt-5" variant="outline" asChild><Link to="/integrations">View connection requirements</Link></Button>
    </section>
  </div></main>;
}