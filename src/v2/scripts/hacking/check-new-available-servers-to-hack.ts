import { NS } from "@ns";
import { getAllAvailableServers } from "/v2/utils/helpers";

export async function main(ns: NS) {
    const hosts = getAllAvailableServers(ns);

    hosts.forEach(host => {
        /** If we already have root access, return */
        if(ns.hasRootAccess(host)) return;

        /** If we cannot hack it because our hacking level is too low, return */
        if(ns.getServerRequiredHackingLevel(host) > ns.getHackingLevel()) return;

        /** Minimum ports checking */
        if(ns.getServerNumPortsRequired(host) === 0) {
            ns.tprint(`Hacking server ${host} 0 open ports required...`);
            ns.nuke(host)
            return;
        }

        if(ns.getServerNumPortsRequired(host) === 1) {
            ns.brutessh(host);
            ns.nuke(host);
        }
    })
}