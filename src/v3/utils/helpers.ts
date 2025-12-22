import { NS } from "@ns";
import {
    GROW_SCRIPT,
    GROW_SCRIPT_NAME,
    HACK_PERCENTAGE,
    HACK_SCRIPT,
    HACK_SCRIPT_NAME,
    WEAKEN_SCRIPT,
    WEAKEN_SCRIPT_NAME,
} from "./constants.js";

export function getAllAvailableServers(ns: NS) {
    const hosts = ns.scan("home");

    for (let i = 0; i < hosts.length; i++) {
        ns.scan(hosts[i]).forEach((host) =>
            !hosts.includes(host) ? hosts.push(host) : false
        );
    }

    return hosts.filter((host) => host !== "home");
}

export function getHackableServers(ns: NS) {
    const hosts = ns.scan("home");

    for (let i = 0; i < hosts.length; i++) {
        ns.scan(hosts[i]).forEach((host) =>
            !hosts.includes(host) ? hosts.push(host) : false
        );
    }

    return hosts.filter(
        (host) => ns.getHackingLevel() < ns.getServerRequiredHackingLevel(host)
    );
}

export function getAllAvailableServersWithRootAccess(ns: NS): string[] {
    const seen = new Set<string>(["home"]);
    const queue = ["home"];

    while (queue.length) {
        const node = queue.shift();
        for (const next of ns.scan(node)) {
            if (!seen.has(next)) {
                seen.add(next);
                queue.push(next);
            }
        }
    }

    return [...seen].filter(
        (host) => host !== "home" && !host.startsWith("serb0r-") && ns.hasRootAccess(host)
    );
}

export function getAllAvailableServersWithRootAccessMinusHackingLevel(
    ns: NS,
    percentageOfHackingLevel = 0.9
) {
    const hosts = ns.scan("home");

    for (let i = 0; i < hosts.length; i++) {
        ns.scan(hosts[i]).forEach((host) =>
            !hosts.includes(host) ? hosts.push(host) : false
        );
    }

    const filteredHosts = hosts.filter(
        (host) =>
            !host.startsWith("serb0r-") &&
            host !== "home" &&
            ns.hasRootAccess(host) &&
            ns.getServerRequiredHackingLevel(host) <=
                ns.getHackingLevel() * percentageOfHackingLevel
    );

    return filteredHosts
        .filter((server) => {
            return ns.getServerMaxMoney(server) !== 0;
        })
        .sort((a, b) => {
            const maxMoneyServerA = ns.getServerMaxMoney(a);
            const maxMoneyServerB = ns.getServerMaxMoney(b);

            // ns.tprint(`Server A: ${a} -> ${maxMoneyServerA}`)
            // ns.tprint(`Server B: ${b} -> ${maxMoneyServerB}`)

            return maxMoneyServerB - maxMoneyServerA;
        });
}

export function getAllAvailableServersWithoutRootAccess(ns: NS) {
    const hosts = ns.scan("home");

    for (let i = 0; i < hosts.length; i++) {
        ns.scan(hosts[i]).forEach((host) =>
            !hosts.includes(host) &&
            ns.getServerRequiredHackingLevel(host) <= ns.getHackingLevel()
                ? hosts.push(host)
                : false
        );
    }

    return hosts.filter(
        (host) =>
            host !== "home" && !ns.hasRootAccess(host) && !host.startsWith("serb0r-")
    );
}

export function getAllNonPurchasedServers(ns: NS) {
    const hosts = ns.scan("home");

    for (let i = 0; i < hosts.length; i++) {
        ns.scan(hosts[i]).forEach((host) =>
            !hosts.includes(host) ? hosts.push(host) : false
        );
    }

    return hosts.filter((host) => host !== "home" && !host.startsWith("serb0r-"));
}

export function getMaximumAvailableThreads(ns: NS, host: string, scriptName: string) {
    const maxRam = ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
    const scriptCost = ns.getScriptRam(scriptName);

    return Math.floor(maxRam / scriptCost);
}

