import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { profileSchema } from '@/lib/profile-schema';

describe('Personal profile boundary', () => {
  it('accepts a personal display name and avatar', () => {
    expect(profileSchema.parse({ displayName: ' Nesta ', avatarUrl: 'https://example.com/avatar.jpg' }).displayName).toBe('Nesta');
  });
  it('does not accept another user identifier as an editable profile field', () => {
    expect(profileSchema.parse({ displayName: 'Nesta', avatarUrl: '', id: 'someone-else' })).toEqual({ displayName: 'Nesta', avatarUrl: '' });
  });
  it('keeps profile reads and updates scoped to the authenticated owner', () => {
    const migration = readFileSync('drizzle/migrations/0000_personal_profiles.sql', 'utf8');
    expect(migration).toContain('FOR SELECT TO authenticated USING (auth.uid() = id)');
    expect(migration).toContain('FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id)');
    expect(migration).toContain('AFTER INSERT ON auth.users');
  });
});