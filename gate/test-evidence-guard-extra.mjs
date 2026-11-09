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
  check('absolute path',{path:outside,sha256:sha});
  check('backslash path',{path:'folder\\\\proof.txt',sha256:sha});
  check('root path',{path:'.',sha256:sha});
  check('empty path',{path:'',sha256:sha});
  check('parent traversal',{path:'../outside',sha256:sha});
  fs.mkdirSync(path.join(root,'nested'));
  fs.writeFileSync(path.join(root,'nested','proof.txt'),'sensitive');
  const ok=validateEvidence(root,[{path:'nested/proof.txt',sha256:sha}]);
  if(ok.length) throw Error('nested valid evidence rejected: '+ok.join(','));
  console.log('nested valid evidence accepted'); passed++;
  console.log('PASS',passed,'/ 9');
} finally { fs.rmSync(base,{recursive:true,force:true}); }
