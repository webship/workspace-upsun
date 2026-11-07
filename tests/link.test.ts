import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import os from 'os';
import path from 'path';

const PKG = fs.existsSync(path.join(__dirname, '..', 'package.json')) ? path.join(__dirname, '..') : path.join(__dirname, '..', '..');

import { upsunLinkOf } from '../src/lib/link';

// The rule every plugin keeps: nothing required from outside the package, so the command line and
// the dashboard see the same code and the package can be installed from npm on its own.
test('the package requires nothing outside itself', () => {
  for (const f of ['src/index.ts', 'src/lib/link.ts', 'src/lib/environments.ts']) {
    const src = fs.readFileSync(path.join(PKG, f), 'utf8');
    assert.doesNotMatch(src, /from ['"]\.\.\/\.\./, `${f} reaches outside the package`);
    assert.doesNotMatch(src, /from ['"](\.\.\/)+(html|jobs|workspaces|format|validate|command-block)['"]/, `${f} imports a dashboard module`);
  }
});

test('a project is linked when .upsun/local/project.yaml names an id, and the branch comes from git', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'upsun-'));
  const p = path.join(dir, 'site1');
  fs.mkdirSync(path.join(p, '.upsun', 'local'), { recursive: true });
  fs.mkdirSync(path.join(p, '.git'), { recursive: true });
  fs.writeFileSync(path.join(p, '.upsun', 'local', 'project.yaml'), 'id: abcdefgh1234\nhost: eu-5.platform.sh\n');
  fs.writeFileSync(path.join(p, '.git', 'HEAD'), 'ref: refs/heads/main\n');
  fs.writeFileSync(path.join(p, '.git', 'config'), '[remote "upsun"]\n\turl = abcdefgh1234@git.eu-5.platform.sh:abcdefgh1234.git\n');
  const u = upsunLinkOf(dir, 'site1');
  assert.strictEqual(u.id, 'abcdefgh1234');
  assert.strictEqual(u.branch, 'main');
  assert.strictEqual(u.mismatch, false);
  assert.strictEqual(upsunLinkOf(dir, 'nope'), null);
});

test('the manifest says what the installer has to place, and every named file ships', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(PKG, 'package.json'), 'utf8'));
  const m = pkg.workspacePlugin;
  assert.strictEqual(m.name, 'upsun');
  const files: string[] = [m.settingsTemplate, m.labels, ...m.commands.files, ...m.scripts.functions, ...m.scripts.args, ...m.scripts.machine, m.scripts.hostInstall, ...m.ddev.compose, ...m.themes, ...m.css, ...(m.features || [])];
  for (const f of files) assert.ok(fs.existsSync(path.join(PKG, f)), `${f} is in the package`);
});
