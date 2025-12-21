import { NS } from "@ns";
import {
    getAllAvailableServersWithRootAccess,
    getMostProfitableServersToHack,
} from "./utils/helpers";
import { copyNestedFilesToRootOfHost } from "./utils/helpers";
import {
    GROW_SCRIPT_NAME,
    GROWTH_TARGET,
    HACK_PERCENTAGE,
    HACK_SCRIPT_NAME,
    WEAKEN_SCRIPT_NAME,
} from "./utils/constants";

// Logging controls
const ENABLE_LOGGING = false;
const DEBUG_SERVER: string | null = "serb0r-1"; // Set to a server name to only log for that server, or null for all servers

function log(ns: NS, message: string, serverName?: string): void {
    if (!ENABLE_LOGGING) return;
    if (DEBUG_SERVER !== null && serverName !== undefined && serverName !== DEBUG_SERVER)
        return;
    ns.tprint(message);
}

export async function main(ns: NS) {
    while (true) {
        log(
            ns,
            `
═══════════════════════════════════════════════════════════════
🔄 CONTROLLER LOOP ITERATION START
═══════════════════════════════════════════════════════════════
        `
        );

        const purchasedServers = ns.getPurchasedServers();
        const nukedServers = getAllAvailableServersWithRootAccess(ns);
        const mostProfitableServersToHack = getMostProfitableServersToHack(ns, "loop");
        const mostProfitableServerToHack = mostProfitableServersToHack?.[0].hostName;
        // ns.tprint(`${JSON.stringify(mostProfitableServersToHack, null, 2)}`);
        // ns.tprint(`${mostProfitableServerToHack}`);

        log(
            ns,
            `
📊 SERVER DISCOVERY:
  Purchased servers: ${purchasedServers.length} [${purchasedServers.join(", ")}]
  Nuked servers: ${nukedServers.length} [${nukedServers.slice(0, 5).join(", ")}${
                nukedServers.length > 5 ? "..." : ""
            }]
  Most profitable target: ${mostProfitableServerToHack || "NONE"}
        `
        );

        const filteredNukedServers = nukedServers.filter(
            (server) =>
                ns.getServerMaxRam(server) >=
                    ns.getScriptRam(WEAKEN_SCRIPT_NAME, server) &&
                server !== mostProfitableServerToHack &&
                server !== "home"
        );
        const allServers = [...new Set([...purchasedServers, ...filteredNukedServers])];

        log(
            ns,
            `
🔍 FILTERED SERVERS:
  Total worker servers: ${allServers.length}
  Servers: [${allServers.join(", ")}]
        `
        );

        if (!mostProfitableServerToHack) {
            log(
                ns,
                `
⚠️  NO PROFITABLE TARGET FOUND - Waiting 5 seconds...
            `
            );
            await ns.sleep(5000);
            continue;
        }

        for (const serverWorker of allServers) {
            log(
                ns,
                `
───────────────────────────────────────────────────────────────
🖥️  PROCESSING WORKER: ${serverWorker}
   Target: ${mostProfitableServerToHack}
───────────────────────────────────────────────────────────────
            `,
                serverWorker
            );

            /** If we already have script running on this server, we have to wait for them to finish first */
            const runningScripts = ns.ps(serverWorker);
            if (runningScripts.length > 0) {
                log(
                    ns,
                    `
⏸️  SKIP: ${serverWorker} has ${runningScripts.length} script(s) running
   Running: ${runningScripts.map((s) => s.filename).join(", ")}
                `,
                    serverWorker
                );
                continue;
            }

            const maxRam = ns.getServerMaxRam(serverWorker);
            const usedRam = ns.getServerUsedRam(serverWorker);
            const freeRamOnServer = maxRam - usedRam;

            log(
                ns,
                `
💾 RAM STATUS (${serverWorker}):
   Max RAM: ${maxRam} GB
   Used RAM: ${usedRam} GB
   Free RAM: ${freeRamOnServer} GB
            `,
                serverWorker
            );

            const weakenScriptExists = ns.fileExists(WEAKEN_SCRIPT_NAME, serverWorker);
            const growScriptExists = ns.fileExists(GROW_SCRIPT_NAME, serverWorker);
            const hackScriptExists = ns.fileExists(HACK_SCRIPT_NAME, serverWorker);

            log(
                ns,
                `
📁 SCRIPT CHECK (${serverWorker}):
   ${WEAKEN_SCRIPT_NAME}: ${weakenScriptExists ? "✅" : "❌"}
   ${GROW_SCRIPT_NAME}: ${growScriptExists ? "✅" : "❌"}
   ${HACK_SCRIPT_NAME}: ${hackScriptExists ? "✅" : "❌"}
            `,
                serverWorker
            );

            if (!weakenScriptExists || !growScriptExists || !hackScriptExists) {
                log(
                    ns,
                    `
📋 COPYING SCRIPTS to ${serverWorker}...
                `,
                    serverWorker
                );
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

            log(
                ns,
                `
🎯 TARGET STATUS (${mostProfitableServerToHack}):
   Money: $${ns.formatNumber(serverToHackMoneyAvailable)} / $${ns.formatNumber(
                    ns.getServerMaxMoney(mostProfitableServerToHack)
                )}
   Security: ${currentSecurity.toFixed(2)} (min: ${minSecurity.toFixed(
                    2
                )} + 0.3 = ${securityThreshold.toFixed(2)})
            `,
                serverWorker
            );

            /** First make sure the entire server is weakened to minimum */
            const weakenRamPerThread = ns.getScriptRam(WEAKEN_SCRIPT_NAME, serverWorker);
            const totalWeakenThreadsAvailable = Math.floor(
                freeRamOnServer / weakenRamPerThread
            );
            const needsWeaken = currentSecurity > securityThreshold;

            log(
                ns,
                `
🔒 WEAKEN CHECK:
   Needs weaken: ${needsWeaken ? "✅ YES" : "❌ NO"}
   Current: ${currentSecurity.toFixed(2)} > Threshold: ${securityThreshold.toFixed(2)}
   Weaken RAM/thread: ${weakenRamPerThread} GB
   Available threads: ${totalWeakenThreadsAvailable}
            `,
                serverWorker
            );

            if (needsWeaken && totalWeakenThreadsAvailable > 0) {
                log(
                    ns,
                    `
⚡ EXECUTING WEAKEN:
   Script: ${WEAKEN_SCRIPT_NAME}
   Worker: ${serverWorker}
   Target: ${mostProfitableServerToHack}
   Threads: ${totalWeakenThreadsAvailable}
                `,
                    serverWorker
                );
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
❌ ERROR: Failed to exec ${WEAKEN_SCRIPT_NAME} on ${serverWorker} for ${mostProfitableServerToHack}
                        `,
                            serverWorker
                        );
                    } else {
                        log(
                            ns,
                            `
✅ WEAKEN STARTED - PID: ${pid}
                        `,
                            serverWorker
                        );
                    }
                    continue;
                } else {
                    log(
                        ns,
                        `
❌ ERROR: ${WEAKEN_SCRIPT_NAME} doesn't exist on ${serverWorker}
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

            log(
                ns,
                `
🌱 GROW CHECK:
   Current money: $${ns.formatNumber(serverToHackMoneyAvailable)}
   Max money: $${ns.formatNumber(maxMoney)}
   Growth target (${GROWTH_TARGET * 100}%): $${ns.formatNumber(growthTargetMoney)}
   Needs grow: ${needsGrow ? "✅ YES" : "❌ NO"}
            `,
                serverWorker
            );

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

                log(
                    ns,
                    `
📈 GROW CALCULATIONS:
   Growth factor needed: ${growthFactor.toFixed(2)}x
   Threads needed (by growth): ${growThreadsNeeded.toFixed(2)}
   Grow RAM/thread: ${growthRamPerThread} GB
   Max threads (by RAM): ${maxGrowByRam}
   Final grow threads: ${growThreads}
                `,
                    serverWorker
                );

                const maximumGrowAndWeakenThreads = findMaximumGrowThreads(
                    ns,
                    serverWorker,
                    mostProfitableServerToHack,
                    growThreads
                );

                log(
                    ns,
                    `
✅ GROW THREAD CALCULATION RESULT:
   ${JSON.stringify(maximumGrowAndWeakenThreads, null, 2)}
                `,
                    serverWorker
                );

                if (maximumGrowAndWeakenThreads.growThreads > 0) {
                    log(
                        ns,
                        `
⚡ EXECUTING GROW:
   Script: ${GROW_SCRIPT_NAME}
   Worker: ${serverWorker}
   Target: ${mostProfitableServerToHack}
   Threads: ${maximumGrowAndWeakenThreads.growThreads}
                    `,
                        serverWorker
                    );
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
❌ ERROR: Failed to exec ${GROW_SCRIPT_NAME} on ${serverWorker} for ${mostProfitableServerToHack}
   Tried with ${maximumGrowAndWeakenThreads.growThreads} threads
   Max RAM: ${ns.getServerMaxRam(serverWorker)} GB
   Used RAM: ${ns.getServerUsedRam(serverWorker)} GB
   Free RAM: ${ns.getServerMaxRam(serverWorker) - ns.getServerUsedRam(serverWorker)} GB
   Grow script cost: ${growthRamPerThread * maximumGrowAndWeakenThreads.growThreads} GB
                        `,
                            serverWorker
                        );
                    } else {
                        log(
                            ns,
                            `
✅ GROW STARTED - PID: ${pid}
                        `,
                            serverWorker
                        );
                    }
                }

                if (maximumGrowAndWeakenThreads.weakenThreads > 0) {
                    log(
                        ns,
                        `
⚡ EXECUTING WEAKEN (after grow):
   Script: ${WEAKEN_SCRIPT_NAME}
   Worker: ${serverWorker}
   Target: ${mostProfitableServerToHack}
   Threads: ${maximumGrowAndWeakenThreads.weakenThreads}
                    `,
                        serverWorker
                    );
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
❌ ERROR: Failed to exec ${WEAKEN_SCRIPT_NAME} on ${serverWorker} for ${mostProfitableServerToHack}
                        `,
                            serverWorker
                        );
                    } else {
                        log(
                            ns,
                            `
✅ WEAKEN STARTED - PID: ${pid}
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

            log(
                ns,
                `
💰 HACK CALCULATIONS:
   Money available: $${ns.formatNumber(serverToHackMoneyAvailable)}
   Hack percentage: ${HACK_PERCENTAGE * 100}%
   Money to hack: $${ns.formatNumber(moneyWeWantToHack)}
   Raw hack threads: ${rawHackThreads.toFixed(2)}
   Final hack threads: ${amountOfHackThreads}
            `,
                serverWorker
            );

            if (amountOfHackThreads < 0) {
                log(
                    ns,
                    `
❌ ERROR: Amount of hack threads is less than 0 for ${serverWorker} trying to hack ${mostProfitableServerToHack}
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

            log(
                ns,
                `
✅ HACK THREAD CALCULATION RESULT:
   ${JSON.stringify(maximumHackAndWeakenThreads, null, 2)}
            `,
                serverWorker
            );

            if (maximumHackAndWeakenThreads.hackThreads > 0) {
                log(
                    ns,
                    `
⚡ EXECUTING HACK:
   Script: ${HACK_SCRIPT_NAME}
   Worker: ${serverWorker}
   Target: ${mostProfitableServerToHack}
   Threads: ${maximumHackAndWeakenThreads.hackThreads}
                `,
                    serverWorker
                );
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
❌ ERROR: Failed to exec ${HACK_SCRIPT_NAME} on ${serverWorker} for ${mostProfitableServerToHack}
                    `,
                        serverWorker
                    );
                } else {
                    log(
                        ns,
                        `
✅ HACK STARTED - PID: ${pid}
                    `,
                        serverWorker
                    );
                }
            }

            if (maximumHackAndWeakenThreads.weakenThreads > 0) {
                log(
                    ns,
                    `
⚡ EXECUTING WEAKEN (after hack):
   Script: ${WEAKEN_SCRIPT_NAME}
   Worker: ${serverWorker}
   Target: ${mostProfitableServerToHack}
   Threads: ${maximumHackAndWeakenThreads.weakenThreads}
                `,
                    serverWorker
                );
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
❌ ERROR: Failed to exec ${WEAKEN_SCRIPT_NAME} on ${serverWorker} for ${mostProfitableServerToHack}
                    `,
                        serverWorker
                    );
                } else {
                    log(
                        ns,
                        `
✅ WEAKEN STARTED - PID: ${pid}
                    `,
                        serverWorker
                    );
                }
            }

            log(
                ns,
                `
✅ COMPLETED PROCESSING ${serverWorker}
───────────────────────────────────────────────────────────────
            `,
                serverWorker
            );
        }

        log(
            ns,
            `
⏸️  LOOP COMPLETE - Sleeping 4000ms...
═══════════════════════════════════════════════════════════════
        `
        );
        await ns.sleep(4000);
    }
}

function findMaximumGrowThreads(
    ns: NS,
    serverWorker: string,
    serverToHack: string,
    growThreads: number
): { growThreads: number; weakenThreads: number } {
    log(
        ns,
        `
      ========== findMaximumGrowThreads START ==========
      Input:
        serverWorker: ${serverWorker}
        serverToHack: ${serverToHack}
        growThreads: ${growThreads}
    `,
        serverWorker
    );

    if (growThreads <= 0) {
        log(
            ns,
            `
      ========== findMaximumGrowThreads EARLY RETURN ==========
      growThreads <= 0, returning { growThreads: 0, weakenThreads: 0 }
    `,
            serverWorker
        );
        return { growThreads: 0, weakenThreads: 0 };
    }

    const maxRam = ns.getServerMaxRam(serverWorker);
    const usedRam = ns.getServerUsedRam(serverWorker);
    const freeRamOnServer = maxRam - usedRam;

    log(
        ns,
        `
      RAM Info:
        maxRam: ${maxRam}
        usedRam: ${usedRam}
        freeRamOnServer: ${freeRamOnServer}
    `,
        serverWorker
    );

    const growthRamPerThread = ns.getScriptRam(GROW_SCRIPT_NAME, serverWorker);
    const weakenRamPerThread = ns.getScriptRam(WEAKEN_SCRIPT_NAME, serverWorker);

    log(
        ns,
        `
      Script RAM Costs:
        growthRamPerThread: ${growthRamPerThread}
        weakenRamPerThread: ${weakenRamPerThread}
    `,
        serverWorker
    );

    const singleGrowSecurityIncrease = ns.growthAnalyzeSecurity(1, serverToHack);
    const singleWeakenSecurityDecrease = ns.weakenAnalyze(1);

    log(
        ns,
        `
      Security Analysis:
        singleGrowSecurityIncrease: ${singleGrowSecurityIncrease}
        singleWeakenSecurityDecrease: ${singleWeakenSecurityDecrease}
    `,
        serverWorker
    );

    const totalSecurityInceaseByGrow = growThreads * singleGrowSecurityIncrease;

    log(
        ns,
        `
      Security Calculations:
        totalSecurityInceaseByGrow: ${totalSecurityInceaseByGrow} (${growThreads} * ${singleGrowSecurityIncrease})
    `,
        serverWorker
    );

    const weakenThreads = Math.ceil(
        totalSecurityInceaseByGrow / singleWeakenSecurityDecrease
    );

    log(
        ns,
        `
      Weaken Threads Calculation:
        weakenThreads: ${weakenThreads} (Math.ceil(${totalSecurityInceaseByGrow} / ${singleWeakenSecurityDecrease}))
    `,
        serverWorker
    );

    const growRamNeeded = growThreads * growthRamPerThread;
    const weakenRamNeeded = weakenThreads * weakenRamPerThread;
    const totalRamNeeded = growRamNeeded + weakenRamNeeded;

    log(
        ns,
        `
      RAM Needed Calculations:
        growRamNeeded: ${growRamNeeded} (${growThreads} * ${growthRamPerThread})
        weakenRamNeeded: ${weakenRamNeeded} (${weakenThreads} * ${weakenRamPerThread})
        totalRamNeeded: ${totalRamNeeded}
        freeRamOnServer: ${freeRamOnServer}
        totalRamNeeded > freeRamOnServer: ${totalRamNeeded > freeRamOnServer}
    `,
        serverWorker
    );

    if (totalRamNeeded > freeRamOnServer) {
        log(
            ns,
            `
      ========== findMaximumGrowThreads RECURSIVE CALL ==========
      Not enough RAM! Recursing with growThreads: ${growThreads - 1}
      (totalRamNeeded: ${totalRamNeeded} > freeRamOnServer: ${freeRamOnServer})
    `,
            serverWorker
        );
        const result = findMaximumGrowThreads(
            ns,
            serverWorker,
            serverToHack,
            growThreads - 1
        );
        log(
            ns,
            `
      ========== findMaximumGrowThreads RECURSIVE RETURN ==========
      Recursive call returned: ${JSON.stringify(result, null, 2)}
    `,
            serverWorker
        );
        return result;
    }

    const result = {
        growThreads: Math.floor(growThreads),
        weakenThreads: Math.floor(weakenThreads),
    };

    log(
        ns,
        `
      ========== findMaximumGrowThreads SUCCESS RETURN ==========
      Returning: ${JSON.stringify(result, null, 2)}
      (growThreads: Math.floor(${growThreads}) = ${Math.floor(growThreads)})
      (weakenThreads: Math.floor(${weakenThreads}) = ${Math.floor(weakenThreads)})
    `,
        serverWorker
    );

    return result;
}

function findMaximumHackThreads(
    ns: NS,
    serverWorker: string,
    serverToHack: string,
    hackThreads: number
): { hackThreads: number; weakenThreads: number } {
    log(
        ns,
        `
      ========== findMaximumHackThreads START ==========
      Input:
        serverWorker: ${serverWorker}
        serverToHack: ${serverToHack}
        hackThreads: ${hackThreads}
    `,
        serverWorker
    );

    if (hackThreads <= 0) {
        log(
            ns,
            `
      ========== findMaximumHackThreads EARLY RETURN ==========
      hackThreads <= 0, returning { hackThreads: 0, weakenThreads: 0 }
    `,
            serverWorker
        );
        return { hackThreads: 0, weakenThreads: 0 };
    }

    const maxRam = ns.getServerMaxRam(serverWorker);
    const usedRam = ns.getServerUsedRam(serverWorker);
    const freeRamOnServer = maxRam - usedRam;

    log(
        ns,
        `
      RAM Info:
        maxRam: ${maxRam}
        usedRam: ${usedRam}
        freeRamOnServer: ${freeRamOnServer}
    `,
        serverWorker
    );

    const hackRamPerThread = ns.getScriptRam(HACK_SCRIPT_NAME, serverWorker);
    const weakenRamPerThread = ns.getScriptRam(WEAKEN_SCRIPT_NAME, serverWorker);

    log(
        ns,
        `
      Script RAM Costs:
        hackRamPerThread: ${hackRamPerThread}
        weakenRamPerThread: ${weakenRamPerThread}
    `,
        serverWorker
    );

    const singleWeakenSecurityDecrease = ns.weakenAnalyze(1);
    const singleHackSecurityIncrease = ns.hackAnalyzeSecurity(1, serverToHack);

    log(
        ns,
        `
      Security Analysis:
        singleHackSecurityIncrease: ${singleHackSecurityIncrease}
        singleWeakenSecurityDecrease: ${singleWeakenSecurityDecrease}
    `,
        serverWorker
    );

    const totalSecurityIncreaseByHack = hackThreads * singleHackSecurityIncrease;

    log(
        ns,
        `
      Security Calculations:
        totalSecurityIncreaseByHack: ${totalSecurityIncreaseByHack} (${hackThreads} * ${singleHackSecurityIncrease})
    `,
        serverWorker
    );

    const weakenThreads = Math.ceil(
        totalSecurityIncreaseByHack / singleWeakenSecurityDecrease
    );

    log(
        ns,
        `
      Weaken Threads Calculation:
        weakenThreads: ${weakenThreads} (Math.ceil(${totalSecurityIncreaseByHack} / ${singleWeakenSecurityDecrease}))
    `,
        serverWorker
    );

    const hackRamNeeded = hackThreads * hackRamPerThread;
    const weakenRamNeeded = weakenThreads * weakenRamPerThread;
    const totalRamNeeded = hackRamNeeded + weakenRamNeeded;

    log(
        ns,
        `
      RAM Needed Calculations:
        hackRamNeeded: ${hackRamNeeded} (${hackThreads} * ${hackRamPerThread})
        weakenRamNeeded: ${weakenRamNeeded} (${weakenThreads} * ${weakenRamPerThread})
        totalRamNeeded: ${totalRamNeeded}
        freeRamOnServer: ${freeRamOnServer}
        totalRamNeeded > freeRamOnServer: ${totalRamNeeded > freeRamOnServer}
    `,
        serverWorker
    );

    if (totalRamNeeded > freeRamOnServer) {
        log(
            ns,
            `
      ========== findMaximumHackThreads RECURSIVE CALL ==========
      Not enough RAM! Recursing with hackThreads: ${hackThreads - 1}
      (totalRamNeeded: ${totalRamNeeded} > freeRamOnServer: ${freeRamOnServer})
    `,
            serverWorker
        );
        const result = findMaximumHackThreads(
            ns,
            serverWorker,
            serverToHack,
            hackThreads - 1
        );
        log(
            ns,
            `
      ========== findMaximumHackThreads RECURSIVE RETURN ==========
      Recursive call returned: ${JSON.stringify(result, null, 2)}
    `,
            serverWorker
        );
        return result;
    }

    const result = {
        hackThreads: Math.floor(hackThreads),
        weakenThreads: Math.floor(weakenThreads),
    };

    log(
        ns,
        `
      ========== findMaximumHackThreads SUCCESS RETURN ==========
      Returning: ${JSON.stringify(result, null, 2)}
      (hackThreads: Math.floor(${hackThreads}) = ${Math.floor(hackThreads)})
      (weakenThreads: Math.floor(${weakenThreads}) = ${Math.floor(weakenThreads)})
    `,
        serverWorker
    );

    return result;
}
