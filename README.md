# Ω HAKIM — Inheritable Assurance DNA

This repository is the external, versioned Genome Registry for the Ω assurance system.

## Core rule
Every materially relevant product may inherit Ω only through an explicit lineage sidecar (`<artifact>.omega.json`). A product without a valid lineage is **not an Ω-qualified product**.

## Default inheritance
`Canonical → Main Signed v0.8 → Host Assurance Head v0.9H.1 (when physical evidence is not required) → relevant profile → task contract → artifact → evidence → gate`.

## Fail-closed
UNKNOWN / UNTESTED / UNPROVEN / missing P0 evidence => NO RELEASE. Host evidence must never be promoted into physical/field/aviation/nuclear claims.

## Files
- `genome/omega-dna.json` — inheritable policy genome.
- `genome/omega-dna.sha256` — independent genome digest.
- `runtime/validate-dna.mjs` — fail-closed inheritance validator.
- `runtime/stamp-artifact.mjs` — creates a lineage sidecar for a new artifact; it does **not** mark it PASS.
- `templates/artifact.omega.template.json` — portable sidecar template.
- `.github/workflows/omega-dna.yml` — CI gate on every push/PR.

## Portable integration contract
Any external platform can participate by preserving the sidecar fields and refusing PASS unless its own applicable validators/evidence succeed. This repository cannot magically enforce platforms with no integration; enforcement is real only where a validator/gate is wired into that platform's release path.

## Distribution layer v1.1
Reusable GitHub actions are provided under `inherit/` and `gate/`. See `DISTRIBUTION.md`.
