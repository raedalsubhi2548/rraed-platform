// Runs the prerender with NODE_ENV=production on any shell (the `NODE_ENV=… node` prefix only works in POSIX shells).
process.env.NODE_ENV = 'production'
await import('./prerender.mjs')
