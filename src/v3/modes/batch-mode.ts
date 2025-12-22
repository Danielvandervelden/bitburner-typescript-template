import { NS } from "@ns";
import {
    copyNestedFilesToRootOfHost,
    getAllAvailableServersWithRootAccess,
    getMostProfitableServersToHack,
} from "../utils/helpers";
import {
    BATCH_SPACING,
    GROW_SCRIPT,
    GROW_SCRIPT_NAME,
    GROWTH_TARGET,
    HACK_SCRIPT_NAME,
    INTERNAL_BATCH_SPACING,
    WEAKEN_SCRIPT,
    WEAKEN_SCRIPT_NAME,
} from "../utils/constants";
import {
    getCombinedServerRam,
    getRamAvailableOnServer,
    isTargetPrepped,
    serverHasRamAvailable,
} from "./batch-mode-helpers";

const forcedTarget: string | undefined = undefined;

export async function main(ns: NS) {
    while (true) {
        const purchasedServers = ns.getPurchasedServers();
        const nukedServers = getAllAvailableServersWithRootAccess(ns);
        const mostProfitableServersToHack = getMostProfitableServersToHack(ns, "loop");
        const mostProfitableServerToHack =
            forcedTarget ?? mostProfitableServersToHack?.[0]?.hostName;

        if (
            (forcedTarget &&
                ns.getServerRequiredHackingLevel(forcedTarget) > ns.getHackingLevel()) ||
            (forcedTarget && !ns.hasRootAccess(forcedTarget))
        ) {
            ns.tprint(
                `Mate, you're trying to hack a server that you CANNOT hack because your hacking level isn't high enough or you don't have root access... ${forcedTarget}`
            );
            return;
        }
        const filteredNukedServers = nukedServers.filter(
            (server) =>
                ns.getServerMaxRam(server) >=
                    ns.getScriptRam(WEAKEN_SCRIPT_NAME, server) &&
                server !== mostProfitableServerToHack &&
                server !== "home"
        );
        const allServers = [...new Set([...purchasedServers, ...filteredNukedServers])];

        if (!mostProfitableServerToHack) {
            await ns.sleep(5000);
            /** TODO: CHANGE TO CONTINUE; */
            return;
        }

        const targetPrep = isTargetPrepped(ns, mostProfitableServerToHack);

        if (!targetPrep.security) {
            weakenSecurity(ns, mostProfitableServerToHack, allServers);

            const totalRemainingServerRamAfterWeakening = getCombinedServerRam(
                ns,
                allServers
            );

            /**
             * Arbitrary 10GB value, but if we do have more than 10GB available,
             * we could already start with some additional grow & weaken threads.
             * Would be a waste not to use them this iteration
             * */
            const weakenScriptRamCost = ns.getScriptRam(WEAKEN_SCRIPT);
            const growScriptRamCost = ns.getScriptRam(GROW_SCRIPT);

            if (
                totalRemainingServerRamAfterWeakening <
                weakenScriptRamCost + growScriptRamCost
            ) {
                await ns.sleep(1000);
                continue;
            }
        }

        if (!targetPrep.money) {
            await growServer(ns, mostProfitableServerToHack, allServers);

            await ns.sleep(1000);
            continue;
        }

        /** READY TO HACK */
        ns.tprint(
            `SERVER: ${mostProfitableServerToHack} has been completely prepped! We can now continue to batching!
            
            Maximum money: ${ns.getServerMaxMoney(mostProfitableServerToHack)}
            Current money; ${ns.getServerMoneyAvailable(mostProfitableServerToHack)}

            Minimum security: ${ns.getServerMinSecurityLevel(mostProfitableServerToHack)}
            Current security: ${ns.getServerSecurityLevel(mostProfitableServerToHack)}
          `
        );

        prepareBatch(ns, mostProfitableServerToHack, allServers);
        await ns.sleep(BATCH_SPACING);
        continue;
    }
}

