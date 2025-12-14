import { copyScript, getAllPurchasedServers, getMaximumAvailableThreads, scriptWithVersion } from './helpers.js';
import { HACK_SCRIPT, HELPER_FUNCTIONS } from './v1-constants.js';
import { NS } from '@ns';

/** @param {NS} ns */
export function main(ns: NS) {
  const hosts = getAllPurchasedServers(ns);

  hosts.forEach(host => {
    if (!ns.fileExists(scriptWithVersion(HELPER_FUNCTIONS), host)) {
      ns.tprint(`Helper functions (${HELPER_FUNCTIONS}) doesn't exist on ${host}, copying now...`)
      copyScript(ns, HELPER_FUNCTIONS, host);

    }

    if (!ns.fileExists(scriptWithVersion(HACK_SCRIPT), host)) {
      ns.tprint(`Hack script (${HACK_SCRIPT}) doesn't exist on ${host}, copying now...`)
      copyScript(ns, HACK_SCRIPT, host);
    }

    const maxThreads = getMaximumAvailableThreads(ns, host, scriptWithVersion(HACK_SCRIPT));

    ns.tprint(`Running ${HACK_SCRIPT} on ${host} with ${maxThreads} threads.`)

    ns.exec(scriptWithVersion(HACK_SCRIPT), host, maxThreads);
  })
}