'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Eye, EyeOff, Copy, Check, Code2 } from 'lucide-react';

interface Partner {
  api_key: string | null;
  net_rate_discount_pct: number;
  tier: string;
}

const CODE_TABS = ['JavaScript', 'Python', 'PHP'] as const;
type Tab = typeof CODE_TABS[number];

function maskKey(key: string) {
  return key.slice(0, 14) + '•'.repeat(key.length - 18) + key.slice(-4);
}

const ENDPOINTS = [
  {
    method: 'GET',
    path: '/api/v1/packages',
    desc: 'Returns all available packages with your exclusive net rates.',
    params: [
      { name: 'destination', type: 'string', req: false, desc: 'Filter by destination (partial match)' },
      { name: 'category', type: 'enum', req: false, desc: 'budget | standard | luxury | custom' },
      { name: 'min_days', type: 'integer', req: false, desc: 'Minimum duration in days' },
      { name: 'max_days', type: 'integer', req: false, desc: 'Maximum duration in days' },
    ],
  },
  {
    method: 'GET',
    path: '/api/v1/availability',
    desc: 'Check availability for packages on specific dates.',
    params: [
      { name: 'travel_date', type: 'string', req: true, desc: 'Departure date (YYYY-MM-DD)' },
      { name: 'return_date', type: 'string', req: true, desc: 'Return date (YYYY-MM-DD)' },
      { name: 'pax', type: 'integer', req: true, desc: 'Number of passengers' },
      { name: 'destination', type: 'string', req: false, desc: 'Filter by destination' },
    ],
  },
  {
    method: 'POST',
    path: '/api/v1/quotes',
    desc: 'Create a group quote programmatically.',
    params: [
      { name: 'destination', type: 'string', req: true, desc: 'Destination name' },
      { name: 'travel_date', type: 'string', req: true, desc: 'Departure date (YYYY-MM-DD)' },
      { name: 'return_date', type: 'string', req: true, desc: 'Return date (YYYY-MM-DD)' },
      { name: 'pax_count', type: 'integer', req: true, desc: 'Number of passengers' },
      { name: 'line_items', type: 'array', req: true, desc: 'Array of {type, name, unit_price_usd, qty}' },
      { name: 'transport_included', type: 'boolean', req: false, desc: 'Include transport (default: true)' },
      { name: 'notes', type: 'string', req: false, desc: 'Notes for Axelo team' },
    ],
  },
  {
    method: 'POST',
    path: '/api/v1/bookings',
    desc: 'Confirm a booking from an approved quote.',
    params: [
      { name: 'quote_id', type: 'uuid', req: true, desc: 'ID of an approved group_quote' },
      { name: 'contact_name', type: 'string', req: true, desc: 'Lead passenger name' },
      { name: 'contact_email', type: 'string', req: true, desc: 'Contact email for confirmation' },
      { name: 'contact_phone', type: 'string', req: true, desc: 'Contact phone / WhatsApp' },
      { name: 'special_requests', type: 'string', req: false, desc: 'Special guest requirements' },
    ],
  },
];