function prepareBatch(ns: NS, targetServer: string, allServers: string[]) {
    const weakenTime = ns.getWeakenTime(targetServer);
    const growthTime = ns.getGrowTime(targetServer);
    const hackTime = ns.getHackTime(targetServer);

    const hackDelay = weakenTime - hackTime;
    const growDelay = weakenTime - growthTime;

    let weakenToStart = 2;
    let growToStart = 1;
    let hackToStart = 1;

    const functionExecutions = [];

    for (const server of allServers) {
        const weakenRamCost = ns.getScriptRam(WEAKEN_SCRIPT_NAME);
        const growRamCost = ns.getScriptRam(GROW_SCRIPT_NAME);
        const hackRamCost = ns.getScriptRam(HACK_SCRIPT_NAME);

        let ramAvailableOnServer = getRamAvailableOnServer(ns, server);

        if (weakenToStart > 0) {
            if (ramAvailableOnServer > weakenRamCost * 2) {
                functionExecutions.push(
                    ns.exec.bind(null, WEAKEN_SCRIPT_NAME, server, 2, targetServer)
                );
                ramAvailableOnServer = ramAvailableOnServer - weakenRamCost * 2;
                weakenToStart = weakenToStart - 2;
            } else if (weakenToStart > 0 && ramAvailableOnServer > weakenRamCost) {
                functionExecutions.push(
                    ns.exec.bind(null, WEAKEN_SCRIPT_NAME, server, 1, targetServer)
                );
                ramAvailableOnServer = ramAvailableOnServer - weakenRamCost;
                weakenToStart = weakenToStart - 1;
            }
        }

        if (growToStart > 0 && ramAvailableOnServer > growRamCost) {
            functionExecutions.push(
                ns.exec.bind(
                    null,
                    GROW_SCRIPT_NAME,
                    server,
                    1,
                    targetServer,
                    growDelay - INTERNAL_BATCH_SPACING
                )
            );
            ramAvailableOnServer = ramAvailableOnServer - growRamCost;
            growToStart = growToStart - 1;
        }

        if (hackToStart > 0 && ramAvailableOnServer > hackRamCost) {
            functionExecutions.push(
                ns.exec.bind(
                    null,
                    HACK_SCRIPT_NAME,
                    server,
                    1,
                    targetServer,
                    hackDelay - INTERNAL_BATCH_SPACING * 2
                )
            );
            ramAvailableOnServer = ramAvailableOnServer - hackRamCost;
            hackToStart = hackToStart - 1;
        }
    }

    if (functionExecutions.length === 4) {
        functionExecutions.forEach((func) => {
            func();
        });
    } else {
        ns.tprint(`Couldn't launch a full batch, will continue next iteration`);
    }

    return;
}