export function runScriptIfNotAlreadyRunning(ns: NS, scriptName: string, host = "home") {
    if (!ns.isRunning(scriptName, host)) {
        ns.run(scriptName);
    } else {
        ns.tprint(`${scriptName} script is already running`);
    }
}

export function createRandomIdentifier(length = 12) {
    const characters = [
        "A",
        "a",
        "B",
        "b",
        "C",
        "c",
        "D",
        "d",
        "E",
        "e",
        "F",
        "f",
        "G",
        "g",
        "H",
        "h",
        "I",
        "i",
        "J",
        "j",
        "K",
        "k",
        "L",
        "l",
        "M",
        "m",
        "N",
        "n",
        "O",
        "o",
        "P",
        "p",
        "Q",
        "q",
        "R",
        "r",
        "S",
        "s",
        "T",
        "t",
        "U",
        "u",
        "V",
        "v",
        "W",
        "w",
        "X",
        "x",
        "Y",
        "y",
        "Z",
        "z",
        "!",
        "@",
        "#",
        "$",
        "%",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "0",
    ];

    let identifier = "";

    for (let i = 0; i < length; i++) {
        const index = Math.floor(Math.random() * characters.length);
        identifier += characters[index];
    }

    return identifier;
}

export function getWorkerInfo(
    ns: NS,
    host: string,
    serverToHack?: string,
    customHostServerRam?: number
) {
    const hostServerRam =
        customHostServerRam ?? ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
    const growthThreshold = 1.05;
    const securityThreshold = ns.getServerMinSecurityLevel(serverToHack ?? host) + 0.03;

    const hackScriptRam = ns.getScriptRam(HACK_SCRIPT, "home");
    const weakenScriptRam = ns.getScriptRam(WEAKEN_SCRIPT, "home");
    const growScriptRam = ns.getScriptRam(GROW_SCRIPT, "home");

    const maxThreadsAllScripts = Math.floor(
        hostServerRam / Math.max(hackScriptRam, weakenScriptRam, growScriptRam)
    );

    return { hostServerRam, growthThreshold, securityThreshold, maxThreadsAllScripts };
}

export function copyNestedFilesToRootOfHost(
    ns: NS,
    fromHost: string,
    scriptPath: string,
    hosts: string[]
) {
    const files = ns.ls(fromHost, scriptPath);

    if (!files.length) {
        ns.tprint(
            `Tried to search for files on ${fromHost} with pathname: ${scriptPath}, but failed...`
        );
        return;
    }

    for (const file of files) {
        const splitFileName = file.split("/");
        const flatFileName = splitFileName[splitFileName.length - 1];
        const content = ns.read(file);
        ns.write(flatFileName, content, "w");

        if (!hosts?.length) {
            ns.tprint(
                `Tried to copy from ${fromHost} scriptpath: ${scriptPath} to hosts, but hosts has no length or is undefined. Hosts value: ${hosts}`
            );
            return;
        }

        for (const host of hosts) {
            const successfullyCopiedFile = ns.scp(flatFileName, host, fromHost);

            if (!successfullyCopiedFile) {
                ns.tprint(
                    `Couldn't successfuly copy ${flatFileName} to ${host} from ${fromHost}`
                );
            }
        }
    }
}

export function getServerInfo(ns: NS, hostToGetInfoFrom: string) {
    const maximumMoney = ns.getServerMaxMoney(hostToGetInfoFrom);
    const currentMoney = ns.getServerMoneyAvailable(hostToGetInfoFrom);
    const growthTime = ns.getGrowTime(hostToGetInfoFrom);
    const currentSecurity = ns.getServerSecurityLevel(hostToGetInfoFrom);
    const weakenTime = ns.getWeakenTime(hostToGetInfoFrom);
    const hackingTime = ns.getHackTime(hostToGetInfoFrom);
    const growth = maximumMoney / currentMoney;

    return {
        maximumMoney,
        currentMoney,
        growthTime,
        currentSecurity,
        weakenTime,
        hackingTime,
        growth,
    };
}

