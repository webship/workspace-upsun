---
name: upsun-hosting
description: Work with a Webship Workspace site on Upsun through the Upsun plugin (`@webship.co/workspace-upsun`) — the UPSUN menu of a project row and the command behind every entry, `cmd-tools-upsun.sh`, with each of its options, how a project is linked, the keys of `plugin.upsun.settings.yml` and the credential they hold, and what the command says when something is missing. Use when asked "is this site linked to Upsun", "link this project", "list the environments", "what was deployed last", "get the live database", "deploy this site", "the menu says not linked", or "where does the Upsun token go".
argument-hint: '<project>'
---

# upsun-hosting

Upsun for a site of a Webship Workspace (`~/workspace`, container-based, DDEV by default). It comes
with the Upsun plugin (`@webship.co/workspace-upsun`), a provider of the hosting family (`@webship.co/workspace-hosting`),
like the agent `upsun-deployer`, the command `/upsun-status` and the prompt `upsun-test-then-deploy`.

## The UPSUN menu

The UPSUN menu is on the project rows of the sites folders. The caption beside it says `linked`
or `not linked`. A project that is not linked is shown how to link it; a linked one gets these
entries, and each of them runs the command of the plugin in a terminal session, from the sites
folder:

| Menu entry | The command |
| --- | --- |
| **Link and environments** | `bash cmd-tools-upsun.sh <project>` |
| **Last 10 activities** | `bash cmd-tools-upsun.sh <project> --activities` |
| **Most recent deploy log** | `bash cmd-tools-upsun.sh <project> --logs` |
| **Deploy the current branch (upsun push)…** | `bash cmd-tools-upsun.sh <project> --push` |

The menu ends with the note "Linking and init stay on the command line; a deploy opens a terminal and upsun asks before pushing".

### Get the live data

The menu also offers to get the database and the files of an environment into the local site. From a terminal:

| What | The command | What it does |
| --- | --- | --- |
| The database | `bash cmd-tools-upsun.sh <project> --environment <environment> --pull-db` | Dump the selected environment's database and import it into DDEV. REPLACES the local database — the current one is exported to backups/ first. Client data: it lands on this machine. |
| The files | `bash cmd-tools-upsun.sh <project> --environment <environment> --pull-files` | Download the selected environment's public files mount into the local docroot (adds and overwrites, never deletes). Client data. |

## The command

`cmd-tools-upsun.sh` is placed in every sites folder of the workspace. The first word after it is the
project; with nothing else it says whether the project is linked, and to what.

```bash
cd ~/workspace/<folder>
bash cmd-tools-upsun.sh <project>
bash cmd-tools-upsun.sh <project> --link <upsun-project-id>
bash cmd-tools-upsun.sh <project> --environments
```

| Option | What it does |
| --- | --- |
| `--link <value>` | Link the project to an Upsun project ID (upsun project:set-remote). Find IDs with: upsun projects |
| `--init` | Scaffold .upsun/config.yaml with upsun project:init (interactive). |
| `--push` | Deploy the current branch with upsun push. Outward-facing: upsun asks for confirmation. |
| `--environment <value>` | Environment for THIS run: the --push target, and the source --pull-db/--pull-files take data from. Default: the one remembered by --select. |
| `--environments` | List the environments (branches) of the linked Upsun project. |
| `--select <value>` | Remember which environment this project works against, in .upsun/local/ (git-excluded). The pulls then need no flag. Checked against the real environment list. |
| `--pull-db` | Dump the selected environment's database and import it into DDEV. REPLACES the local database — the current one is exported to backups/ first. Client data: it lands on this machine. |
| `--pull-files` | Download the selected environment's public files mount into the local docroot (adds and overwrites, never deletes). Client data. |
| `--logs` | Show the most recent deploy log. |
| `--activities` | List the last 10 Upsun activities. |
| `--no-safety-backup` | Skip exporting the local database before --pull-db replaces it. The export exists because a pull that ate an afternoon of work is a bad pull, so skipping it is a choice, not a default. |
| `--force` | Allow --link to relink a project that already points at a different Upsun ID. |

With no project the command says that `PROJECT_NAME` is required; with a project that is not in
the folder, "No such project"; with an option that needs a link on a project that has none, "Not
linked to Upsun".

## Link a project

A project is linked to an Upsun project by its id. The link lives in the project (`.upsun/local/project.yaml` and a git remote named `upsun`). An Upsun project id is 8 to 20 lowercase letters and digits.

```bash
bash cmd-tools-upsun.sh <project> --link <upsun-project-id>
```

## The settings: `core/config/plugin.upsun.settings.yml`

| Key | What it is |
| --- | --- |
| `cli_token:` | What "Get database & files" and the environment lists use to reach Upsun from the dashboard: an API token from the Upsun console (My profile → API tokens). Not an Atlassian token. |

The dashboard reaches Upsun with cli_token in core/config/plugin.upsun.settings.yml. The file is created mode 600 and its secrets are
masked on the Settings page. Never print them, never copy them into another file, and never commit
the file.

## Turn it on, and check it

```bash
cd ~/workspace
bash core/scripts/plugins.sh --require @webship.co/workspace-upsun
bash core/scripts/plugins.sh --activate upsun --with-needs     # adds a sites folder and the AI folders when they are missing
bash core/scripts/plugins.sh --install upsun
bash core/scripts/plugins.sh --configure upsun
bash core/scripts/plugins.sh --check upsun                     # the commands it needs on the machine
```

## Traps

- **"The upsun CLI is not installed"**: without the `upsun` command on the machine, every call that names a project answers this, before it looks at the project, with how to install it.
- **"Unable to authenticate the provided API token"** nearly always means the token is of the wrong kind: `cli_token:` must be an Upsun API token (Upsun console, My profile, API tokens). A token of another service is refused with this same message.
- **The login of the machine is not the dashboard's.** `upsun login` on the machine keeps its session in the system keyring, which the dashboard's container cannot reach: the dashboard needs `cli_token:`. In a terminal on the machine the login is enough.
- **A database pull replaces the local database.** The current one is exported to `backups/` first, unless `--no-safety-backup` was given.
- **A paused environment has no address**: only active ones are listed with one.
- **A deploy is outward-facing.** The command asks before it sends anything, in a terminal: it is
  not a step for an AI assistant to take on its own.
