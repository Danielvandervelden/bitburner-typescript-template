import { NS } from '@ns';
import { SERVER_HACK_SCRIPT, HELPER_FUNCTIONS } from './v1-constants.js';
import { copyScript, scriptWithVersion } from './helpers.js';

/** @param {NS} ns */
export async function main(ns: NS) {
  let size = 8;

  let i = 0;

  while (true) {
    const purchasedServers = ns.getPurchasedServers();

    if (ns.getPurchasedServerLimit() === purchasedServers.length && ns.getPurchasedServerCost(size * 4) * 1 < ns.getServerMoneyAvailable("home")) {
      removeServerWithLowestRam();
    }

    if (ns.getServerMoneyAvailable("home") > ns.getPurchasedServerCost(size)) {

      let hostname = ns.purchaseServer(`serb0r-${i}-${size}gb`, size);

      if (hostname) {
        copyScript(ns, SERVER_HACK_SCRIPT, hostname);
        copyScript(ns, HELPER_FUNCTIONS, hostname);

        ns.tprint(`Hostname we're going for: ${hostname}`);
        ns.tprint(`Script RAM: ${ns.getScriptRam(scriptWithVersion(SERVER_HACK_SCRIPT), hostname)}`);
        ns.tprint(`Size of the server: ${size}gb`);

        let totalThreadsAvailable = Math.floor(size / ns.getScriptRam(scriptWithVersion(SERVER_HACK_SCRIPT), hostname));

        if (totalThreadsAvailable < Infinity && totalThreadsAvailable > 0) {
          ns.exec(scriptWithVersion(SERVER_HACK_SCRIPT), hostname, totalThreadsAvailable);
        } else {
          ns.tprint(`${hostname} has ${totalThreadsAvailable} threads available?`);
        }
        ++i;
      }
    }

    await ns.sleep(10);
  }

  function removeServerWithLowestRam() {
    const purchasedServers = ns.getPurchasedServers();
    const foundPreviousSizeServer = purchasedServers.find(server => ns.getServerMaxRam(server) === size / 2);

    if (!foundPreviousSizeServer) {
      size = size * 2;
      removeServerWithLowestRam();
    } else if (foundPreviousSizeServer) {
      // ns.tprint(`Found server to remove: ${foundPreviousSizeServer}`);
      ns.killall(foundPreviousSizeServer);
      ns.deleteServer(foundPreviousSizeServer);
    }
  }
}