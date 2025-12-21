import { NS } from "@ns";
import {
    GROW_SCRIPT_NAME,
    GROWTH_TARGET,
    HACK_PERCENTAGE,
    HACK_SCRIPT_NAME,
    WEAKEN_SCRIPT_NAME,
} from "../utils/constants";
import {
    copyNestedFilesToRootOfHost,
    getAllAvailableServersWithRootAccess,
    getMostProfitableServersToHack,
} from "../utils/helpers";

// Logging controls
const ENABLE_LOGGING = false;
const DEBUG_SERVER: string | null = "serb0r-1";

export function log(ns: NS, message: string, serverName?: string): void {
    if (!ENABLE_LOGGING) return;
    if (DEBUG_SERVER !== null && serverName !== undefined && serverName !== DEBUG_SERVER)
        return;
    ns.tprint(message);
}

export async function main(ns: NS) {
    while (true) {
        const purchasedServers = ns.getPurchasedServers();
        const nukedServers = getAllAvailableServersWithRootAccess(ns);
        const mostProfitableServersToHack = getMostProfitableServersToHack(ns, "loop");
        const mostProfitableServerToHack = mostProfitableServersToHack?.[0]?.hostName;

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
            continue;
        }

        for (const serverWorker of allServers) {
            /** If we already have script running on this server, we have to wait for them to finish first */
            const runningScripts = ns.ps(serverWorker);
            if (runningScripts.length > 0) {
                continue;
            }

            const maxRam = ns.getServerMaxRam(serverWorker);
            const usedRam = ns.getServerUsedRam(serverWorker);
            const freeRamOnServer = maxRam - usedRam;

            const weakenScriptExists = ns.fileExists(WEAKEN_SCRIPT_NAME, serverWorker);
            const growScriptExists = ns.fileExists(GROW_SCRIPT_NAME, serverWorker);
            const hackScriptExists = ns.fileExists(HACK_SCRIPT_NAME, serverWorker);

            if (!weakenScriptExists || !growScriptExists || !hackScriptExists) {
                copyNestedFilesToRootOfHost(ns, "home", "/v3/hacking", [serverWorker]);
                continue;
            }

            const serverToHackMoneyAvailable = Math.max(
                1,
                ns.getServerMoneyAvailable(mostProfitableServerToHack)
            );

            const currentSecurity = ns.getServerSecurityLevel(mostProfitableServerToHack);
            const minSecurity = ns.getServerMinSecurityLevel(mostProfitableServerToHack);
            const securityThreshold = minSecurity + 0.3;

            /** First make sure the entire server is weakened to minimum */
            const weakenRamPerThread = ns.getScriptRam(WEAKEN_SCRIPT_NAME, serverWorker);
            const totalWeakenThreadsAvailable = Math.floor(
                freeRamOnServer / weakenRamPerThread
            );
            const needsWeaken = currentSecurity > securityThreshold;

            if (needsWeaken && totalWeakenThreadsAvailable > 0) {
                if (weakenScriptExists) {
                    const pid = ns.exec(
                        WEAKEN_SCRIPT_NAME,
                        serverWorker,
                        totalWeakenThreadsAvailable,
                        mostProfitableServerToHack
                    );
                    if (pid === 0) {
                        log(
                            ns,
                            `
ERROR: Failed to exec ${WEAKEN_SCRIPT_NAME} on ${serverWorker} for ${mostProfitableServerToHack}
                    `,
                            serverWorker
                        );
                    }
                    continue;
                } else {
                    log(
                        ns,
                        `
ERROR: ${WEAKEN_SCRIPT_NAME} doesn't exist on ${serverWorker}
                `,
                        serverWorker
                    );
                    continue;
                }
            }

            /** Next we'll have to make sure to grow the server to maximum growth, but also weaken it to counteract the growth we apply */
            const maxMoney = ns.getServerMaxMoney(mostProfitableServerToHack);
            const growthTargetMoney = maxMoney * GROWTH_TARGET;
            const needsGrow = serverToHackMoneyAvailable < growthTargetMoney;

            if (needsGrow) {
                const growthFactor = Math.max(
                    1,
                    growthTargetMoney / serverToHackMoneyAvailable
                );

                const growThreadsNeeded = ns.growthAnalyze(
                    mostProfitableServerToHack,
                    growthFactor
                );

                const growthRamPerThread = ns.getScriptRam(
                    GROW_SCRIPT_NAME,
                    serverWorker
                );

                const maxGrowByRam = Math.floor(freeRamOnServer / growthRamPerThread);
                const growThreads = Math.max(
                    Math.min(growThreadsNeeded, maxGrowByRam),
                    1
                );

                const maximumGrowAndWeakenThreads = findMaximumGrowThreads(
                    ns,
                    serverWorker,
                    mostProfitableServerToHack,
                    growThreads
                );

                if (maximumGrowAndWeakenThreads.growThreads > 0) {
                    const pid = ns.exec(
                        GROW_SCRIPT_NAME,
                        serverWorker,
                        maximumGrowAndWeakenThreads.growThreads,
                        mostProfitableServerToHack
                    );
                    if (pid === 0) {
                        log(
                            ns,
                            `
ERROR: Failed to exec ${GROW_SCRIPT_NAME} on ${serverWorker} for ${mostProfitableServerToHack}
Tried with ${maximumGrowAndWeakenThreads.growThreads} threads
Max RAM: ${ns.getServerMaxRam(serverWorker)} GB
Used RAM: ${ns.getServerUsedRam(serverWorker)} GB
Free RAM: ${ns.getServerMaxRam(serverWorker) - ns.getServerUsedRam(serverWorker)} GB
Grow script cost: ${growthRamPerThread * maximumGrowAndWeakenThreads.growThreads} GB
                    `,
                            serverWorker
                        );
                    }
                }

                if (maximumGrowAndWeakenThreads.weakenThreads > 0) {
                    const pid = ns.exec(
                        WEAKEN_SCRIPT_NAME,
                        serverWorker,
                        maximumGrowAndWeakenThreads.weakenThreads,
                        mostProfitableServerToHack
                    );
                    if (pid === 0) {
                        log(
                            ns,
                            `
ERROR: Failed to exec ${WEAKEN_SCRIPT_NAME} on ${serverWorker} for ${mostProfitableServerToHack}
                    `,
                            serverWorker
                        );
                    }
                }

                continue;
            }

            /** Now we're at max money, min security time to figure out the hack/weaken threads to run simultaneously */
            // We're looping, not batching so we won't always be at full money, probably? So we take 5% (which is HACK_PERCENTAGE)
            const moneyWeWantToHack = serverToHackMoneyAvailable * HACK_PERCENTAGE;
            const rawHackThreads = ns.hackAnalyzeThreads(
                mostProfitableServerToHack,
                moneyWeWantToHack
            );
            const amountOfHackThreads = Math.max(Math.floor(rawHackThreads), 1);

            if (amountOfHackThreads < 0) {
                log(
                    ns,
                    `
ERROR: Amount of hack threads is less than 0 for ${serverWorker} trying to hack ${mostProfitableServerToHack}
            `,
                    serverWorker
                );
                continue;
            }

            const maximumHackAndWeakenThreads = findMaximumHackThreads(
                ns,
                serverWorker,
                mostProfitableServerToHack,
                amountOfHackThreads
            );

            if (maximumHackAndWeakenThreads.hackThreads > 0) {
                const pid = ns.exec(
                    HACK_SCRIPT_NAME,
                    serverWorker,
                    maximumHackAndWeakenThreads.hackThreads,
                    mostProfitableServerToHack
                );
                if (pid === 0) {
                    log(
                        ns,
                        `
ERROR: Failed to exec ${HACK_SCRIPT_NAME} on ${serverWorker} for ${mostProfitableServerToHack}
                `,
                        serverWorker
                    );
                }
            }

            if (maximumHackAndWeakenThreads.weakenThreads > 0) {
                const pid = ns.exec(
                    WEAKEN_SCRIPT_NAME,
                    serverWorker,
                    maximumHackAndWeakenThreads.weakenThreads,
                    mostProfitableServerToHack
                );
                if (pid === 0) {
                    log(
                        ns,
                        `
ERROR: Failed to exec ${WEAKEN_SCRIPT_NAME} on ${serverWorker} for ${mostProfitableServerToHack}
                `,
                        serverWorker
                    );
                }
            }
        }

        await ns.sleep(4000);
    }
}

