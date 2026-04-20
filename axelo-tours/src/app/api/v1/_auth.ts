import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ── Supabase admin client (service role) ──────────────────────────────────────
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── In-memory rate limiter ────────────────────────────────────────────────────
// 100 requests per rolling 60-minute window per API key
const RATE_LIMIT = 100;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

interface RateBucket {
  timestamps: number[];
}

const rateBuckets = new Map<string, RateBucket>();

function checkRateLimit(apiKey: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  if (!rateBuckets.has(apiKey)) {
    rateBuckets.set(apiKey, { timestamps: [] });
  }

  const bucket = rateBuckets.get(apiKey)!;
  // Evict timestamps outside the window
  bucket.timestamps = bucket.timestamps.filter(ts => ts > windowStart);

  const remaining = RATE_LIMIT - bucket.timestamps.length;
  const resetAt = bucket.timestamps.length > 0
    ? bucket.timestamps[0] + WINDOW_MS
    : now + WINDOW_MS;

  if (bucket.timestamps.length >= RATE_LIMIT) {
    return { allowed: false, remaining: 0, resetAt };
  }

  bucket.timestamps.push(now);
  return { allowed: true, remaining: remaining - 1, resetAt };
}

// ── Validated Partner type ────────────────────────────────────────────────────
export interface ValidatedPartner {
  id: string;
  company_name: string;
  company_type: string;
  tier: string;
  net_rate_discount_pct: number;
  api_key: string;
}

// ── Main auth helper ──────────────────────────────────────────────────────────
export async function validateApiKey(request: NextRequest): Promise<
  | { success: true; partner: ValidatedPartner; headers: Record<string, string> }
  | { success: false; response: NextResponse }
> {
  const apiKey = request.headers.get('x-api-key');

  if (!apiKey || !apiKey.startsWith('axelo_live_')) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Missing or invalid x-api-key header. Keys start with axelo_live_',
          docs: 'https://axelotours.co.ke/partner/api-docs',
        },
        { status: 401 }
      ),
    };
  }

  // Check rate limit before hitting the database
  const rl = checkRateLimit(apiKey);
  const rlHeaders = {
    'X-RateLimit-Limit': String(RATE_LIMIT),
    'X-RateLimit-Remaining': String(rl.remaining),
    'X-RateLimit-Reset': String(Math.ceil(rl.resetAt / 1000)),
  };

  if (!rl.allowed) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error: 'Rate Limit Exceeded',
          message: `You have exceeded ${RATE_LIMIT} requests per hour. Try again after ${new Date(rl.resetAt).toISOString()}.`,
        },
        { status: 429, headers: rlHeaders }
      ),
    };
  }

  // Validate key against database
  const { data: partner, error } = await supabaseAdmin
    .from('partners')
    .select('id, company_name, company_type, tier, net_rate_discount_pct, api_key, status')
    .eq('api_key', apiKey)
    .single();

  if (error || !partner) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Unauthorized', message: 'API key not found.' },
        { status: 401, headers: rlHeaders }
      ),
    };
  }

  if (partner.status !== 'active') {
    return {
      success: false,
      response: NextResponse.json(
        {
          error: 'Forbidden',
          message: `Partner account is ${partner.status}. Contact support@axelotours.co.ke.`,
        },
        { status: 403, headers: rlHeaders }
      ),
    };
  }

  return { success: true, partner, headers: rlHeaders };
}

export { supabaseAdmin };
