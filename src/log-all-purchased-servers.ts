import { NS } from "@ns";

export async function main(ns: NS) {
    const allServers = ns.getPurchasedServers();

    for (let i = 0; i < allServers.length; i++) {
        ns.tprint(`Server: ${allServers[i]}`);
    }
}