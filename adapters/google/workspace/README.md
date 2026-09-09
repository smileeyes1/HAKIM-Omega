# Google Workspace Ω inheritance

For Drive/Docs/Sheets/Slides, use the Google Control Plane registry as the lineage ledger. A native Google file is mutable, so PASS must bind to a revision ID or to a deterministic export hash; title/file ID alone is insufficient. For exported PDF/DOCX/PPTX/XLSX, bind the exact exported bytes with SHA-256 and run the applicable validators. Apps Script uses `OmegaDNA.gs`. Gemini/Gems remains projection-only unless an external gate validates the exported artifact.
