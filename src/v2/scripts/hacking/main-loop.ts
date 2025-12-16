import { NS } from "@ns";
import { getAllAvailableServersWithRootAccess } from "/v1/helpers";
import { WORKER_SCRIPT } from "/v2/utils/constants";

export async function main(ns: NS) {


    while (true) {
        const hosts = getAllAvailableServersWithRootAccess(ns);

        for (let host of hosts) {
            const workerRunningOnHome = ns.isRunning(WORKER_SCRIPT, 'home', host);

            if (workerRunningOnHome) {
                // ns.tprint(`Worker for ${host} already running`);
                continue;
            }

            // ns.tprint(`RUNNING FOR: ${host}`);
            // ns.tprint(`Starting worker for ${host}`);
            const pid = ns.exec(WORKER_SCRIPT, 'home', 1, host);


            if (!pid) {
                ns.tprint(`Failed to start worker for ${host}`);
            }
        }

        await ns.sleep(5000);
    }
}