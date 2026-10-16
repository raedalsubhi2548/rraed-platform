// tiny helper: exact replacements that ignore CRLF/LF differences
const fs = require('fs')
module.exports = function edit(p, reps) {
  let s = fs.readFileSync(p, 'utf8'); const crlf = s.includes('\r\n'); s = s.replace(/\r\n/g, '\n')
  for (const [a, b] of reps) { if (!s.includes(a)) throw new Error(p + ' miss: ' + a.slice(0, 80)); s = s.split(a).join(b) }
  fs.writeFileSync(p, crlf ? s.replace(/\n/g, '\r\n') : s)
}
