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
    HACK_PERCENTAGE,
    INTERNAL_BATCH_SPACING,
    WEAKEN_SCRIPT,
    WEAKEN_SCRIPT_NAME,
    HACK_SCRIPT,
    GROW_SEC_INCREASE_PER_THREAD,
    HOME_RAM_RESERVE,
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
                server !== mostProfitableServerToHack
        );
        const allServers = [
            ...new Set([...purchasedServers, ...filteredNukedServers, "home"]),
        ];

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
        // ns.tprint(
        //     `SERVER: ${mostProfitableServerToHack} has been completely prepped! We can now continue to batching!

        //     Maximum money: ${ns.getServerMaxMoney(mostProfitableServerToHack)}
        //     Current money; ${ns.getServerMoneyAvailable(mostProfitableServerToHack)}

        //     Minimum security: ${ns.getServerMinSecurityLevel(mostProfitableServerToHack)}
        //     Current security: ${ns.getServerSecurityLevel(mostProfitableServerToHack)}
        //   `
        // );

        prepareBatch(ns, mostProfitableServerToHack, allServers);
        await ns.sleep(BATCH_SPACING);
        continue;
    }
}

type ExecPlanItem = {
    script: string;
    host: string;
    threads: number;
    args: (string | number)[];
};

function prepareBatch(ns: NS, targetServer: string, allServers: string[]) {
    const weakenTime = ns.getWeakenTime(targetServer);
    const growthTime = ns.getGrowTime(targetServer);
    const hackingTime = ns.getHackTime(targetServer);

    const internalSpacing = INTERNAL_BATCH_SPACING;

    const weaken2Delay = 0;
    const growDelay = Math.max(0, weakenTime - growthTime - 1 * internalSpacing);
    const weaken1Delay = Math.max(0, 2 * internalSpacing);
    const hackingDelay = Math.max(0, weakenTime - hackingTime - 3 * internalSpacing);

    const moneyWantToSteal = ns.getServerMaxMoney(targetServer) * HACK_PERCENTAGE;
    const hackThreadsWanted = Math.ceil(
        ns.hackAnalyzeThreads(targetServer, moneyWantToSteal)
    );

    const threads = calculateTotalBatchThreads(
        ns,
        targetServer,
        hackThreadsWanted,
        allServers
    );
    if (threads.hackThreads <= 0) {
        ns.tprint(`No viable batch for ${targetServer} with current RAM.`);
        return;
    }

    const remaining = new Map<string, number>();
    for (const host of allServers) {
        const free = ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
        remaining.set(
            host,
            host === "home" ? Math.max(0, free - HOME_RAM_RESERVE) : free
        );
    }

    const ramCost = {
        hack: ns.getScriptRam(HACK_SCRIPT),
        grow: ns.getScriptRam(GROW_SCRIPT),
        weaken: ns.getScriptRam(WEAKEN_SCRIPT),
    };

    const plan: ExecPlanItem[] = [];

    function allocate(
        script: string,
        costPerThread: number,
        threadsNeeded: number,
        args: (string | number)[]
    ): number {
        let left = threadsNeeded;

        for (const host of allServers) {
            if (left <= 0) break;

            const free = remaining.get(host) ?? 0;
            const fit = Math.floor(free / costPerThread);
            if (fit <= 0) continue;

            const use = Math.min(fit, left);

            plan.push({ script, host, threads: use, args });

            remaining.set(host, free - use * costPerThread);
            left -= use;
        }

        return left;
    }

    const failW2 = allocate(WEAKEN_SCRIPT_NAME, ramCost.weaken, threads.weaken2Threads, [
        targetServer,
        weaken2Delay,
        "w2",
    ]);
    const failG = allocate(GROW_SCRIPT_NAME, ramCost.grow, threads.growThreads, [
        targetServer,
        growDelay,
        "g",
    ]);
    const failW1 = allocate(WEAKEN_SCRIPT_NAME, ramCost.weaken, threads.weaken1Threads, [
        targetServer,
        weaken1Delay,
        "w1",
    ]);
    const failH = allocate(HACK_SCRIPT_NAME, ramCost.hack, threads.hackThreads, [
        targetServer,
        hackingDelay,
        "h",
    ]);

    const failed = failW2 + failG + failW1 + failH;
    if (failed > 0) {
        return;
    }

    for (const p of plan) {
        const freeNow =
            ns.getServerMaxRam(p.host) -
            ns.getServerUsedRam(p.host) -
            (p.host === "home" ? HOME_RAM_RESERVE : 0);

        const cost = ns.getScriptRam(p.script, p.host);
        const maxThreadsNow = Math.floor(freeNow / cost);

        if (maxThreadsNow <= 0) continue;

        const threads = Math.min(p.threads, maxThreadsNow);
        const pid = ns.exec(p.script, p.host, threads, ...p.args);

        if (pid === 0) {
            ns.tprint(
                `Still failed exec ${p.script} on ${p.host} (${threads} threads) freeNow=${freeNow}`
            );
        }
    }

    // ns.tprint(
    //     `Launched batch on ${targetServer}: H=${threads.hackThreads} W1=${threads.weaken1Threads} G=${threads.growThreads} W2=${threads.weaken2Threads}`
    // );
}

