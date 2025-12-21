import { NS } from "@ns";
import {
    copyNestedFilesToRootOfHost,
    getAllAvailableServersWithRootAccess,
    getMostProfitableServersToHack,
} from "../utils/helpers";
import { WEAKEN_SCRIPT_NAME } from "../utils/constants";
import { isTargetPrepped } from "./batch-mode-helpers";

const forcedTarget = "neo-net";

export async function main(ns: NS) {
    while (true) {
        const purchasedServers = ns.getPurchasedServers();
        const nukedServers = getAllAvailableServersWithRootAccess(ns);
        const mostProfitableServersToHack = getMostProfitableServersToHack(ns, "loop");
        const mostProfitableServerToHack =
            forcedTarget ?? mostProfitableServersToHack?.[0]?.hostName;

        const filteredNukedServers = nukedServers.filter(
            (server) =>
                ns.getServerMaxRam(server) >=
                    ns.getScriptRam(WEAKEN_SCRIPT_NAME, server) &&
                server !== mostProfitableServerToHack &&
                server !== "home"
        );
        const allServers = [...new Set([...purchasedServers, ...filteredNukedServers])];
        // const totalServerRamAvailable = allServers.reduce((prevTotalRam, server) => {
        //     if (ns.serverExists(server)) {
        //         const serverRamAvailable =
        //             ns.getServerMaxRam(server) - ns.getServerUsedRam(server);

        //         return prevTotalRam + serverRamAvailable;
        //     }

        //     return prevTotalRam;
        // }, 0);

        if (!mostProfitableServerToHack) {
            await ns.sleep(5000);
            /** TODO: CHANGE TO CONTINUE; */
            return;
        }

        const targetPrep = isTargetPrepped(ns, mostProfitableServerToHack);

        if (!targetPrep.security) {
            ns.tprint(`Need to weaken ${mostProfitableServerToHack}`);
            await weakenSecurity(ns, mostProfitableServerToHack, allServers);

            /** TODO: CHANGE TO CONTINUE; */
            return;
        }

        if (!targetPrep.money) {
            await growServer(ns, mostProfitableServerToHack);
            /** TODO: CHANGE TO CONTINUE; */
            return;
        }
        return;
        // await ns.sleep(200);
    }
}

async function weakenSecurity(
    ns: NS,
    targetServer: string,
    allServersAvailable: string[]
) {
    const currentTargetServerSecurityLevel = ns.getServerSecurityLevel(targetServer);
    const minimumTargetServerSecurityLevel = ns.getServerMinSecurityLevel(targetServer);
    const weakenAmountPerThreads = ns.weakenAnalyze(1);
    let weakenThreadsNeeded =
        (currentTargetServerSecurityLevel - minimumTargetServerSecurityLevel) /
        weakenAmountPerThreads;

    for (const server of allServersAvailable) {
        if (ns.ps(server).length === 0) continue;

        const doesWeakenScriptExistOnServer = ns.fileExists(WEAKEN_SCRIPT_NAME, server);

        if (!doesWeakenScriptExistOnServer) {
            ns.tprint(
                `Weaken script doesn't exist on ${server}! Copying it, along with hack and grow, over...`
            );
            copyNestedFilesToRootOfHost(ns, "home", "/v3/hacking", [server]);
            continue;
        }

        const ramAvailableOnServer =
            ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
        const weakenScriptRamCost = ns.getScriptRam(WEAKEN_SCRIPT_NAME, server);
        const possibleWeakenThreadsToRunOnServer = Math.floor(
            ramAvailableOnServer / weakenScriptRamCost
        );

        const result = ns.exec(
            WEAKEN_SCRIPT_NAME,
            server,
            possibleWeakenThreadsToRunOnServer
        );

        if (!result) {
            ns.tprint(
                `Something went wrong when trying to start ${WEAKEN_SCRIPT_NAME} on ${server}
              DEBUG INFO:
              Ram available on server: ${ramAvailableOnServer}
              Weaken script RAM cost: ${weakenScriptRamCost}
              Possible weaken thread to run: ${possibleWeakenThreadsToRunOnServer}
            `
            );
        }

        weakenThreadsNeeded = weakenThreadsNeeded - possibleWeakenThreadsToRunOnServer;
    }

    ns.tprint(`
      Weaken stats for ${targetServer}:
      ===========
      Current security level: ${currentTargetServerSecurityLevel}
      Minimum security level: ${minimumTargetServerSecurityLevel}
      Weakening per thread: ${weakenAmountPerThreads} 
      Total weaken threads needed: ${weakenThreadsNeeded}
    `);
}

async function growServer(ns: NS, targetServer: string) {
    ns.tprint(`Must grow server`);
}