function getCodeSnippet(tab: Tab, apiKey: string) {
  const base = 'https://axelotours.co.ke';
  const key = apiKey || 'axelo_live_YOUR_KEY_HERE';

  if (tab === 'JavaScript') {
    return `// Axelo Tours Partner API — JavaScript / Node.js
const API_KEY = '${key}';
const BASE_URL = '${base}/api/v1';

// ---------- GET Packages with Net Rates ----------
const res = await fetch(\`\${BASE_URL}/packages?destination=Kenya\`, {
  headers: { 'x-api-key': API_KEY }
});
const { data: packages } = await res.json();
console.log(packages);

// ---------- Check Availability ----------
const avail = await fetch(
  \`\${BASE_URL}/availability?travel_date=2026-07-01&return_date=2026-07-08&pax=40\`,
  { headers: { 'x-api-key': API_KEY } }
);
const availability = await avail.json();

// ---------- Create a Group Quote ----------
const quote = await fetch(\`\${BASE_URL}/quotes\`, {
  method: 'POST',
  headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    destination: 'Kenya — Maasai Mara',
    travel_date: '2026-07-01',
    return_date: '2026-07-08',
    pax_count: 40,
    line_items: [
      { type: 'package', name: '5-Day Mara Safari', unit_price_usd: 1200, qty: 40 },
      { type: 'transport', name: 'Airport Transfers', unit_price_usd: 45, qty: 40 }
    ],
    transport_included: true,
    notes: 'Group from Germany, dietary: 3 vegan'
  })
});
const { data: newQuote } = await quote.json();
console.log('Quote ref:', newQuote.quote_ref);`;
  }

  if (tab === 'Python') {
    return `# Axelo Tours Partner API — Python
import requests

API_KEY = '${key}'
BASE_URL = '${base}/api/v1'
HEADERS = {'x-api-key': API_KEY, 'Content-Type': 'application/json'}

# ---------- GET Packages ----------
res = requests.get(f'{BASE_URL}/packages', params={'destination': 'Kenya'}, headers=HEADERS)
packages = res.json()['data']
print(f"Found {len(packages)} packages")

# ---------- Check Availability ----------
avail = requests.get(f'{BASE_URL}/availability', params={
    'travel_date': '2026-07-01',
    'return_date': '2026-07-08',
    'pax': 40
}, headers=HEADERS)
print(avail.json()['meta'])

# ---------- Create Quote ----------
payload = {
    'destination': 'Kenya — Maasai Mara',
    'travel_date': '2026-07-01',
    'return_date': '2026-07-08',
    'pax_count': 40,
    'line_items': [
        {'type': 'package', 'name': '5-Day Mara Safari', 'unit_price_usd': 1200, 'qty': 40}
    ]
}
quote = requests.post(f'{BASE_URL}/quotes', json=payload, headers=HEADERS)
print('Quote ref:', quote.json()['data']['quote_ref'])`;
  }

  // PHP
  return `<?php
// Axelo Tours Partner API — PHP

define('API_KEY', '${key}');
define('BASE_URL', '${base}/api/v1');

function axelo_request(string $method, string $endpoint, array $params = []): array {
    $ch = curl_init();
    $url = BASE_URL . $endpoint;
    if ($method === 'GET' && !empty($params)) $url .= '?' . http_build_query($params);
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => ['x-api-key: ' . API_KEY, 'Content-Type: application/json'],
        CURLOPT_CUSTOMREQUEST => $method,
    ]);
    if ($method === 'POST' && !empty($params)) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($params));
    }
    $res = curl_exec($ch);
    curl_close($ch);
    return json_decode($res, true);
}

// GET packages
$packages = axelo_request('GET', '/packages', ['destination' => 'Kenya']);
echo "Found " . $packages['meta']['count'] . " packages\n";

// Create quote
$quote = axelo_request('POST', '/quotes', [
    'destination' => 'Kenya — Maasai Mara',
    'travel_date' => '2026-07-01',
    'return_date' => '2026-07-08',
    'pax_count' => 40,
    'line_items' => [['type' => 'package', 'name' => '5-Day Mara Safari', 'unit_price_usd' => 1200, 'qty' => 40]]
]);
echo "Quote ref: " . $quote['data']['quote_ref'];`;
}

