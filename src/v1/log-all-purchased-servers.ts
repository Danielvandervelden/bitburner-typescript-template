import { NS } from "@ns";
import { getAllPurchasedServers } from "./helpers.js";

export async function main(ns: NS) {
    const allServers = getAllPurchasedServers(ns);

    for (let i = 0; i < allServers.length; i++) {
        ns.tprint(`Server: ${allServers[i]}`);
    }
}