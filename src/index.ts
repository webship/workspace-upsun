/**
 * Upsun for Webship Workspace.
 *
 * The UPSUN menu on every site row (link, environments, live sites, activities, the deploy log, a
 * deploy, get database and files, branch and data), a live-site chip on the project card, a "Link
 * to Upsun" option when a new folder is made, and the `/upsun-site/<workspace>/<project>` jump to
 * the environment the local code is on. All of that is the hosting family's surface
 * (@webship.co/workspace-hosting); this package is the Upsun provider plus what the installer places.
 *
 * Everything the dashboard is asked for goes through `api`; this package requires nothing from
 * the dashboard's own files, so it can be installed from npm and removed without a trace.
 */

import type { PluginApi } from '@webship.co/workspace-plugin-api';
import { registerHosting } from '@webship.co/workspace-hosting';

import { upsunProvider } from './lib/provider';

export { upsunLinkOf } from './lib/link';
export { upsunProvider };

export function register(api: PluginApi): void {
  registerHosting(api, upsunProvider(api));
}
