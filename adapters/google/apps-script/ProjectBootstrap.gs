const OMEGA_GOOGLE_BOOTSTRAP = Object.freeze({
  distributionVersion: '1.3.1',
  distributionSha256: '57c40bed4042e080eae458af7cfcf841873e3cc9fc2bac8da612da037eb0f5b2',
  bootstrapTemplateId: '1u2K5jNi4JXSEPLNAkIBwRHjW3XqpwYAwIGxFU9nw21A',
  centralRegistrySheetId: '1j0hloBJO4MX-eQ1vPYfuDtqZbGqCJeSfbzkSBuBz3HU'
});

function omegaBootstrapProjectIdentity_(projectId, parentId, profiles) {
  if (!projectId || !parentId) throw new Error('OMEGA_NO_GO: projectId/parentId required');
  return {project_id:String(projectId),parent_id:String(parentId),genome_id:OMEGA_DNA.genomeId,genome_version:OMEGA_DNA.genomeVersion,genome_sha256:OMEGA_DNA.genomeSha256,distribution_version:OMEGA_GOOGLE_BOOTSTRAP.distributionVersion,distribution_sha256:OMEGA_GOOGLE_BOOTSTRAP.distributionSha256,applied_profiles:profiles||[],status:'UNPROVEN'};
}

function omegaRegisterProject_(projectId, url, parentId, profiles, evidenceText, gate, limits) {
  const ss=SpreadsheetApp.openById(OMEGA_GOOGLE_BOOTSTRAP.centralRegistrySheetId);
  const sh=ss.getSheetByName('Lineage Registry');
  if(!sh) throw new Error('OMEGA_NO_GO: registry tab missing');
  sh.appendRow([String(projectId),'Google Project Bootstrap',String(url),String(parentId),OMEGA_DNA.genomeSha256,(profiles||[]).join(';'),String(evidenceText||''),String(gate||'UNPROVEN'),String(limits||'No PASS until product-specific evidence'),Utilities.formatDate(new Date(),'Asia/Jerusalem','yyyy-MM-dd')]);
  return true;
}

function omegaCreateProjectBootstrap(projectId,parentId,profiles,destinationFolderId,targetOutputs){
  if(!destinationFolderId) throw new Error('OMEGA_NO_GO: destination folder required');
  const identity=omegaBootstrapProjectIdentity_(projectId,parentId,profiles);
  const folder=DriveApp.getFolderById(destinationFolderId);
  const source=DriveApp.getFileById(OMEGA_GOOGLE_BOOTSTRAP.bootstrapTemplateId);
  const copy=source.makeCopy('Ω '+identity.project_id+' — DNA Bootstrap',folder);
  const ss=SpreadsheetApp.openById(copy.getId());
  const contract=ss.getSheetByName('Project Contract');
  const gate=ss.getSheetByName('Release Gate');
  if(!contract||!gate) throw new Error('OMEGA_NO_GO: bootstrap structure invalid');
  contract.getRange('B2').setValue(identity.project_id);
  contract.getRange('B3').setValue(identity.parent_id);
  contract.getRange('B9').setValue((profiles||[]).join(';'));
  contract.getRange('B10').setValue(targetOutputs||'REQUIRED');
  contract.getRange('D2:D3').setValues([['UNPROVEN'],['UNPROVEN']]);
  contract.getRange('D9:D11').setValues([['UNPROVEN'],['UNPROVEN'],['UNPROVEN']]);
  gate.getRange('C2:D8').setValues(Array.from({length:7},function(){return ['UNPROVEN','UNPROVEN'];}));
  gate.getRange('C6').setValue(false);
  gate.getRange('C8:D8').setValues([['UNPROVEN','UNPROVEN']]);
  SpreadsheetApp.flush();
  omegaRegisterProject_(identity.project_id,copy.getUrl(),identity.parent_id,profiles,'Bootstrap copy created; revision/export identity and product evidence still required','UNPROVEN','Child inherits DNA but never parent PASS');
  return {project_id:identity.project_id,bootstrap_file_id:copy.getId(),bootstrap_url:copy.getUrl(),status:'UNPROVEN',genome_sha256:OMEGA_DNA.genomeSha256,distribution_sha256:OMEGA_GOOGLE_BOOTSTRAP.distributionSha256};
}

function omegaGetLatestRevisionId(fileId){
  if(typeof Drive==='undefined'||!Drive.Revisions||!Drive.Revisions.list) throw new Error('OMEGA_NO_GO: advanced Drive revision API required');
  const r=Drive.Revisions.list(fileId,{pageSize:100});
  const items=r.revisions||r.items||[];
  if(!items.length) throw new Error('OMEGA_NO_GO: revision id unavailable');
  return String(items[items.length-1].id);
}

function omegaExportNativeIdentity(fileId,exportMimeType){
  if(!fileId||!exportMimeType) throw new Error('OMEGA_NO_GO: export identity input required');
  const url='https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(fileId)+'/export?mimeType='+encodeURIComponent(exportMimeType);
  const response=UrlFetchApp.fetch(url,{headers:{Authorization:'Bearer '+ScriptApp.getOAuthToken()},muteHttpExceptions:true});
  if(response.getResponseCode()!==200) throw new Error('OMEGA_NO_GO: export failed HTTP '+response.getResponseCode());
  return {drive_file_id:String(fileId),export_mime_type:String(exportMimeType),export_sha256:omegaSha256Hex_(response.getBlob().getBytes()),exported_at:new Date().toISOString(),status:'IDENTITY_ONLY_UNPROVEN'};
}

function omegaCaptureNativeIdentity(lineage,fileId,exportMimeType){
  if(!lineage) throw new Error('OMEGA_NO_GO: lineage required');
  lineage.native_google_identity={revision_id:omegaGetLatestRevisionId(fileId),export:omegaExportNativeIdentity(fileId,exportMimeType)};
  return lineage;
}

function omegaRequireGoogleNativeRelease(lineage,expectedArtifactSha256){
  const core=omegaValidateLineageObject(lineage,expectedArtifactSha256);
  if(core.status!=='PASS') throw new Error('OMEGA_NO_GO:'+core.failures.join(','));
  const mime=lineage&&lineage.native_identity&&lineage.native_identity.mimeType||'';
  if(mime.indexOf('application/vnd.google-apps.')===0){
    const ngi=lineage.native_google_identity;
    const hasRevision=!!(ngi&&ngi.revision_id);
    const hasExport=!!(ngi&&ngi.export&&ngi.export.export_sha256);
    if(!hasRevision&&!hasExport) throw new Error('OMEGA_NO_GO:NATIVE_REVISION_OR_EXPORT_IDENTITY_MISSING');
  }
  return core;
}
