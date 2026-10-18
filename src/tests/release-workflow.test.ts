import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const workflow = require('js-yaml').load(readFileSync('.github/workflows/release-bundles.yml', 'utf8'));

describe('release workflow', () => {
  it('validates versions before quality, draft creation or platform builds', () => {
    expect(workflow.permissions).toEqual({ contents: 'read' });
    expect(workflow.jobs.validate.permissions).toEqual({ contents: 'read' });
    expect(workflow.jobs.validate.steps.some((step: { run?: string }) => step.run?.includes('scripts/release-safety.mjs versions'))).toBe(true);
    expect(workflow.jobs.quality.needs).toContain('validate');
    expect(workflow.jobs.draft.needs).toContain('quality');
    for (const platform of ['windows', 'linux', 'macos']) {
      expect(workflow.jobs[`build-${platform}`].needs).toContain('validate');
      expect(workflow.jobs[`build-${platform}`].permissions).toEqual({ contents: 'read' });
    }
  });

  it('keeps releases draft until every required bundle and checksum is verified', () => {
    const draft = workflow.jobs.draft;
    const publish = workflow.jobs.publish;
    expect(draft.if).toBe("github.event_name == 'push'");
    expect(draft.permissions).toEqual({ contents: 'write' });
    expect(draft.steps.map((step: { run?: string }) => step.run || '').join('\n')).toContain('--draft');
    expect(publish.if).toBe("github.event_name == 'push'");
    expect(publish.permissions).toEqual({ contents: 'write' });
    expect(publish.needs).toEqual(['validate', 'draft', 'build-windows', 'build-linux', 'build-macos', 'verify-bundles']);
    const commands = publish.steps.map((step: { run?: string }) => step.run || '').join('\n');
    expect(commands.indexOf('scripts/release-safety.mjs verify')).toBeGreaterThanOrEqual(0);
    expect(commands.indexOf('scripts/release-safety.mjs verify')).toBeLessThan(commands.indexOf('gh release upload'));
    expect(commands.indexOf('gh release upload')).toBeLessThan(commands.indexOf('--draft=false'));
    expect(commands).not.toContain('always()');
  });

  it('only uploads CI artifacts from build jobs, with missing files treated as errors', () => {
    for (const platform of ['windows', 'linux', 'macos']) {
      const job = workflow.jobs[`build-${platform}`];
      const commands = job.steps.map((step: { run?: string }) => step.run || '').join('\n');
      expect(commands).not.toContain('gh release');
      expect(commands).toContain(`scripts/release-safety.mjs checksum release-assets ${platform}`);
      const upload = job.steps.find((step: { uses?: string }) => step.uses?.startsWith('actions/upload-artifact@'));
      expect(upload.with['if-no-files-found']).toBe('error');
    }
  });
});
