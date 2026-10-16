#!/bin/sh
# local build against the live catalog (public publishable key read from the live bundle, never stored)
cd "$(dirname "$0")"
export VITE_SUPABASE_URL=https://dpjobithiiryniconytd.supabase.co
JS=$(curl -s https://rraed.com/ | grep -o '/assets/index-[^"]*\.js' | head -1)
SUPA=$(curl -s "https://rraed.com$JS" | grep -o 'assets/supa-[A-Za-z0-9_-]*\.js' | head -1)
export VITE_SUPABASE_ANON_KEY=$(curl -s "https://rraed.com/$SUPA" | grep -o 'sb_publishable_[A-Za-z0-9_-]\{20,\}' | head -1)
npx vite build 2>&1 | grep -iE "error|warn" | head -5
npx vite build --ssr src/entry-server.jsx --outDir dist-ssr 2>&1 | grep -iE "error" | head -5
NODE_ENV=production node scripts/prerender.mjs 2>&1 | tail -2
