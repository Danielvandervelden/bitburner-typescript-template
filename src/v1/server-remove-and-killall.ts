import { copyScript, getAllPurchasedServers } from './helpers.js';
import { HACK_SCRIPT, HELPER_FUNCTIONS } from './v1-constants.js';
import { NS } from '@ns';

/** @param {NS} ns */
export async function main(ns: NS) {
  const allServers = getAllPurchasedServers(ns);

  for (let host of allServers) {
    ns.killall(host);
    copyScript(ns, HELPER_FUNCTIONS, host);
    copyScript(ns, HACK_SCRIPT, host);
  }
}