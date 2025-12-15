import { NS } from "@ns";

export function getAllAvailableServers(ns: NS) {
  const hosts = ns.scan('home');

  for (let i = 0; i < hosts.length; i++) {
    ns.scan(hosts[i]).forEach(host => !hosts.includes(host) ? hosts.push(host) : false);
  }

  return hosts.filter(host => host !== 'home');
}

export function getHackableServers(ns: NS) {
  const hosts = ns.scan('home');

  for (let i = 0; i < hosts.length; i++) {
    ns.scan(hosts[i]).forEach(host => !hosts.includes(host) ? hosts.push(host) : false);
  }

  return hosts.filter((host) => ns.getHackingLevel() < ns.getServerRequiredHackingLevel(host));
}

export function getAllAvailableServersWithRootAccess(ns: NS) {
  const hosts = ns.scan('home');

  for (let i = 0; i < hosts.length; i++) {
    ns.scan(hosts[i]).forEach(host => !hosts.includes(host) ? hosts.push(host) : false);
  }

  return hosts.filter(host => !host.startsWith('serb0r-') && host !== 'home' && ns.hasRootAccess(host));
}

export function getAllAvailableServersWithoutRootAccess(ns: NS) {
  const hosts = ns.scan('home');

  for (let i = 0; i < hosts.length; i++) {
    ns.scan(hosts[i]).forEach(host => !hosts.includes(host) && ns.getServerRequiredHackingLevel(host) <= ns.getHackingLevel() ? hosts.push(host) : false);
  }

  return hosts.filter(host => host !== 'home' && !ns.hasRootAccess(host) && !host.startsWith('serb0r-'));
}

export function getAllNonPurchasedServers(ns: NS) {
  const hosts = ns.scan('home');

  for (let i = 0; i < hosts.length; i++) {
    ns.scan(hosts[i]).forEach(host => !hosts.includes(host) ? hosts.push(host) : false);
  }

  return hosts.filter(host => host !== 'home' && !host.startsWith('serb0r-'));
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

export function runScriptIfNotAlreadyRunning(ns: NS, scriptName: string, host: string = 'home') {
  if (!ns.isRunning(scriptName, host)) {
    ns.run(scriptName);
  } else {
    ns.tprint(`${scriptName} script is already running`)
  }
}