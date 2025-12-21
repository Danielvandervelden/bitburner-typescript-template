import { NS } from "@ns";
import { copyNestedFilesToRootOfHost, getAllAvailableServers } from "/v2/utils/helpers";

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