function findMaximumGrowThreads(
    ns: NS,
    serverWorker: string,
    serverToHack: string,
    growThreads: number
): { growThreads: number; weakenThreads: number } {
    if (growThreads <= 0) {
        return { growThreads: 0, weakenThreads: 0 };
    }

    const maxRam = ns.getServerMaxRam(serverWorker);
    const usedRam = ns.getServerUsedRam(serverWorker);
    const freeRamOnServer = maxRam - usedRam;

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
        const result = findMaximumGrowThreads(
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

    return result;
}

function findMaximumHackThreads(
    ns: NS,
    serverWorker: string,
    serverToHack: string,
    hackThreads: number
): { hackThreads: number; weakenThreads: number } {
    if (hackThreads <= 0) {
        return { hackThreads: 0, weakenThreads: 0 };
    }

    const maxRam = ns.getServerMaxRam(serverWorker);
    const usedRam = ns.getServerUsedRam(serverWorker);
    const freeRamOnServer = maxRam - usedRam;

    const hackRamPerThread = ns.getScriptRam(HACK_SCRIPT_NAME, serverWorker);
    const weakenRamPerThread = ns.getScriptRam(WEAKEN_SCRIPT_NAME, serverWorker);

    const singleWeakenSecurityDecrease = ns.weakenAnalyze(1);
    const singleHackSecurityIncrease = ns.hackAnalyzeSecurity(1, serverToHack);

    const totalSecurityIncreaseByHack = hackThreads * singleHackSecurityIncrease;

    const weakenThreads = Math.ceil(
        totalSecurityIncreaseByHack / singleWeakenSecurityDecrease
    );

    const hackRamNeeded = hackThreads * hackRamPerThread;
    const weakenRamNeeded = weakenThreads * weakenRamPerThread;
    const totalRamNeeded = hackRamNeeded + weakenRamNeeded;

    if (totalRamNeeded > freeRamOnServer) {
        const result = findMaximumHackThreads(
            ns,
            serverWorker,
            serverToHack,
            hackThreads - 1
        );

        return result;
    }

    const result = {
        hackThreads: Math.floor(hackThreads),
        weakenThreads: Math.floor(weakenThreads),
    };

    return result;
}
