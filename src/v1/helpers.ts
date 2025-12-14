import { NS } from "@ns";
import { VERSION } from "./v1-constants.js";

const uselessServers = ['avmnite-02h', 'darkweb', 'I.I.I.I', 'home', "CSEC"];

/** @param {NS} ns */
export function getAllAvailableServers(ns: NS) {
  const hosts = ns.scan('home');

  for (let i = 0; i < hosts.length; i++) {
    ns.scan(hosts[i]).forEach(host => !hosts.includes(host) ? hosts.push(host) : false);
  }

  return hosts.filter(host => host !== 'home');
}

/** @param {NS} ns */
export function getHackableServers(ns: NS) {
  const hosts = ns.scan('home');

  for (let i = 0; i < hosts.length; i++) {
    ns.scan(hosts[i]).forEach(host => !hosts.includes(host) ? hosts.push(host) : false);
  }

  const clause1 = (host: string) => ns.getHackingLevel() < 300 && ns.hasRootAccess(host) && !host.startsWith('serb0r-') && ns.getWeakenTime(host) / 60 < 5000 && !uselessServers.includes(host);
  const clause2 = (host: string) => ns.getHackingLevel() >= 300 && ns.hasRootAccess(host) && !host.startsWith('serb0r-') && ns.getServerRequiredHackingLevel(host) > (ns.getHackingLevel() / 15) && ns.getWeakenTime(host) < 500000 && !uselessServers.includes(host);

  return hosts.filter(host => clause1(host) || clause2(host));
}

/** @param {NS} ns */
export function getAllAvailableServersWithRootAccess(ns: NS) {
  const hosts = ns.scan('home');

  for (let i = 0; i < hosts.length; i++) {
    ns.scan(hosts[i]).forEach(host => !hosts.includes(host) ? hosts.push(host) : false);
  }

  return hosts.filter(host => !host.startsWith('serb0r-') && host !== 'home' && ns.hasRootAccess(host));
}

/** @param {NS} ns */
export function getAllAvailableServersWithoutRootAccess(ns: NS) {
  const hosts = ns.scan('home');

  for (let i = 0; i < hosts.length; i++) {
    ns.scan(hosts[i]).forEach(host => !hosts.includes(host) && ns.getServerRequiredHackingLevel(host) <= ns.getHackingLevel() ? hosts.push(host) : false);
  }

  return hosts.filter(host => host !== 'home' && !ns.hasRootAccess(host) && !host.startsWith('serb0r-'));
}

/** @param {NS} ns */
export function getAllNonPurchasedServers(ns: NS) {
  const hosts = ns.scan('home');

  for (let i = 0; i < hosts.length; i++) {
    ns.scan(hosts[i]).forEach(host => !hosts.includes(host) ? hosts.push(host) : false);
  }

  return hosts.filter(host => host !== 'home' && !host.startsWith('serb0r-') && !uselessServers.includes(host));
}

export function getAllPurchasedServers(ns: NS) {
  const hosts = ns.scan('home');

  return hosts.filter((host: string) => host.startsWith('serb0r-'));
}

export function getMaximumAvailableThreads(ns: NS, host: string, scriptName: string) {
  const maxRam = ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
  const scriptCost = ns.getScriptRam(scriptName);

  ns.tprint('Max RAM: ', maxRam);
  ns.tprint('script cost: ', scriptCost);

  return Math.floor(maxRam / scriptCost);
}

export function copyScript(ns: NS, scriptName: string, to: string, from?: string,) {
  ns.scp(`${scriptWithVersion(scriptName)}`, to, from ?? 'home');
}

export function scriptWithVersion(scriptName: string) {
  return `${VERSION}/${scriptName}`
}