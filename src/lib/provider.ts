/**
 * Upsun, as a hosting provider: what differs from the other hosts.
 *
 * The link comes from `.upsun/local/project.yaml` and the `upsun` git remote; environments and
 * their live URLs from the upsun CLI inside the dashboard container, with the API token from
 * plugin.upsun.settings.yml injected per call; the pulls, the deploy log, the activities and the
 * deploy itself go through cmd-tools-upsun.sh in a screen session. The surface itself (menu, modal,
 * pull flow, chip, folder section) is @webship/workspace-hosting's.
 */

import type { PluginApi, PluginLib } from '@webship/workspace-plugin-api';
import type { EnvInfo, EnvRow, HostingLink, HostingProvider } from '@webship/workspace-hosting';

import { upsunLinkOf } from './link';

const ENV_RE = /^[a-zA-Z0-9._\/-]+$/;

export function upsunProvider(api: PluginApi): HostingProvider {
  const settings = () => api.settings.read() || {};

  // The env the upsun CLI needs in this container: the API token from settings (cli_token).
  // Injected per job, never into the app environment.
  const jobEnv = (): NodeJS.ProcessEnv | null => {
    try {
      const t = String(settings().cli_token || '').trim();
      if (t && t !== 'CHANGE_ME') return { ...process.env, UPSUN_CLI_TOKEN: t };
    } catch (_) { /* fall through */ }
    return null;
  };

  async function environments(link: HostingLink, lib: PluginLib, env: NodeJS.ProcessEnv): Promise<EnvInfo> {
    const id = link.id as string;
    const out = await lib.run('upsun', ['environment:list', '-p', id, '--format', 'csv', '--columns', 'title,id,status', '--no-header'],
      process.env.HOME, { timeoutMs: 60 * 1000, env });
    if (!out.ok) return { id, rows: [], why: 'list failed' };
    const rows: EnvRow[] = String(out.stdout).split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
      const parts = l.split(',');
      return { title: parts[0], envId: parts[1], status: parts[2] || '' };
    }).filter((r) => r.envId && ENV_RE.test(r.envId));
    // One url call per ACTIVE environment, in parallel: a paused one has no route.
    await Promise.all(rows.map(async (r) => {
      if (!/^active$/i.test(r.status)) return;
      const res = await lib.run('upsun', ['url', '--primary', '--pipe', '-p', id, '-e', r.envId],
        process.env.HOME, { timeoutMs: 60 * 1000, env });
      const url = String(res.stdout || '').trim().split('\n')[0];
      if (res.ok && /^https?:\/\//.test(url)) r.url = url;
    }));
    return { id, rows };
  }

  async function environmentActive(link: HostingLink, envId: string, lib: PluginLib, env: NodeJS.ProcessEnv): Promise<boolean> {
    const chk = await lib.run('upsun', ['environment:info', 'status', '--project', link.id || '', '--environment', envId],
      process.env.HOME, { timeoutMs: 30 * 1000, env });
    // A failed check is not a verdict: the pull itself will say what is wrong.
    return !chk.ok || /active/i.test(String(chk.stdout));
  }

  return {
    id: 'upsun',
    label: 'UPSUN',
    title: 'Upsun',
    cli: 'upsun',
    script: 'cmd-tools-upsun.sh',
    detect: (projectDir) => upsunLinkOf(projectDir),
    linkHint: (project) => `bash cmd-tools-upsun.sh ${project} --link <upsun-project-id>`,
    consoleUrl: (link) => (link.id ? `https://console.upsun.com/projects/${encodeURIComponent(link.id)}` : null),
    jobEnv,
    tokenHint: 'cli_token in core/config/plugin.upsun.settings.yml',
    environments,
    environmentActive,
    tools: {
      status: { verb: 'upsun', label: 'Link and environments', icon: 'info', args: [] },
      activities: { verb: 'upsun-activities', label: 'Last 10 activities', icon: 'list', args: ['--activities'] },
      logs: { verb: 'upsun-logs', label: 'Most recent deploy log', icon: 'file-text', args: ['--logs'] },
      deploy: { verb: 'upsun-push', label: 'Deploy the current branch (upsun push)…', icon: 'push', args: ['--push'] },
    },
    pull: {
      db: true, files: true,
      dbArgs: (e) => ['--environment', e, '--pull-db'],
      filesArgs: (e) => ['--environment', e, '--pull-files'],
      gitRemote: 'upsun',
      noSafetyBackupArg: '--no-safety-backup',
    },
    // "Unable to authenticate the provided API token" has one overwhelmingly likely cause here,
    // and the message does not say it: the field holds a token of the wrong KIND. The CLI
    // hard-wraps its error box, so "API token" never appears contiguous; match what survives.
    errorHint: (msg) => (/could not be authorized|authenticate the provided/i.test(msg)
      ? `${msg}\n\nThat token is cli_token in core/config/plugin.upsun.settings.yml. It must be an UPSUN API token (Upsun console → My profile → API tokens) — an Atlassian token, which starts ATATT, is refused with this exact message.`
      : msg),
    folder: {
      idPattern: /^[a-z0-9]{8,20}$/,
      idPlaceholder: 'eeihb6tksv2ly',
      idHelp: 'An Upsun project id is 8 to 20 lowercase letters and digits.',
      createPrompt: 'Create a new Upsun project for this folder and deploy it. Before creating anything billed, ask me which organization, region and plan to use, and wait for my answer. '
        + 'If a setup session is configuring DDEV here, wait until .ddev/config.yaml exists. Then: git init if needed, upsun project:create, link it with `upsun project:set-remote`, '
        + 'write .upsun/config.yaml to match .ddev/config.yaml (PHP version, database, docroot), commit, and push to main. Never put a secret or key into the repository.',
    },
    menuNote: 'Linking and init stay on the command line; a deploy opens a terminal and upsun asks before pushing',
  };
}