interface WorkerExecutionOptions {
    host: string;
    serverToHack: string;
    securityThreshold: number;
    maxThreadsAllScripts: number;
    growthThreshold: number;
    customWeakenScriptPath?: string;
    customGrowScriptPath?: string;
    customHackScriptPath?: string;
}

export async function determineWorkerExecution(ns: NS, options: WorkerExecutionOptions) {
    const {
        growthThreshold,
        host,
        maxThreadsAllScripts,
        securityThreshold,
        serverToHack,
        customGrowScriptPath,
        customHackScriptPath,
        customWeakenScriptPath,
    } = options;
    const { currentSecurity, growthTime, hackingTime, weakenTime, growth } =
        getServerInfo(ns, serverToHack);

    if (customHackScriptPath && !ns.fileExists(customHackScriptPath, host)) {
        ns.tprint(
            `Gave a custom hack script path (${customHackScriptPath}) but we can't find it on ${host}!`
        );
        return;
    }

    if (customGrowScriptPath && !ns.fileExists(customGrowScriptPath, host)) {
        ns.tprint(
            `Gave a custom hack script path (${customGrowScriptPath}) but we can't find it on ${host}!`
        );
        return;
    }

    if (customWeakenScriptPath && !ns.fileExists(customWeakenScriptPath, host)) {
        ns.tprint(
            `Gave a custom hack script path (${customWeakenScriptPath}) but we can't find it on ${host}!`
        );
        return;
    }

    if (currentSecurity > securityThreshold) {
        // ns.tprint(`
        //     Executing weaken on ${serverToHack} with ${maxThreadsAllScripts} threads.

        //     Current security: ${currentSecurity}
        //     Security threshold: ${securityThreshold}
        //     Time to weaken in seconds: ${weakenTime / 1000}
        // `);

        const pid = ns.exec(
            customWeakenScriptPath ?? WEAKEN_SCRIPT_NAME,
            host,
            maxThreadsAllScripts,
            serverToHack
        );

        if (!pid) {
            ns.tprint(`
        Tried to execute ${WEAKEN_SCRIPT_NAME} on ${host} using ${maxThreadsAllScripts} threads to hack ${serverToHack}, but failed...  

        Will try to copy scripts over to see if that fixes the issue...
      `);

            copyNestedFilesToRootOfHost(ns, "home", "/v2/scripts/hacking/bits", [host]);
            return;
        }
        await ns.sleep(weakenTime + 100);
        return;
    }

    if (growth > growthThreshold) {
        // ns.tprint(`
        //     Executing grow on ${serverToHack} with ${maxThreadsAllScripts} threads.

        //     Growth ratio: ${growth}
        //     Growth threshold: ${growthThreshold}
        //     Growth time in seconds: ${growthTime / 1000}
        //     Max money: ${maximumMoney}
        //     Current money: ${currentMoney}
        // `);

        const pid = ns.exec(
            customGrowScriptPath ?? GROW_SCRIPT_NAME,
            host,
            maxThreadsAllScripts,
            serverToHack
        );

        if (!pid) {
            ns.tprint(`
        Tried to execute ${GROW_SCRIPT_NAME} on ${host} using ${maxThreadsAllScripts} threads to hack ${serverToHack}, but failed...  
      `);
            return;
        }

        await ns.sleep(growthTime + 100);
        return;
    }

    // ns.tprint(`Executing hack on ${serverToHack} from ${host} with ${maxThreadsAllScripts} threads, will take ${hackingTime / 1000} seconds`);
    const pid = ns.exec(
        customHackScriptPath ?? HACK_SCRIPT_NAME,
        host,
        maxThreadsAllScripts,
        serverToHack
    );

    if (!pid) {
        ns.tprint(`
      Tried to execute ${HACK_SCRIPT_NAME} on ${host} using ${maxThreadsAllScripts} threads to hack ${serverToHack}, but failed...  
    `);
        return;
    }
    await ns.sleep(hackingTime);
}

