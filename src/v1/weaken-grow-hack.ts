import { NS } from '@ns';
import { getHackableServers } from './helpers.js';

/** @param {NS} ns */
export async function main(ns: NS) {

  const allHosts = getHackableServers(ns);

  const randomServer = Math.floor(Math.random() * (Number(allHosts.length)));

  const currentHost = allHosts[randomServer];
  const minimumSecurity = ns.getServerMinSecurityLevel(currentHost);
  const maximumMoneyAvailable = ns.getServerMaxMoney(currentHost);


  while (true) {

    const currentSecurity = ns.getServerSecurityLevel(currentHost);
    const currentMoneyAvailable = ns.getServerMoneyAvailable(currentHost);

    if (currentSecurity > minimumSecurity) {
      await ns.weaken(currentHost);
    } else if (currentMoneyAvailable < maximumMoneyAvailable) {
      await ns.grow(currentHost);
    } else {
      await ns.hack(currentHost);
    }
  }
}