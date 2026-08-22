# CI, not yet enabled

`github-actions-test.yml` is a ready-to-use GitHub Actions workflow: typecheck,
tests against a Postgres service, and a production build.

It is parked here rather than in `.github/workflows/` because pushing a workflow
file needs a GitHub token with `workflow` scope, which this repository's token
does not have.

To enable it:

```bash
gh auth refresh -h github.com -s workflow
mkdir -p .github/workflows
git mv ci/github-actions-test.yml .github/workflows/test.yml
git commit -m "ci: enable the test workflow"
git push
```

Until then, run the same checks locally:

```bash
npm run typecheck && npm test && npm run build
```
