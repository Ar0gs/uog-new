// ============================================================
//  UNION OF GENIUS — SUPABASE DATABASE LAYER  v3
//  ✏️  Step 1: Paste your keys below (lines 14-16)
//  ✏️  Step 2: Run the SQL in SETUP.md in Supabase SQL Editor
//  Everything else is automatic.
// ============================================================

const SUPABASE_URL         = 'https://wgeuoevimvhjekhwclua.supabase.co';
// e.g. 'https://abcdefghijkl.supabase.co'

const SUPABASE_ANON_KEY    = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnZXVvZXZpbXZoamVraHdjbHVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NjkwMTksImV4cCI6MjA5NDU0NTAxOX0.EB5MZljRDjEDxhTC2Gc-l2DGbF2W7q8uWGVbRfDVoV0';
// Settings → API → Project API keys → anon / public

const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnZXVvZXZpbXZoamVraHdjbHVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODk2OTAxOSwiZXhwIjoyMDk0NTQ1MDE5fQ.VMMpykjuIozNw8A4Ieb2ibzRQ6uI6ZxdZjHx0gL8gHw';
// Settings → API → Project API keys → service_role  (keep private)

// ============================================================
//  INTERNAL: single fetch wrapper
// ============================================================
async function _sb(table, method, body, qs, useService) {
  const key = useService ? SUPABASE_SERVICE_KEY : SUPABASE_ANON_KEY;

  // Guard: catch un-filled placeholder keys immediately
  if (!SUPABASE_URL || SUPABASE_URL.includes('PASTE') ||
      !key          || key.includes('PASTE')) {
    throw new Error(
      'UOG_DB_ERROR: Supabase keys not set. ' +
      'Open js/db.js and paste your Project URL, anon key, and service_role key.'
    );
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}${qs ? '?' + qs : ''}`;

  const headers = {
    'apikey':        key,
    'Authorization': `Bearer ${key}`,
    'Content-Type':  'application/json',
    'Prefer':        method === 'POST' ? 'return=representation' : 'return=representation',
  };

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    throw new Error(`UOG_DB_ERROR: Network request failed — ${networkErr.message}`);
  }

  // Read body once
  const text = await res.text();

  if (!res.ok) {
    // Try to parse Supabase JSON error for a clear message
    let detail = text;
    try {
      const parsed = JSON.parse(text);
      detail = parsed.message || parsed.hint || parsed.details || text;
    } catch(_) {}

    if (res.status === 401) {
      throw new Error(`UOG_DB_ERROR: Unauthorised (401) — Check your Supabase keys in js/db.js. Detail: ${detail}`);
    }
    if (res.status === 403) {
      throw new Error(`UOG_DB_ERROR: Forbidden (403) — RLS policy blocking request on table "${table}". Run the SQL from SETUP.md in your Supabase SQL Editor. Detail: ${detail}`);
    }
    if (res.status === 404) {
      throw new Error(`UOG_DB_ERROR: Table "${table}" not found (404) — Run the CREATE TABLE SQL from SETUP.md. Detail: ${detail}`);
    }
    throw new Error(`UOG_DB_ERROR: ${method} ${table} → HTTP ${res.status}: ${detail}`);
  }

  if (!text || text === 'null') return method === 'POST' ? [] : null;
  try {
    return JSON.parse(text);
  } catch(_) {
    return text;
  }
}

// ============================================================
//  PUBLIC API  (used by index.html — anon key)
// ============================================================

/** Insert one row. Returns the created row object (with id, created_at). */
async function sbInsert(table, data) {
  const result = await _sb(table, 'POST', data, 'select=*', false);
  return Array.isArray(result) ? result[0] : result;
}

/** Get all rows where status = value (used for live blog posts). */
async function sbGetWhere(table, col, val) {
  return _sb(table, 'GET', undefined,
    `select=*&${col}=eq.${encodeURIComponent(val)}&order=created_at.desc`, false);
}

// ============================================================
//  ADMIN API  (used by admin.html — service_role key)
// ============================================================

/** Get every row in a table, newest first. */
async function sbAdminGetAll(table) {
  return _sb(table, 'GET', undefined, 'select=*&order=created_at.desc', true);
}

/** Insert one row as admin. Returns created row. */
async function sbAdminInsert(table, data) {
  const result = await _sb(table, 'POST', data, 'select=*', true);
  return Array.isArray(result) ? result[0] : result;
}

/** Update a row by id. */
async function sbAdminUpdate(table, id, data) {
  const result = await _sb(table, 'PATCH', data, `id=eq.${id}&select=*`, true);
  return Array.isArray(result) ? result[0] : result;
}

/** Delete a row by id. */
async function sbAdminDelete(table, id) {
  return _sb(table, 'DELETE', undefined, `id=eq.${id}`, true);
}

// ============================================================
//  SELF-TEST  — call sbSelfTest() in browser console to
//  diagnose connection problems before going live.
// ============================================================
async function sbSelfTest() {
  console.group('🔍 UOG Supabase Self-Test');

  const tables = ['registrations','contacts','blogs','subscribers'];
  let allOk = true;

  for (const t of tables) {
    try {
      const rows = await sbAdminGetAll(t);
      console.log(`✅ ${t}: OK (${Array.isArray(rows) ? rows.length : '?'} rows)`);
    } catch(e) {
      console.error(`❌ ${t}: FAILED — ${e.message}`);
      allOk = false;
    }
  }

  // Test a write (insert then delete)
  try {
    const row = await sbInsert('contacts', {
      name: '__test__', email: 'test@test.com',
      subject: 'Self-test', message: 'Auto-generated test row'
    });
    if (row && row.id) {
      await sbAdminDelete('contacts', row.id);
      console.log('✅ Write test: OK (inserted and deleted a test row)');
    } else {
      console.warn('⚠️  Write test: Insert returned no row — check RLS INSERT policy on contacts table');
      allOk = false;
    }
  } catch(e) {
    console.error(`❌ Write test: FAILED — ${e.message}`);
    allOk = false;
  }

  if (allOk) {
    console.log('🎉 All tests passed! Your Supabase connection is working.');
  } else {
    console.warn('⚠️  Some tests failed. Fix the errors above, then re-run sbSelfTest().');
    console.warn('Most common fix: run the SQL in SETUP.md inside your Supabase SQL Editor.');
  }
  console.groupEnd();
}
