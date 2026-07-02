# GBBox 0.3.1 Release Notes

## Highlights

- Increased the windowed grid and list platform background image visibility by about 20%.
- Kept the existing platform-specific rotating background behavior and overlay treatment.

## Validation

The release source was prepared to pass:

```bash
npm run lint
npm run test:frontend
npm run test:backend
npm run build
```

Release bundles are produced by the GitHub Actions `Release Bundles` workflow when the `v0.3.1` tag is pushed.
