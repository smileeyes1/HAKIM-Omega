const OMEGA_DNA = Object.freeze({
  genomeId: 'OMEGA_INHERITABLE_ASSURANCE_DNA',
  genomeVersion: '1.0.0',
  genomeSha256: '1e5dfdf7816bb83368b94a7c04e94833c0a27775417f638dcc4c4eeeb5bae312',
  mainSignedHead: 'v0.8.0/sequence8',
  hostAssuranceHead: 'v0.9H.1',
  failClosed: true,
  forbiddenClaims: [
    'PHYSICAL_ANDROID_QUALIFIED','PHYSICAL_PRINTER_QUALIFIED','HARDWARE_BACKED_TRUST',
    'ORGANIZATIONALLY_INDEPENDENT_IVV','FIELD_PROVEN','AVIATION_NUCLEAR_EQUIVALENT','ZERO_DEFECT'
  ]
});

function omegaSha256Hex_(bytes) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytes)
    .map(function(b){ return ('0' + ((b < 0 ? b + 256 : b).toString(16))).slice(-2); }).join('');
}

function omegaNativeIdentity_(file) {
  return {
    fileId: file.getId(),
    name: file.getName(),
    mimeType: file.getMimeType(),
    modifiedTime: file.getLastUpdated().toISOString()
  };
}

/**
 * Creates a lineage sidecar next to a Drive file. This NEVER marks PASS.
 * For native Docs/Sheets/Slides, identity is fileId+modifiedTime; exported bytes must be
 * validated separately before release. For binary files, artifactSha256 is computed.
 */
function omegaStampDriveFile(fileId, artifactId, parentId, appliedProfiles) {
  if (!fileId || !artifactId || !parentId) throw new Error('OMEGA_NO_GO: required lineage input missing');
  var file = DriveApp.getFileById(fileId);
  var mime = file.getMimeType();
  var isNative = mime.indexOf('application/vnd.google-apps.') === 0;
  var hash = isNative ? null : omegaSha256Hex_(file.getBlob().getBytes());
  var lineage = {
    omega_lineage_version: '1',
    artifact_id: artifactId,
    artifact_sha256: hash,
    native_identity: omegaNativeIdentity_(file),
    dna: {genome_id:OMEGA_DNA.genomeId, genome_version:OMEGA_DNA.genomeVersion, genome_sha256:OMEGA_DNA.genomeSha256},
    parent: {kind:'contract_or_artifact', id:parentId, sha256:''},
    applied_profiles: appliedProfiles || [],
    applicable_p0: [],
    evidence_refs: [],
    gate: {result:'UNPROVEN', scope:'GOOGLE_HOST_ONLY_OR_FIELD_AS_PROVEN', tested_equals_delivered:false},
    claims: [],
    limitations: isNative ? ['NATIVE_FILE_REQUIRES_SEPARATE_EXPORT_VALIDATION'] : ['INHERITED_NOT_YET_RELEASE_QUALIFIED']
  };
  var parents = file.getParents();
  var folder = parents.hasNext() ? parents.next() : DriveApp.getRootFolder();
  var sidecar = folder.createFile(file.getName() + '.omega.json', JSON.stringify(lineage, null, 2), MimeType.PLAIN_TEXT);
  return {sidecarFileId: sidecar.getId(), lineage: lineage};
}

function omegaValidateLineageObject(lineage, expectedArtifactSha256) {
  var failures = [];
  if (!lineage || lineage.omega_lineage_version !== '1') failures.push('LINEAGE_VERSION_INVALID');
  if (lineage && lineage.dna && lineage.dna.genome_id !== OMEGA_DNA.genomeId) failures.push('GENOME_ID_MISMATCH');
  if (lineage && lineage.dna && lineage.dna.genome_version !== OMEGA_DNA.genomeVersion) failures.push('GENOME_VERSION_MISMATCH');
  if (lineage && lineage.dna && lineage.dna.genome_sha256 !== OMEGA_DNA.genomeSha256) failures.push('GENOME_SHA256_MISMATCH');
  if (!lineage || !lineage.parent || !lineage.parent.id) failures.push('PARENT_MISSING');
  if (!lineage || !Array.isArray(lineage.evidence_refs) || lineage.evidence_refs.length === 0) failures.push('EVIDENCE_MISSING');
  if (!lineage || !lineage.gate || lineage.gate.result !== 'PASS') failures.push('GATE_NOT_PASS');
  if (!lineage || !lineage.gate || lineage.gate.tested_equals_delivered !== true) failures.push('TESTED_DELIVERED_NOT_PROVEN');
  if (expectedArtifactSha256 && lineage.artifact_sha256 !== expectedArtifactSha256) failures.push('ARTIFACT_HASH_MISMATCH');
  (lineage && lineage.claims || []).forEach(function(c){
    if (OMEGA_DNA.forbiddenClaims.indexOf(c) >= 0 && lineage.gate.scope !== 'FIELD_AS_PROVEN') failures.push('FORBIDDEN_CLAIM:' + c);
  });
  return {status: failures.length ? 'NO_GO' : 'PASS', failures: failures};
}

/** Fail closed: throws if release conditions are not met. */
function omegaRequireRelease(lineage, expectedArtifactSha256) {
  var r = omegaValidateLineageObject(lineage, expectedArtifactSha256);
  if (r.status !== 'PASS') throw new Error('OMEGA_NO_GO:' + r.failures.join(','));
  return r;
}

/** Generic envelope for Google Chat/webhook/Gmail/Calendar/other workflows. */
function omegaEnvelope(payload, artifactId, parentId, profiles) {
  if (!artifactId || !parentId) throw new Error('OMEGA_NO_GO: artifactId/parentId required');
  return {
    omega: {
      genome_id: OMEGA_DNA.genomeId,
      genome_version: OMEGA_DNA.genomeVersion,
      genome_sha256: OMEGA_DNA.genomeSha256,
      artifact_id: artifactId,
      parent_id: parentId,
      applied_profiles: profiles || [],
      gate: 'UNPROVEN'
    },
    payload: payload
  };
}
