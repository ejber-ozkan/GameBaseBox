import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const workflow = readFileSync(
  join(process.cwd(), '.github', 'workflows', 'release-bundles.yml'),
  'utf8',
);

describe('release workflow', () => {
  it('creates one release and uploads every platform asset with GitHub CLI', () => {
    expect(workflow).not.toContain('softprops/action-gh-release');
    expect(workflow.match(/gh release create/g)).toHaveLength(1);
    expect(workflow.match(/gh release upload/g)).toHaveLength(3);
    expect(workflow.match(/GH_TOKEN: \$\{\{ secrets\.GITHUB_TOKEN \}\}/g)).toHaveLength(4);
  });
});
