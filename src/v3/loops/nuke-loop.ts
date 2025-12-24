import { NS } from "@ns";
import { copyNestedFilesToRootOfHost, getAllAvailableServers } from "/v3/utils/helpers";

type HackFunctions =
    | NS["brutessh"]
    | NS["ftpcrack"]
    | NS["relaysmtp"]
    | NS["httpworm"]
    | NS["sqlinject"];

const portsHackArray: (ns: NS) => { name: string; function: HackFunctions }[] = (ns) => [
    {
        name: "BruteSSH.exe",
        function: ns.brutessh,
    },
    {
        name: "FTPCrack.exe",
        function: ns.ftpcrack,
    },
    {
        name: "RelaySMTP.exe",
        function: ns.relaysmtp,
    },
    {
        name: "HTTPWorm.exe",
        function: ns.httpworm,
    },
    {
        name: "SQLInject.exe",
        function: ns.sqlinject,
    },
];

function checkAmountOfPortsWeCanHack(ns: NS) {
    const portHacks = portsHackArray(ns);

    return portHacks.reduce((previousNumber, currentPortHack) => {
        if (ns.fileExists(currentPortHack.name)) {
            return previousNumber + 1;
        }

        return previousNumber;
    }, 0);
}

/** BFS to find path from home to target */
function findPath(ns: NS, target: string): string[] | null {
    const visited = new Set<string>(["home"]);
    const queue: { server: string; path: string[] }[] = [{ server: "home", path: [] }];

    while (queue.length > 0) {
        const { server, path } = queue.shift()!;
        const neighbors = ns.scan(server);

        for (const neighbor of neighbors) {
            if (neighbor === target) {
                return [...path, neighbor];
            }
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push({ server: neighbor, path: [...path, neighbor] });
            }
        }
    }
    return null;
}

/** Navigate to target server via path */
function navigateTo(ns: NS, target: string): boolean {
    const path = findPath(ns, target);
    if (!path) return false;

    for (const hop of path) {
        if (!ns.singularity.connect(hop)) return false;
    }
    return true;
}

export async function main(ns: NS) {
    while (true) {
        const hosts = getAllAvailableServers(ns);

        if (ns.hasTorRouter()) {
            /** Check if we actually have all the porthacks, if not we check if we have enough money to buy them */
            for (const hack of portsHackArray(ns)) {
                if (
                    !ns.fileExists(hack.name, "home") &&
                    ns.singularity.getDarkwebProgramCost(hack.name) <
                        ns.getServerMoneyAvailable("home")
                ) {
                    const result = ns.singularity.purchaseProgram(hack.name);

                    if (!result) {
                        ns.tprint(`
                  We tried purchasing ${hack.name}, but something went wrong... 
                `);
                    }
                }
            }
        } else {
            if (
                ns.singularity.getDarkwebProgramCost("Tor Router") <
                ns.getServerMoneyAvailable("home")
            ) {
                ns.singularity.purchaseTor();
            }
        }

        for (const host of hosts) {
            /** If we don't have a backdoor, make one */
            if (
                !ns.getServer(host).backdoorInstalled &&
                ns.getServerRequiredHackingLevel(host) < ns.getHackingLevel() &&
                ns.getServerNumPortsRequired(host) <= checkAmountOfPortsWeCanHack(ns) &&
                ns.hasRootAccess(host) &&
                host !== "home" &&
                host !== "." &&
                !host.startsWith("serb0r-") &&
                !host.startsWith("storm")
            ) {
                if (navigateTo(ns, host)) {
                    ns.tprint(`Installing backdoor for ${host}`);
                    await ns.singularity.installBackdoor();
                    ns.singularity.connect("home");
                }
                continue;
            }

            /** If we already have root access, skip */
            if (ns.hasRootAccess(host)) {
                continue;
            }

            /** If we cannot hack it because our hacking level is too low, skip */
            if (ns.getServerRequiredHackingLevel(host) > ns.getHackingLevel()) {
                continue;
            }

            /** Minimum ports checking */
            if (ns.getServerNumPortsRequired(host) === 0) {
                ns.tprint(`Hacking server ${host} 0 open ports required...`);
                ns.nuke(host);
                continue;
            }

            if (ns.getServerNumPortsRequired(host) > checkAmountOfPortsWeCanHack(ns)) {
                continue;
            }

            if (ns.getServerNumPortsRequired(host) > 0) {
                const portsToHack = ns.getServerNumPortsRequired(host);
                const slicedPortsHackArray = portsHackArray(ns).slice(0, portsToHack);

                for (const portHack of slicedPortsHackArray) {
                    if (ns.fileExists(portHack.name, "home")) {
                        portHack.function(host);
                        ns.tprint(`Hacking ${host} with porthack: ${portHack.name}`);
                    }
                }

                ns.tprint(`Nuking ${host}!`);
                ns.nuke(host);
                copyNestedFilesToRootOfHost(ns, "home", "/v3/hacking", [host]);
            }
        }

        await ns.sleep(10000);
    }
}
