import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { profileSchema } from './profile-schema';

export const getProfile = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from('profiles').select('display_name, avatar_url, preferences').eq('id', context.userId).single();
    if (error) throw new Error('Could not load your profile. Please try again.');
    return data;
  });

export const saveProfile = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => profileSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: profile, error } = await context.supabase.from('profiles').update({ display_name: data.displayName, avatar_url: data.avatarUrl }).eq('id', context.userId).select('display_name, avatar_url, preferences').single();
    if (error) throw new Error('Could not save your profile. Please try again.');
    return profile;
  });