import { NS } from "@ns";
import { copyNestedFilesToRootOfHost, getAllPurchasedServers } from "/v2/utils/helpers";

export async function main(ns: NS) {
    const hosts = getAllPurchasedServers(ns);

    copyNestedFilesToRootOfHost(ns, 'home', '/v2/scripts/hacking/bits', hosts)
}