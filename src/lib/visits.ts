import { supabase } from './supabase';

const SESSION_KEY = 'visitor_session';
const LAST_TRACK_KEY = 'last_visit_track';

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `v_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function trackVisit(page: string) {
  const now = Date.now();
  const lastTrack = Number(sessionStorage.getItem(LAST_TRACK_KEY) || 0);
  if (now - lastTrack < 5000) return;

  sessionStorage.setItem(LAST_TRACK_KEY, String(now));

  supabase
    .from('site_visits')
    .insert({ visitor_session: getSessionId(), page })
    .then(() => {});
}
