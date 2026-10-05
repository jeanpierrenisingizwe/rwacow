/**
 * Demo mode — intercepts axios requests and returns
 * realistic local data when the backend is offline.
 */
import {
  DEMO_COWS, DEMO_OWNERS, DEMO_VACCINATIONS, DEMO_OFFSPRING,
  DEMO_SLAUGHTER, DEMO_TRANSFERS, DEMO_STATS, demoCowDetail,
} from './demoData';

type MockResponse = { data: unknown };

export function mockRequest(method: string, url: string, body?: unknown): MockResponse | null {
  const m = method.toUpperCase();
  const u = url.replace(/^\//, '');

  // ── AUTH ──────────────────────────────────────
  if (m === 'POST' && u === 'auth/login') {
    const { email, password } = body as any;
    // In demo mode accept any credentials — just need email + password present
    if (email && password) {
      // Try to find a matching demo user by email, otherwise create a generic session
      const roleMap: Record<string, string> = {
        'admin@rwacow.rw':  'admin',
        'vet@rwacow.rw':    'vet',
        'farmer@rwacow.rw': 'farmer',
      };
      const role = roleMap[email] || 'farmer';
      const name = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
      return {
        data: {
          user: { id: 'demo-user-' + Date.now(), full_name: name, email, role },
          token: 'demo-token',
        },
      };
    }
    throw { response: { data: { error: 'Email and password are required' }, status: 400 } };
  }
  if (m === 'POST' && u === 'auth/register') {
    const b = body as any;
    // Simulate successful registration
    return { data: { user: { id: 'new-user-' + Date.now(), full_name: b.full_name, email: b.email, role: b.role }, token: 'demo-token' } };
  }
  if (m === 'POST' && u === 'auth/forgot-password') {
    return { data: { message: 'Reset link generated.', dev_reset_url: 'http://localhost:3000/reset-password?token=demo-token-123' } };
  }
  if (m === 'GET' && u === 'auth/me') {
    return { data: { id: 'demo-admin-001', full_name: 'Demo Admin', email: 'admin@rwacow.rw', role: 'admin' } };
  }

  // ── COWS ──────────────────────────────────────
  if (m === 'GET' && u.startsWith('cows/stats')) {
    return { data: DEMO_STATS };
  }
  if (m === 'GET' && u.match(/^cows\/[^/]+$/)) {
    const id = u.split('/')[1];
    const detail = demoCowDetail(id);
    if (!detail) throw { response: { data: { error: 'Cow not found' }, status: 404 } };
    return { data: detail };
  }
  if (m === 'GET' && u.startsWith('cows')) {
    return { data: { cows: DEMO_COWS, total: DEMO_COWS.length } };
  }
  if (m === 'POST' && u === 'cows') {
    const b = body as any;
    const newCow = { ...b, id: 'cow-' + Date.now(), status: 'active', created_at: new Date().toISOString() };
    DEMO_COWS.push(newCow as any);
    return { data: newCow };
  }

  // ── OWNERS ────────────────────────────────────
  if (m === 'GET' && u.match(/^owners\/[^/]+$/)) {
    const id = u.split('/')[1];
    const owner = DEMO_OWNERS.find(o => o.id === id);
    if (!owner) throw { response: { data: { error: 'Not found' }, status: 404 } };
    return { data: { ...owner, cows: DEMO_COWS.filter(c => c.current_owner_id === id) } };
  }
  if (m === 'GET' && u.startsWith('owners')) {
    return { data: { owners: DEMO_OWNERS, total: DEMO_OWNERS.length } };
  }
  if (m === 'POST' && u === 'owners') {
    const b = body as any;
    const newOwner = { ...b, id: 'own-' + Date.now(), cow_count: 0 };
    DEMO_OWNERS.push(newOwner as any);
    return { data: newOwner };
  }

  // ── VACCINATIONS ──────────────────────────────
  if (m === 'GET' && u.startsWith('vaccinations')) {
    return { data: { vaccinations: DEMO_VACCINATIONS, total: DEMO_VACCINATIONS.length } };
  }
  if (m === 'POST' && u === 'vaccinations') {
    const b = body as any;
    const nv = {
      id: 'vac-' + Date.now(),
      cow_id: b.cow_id,
      vaccine_name: b.vaccine_name,
      vaccination_date: b.vaccination_date,
      next_due_date: b.next_due_date || null,
      batch_number: b.batch_number || null,
      notes: b.notes || null,
      vet_name: 'You',
      tag_number: '',
      cow_name: '',
      owner_name: '',
    };
    DEMO_VACCINATIONS.push(nv as any);
    return { data: nv };
  }

  // ── OFFSPRING ─────────────────────────────────
  if (m === 'GET' && u.startsWith('offspring')) {
    return { data: { offspring: DEMO_OFFSPRING, total: DEMO_OFFSPRING.length } };
  }
  if (m === 'POST' && u === 'offspring') {
    const b = body as any;
    return { data: { offspring: { ...b, id: 'off-' + Date.now() }, calf: { id: 'cow-' + Date.now(), tag_number: b.calf_tag_number } } };
  }

  // ── SLAUGHTER ─────────────────────────────────
  if (m === 'GET' && u.startsWith('slaughter/pending-auth/count')) {
    const count = DEMO_SLAUGHTER.filter((s: any) => s.authorization_status === 'pending').length;
    return { data: { count } };
  }
  if (m === 'GET' && u.startsWith('slaughter')) {
    return { data: { records: DEMO_SLAUGHTER, total: DEMO_SLAUGHTER.length } };
  }
  if (m === 'POST' && u === 'slaughter') {
    const b = body as any;
    const nr = {
      ...b, id: 'sla-' + Date.now(),
      status: 'pending_authorization', authorization_status: 'pending',
    };
    DEMO_SLAUGHTER.push(nr as any);
    return { data: { ...nr, message: 'Cow registered. Awaiting veterinary authorization before slaughter.' } };
  }
  if (m === 'PUT' && u.includes('/authorize')) {
    const id = u.split('/')[1];
    const b = body as any;
    const rec: any = DEMO_SLAUGHTER.find((s: any) => s.id === id);
    if (rec) {
      rec.authorization_status = b.decision;
      rec.status = b.decision === 'authorized' ? 'authorized' : 'cancelled';
      rec.authorized_by_name = 'You (Vet)';
    }
    return { data: { message: b.decision === 'authorized' ? 'Slaughter authorized.' : 'Slaughter rejected.', id } };
  }
  if (m === 'PUT' && u.includes('/confirm')) {
    const id = u.split('/')[1];
    const rec: any = DEMO_SLAUGHTER.find((s: any) => s.id === id);
    if (rec) { rec.status = 'completed'; rec.slaughter_date = new Date().toISOString().split('T')[0]; }
    return { data: { status: 'completed' } };
  }

  // ── TRANSFERS ─────────────────────────────────
  if (m === 'GET' && u.startsWith('transfers')) {
    return { data: { transfers: DEMO_TRANSFERS, total: DEMO_TRANSFERS.length } };
  }
  if (m === 'POST' && u === 'transfers') {
    const b = body as any;
    const nt = { ...b, id: 'tr-' + Date.now(), transfer_date: new Date().toISOString().split('T')[0] };
    DEMO_TRANSFERS.push(nt as any);
    return { data: nt };
  }

  return null;
}
