import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { register } from '../src/index';

// Compiled, these tests run from dist/tests, so the package root is one folder further up.
const PKG = fs.existsSync(path.join(__dirname, '..', 'package.json')) ? path.join(__dirname, '..') : path.join(__dirname, '..', '..');

// A stand-in for the dashboard's api: records what register() asks for, and answers the few
// helpers the plugin calls while drawing.
function fakeApi(root: string) {
  const calls: { rowMenus: Record<string, any>; chips: any[]; actions: Record<string, any>; fragments: any[]; pages: any[]; setups: any[] } = { rowMenus: {}, chips: [], actions: {}, fragments: [], pages: [], setups: [] };
  const api = {
    name: 'upsun',
    config: {},
    settings: { read: () => ({ cli_token: 'CHANGE_ME' }), set() {}, setList() {} },
    lib: {
      esc: (s: unknown) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
      workspaceDir: (ws: string) => path.join(root, ws),
      listProjects: (dir: string) => fs.readdirSync(dir),
      isValidWorkspace: (ws: string) => /^[a-z0-9_-]+$/.test(ws),
      screenAction: () => {},
      iconHtml: (name: string) => `<i data-icon="${name}"></i>`,
      NAME_RE: /^[a-zA-Z0-9_-]+$/,
      ROOT: root, run: async () => ({ ok: false }), startInScreen: async () => ({ ok: true }), screenStartedHtml: () => '', cliError: (s) => s, commandBlock: () => '',
    },
    addRowMenu: (slot: string, spec: any, fn: any) => { calls.rowMenus[slot] = { spec, fn }; },
    addProjectChip: (fn: any) => calls.chips.push(fn),
    addAction: (name: string, fn: any) => { calls.actions[name] = fn; },
    addFragment: (fn: any) => calls.fragments.push(fn),
    addPage: (re: RegExp, fn: any) => calls.pages.push({ re, fn }),
    addFolderSetup: (s: any) => calls.setups.push(s),
  };
  return { api, calls };
}

function workspace() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'upsun-ws-'));
  fs.mkdirSync(path.join(root, 'dev', 'site1'), { recursive: true });
  fs.writeFileSync(path.join(root, 'dev', 'cmd-tools-upsun.sh'), '#!/usr/bin/env bash\n');
  return root;
}

test('register() asks for exactly the surface the plugin owns', () => {
  const { api, calls } = fakeApi(workspace());
  register(api as any);
  assert.deepStrictEqual(Object.keys(calls.rowMenus), ['upsun']);
  assert.deepStrictEqual(calls.rowMenus.upsun.spec, { label: 'UPSUN', row: 0 });
  assert.deepStrictEqual(Object.keys(calls.actions).sort(), ['activities', 'environments', 'envs', 'logs', 'pull', 'pull-form', 'site-url', 'status']);
  assert.strictEqual(calls.chips.length, 1);
  assert.strictEqual(calls.fragments.length, 1);
  assert.ok(calls.pages[0].re.test('/upsun-site/dev/site1'));
  assert.strictEqual(calls.setups.length, 1);
});

test('the row menu shows only where the type allows upsun and the folder has the command', () => {
  const root = workspace();
  const { api, calls } = fakeApi(root);
  register(api as any);
  const vals = () => 'hx-vals=\'{}\'';
  const ctx: any = { key: 'dev', project: 'site1', dir: path.join(root, 'dev'), meta: {}, vals };
  const shown = calls.rowMenus.upsun.fn({ ...ctx, allowed: new Set(['upsun']) });
  assert.match(shown, /UPSUN/);
  assert.match(shown, /not linked/, 'an unlinked project still gets the menu, and says so');
  assert.match(shown, /\/actions\/p\/upsun\/status/, 'actions are namespaced under the plugin');
  assert.strictEqual(calls.rowMenus.upsun.fn({ ...ctx, allowed: new Set(['ddev']) }), null, 'a type that does not allow upsun gets nothing');
  fs.unlinkSync(path.join(root, 'dev', 'cmd-tools-upsun.sh'));
  assert.strictEqual(calls.rowMenus.upsun.fn({ ...ctx, allowed: new Set(['upsun']) }), null, 'no command in the folder, no menu');
});

test('the New-folder section links, creates with AI, and refuses a bad id', () => {
  const root = workspace();
  const { api, calls } = fakeApi(root);
  register(api as any);
  const [setup] = calls.setups;
  const ctx = { allowed: new Set(['upsun']) } as any;
  assert.match(setup.html('dev', ctx), /name="upsun" value="link"/);
  assert.strictEqual(setup.html('dev', { allowed: new Set() }), '');
  const steps = setup.steps('dev', 'demo1', { upsun: 'link', upsun_id: 'abcd1234efgh5' }, ctx);
  assert.match(steps.join(' && '), /git init -q/);
  assert.match(steps.join(' && '), /bash cmd-tools-upsun\.sh 'demo1' --link 'abcd1234efgh5'/);
  assert.deepStrictEqual(setup.steps('dev', 'demo1', { upsun: 'none' }, ctx), []);
  assert.match(setup.prompt('dev', 'demo1', { upsun: 'create' }).join(''), /ask me which organization, region and plan/);
  assert.match(setup.problem('dev', { upsun: 'link', upsun_id: 'BAD ID' }, ctx), /Upsun project id/);
  assert.strictEqual(setup.problem('dev', {}, ctx), '');
});
