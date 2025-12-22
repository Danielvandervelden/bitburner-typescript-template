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

        hosts.forEach((host) => {
            /** If we already have root access, return */
            if (ns.hasRootAccess(host)) {
                //ns.tprint(`Trying to hack ${host}. but we already have root access`);
                return;
            }

            /** If we cannot hack it because our hacking level is too low, return */
            if (ns.getServerRequiredHackingLevel(host) > ns.getHackingLevel()) {
                //ns.tprint(`Trying to hack ${host}, but our hacking level is too low`);
                return;
            }

            /** Minimum ports checking */
            if (ns.getServerNumPortsRequired(host) === 0) {
                ns.tprint(`Hacking server ${host} 0 open ports required...`);
                ns.nuke(host);
                return;
            }

            if (ns.getServerNumPortsRequired(host) > checkAmountOfPortsWeCanHack(ns)) {
                //ns.tprint(`Can't hack ${host}, because it requires ${ns.getServerNumPortsRequired(host)} ports to be hacked, and we can hack only ${checkAmountOfPortsWeCanHack(ns)}`)
                return;
            }

            if (ns.getServerNumPortsRequired(host) > 0) {
                const portsToHack = ns.getServerNumPortsRequired(host);
                const slicedPortsHackArray = portsHackArray(ns).slice(0, portsToHack);

                //ns.tprint(`Trying to hack ${host}, it requires ${portsToHack} ports to be hacked open`);
                //ns.tprintRaw('Using following port hacks: ' + JSON.stringify(slicedPortsHackArray))

                for (const portHack of slicedPortsHackArray) {
                    if (ns.fileExists(portHack.name, "home")) {
                        portHack.function(host);
                        ns.tprint(`Hacking ${host} with porthack: ${portHack.name}`);
                    }
                }

                ns.tprint(`Nuking ${host}!`);
                ns.nuke(host);
                copyNestedFilesToRootOfHost(ns, "home", "/v2/scripts/hacking/bits", [
                    host,
                ]);
            }
        });

        await ns.sleep(10000);
    }
}
