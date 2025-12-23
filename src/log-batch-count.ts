import { NS } from "@ns";
import { getAllAvailableServersWithRootAccess } from "./v3/utils/helpers";

export async function main(ns: NS) {
    while (true) {
        const purchasedServers = ns.getPurchasedServers();
        const nukedServers = getAllAvailableServersWithRootAccess(ns);
        const allServers = [...new Set([...purchasedServers, ...nukedServers, "home"])];

        let growCount = 0;

        for (const server of allServers) {
            const processes = ns.ps(server);

            processes.forEach((process) => {
                if (process.filename === "grow.js") {
                    growCount = growCount + 1;
                }
            });
        }

        ns.tprint(`Batch count: ${growCount}`);
        await ns.sleep(2000);
    }
}
