import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// Opt-in integrity check. Hash matches prove file integrity, not truth of claims.
export function validateEvidence(root, entries) {
  if (!Array.isArray(entries) || entries.length === 0) return ['EVIDENCE_MANIFEST_MISSING'];
  const failures = [];
  const base = fs.realpathSync(root);
  for (const [i, entry] of entries.entries()) {
    if (!entry || typeof entry.path !== 'string' || !/^[a-f0-9]{64}$/.test(entry.sha256 || '') ||
        path.isAbsolute(entry.path) || entry.path.includes('\\')) {
      failures.push(`EVIDENCE_${i}_INVALID`); continue;
    }
    const target = path.resolve(base, entry.path);
    const rel = path.relative(base, target);
    if (!rel || rel === '..' || rel.startsWith('..' + path.sep) || path.isAbsolute(rel)) {
      failures.push(`EVIDENCE_${i}_OUTSIDE_ROOT`); continue;
    }
    try {
      const real = fs.realpathSync(target);
      if (!real.startsWith(base + path.sep) || !fs.statSync(real).isFile()) {
        failures.push(`EVIDENCE_${i}_NOT_REGULAR_OR_OUTSIDE`); continue;
      }
      const actual = crypto.createHash('sha256').update(fs.readFileSync(real)).digest('hex');
      if (actual !== entry.sha256) failures.push(`EVIDENCE_${i}_HASH_MISMATCH`);
    } catch { failures.push(`EVIDENCE_${i}_MISSING`); }
  }
  return failures;
}
