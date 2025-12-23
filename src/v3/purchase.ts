import { NS } from "@ns";
import { copyNestedFilesToRootOfHost } from "./utils/helpers";

/** @param {NS} ns */
export async function main(ns: NS) {
    const size = 2;
    const homeMoneyFactorBeforeBuyingUpgrade = 1;

    while (true) {
        const purchasedServers = ns.getPurchasedServers();

        if (purchasedServers.length < ns.getPurchasedServerLimit()) {
            // ns.tprint('We have more servers to buy before we start upgrading...');

            if (ns.getServerMoneyAvailable("home") > ns.getPurchasedServerCost(size)) {
                const hostname = ns.purchaseServer(
                    `serb0r-${purchasedServers.length}`,
                    size
                );

                ns.tprint(`Bought new server: ${hostname}`);

                ns.tprint(`Copying hack/grow/weaken to newly purchased servers...`);
                copyNestedFilesToRootOfHost(ns, "home", "/v3/hacking", [hostname]);
            }
        } else {
            for (const server of purchasedServers) {
                const serverSize = ns.getServerMaxRam(server);
                if (
                    ns.getServerMoneyAvailable("home") >
                    ns.getPurchasedServerUpgradeCost(server, serverSize * 2) *
                        homeMoneyFactorBeforeBuyingUpgrade
                ) {
                    // ns.tprint(`Upgrading ${server} to ${serverSize * 2}`)
                    ns.upgradePurchasedServer(server, serverSize * 2);
                }

                await ns.sleep(250);
            }
        }

        await ns.sleep(1000);
    }
}
