import { User } from '@supabase/supabase-js';

// Default list of admin emails for fallback / development
const DEFAULT_ADMIN_EMAILS = ['admin@biteflow.com', 'admin@example.com'];

/**
 * Checks if a Supabase user has administrative privileges.
 * Performs checks based on:
 * 1. User metadata or App metadata roles.
 * 2. An environment-configured list of emails (NEXT_PUBLIC_ADMIN_EMAILS).
 * 3. Default fallback emails and domain checks (e.g., any @biteflow.com email).
 */
export function isUserAdmin(user: User | null | undefined): boolean {
  if (!user) return false;

  // 1. Check metadata roles (assigned via Supabase dashboard or trigger)
  const userRole = user.user_metadata?.role;
  const appRole = user.app_metadata?.role;
  if (userRole === 'admin' || appRole === 'admin') {
    return true;
  }

  // 2. Check if user's email is in the admin emails list
  const configuredEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS
    ? process.env.NEXT_PUBLIC_ADMIN_EMAILS.split(',').map((e) => e.trim().toLowerCase())
    : DEFAULT_ADMIN_EMAILS;

  if (user.email && configuredEmails.includes(user.email.toLowerCase())) {
    return true;
  }

  // 3. Check for specific admin domain matching for ease of use
  if (user.email && user.email.toLowerCase().endsWith('@biteflow.com')) {
    return true;
  }

  return false;
}
