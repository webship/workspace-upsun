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

The `workspacePlugin` block in `package.json` is the manifest the installer reads.
