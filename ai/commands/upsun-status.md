---
description: Say where a Webship Workspace site stands on Upsun — whether it is linked and to what, and its environments, and its last activities — with the read-only options of the plugin's command. Nothing is linked, pulled or deployed.
argument-hint: '<project>'
---

# /upsun-status

Say where this site stands on Upsun: `$ARGUMENTS`

The argument is one word: the project, which is its folder name in a sites folder of the
workspace. With no project, stop and ask for one.

The workspace is container-based (DDEV by default); the command of the Upsun plugin (`@webship.co/workspace-upsun`) runs
on the machine, from the sites folder. This command only reads: never run `cmd-tools-upsun.sh` with
`--push`, `--link`, `--select`, `--pull-db`, `--pull-files` here, and never print a token or a key.

## 1. Find the project and the command

```bash
ls -d ~/workspace/*/<project>
cd ~/workspace/<folder>
ls cmd-tools-upsun.sh
```

If the command is not there, stop: the plugin is not installed, or the folder is not a sites folder.

## 2. Is it linked

```bash
bash cmd-tools-upsun.sh <project>
```

If it says "not linked", say so with the line it prints for linking, and stop.

## 3. Read

```bash
bash cmd-tools-upsun.sh <project> --environments
bash cmd-tools-upsun.sh <project> --activities
bash cmd-tools-upsun.sh <project> --logs
```

## 4. Report

What the project is linked to, the environments with their state and address, what happened last, and
anything the command said it could not do, in its own words (a missing command, a refused
credential).

For a deploy or for getting the live data, hand over to the agent `upsun-deployer`.
