import { NS } from "@ns";
import { getMostProfitableServerToHack } from "./utils/helpers";

export async function main(ns: NS) {
    while (true) {
        const purchasedServers = ns.getPurchasedServers();
        const mostProfitableServerToHack = getMostProfitableServerToHack(ns, "loop");

        ns.tprint(`MOST PROFITABLE SERVER TO HACK: ${mostProfitableServerToHack}`);

        return;
        // await ns.sleep(1000);
    }
}
