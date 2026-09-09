# Ω DNA distribution / inheritance

## GitHub products
Stamp during build:

```yaml
- uses: smileeyes1/HAKIM-Omega/inherit@main
  with:
    artifact: dist/product.pdf
    artifact-id: product-v1
    parent-id: contract-123
    profiles: palestinian_arabic_student
```

After the product-specific validators populate evidence and mark the sidecar PASS, gate release:

```yaml
- uses: smileeyes1/HAKIM-Omega/gate@main
  with:
    artifact: dist/product.pdf
    sidecar: dist/product.pdf.omega.json
```

The inherit action deliberately creates `UNPROVEN`; only the product's actual assurance pipeline may change it to `PASS`.

## Other platforms
Carry the same `<artifact>.omega.json` sidecar (or equivalent immutable metadata envelope), preserve the genome SHA-256 and artifact SHA-256, run applicable validators, and fail closed before release.

If a platform cannot carry metadata or call a validator, it is not automatically Ω-enforced; record `PROPAGATION_NOT_ENFORCED` rather than claiming inherited assurance.
