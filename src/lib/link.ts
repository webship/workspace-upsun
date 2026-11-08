/**
 * Whether a project is linked to Upsun, and to what.
 *
 * Read from the project's own `.upsun/local/project.yaml` and its git remote. The hosting base
 * memoises the answer per render, so this reads the files every time it is asked.
 */

import fs from 'fs';
import path from 'path';

import type { HostingLink } from '@webship.co/workspace-hosting';

export interface UpsunLink extends HostingLink {
  id: string | null;
  host: string | null;
  remote: string | null;
  remoteId: string | null;
  env: string | null;
  branch: string | null;
  mismatch: boolean;
  remoteNotUpsun: boolean;
}

/** The link of the project at `projectDir`; or `(workspaceDir, project)`, the older spelling. */
export function upsunLinkOf(dir: string, project?: string): UpsunLink | null {
  const root = project === undefined ? dir : path.join(dir, project);
  let id: string | null = null; let host: string | null = null; let remote: string | null = null;
  try {
    const y = fs.readFileSync(path.join(root, '.upsun', 'local', 'project.yaml'), 'utf8');
    id = (y.match(/^id:\s*(\S+)/m) || [])[1] || null;
    host = (y.match(/^host:\s*(\S+)/m) || [])[1] || null;
  } catch (_) { /* not linked */ }
  try {
    const cfg = fs.readFileSync(path.join(root, '.git', 'config'), 'utf8');
    const m = cfg.match(/\[remote "upsun"\]([^[]*)/);
    if (m) remote = (m[1].match(/url\s*=\s*(\S+)/) || [])[1] || null;
  } catch (_) { /* no repo or no such remote */ }
  // Which environment (branch) the local tooling works against, remembered by
  // `cmd-tools-upsun.sh --select` in the CLI's own git-excluded local directory.
  let env: string | null = null;
  try {
    env = fs.readFileSync(path.join(root, '.upsun', 'local', 'workspace-environment'), 'utf8').trim() || null;
  } catch (_) { /* none selected */ }
  // The branch the local CODE is on — often the clearest answer to "which
  // environment am I looking at locally".
  let branch: string | null = null;
  try {
    const head = fs.readFileSync(path.join(root, '.git', 'HEAD'), 'utf8').trim();
    branch = (head.match(/^ref: refs\/heads\/(.+)$/) || [])[1] || null;
  } catch (_) { /* not a git clone */ }
  // The id a push would reach, from either the platform.sh git url form or a plain one.
  const remoteId = remote ? ((remote.match(/^([a-z0-9]+)@git\./) || [])[1]
    || (remote.match(/[:/]([a-z0-9]+)\.git$/) || [])[1] || null) : null;
  const link: UpsunLink | null = (id || remote) ? {
    id, host, remote, remoteId, env, branch,
    mismatch: !!(id && remoteId && id !== remoteId),
    mismatchNote: id && remoteId && id !== remoteId ? `The git remote points at ${remoteId}` : undefined,
    remoteNotUpsun: !!(remote && !/platform\.sh|upsun/.test(remote)),
  } : null;
  return link;
}

