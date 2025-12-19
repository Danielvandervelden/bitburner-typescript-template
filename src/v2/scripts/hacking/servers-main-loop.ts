import { NS } from "@ns";
import { getAllAvailableServersWithRootAccessMinusHackingLevel } from "/v2/utils/helpers";
import { SERVER_WORKER_SCRIPT } from "/v2/utils/constants";

export async function main(ns: NS) {
    let lastServerToBeHacked = 0;

    while (true) {
        const hosts = ns.getPurchasedServers();
        const hackedServers = getAllAvailableServersWithRootAccessMinusHackingLevel(ns);

        if (hackedServers.length === 0) {
            ns.tprint(`Hacked servers array is empty: ${hackedServers}, guess we continue in the next iteration? Is weird though.`);
            await ns.sleep(2000);
            continue;
        }

        if (lastServerToBeHacked >= hackedServers.length) {
            ns.tprint(`The last server to be hacked index (${lastServerToBeHacked} is bigger or equal to the hackedServers.length (${hackedServers.length}). Setting lastServerToBeHacked to 0)`);
            lastServerToBeHacked = 0;
        }

        for (let host of hosts) {
            const serverToHack = hackedServers[lastServerToBeHacked]

            if (!serverToHack) {
                ns.tprint(`No server to hack available for ${host} (lastServerToBeHacked: ${lastServerToBeHacked}, hackedServers.length: ${hackedServers.length})`);
                continue;
            }

            const hostAlreadyHasWorker = ns.ps("home").some(p =>
                p.filename.endsWith("v2/scripts/hacking/server-worker.js") &&
                p.args[0] === host
            );

            if (hostAlreadyHasWorker) {
                continue;
            }

            // ns.tprint(`Starting server worker for ${host} hacking: ${serverToHack}`);
            const pid = ns.exec(SERVER_WORKER_SCRIPT, 'home', 1, host, serverToHack);

            if (lastServerToBeHacked < hackedServers.length - 1) {
                lastServerToBeHacked++
            } else {
                lastServerToBeHacked = 0;
            }

            if (!pid) {
                ns.tprint(`Something went wrong, couldn't spawn server worker for ${host} hacking ${serverToHack}, continuing to next host`)
                continue;
            }
        }

        await ns.sleep(2000);
    }
}