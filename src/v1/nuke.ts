import { NS } from '@ns';
import { getAllAvailableServersWithoutRootAccess } from './helpers.js';

/** @param {NS} ns */
export async function main(ns: NS) {
  const hosts = getAllAvailableServersWithoutRootAccess(ns);

  for (let host of hosts) {
    let nukable = false;
    let ports = ns.getServerNumPortsRequired(host);

    if (ports === 0) {
      nukable = true;
    }

    if (ports >= 1 && ns.fileExists("BruteSSH.exe", 'home')) {
      ns.brutessh(host);

      ports === 1 ? nukable = true : "";
    }

    if (ports >= 2 && ns.fileExists("FTPCrack.exe", 'home')) {
      ns.ftpcrack(host);

      ports === 2 ? nukable = true : "";
    }

    if (ports >= 3 && ns.fileExists("relaySMTP.exe", 'home')) {
      ns.relaysmtp(host);

      ports === 3 ? nukable = true : "";
    }

    if (ports >= 4 && ns.fileExists("HTTPWorm.exe", 'home')) {
      ns.httpworm(host);

      ports === 4 ? nukable = true : "";
    }

    if (ports >= 5 && ns.fileExists("SQLInject.exe", 'home')) {
      ns.sqlinject(host);

      ports === 5 ? nukable = true : "";
    }

    if (nukable) {
      ns.tprint(`Hacked new server: ${host}`);
      ns.nuke(host);
    }
  }
}