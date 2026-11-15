# @webship.co/workspace-upsun

Upsun for the [Webship Workspace](https://github.com/webship/workspace) dashboard: the **UPSUN**
menu on every site row (link, environments and live sites, activities, the deploy log, deploy, get
database and files, branch and data), a live-site chip on the project card, "Link to Upsun" when a new folder
is made, and the `upsun` CLI in the dashboard container with the host's session mounted in.

## Use it

```bash
cd ~/workspace
bash core/scripts/plugins.sh --require github:webship/workspace-upsun   # npm install into the dashboard
bash core/scripts/plugins.sh --activate upsun                            # plugins.upsun in settings.yml
bash core/scripts/plugins.sh --install upsun                             # scripts, commands, compose, theme
bash core/scripts/plugins.sh --configure upsun                           # core/config/plugin.upsun.settings.yml
```

The same four steps are buttons on the dashboard's **Settings → Plugins** page. `--install` is
idempotent and says when the dashboard container needs `ddev restart` (it does the first time: the
compose file mounts `~/.upsun-cli`).

## The items it carries

The workspace is container-based (DDEV by default). Each item lands in the folder of its kind, when
that folder is an active workspace folder, is listed there like any other item, and is installed
into Claude Code from there:

| What | Lands in | What it is for |
| --- | --- | --- |
| The agent `upsun-deployer` | `ai-agents/` | Says whether a site is linked to Upsun and to what, reads its environments and its log, brings the live data here when asked, tests it before a deploy, and hands over the deploy line |
| The skill `upsun-hosting` | `ai-skills/` | Every entry of the UPSUN menu and the command behind it, each option of `cmd-tools-upsun.sh`, the link, the keys of `plugin.upsun.settings.yml` |
| The command `/upsun-status` | `ai-commands/` | `/upsun-status <project>`: the link and the environments. Read-only |
| The prompt `upsun-test-then-deploy` | `ai-prompts/` | The launch command of a session that checks a site, runs its webship-js suite when it has one, and gives the deploy line |

The plugin keeps its one command, `cmd-tools-upsun.sh`; no other was added. The item bodies are plain Markdown any AI command-line assistant can follow; Claude Code is the default shape (frontmatter, the launch command of the prompt). A site that carries a webship-js suite is tested by the workspace's own `cmd-tools-testing.sh <project> --run` before a deploy, when it is there.

How the items are laid out and checked: [docs/plugin-items-pattern.md](docs/plugin-items-pattern.md).

## What it needs

A workspace starts empty, so the manifest says what else this plugin needs (`needs`):

- one sites folder: `dev`, `test`, `demos`, `sandboxes`, `projects` (`dev` is the one added when none is there). `cmd-tools-upsun.sh`, which the menu's verbs run, is placed in it, and the menu is on its project rows.
- on the machine: `upsun`, the provider's CLI (https://docs.upsun.com/administration/cli.html).

`--require` says so, `--activate` and `--install` stop until the workspace has a sites folder, and `--with-needs` adds it first. A missing command is said and never added:

```bash
bash core/scripts/plugins.sh --activate upsun --with-needs
bash core/scripts/plugins.sh --check upsun      # each command: found, with its version, or missing, with how to install it
```

A workspace that knows none of this (Webship Workspace 1.0.8 and older) ignores the keys: add a sites folder yourself, then `--install upsun` again.

It also needs the AI folders its items are placed in (`needs.plugins`): `ai-agents`, `ai-skills`, `ai-commands` and `ai-prompts`, beside the sites folder. `--with-needs` adds what is missing first. A kind whose folder is not an active workspace folder is skipped, and the install says so.

## What the package holds

| Path | What it is |
| --- | --- |
| `src/index.ts` | `register(api)`: `registerHosting(api, upsunProvider(api))` — the menu, chip, modal, pull flow and New-folder section are the hosting family's (`@webship.co/workspace-hosting`) |
| `src/lib/provider.ts` | The Upsun provider: the link, the token, the environments and their URLs, the verbs (status, activities, logs, deploy), the pulls, the console |
| `src/lib/link.ts` | Whether a project is linked, and to what (its `.upsun/local/project.yaml` and `upsun` remote) |
| `commands/cmd-tools-upsun.sh` | The per-workspace command, installed into every `sites` workspace |
| `scripts/functions/fun-upsun.sh` | The bash functions behind it, sourced by bootstrap once installed |
| `scripts/args/arg-upsun.sh` | Its argparse |
| `scripts/upsun-ai.sh` | Upsun's agent skill and read-only MCP |
| `scripts/host-install.sh` | The host side: the CLI, the token check, the AI toolkit |
| `ddev/docker-compose.upsun-cli.yaml` | Mounts the host's upsun session into the dashboard container |
| `config/plugin.upsun.settings.yml` | The settings template (`cli_token`) |
| `config/theme.upsun.yml` | A dashboard theme in Upsun's colours |
| `ai/agents/upsun-deployer.md` | The agent `upsun-deployer` |
| `ai/skills/upsun-hosting/` | The skill `upsun-hosting` |
| `ai/commands/upsun-status.md` | The command `/upsun-status` |
| `ai/prompts/upsun-test-then-deploy.md` | The prompt `upsun-test-then-deploy` |
| `tests/items.test.ts` | The shape of every item, and that it names nothing the plugin does not have |

The `workspacePlugin` block in `package.json` is the manifest the installer reads.
