# Ω DNA — Google Apps Script Adapter

Purpose: give Google Workspace projects an executable lineage/fail-closed adapter instead of relying on prompt instructions.

## Use
1. Copy `OmegaDNA.gs` and `appsscript.json` into the Apps Script project.
2. When a material Drive artifact is created, call `omegaStampDriveFile(fileId, artifactId, parentId, profiles)`.
3. The sidecar starts `UNPROVEN` by design.
4. Product-specific validators add evidence and may set the lineage gate to `PASS` only after applicable P0s pass.
5. Before consequential delivery, call `omegaRequireRelease(lineage, expectedSha256)`.

For native Docs/Sheets/Slides, the native identity is fileId + modifiedTime; exports must be separately validated and hashed as child artifacts.

`omegaEnvelope()` can wrap payloads sent by Google Chat/webhooks or consequential Gmail/Calendar automations. Receiving/wrapping a payload is never PASS.

## Boundary
This adapter does not install itself into every Google product. It becomes executable enforcement only in projects where it is copied/imported or where an automation calls it. Unwired products remain `PROPAGATION_NOT_ENFORCED`.
