Set-Location "c:\Users\Manu\Desktop\Axelo Tours\axelo-tours"
Write-Host "Installing NPM dependencies..."
npm install @supabase/supabase-js @supabase/ssr framer-motion gsap three @types/three lucide-react date-fns react-hot-toast @stripe/stripe-js stripe

Write-Host "Running shadcn init..."
npx --yes shadcn@latest init -d

Write-Host "Scaffolding directories..."
Set-Location "src"

$dirs = @(
  "app/(public)/safaris/[slug]",
  "app/(public)/book/[id]",
  "app/(public)/portal",
  "app/(public)/about",
  "app/(public)/contact",
  "app/(admin)/admin/bookings",
  "app/(admin)/admin/packages",
  "app/(admin)/admin/clients",
  "app/(admin)/admin/payments",
  "app/(admin)/admin/costing",
  "app/(admin)/admin/vouchers",
  "app/(admin)/admin/intel",
  "app/(admin)/admin/calls",
  "app/(admin)/admin/outreach",
  "app/api/bookings",
  "app/api/packages",
  "app/api/payments/intasend",
  "app/api/payments/stripe",
  "app/api/chat",
  "app/api/voice/inbound",
  "app/api/costing/analyse",
  "app/api/vouchers/generate",
  "app/api/vouchers/send",
  "app/api/competitor-analysis",
  "app/api/outreach/research",
  "app/api/outreach/generate-email",
  "app/api/blog/generate",
  "components/ui",
  "components/layout",
  "components/home",
  "components/booking",
  "components/admin",
  "components/chat"
)

foreach ($d in $dirs) {
  if (-not (Test-Path $d)) {
    New-Item -ItemType Directory -Force -Path $d | Out-Null
  }
}

$files = @(
  "app/(public)/page.tsx",
  "app/(public)/safaris/page.tsx",
  "app/(public)/safaris/[slug]/page.tsx",
  "app/(public)/book/[id]/page.tsx",
  "app/(public)/portal/page.tsx",
  "app/(public)/about/page.tsx",
  "app/(public)/contact/page.tsx",
  "app/(admin)/admin/page.tsx",
  "app/(admin)/admin/bookings/page.tsx",
  "app/(admin)/admin/packages/page.tsx",
  "app/(admin)/admin/clients/page.tsx",
  "app/(admin)/admin/payments/page.tsx",
  "app/(admin)/admin/costing/page.tsx",
  "app/(admin)/admin/vouchers/page.tsx",
  "app/(admin)/admin/intel/page.tsx",
  "app/(admin)/admin/calls/page.tsx",
  "app/(admin)/admin/outreach/page.tsx",
  "app/api/bookings/route.ts",
  "app/api/packages/route.ts",
  "app/api/payments/intasend/route.ts",
  "app/api/payments/stripe/route.ts",
  "app/api/chat/route.ts",
  "app/api/voice/inbound/route.ts",
  "app/api/costing/analyse/route.ts",
  "app/api/vouchers/generate/route.ts",
  "app/api/vouchers/send/route.ts",
  "app/api/competitor-analysis/route.ts",
  "app/api/outreach/research/route.ts",
  "app/api/outreach/generate-email/route.ts",
  "app/api/blog/generate/route.ts"
)

foreach ($f in $files) {
  if (-not (Test-Path $f)) {
    $content = ""
    if ($f.EndsWith("page.tsx")) {
      $content = "export default function Page() { return <div>Placeholder</div> }"
    } elseif ($f.EndsWith("route.ts")) {
      $content = "export async function GET() { return Response.json({ status: 'ok' }) }"
    }
    Set-Content -Path $f -Value $content
  }
}

Write-Host "Scaffolding Complete"
