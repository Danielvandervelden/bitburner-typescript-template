import { NS } from "@ns";
import {
    copyNestedFilesToRootOfHost,
    getAllAvailableServersWithRootAccess,
} from "./utils/helpers";

export async function main(ns: NS) {
    const purchasedServers = ns.getPurchasedServers();
    const nukedServers = getAllAvailableServersWithRootAccess(ns);

    const allServers = [...new Set([...purchasedServers, ...nukedServers])];

    copyNestedFilesToRootOfHost(ns, "home", "/v3/hacking", allServers);
}
