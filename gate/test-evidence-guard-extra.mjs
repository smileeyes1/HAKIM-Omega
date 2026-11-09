import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {validateEvidence} from './evidence-guard.mjs';
const base=fs.mkdtempSync(path.join(os.tmpdir(),'omega-extra-'));
const root=path.join(base,'evidence'); fs.mkdirSync(root);
const outside=path.join(base,'outside'); fs.writeFileSync(outside,'sensitive');
const sha=crypto.createHash('sha256').update('sensitive').digest('hex');
let passed=0;
function check(name,entry) {
  const errors=validateEvidence(root,[entry]);
  if(!errors.length) throw Error(name+' unexpectedly accepted');
  console.log(name,errors[0]); passed++;
}
try {
  fs.symlinkSync(outside,path.join(root,'link'));
  check('symlink escape',{path:'link',sha256:sha});
  fs.mkdirSync(path.join(root,'folder'));
  check('directory',{path:'folder',sha256:sha});
  check('bad digest',{path:'link',sha256:'bad'});
  console.log('PASS',passed,'/ 3');
} finally { fs.rmSync(base,{recursive:true,force:true}); }