function weakenSecurity(ns: NS, targetServer: string, allServersAvailable: string[]) {
    const currentTargetServerSecurityLevel = ns.getServerSecurityLevel(targetServer);
    const minimumTargetServerSecurityLevel = ns.getServerMinSecurityLevel(targetServer);
    const weakenAmountPerThreads = ns.weakenAnalyze(1);
    let weakenThreadsNeeded = Math.ceil(
        (currentTargetServerSecurityLevel - minimumTargetServerSecurityLevel) /
            weakenAmountPerThreads
    );

    ns.tprint(`
      Security is too high now, we have to weaken!
      Current target security: ${currentTargetServerSecurityLevel}
      Minimum target security: ${minimumTargetServerSecurityLevel}

      Weaken per thread: ${weakenAmountPerThreads}
      Total weaken threads needed: ${weakenThreadsNeeded}
    `);

    for (const server of allServersAvailable) {
        if (weakenThreadsNeeded < 1) {
            return;
        }

        const doesWeakenScriptExistOnServer = ns.fileExists(WEAKEN_SCRIPT_NAME, server);

        if (!doesWeakenScriptExistOnServer) {
            ns.tprint(
                `Weaken script doesn't exist on ${server}! Copying it, along with hack and grow, over...`
            );
            copyNestedFilesToRootOfHost(ns, "home", "/v3/hacking", [server]);
            continue;
        }

        const serverHasRam = serverHasRamAvailable(
            ns,
            server,
            ns.getScriptRam(WEAKEN_SCRIPT_NAME, server)
        );
        if (!serverHasRam) continue;

        const ramAvailableOnServer = getRamAvailableOnServer(ns, server);
        const weakenScriptRamCost = ns.getScriptRam(WEAKEN_SCRIPT_NAME, server);
        const possibleWeakenThreadsToRunOnServer = Math.min(
            weakenThreadsNeeded,
            Math.floor(ramAvailableOnServer / weakenScriptRamCost)
        );

        if (possibleWeakenThreadsToRunOnServer < 1) {
            continue;
        }

        const result = ns.exec(
            WEAKEN_SCRIPT_NAME,
            server,
            possibleWeakenThreadsToRunOnServer,
            targetServer
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
        continue;
    }
}

async function growServer(ns: NS, targetServer: string, allServers: string[]) {
    const serverMaxMoney = ns.getServerMaxMoney(targetServer);
    const currentMoney = ns.getServerMoneyAvailable(targetServer);

    const growthFactor = (serverMaxMoney * GROWTH_TARGET) / currentMoney;
    let growThreadsNeeded = Math.ceil(ns.growthAnalyze(targetServer, growthFactor));

    for (const server of allServers) {
        if (ns.ps(server).length) {
            continue;
        }

        ns.tprint(`
          Money is not at max yet, time to grow!
          Current target money: ${currentMoney}
          Max target money: ${serverMaxMoney}
    
          Growth factor: ${growthFactor}
          Total grow threads needed: ${growThreadsNeeded}
        `);

        if (growThreadsNeeded < 1) {
            return;
        }

        const doesGrowScriptExistOnServer = ns.fileExists(GROW_SCRIPT_NAME, server);

        if (!doesGrowScriptExistOnServer) {
            ns.tprint(
                `Grow script doesn't exist on ${server}! Copying it, along with hack and weaken, over...`
            );
            copyNestedFilesToRootOfHost(ns, "home", "/v3/hacking", [server]);
            continue;
        }

        const growAndWeakenThreads = findMaximumGrowAndWeakenThreads(
            ns,
            server,
            targetServer,
            growThreadsNeeded
        );

        const weakenTimeOfServer = ns.getWeakenTime(targetServer);
        const growthTimeOfServer = ns.getGrowTime(targetServer);
        const growScriptDelay = weakenTimeOfServer - growthTimeOfServer;

        if (growAndWeakenThreads.growThreads > 0) {
            const pid = ns.exec(
                GROW_SCRIPT_NAME,
                server,
                growAndWeakenThreads.growThreads,
                targetServer,
                growScriptDelay
            );
            if (pid === 0) {
                ns.tprint(
                    `Something went wrong. Couldn't start ${growAndWeakenThreads.growThreads} grow threads on ${server} to hack ${targetServer}`
                );
            } else {
                growThreadsNeeded = growThreadsNeeded - growAndWeakenThreads.growThreads;
            }
        }

        if (growAndWeakenThreads.weakenThreads > 0) {
            const pid = ns.exec(
                WEAKEN_SCRIPT_NAME,
                server,
                growAndWeakenThreads.weakenThreads,
                targetServer
            );
            if (pid === 0) {
                ns.tprint(
                    `Something went wrong. Couldn't start ${growAndWeakenThreads.weakenThreads} weaken threads on ${server} to offest grow on ${targetServer}`
                );
            }
        }

        continue;
    }
}

function findMaximumGrowAndWeakenThreads(
    ns: NS,
    serverWorker: string,
    serverToHack: string,
    growThreads: number
): { growThreads: number; weakenThreads: number } {
    if (growThreads <= 0) {
        return { growThreads: 0, weakenThreads: 0 };
    }
    const freeRamOnServer = getRamAvailableOnServer(ns, serverWorker);

    const growthRamPerThread = ns.getScriptRam(GROW_SCRIPT_NAME, serverWorker);
    const weakenRamPerThread = ns.getScriptRam(WEAKEN_SCRIPT_NAME, serverWorker);

    const singleGrowSecurityIncrease = ns.growthAnalyzeSecurity(1, serverToHack);
    const singleWeakenSecurityDecrease = ns.weakenAnalyze(1);

    const totalSecurityInceaseByGrow = growThreads * singleGrowSecurityIncrease;

    const weakenThreads = Math.ceil(
        totalSecurityInceaseByGrow / singleWeakenSecurityDecrease
    );

    const growRamNeeded = growThreads * growthRamPerThread;
    const weakenRamNeeded = weakenThreads * weakenRamPerThread;
    const totalRamNeeded = growRamNeeded + weakenRamNeeded;

    if (totalRamNeeded > freeRamOnServer) {
        const result = findMaximumGrowAndWeakenThreads(
            ns,
            serverWorker,
            serverToHack,
            growThreads - 1
        );

        return result;
    }

    const result = {
        growThreads: Math.floor(growThreads),
        weakenThreads: Math.floor(weakenThreads),
    };

    ns.tprint(`
      Grow/weaken threads info
      ======
      Single grow security increase: ${singleGrowSecurityIncrease}
      Single weaken security decrease: ${singleWeakenSecurityDecrease}
      
      Total security increase by grow: ${growThreads} * ${singleGrowSecurityIncrease} = ${totalSecurityInceaseByGrow}
      Total weaken threads to offset: ${totalSecurityInceaseByGrow} / ${singleWeakenSecurityDecrease} (ceiled)


      Free RAM on server: ${freeRamOnServer}
      Grow ram needed: ${growRamNeeded}
      Weaken ram needed: ${weakenRamNeeded}
      Total ram needed: ${totalRamNeeded}

      Eventual result: ${JSON.stringify(result, null, 2)}
    `);

    return result;
}
