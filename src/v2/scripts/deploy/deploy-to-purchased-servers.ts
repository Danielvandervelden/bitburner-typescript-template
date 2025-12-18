import { NS } from "@ns";
import { copyNestedFilesToRootOfHost } from "/v2/utils/helpers";

export async function main(ns: NS) {
    const hosts = ns.getPurchasedServers();

    if (!hosts.length) {
        ns.tprint(`We have no purchased servers yet...`);
        return;
    }

    copyNestedFilesToRootOfHost(ns, 'home', '/v2/scripts/hacking/bits', hosts)
}