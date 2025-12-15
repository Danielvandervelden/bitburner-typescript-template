import { NS } from "@ns";
import { getAllAvailableServersWithRootAccess } from "/v1/helpers";
import { WORKER_SCRIPT } from "/v2/utils/constants";

export async function main(ns: NS) {
    const hackedServers = getAllAvailableServersWithRootAccess(ns);

    const hosts = [...hackedServers]

    const runningForHost: string[] = [];

    while (true) {

        for (let host of hosts) {
            if (runningForHost.includes(host)) {
                ns.tprint(`Already running a worker for ${host}`)
                return;
            }
            ns.tprint(`RUNNING FOR: ${host}`);
            const pid = ns.exec(WORKER_SCRIPT, 'home', 1, host);

            runningForHost.push(host);

            if (!pid) {
                ns.tprint(`Failed to start worker for ${host}`);
            }
        }

        await ns.sleep(30000);
    }
}