type ProfitMode = "loop" | "batch";
interface BestServer {
    hostName: string;
    bestScore: number;
}

export const getMostProfitableServersToHack = (
    ns: NS,
    mode: ProfitMode
): BestServer[] => {
    const targets = getAllAvailableServersWithRootAccess(ns).filter((host) => {
        const maxMoney = ns.getServerMaxMoney(host);
        const chance = ns.hackAnalyzeChance(host);
        const reqLvl = ns.getServerRequiredHackingLevel(host);

        return maxMoney > 0 && chance > 0.9 && reqLvl < ns.getHackingLevel();
    });

    if (!targets.length) {
        return [];
    }

    const bestServers: BestServer[] = [];

    // Cache script RAM once (it’s constant)
    const hackRam = ns.getScriptRam(HACK_SCRIPT);
    const growRam = ns.getScriptRam(GROW_SCRIPT);
    const weakenRam = ns.getScriptRam(WEAKEN_SCRIPT);

    // Security reduction per weaken thread (player-based, constant)
    const weakenPerThread = ns.weakenAnalyze(1);

    for (const host of targets) {
        const maxMoney = ns.getServerMaxMoney(host);
        const currentMoney = ns.getServerMoneyAvailable(host);
        const hackChance = ns.hackAnalyzeChance(host);

        // Money basis
        const moneyBase = mode === "batch" ? maxMoney : currentMoney;

        // Growth factor basis
        const growthFactor =
            mode === "batch"
                ? 1 / (1 - HACK_PERCENTAGE) // regrow after hacking HACK_PERCENTAGE from full
                : Math.max(1, maxMoney / Math.max(currentMoney, 1)); // restore from current -> max

        // Threads
        const hackFracPerThread = ns.hackAnalyze(host);
        if (hackFracPerThread <= 0) continue;

        const hackThreads = Math.max(1, Math.ceil(HACK_PERCENTAGE / hackFracPerThread));
        const growThreads = Math.max(0, Math.ceil(ns.growthAnalyze(host, growthFactor)));

        const securityIncrease =
            ns.hackAnalyzeSecurity(hackThreads, host) +
            ns.growthAnalyzeSecurity(growThreads, host);

        const weakenThreads = Math.max(0, Math.ceil(securityIncrease / weakenPerThread));

        // RAM cost
        const ramCostPerCycle =
            hackThreads * hackRam + growThreads * growRam + weakenThreads * weakenRam;

        if (ramCostPerCycle <= 0) continue;

        // Time basis (batch is paced by weaken; loop can use longest)
        const weakenTime = ns.getWeakenTime(host);
        const cycleTimeMs =
            mode === "batch"
                ? weakenTime
                : Math.max(weakenTime, ns.getGrowTime(host), ns.getHackTime(host));

        const cycleTimeSeconds = cycleTimeMs / 1000;
        if (cycleTimeSeconds <= 0) continue;

        // Expected value
        const expectedMoneyPerCycle = moneyBase * HACK_PERCENTAGE * hackChance;

        // Score: $/sec/GB
        const moneyPerSecondPerGb =
            expectedMoneyPerCycle / cycleTimeSeconds / ramCostPerCycle;

        // Optional debug: uncomment when needed

        // ns.tprint(`
        //   Information for ${host} (${mode})
        //   ------
        //   Money per second per GB: ${moneyPerSecondPerGb}
        //   Max money: ${maxMoney}
        //   Current money: ${currentMoney}
        //   Hack chance: ${hackChance}
        //   Hack %/thread: ${hackFracPerThread}
        //   Threads (H/G/W): ${hackThreads}/${growThreads}/${weakenThreads}
        //   Cycle time: ${cycleTimeSeconds}s
        //   RAM/cycle: ${ramCostPerCycle}GB
        // `);

        bestServers.push({ hostName: host, bestScore: moneyPerSecondPerGb });
    }

    bestServers.sort((a, b) => b.bestScore - a.bestScore);

    return bestServers;
};