export default function ApiDocsPage() {
  const supabase = createClient();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [codeTab, setCodeTab] = useState<Tab>('JavaScript');

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('partners').select('api_key, net_rate_discount_pct, tier').eq('contact_email', user.email).single();
      setPartner(data);
    };
    init();
  }, [supabase]);

  const handleCopy = async () => {
    if (!partner?.api_key) return;
    await navigator.clipboard.writeText(partner.api_key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const METHOD_COLORS: Record<string, string> = {
    GET: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
    POST: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
  };

  return (
    <div className="p-8 text-white max-w-4xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold mb-1">API Documentation</h1>
        <p className="text-gray-400">Integrate Axelo packages directly into your booking platform</p>
      </div>

      {/* API Key Card */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-5 mb-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Your API Key
            </div>
            {partner?.api_key ? (
              <div className="flex items-center gap-3">
                <code className="font-mono text-sm text-emerald-300 bg-black/20 px-3 py-2 rounded-lg flex-1 min-w-0 truncate">
                  {revealed ? partner.api_key : maskKey(partner.api_key)}
                </code>
                <button onClick={() => setRevealed(r => !r)} className="text-gray-400 hover:text-white transition-colors shrink-0" title={revealed ? 'Hide' : 'Reveal'}>
                  {revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button onClick={handleCopy} className="text-gray-400 hover:text-white transition-colors shrink-0">
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            ) : (
              <p className="text-sm text-amber-400">No API key assigned yet. Contact partnerships@axelotours.co.ke</p>
            )}
          </div>
          <div className="text-right shrink-0">
            <div className="text-xs text-gray-500">Rate Limit</div>
            <div className="font-bold text-white">100 req/hour</div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
          <span>Base URL: <code className="text-gray-300">https://axelotours.co.ke/api/v1</code></span>
          <span>Auth: <code className="text-gray-300">x-api-key</code> header</span>
          <span>Tier: <span className="capitalize text-gray-300">{partner?.tier ?? '—'}</span></span>
        </div>
      </div>

      {/* Code Snippets */}
      <div className="mb-8">
        <h2 className="font-display text-xl font-bold mb-4">Quick Start</h2>
        <div className="bg-[#0a0f0a] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="flex items-center gap-1 px-4 pt-4 border-b border-white/[0.06]">
            {CODE_TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setCodeTab(tab)}
                className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
                  codeTab === tab ? 'bg-white/10 text-white border-t border-x border-white/10' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <pre className="p-5 text-xs text-gray-300 leading-relaxed overflow-x-auto font-mono whitespace-pre">
            <code>{getCodeSnippet(codeTab, partner?.api_key ?? '')}</code>
          </pre>
        </div>
      </div>

      {/* Endpoints */}
      <div>
        <h2 className="font-display text-xl font-bold mb-5">Endpoints</h2>
        <div className="space-y-4">
          {ENDPOINTS.map(ep => (
            <div key={ep.path} className="bg-white/[0.03] border border-white/[0.08] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 flex items-center gap-3 border-b border-white/[0.06]">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border font-mono ${METHOD_COLORS[ep.method]}`}>
                  {ep.method}
                </span>
                <code className="font-mono text-sm text-white">{ep.path}</code>
              </div>
              <div className="px-5 py-4">
                <p className="text-sm text-gray-400 mb-4">{ep.desc}</p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-600 border-b border-white/[0.05]">
                      <th className="text-left pb-2 font-medium">Parameter</th>
                      <th className="text-left pb-2 font-medium">Type</th>
                      <th className="text-left pb-2 font-medium">Required</th>
                      <th className="text-left pb-2 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ep.params.map(p => (
                      <tr key={p.name} className="border-b border-white/[0.03]">
                        <td className="py-2 pr-4"><code className="text-emerald-400">{p.name}</code></td>
                        <td className="py-2 pr-4 text-blue-400">{p.type}</td>
                        <td className="py-2 pr-4">
                          {p.req
                            ? <span className="text-amber-400">required</span>
                            : <span className="text-gray-600">optional</span>}
                        </td>
                        <td className="py-2 text-gray-400">{p.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rate Limit Info */}
      <div className="mt-8 bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5">
        <h3 className="font-display font-bold mb-3 flex items-center gap-2"><Code2 className="w-5 h-5 text-primary" /> Rate Limiting</h3>
        <div className="text-sm text-gray-400 space-y-2">
          <p>All API endpoints are rate-limited to <strong className="text-white">100 requests per rolling hour</strong> per API key.</p>
          <p>Response headers for every request include:</p>
          <pre className="bg-black/30 rounded-xl p-3 text-xs mt-2 text-gray-300 font-mono">
{`X-RateLimit-Limit: 100
X-RateLimit-Remaining: 97
X-RateLimit-Reset: 1750000000`}
          </pre>
          <p>When the limit is exceeded, you receive a <code className="text-amber-400">429 Too Many Requests</code> response with a retry timestamp.</p>
        </div>
      </div>

      {/* Support */}
      <div className="mt-6 text-sm text-gray-500 text-center">
        Need help integrating? Email <a href="mailto:tech@axelotours.co.ke" className="text-primary hover:underline">tech@axelotours.co.ke</a> or WhatsApp your account manager.
      </div>
    </div>
  );
}