function calculateTotalBatchThreads(
    ns: NS,
    targetServer: string,
    hackThreads: number,
    allServers: string[]
): {
    hackThreads: number;
    weaken1Threads: number;
    growThreads: number;
    weaken2Threads: number;
} {
    if (hackThreads < 1) {
        ns.tprint(`Batch impossible, not enough RAM available to do anything`);
        return { hackThreads: 0, weaken1Threads: 0, growThreads: 0, weaken2Threads: 0 };
    }

    const totalRamAvailable = getCombinedServerRam(ns, allServers);

    const weakenRamCost = ns.getScriptRam(WEAKEN_SCRIPT);
    const growRamCost = ns.getScriptRam(GROW_SCRIPT);
    const hackRamCost = ns.getScriptRam(HACK_SCRIPT);

    const weakenPerThread = ns.weakenAnalyze(1);
    const totalHackSecurityIncrease = ns.hackAnalyzeSecurity(hackThreads, targetServer);

    const weaken1Threads = Math.ceil(totalHackSecurityIncrease / weakenPerThread);

    const maxMoney = ns.getServerMaxMoney(targetServer);
    const stolenFraction = ns.hackAnalyze(targetServer) * hackThreads;
    const moneyStolenUsingHackThreads = maxMoney * stolenFraction;

    const growthFactor =
        ns.getServerMaxMoney(targetServer) /
        (ns.getServerMaxMoney(targetServer) - moneyStolenUsingHackThreads);

    const growThreads = Math.ceil(ns.growthAnalyze(targetServer, growthFactor));
    const totalGrowSecurityIncrease = GROW_SEC_INCREASE_PER_THREAD * growThreads;
    const weaken2Threads = Math.ceil(totalGrowSecurityIncrease / weakenPerThread);

    const totalRamCostForBatch =
        hackThreads * hackRamCost +
        weaken1Threads * weakenRamCost +
        growThreads * growRamCost +
        weaken2Threads * weakenRamCost;

    if (totalRamAvailable < totalRamCostForBatch) {
        return calculateTotalBatchThreads(ns, targetServer, hackThreads - 1, allServers);
    }

    // ns.tprint(`
    //   Batch threads prepared. We want to steal ${moneyStolenUsingHackThreads} from ${targetServer} (Maximum money is: ${ns.getServerMaxMoney(
    //     targetServer
    // )})

    // Total RAM available accross all servers: ${totalRamAvailable}
    // RAM cost for batch: ${totalRamCostForBatch}

    // Total security increase for hack: ${totalHackSecurityIncrease}

    // Growth threads float: ${growThreadsFloat}
    // Grow threads int: ${growThreads}
    // Security increase per grow: ${GROW_SEC_INCREASE_PER_THREAD}
    // Total security increase for grow: ${totalGrowSecurityIncrease}
    // Weaken per thread: ${weakenPerThread}

    // Threads:
    //   H: ${hackThreads}
    //   W1: ${weaken1Threads}
    //   G: ${growThreads}
    //   W2: ${weaken2Threads}
    // `);

    return {
        hackThreads,
        weaken1Threads,
        growThreads,
        weaken2Threads,
    };
}

function weakenSecurity(ns: NS, targetServer: string, allServersAvailable: string[]) {
    const currentTargetServerSecurityLevel = ns.getServerSecurityLevel(targetServer);
    const minimumTargetServerSecurityLevel = ns.getServerMinSecurityLevel(targetServer);
    const weakenAmountPerThreads = ns.weakenAnalyze(1);
    let weakenThreadsNeeded = Math.ceil(
        (currentTargetServerSecurityLevel - minimumTargetServerSecurityLevel) /
            weakenAmountPerThreads
    );

    // ns.tprint(`
    //   Security is too high now, we have to weaken!
    //   Current target security: ${currentTargetServerSecurityLevel}
    //   Minimum target security: ${minimumTargetServerSecurityLevel}

    //   Weaken per thread: ${weakenAmountPerThreads}
    //   Total weaken threads needed: ${weakenThreadsNeeded}
    // `);

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

        // ns.tprint(`
        //   Money is not at max yet, time to grow!
        //   Current target money: ${currentMoney}
        //   Max target money: ${serverMaxMoney}

        //   Growth factor: ${growthFactor}
        //   Total grow threads needed: ${growThreadsNeeded}
        // `);

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

    // ns.tprint(`
    //   Grow/weaken threads info
    //   ======
    //   Single grow security increase: ${singleGrowSecurityIncrease}
    //   Single weaken security decrease: ${singleWeakenSecurityDecrease}

    //   Total security increase by grow: ${growThreads} * ${singleGrowSecurityIncrease} = ${totalSecurityInceaseByGrow}
    //   Total weaken threads to offset: ${totalSecurityInceaseByGrow} / ${singleWeakenSecurityDecrease} (ceiled)

    //   Free RAM on server: ${freeRamOnServer}
    //   Grow ram needed: ${growRamNeeded}
    //   Weaken ram needed: ${weakenRamNeeded}
    //   Total ram needed: ${totalRamNeeded}

    //   Eventual result: ${JSON.stringify(result, null, 2)}
    // `);

    return result;
}
