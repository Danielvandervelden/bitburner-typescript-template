import { NS } from '@ns';
import { createRandomIdentifier } from '/v2/utils/helpers.js';

/** @param {NS} ns */
export async function main(ns: NS) {
  /** Check what's the current largest GB server we own. */
  const size = ns.getPurchasedServers().reduce((prevRam, currentServer) => {
    const currentServerRam = ns.getServerMaxRam(currentServer);

    if (currentServerRam > prevRam) {
      return currentServerRam;
    }

    return prevRam;
  }, 0);

  while (true) {
    const purchasedServers = ns.getPurchasedServers();

    if (ns.getPurchasedServerLimit() === purchasedServers.length && ns.getPurchasedServerCost(size * 2) * 1 < ns.getServerMoneyAvailable("home")) {
      await removeServerWithLowestRam();
    }

    if (ns.getServerMoneyAvailable("home") > ns.getPurchasedServerCost(size)) {

      const randomIdentifier = createRandomIdentifier();

      let hostname = ns.purchaseServer(`serb0r-${randomIdentifier}-${size}gb`, size);

      ns.tprint(`Bought new server: ${hostname}`);
    }

    await ns.sleep(30000);
  }

  async function removeServerWithLowestRam() {
    const purchasedServers = ns.getPurchasedServers();
    const smallestServer = purchasedServers.reduce((previousServer, currentServer) => {
      if (previousServer === '') {
        return currentServer;
      }

      const currentServerRam = ns.getServerMaxRam(currentServer);
      const previousServerRam = ns.getServerMaxRam(previousServer);

      if (currentServerRam < previousServerRam) {
        return currentServer;
      }

      return previousServer;
    }, '');

    async function waitForScriptToEndThenRemove() {
      const serverRam = ns.getServerUsedRam(smallestServer);

      if (serverRam !== 0) {
        await ns.sleep(1000);
        // ns.tprint(`Trying to remove server: ${smallestServer}, but script is still going.`);
        await waitForScriptToEndThenRemove();
        return;
      }

      ns.tprint(`Successfully deleted ${smallestServer}`);
      ns.deleteServer(smallestServer);
    }

    await waitForScriptToEndThenRemove();
  }
}