import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { validateEvidence } from './evidence-guard.mjs';
const root=fs.mkdtempSync(path.join(os.tmpdir(),'omega-evidence-'));
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
let passed=0;
function check(label, entries, expected) {
  const errors=validateEvidence(root,entries);
  if ((errors.length===0)!==expected) throw Error(label+': '+errors.join(','));
  passed++; console.log(label+': PASS');
}
try {
  fs.writeFileSync(path.join(root,'proof.txt'),'known');
  const valid={path:'proof.txt',sha256:sha('known')};
  check('valid',[valid],true);
  check('wrong-hash',[{...valid,sha256:'0'.repeat(64)}],false);
  check('missing',[{...valid,path:'missing.txt'}],false);
  check('traversal',[{...valid,path:'../proof.txt'}],false);
  check('empty',[],false);
  fs.writeFileSync(path.join(root,'proof.txt'),'tampered');
  check('tampered',[valid],false);
  console.log('PASS '+passed+'/6');
} finally { fs.rmSync(root,{recursive:true,force:true}); }
