import { NS } from "@ns";
import { getAllAvailableServersWithRootAccess } from "../../utils/helpers";
import { WORKER_SCRIPT } from "/v2/utils/constants";

export async function main(ns: NS) {
    while (true) {
        const hosts = getAllAvailableServersWithRootAccess(ns);

        const filteredHosts = hosts.filter((host) => {
            return ns.getServerMaxMoney(host) !== 0;
        })

        for (let host of filteredHosts) {
            const workerRunningOnHome = ns.isRunning(WORKER_SCRIPT, 'home', host);
            const homeRamAvailable = ns.getServerMaxRam('home') - ns.getServerUsedRam('home');

            // ns.tprint(`
            //     Worker script: ${WORKER_SCRIPT}
            //     For host: ${host}
            //     Running already on home: ${workerRunningOnHome}    
            // `)

            if (workerRunningOnHome) {
                // ns.tprint(`Worker for ${host} already running`);
                continue;
            }

            /** Do we have enough memory on home to even run another script? */
            if (ns.getScriptRam(WORKER_SCRIPT, 'home') >= homeRamAvailable) {
                // ns.tprint(`
                //     Can't start new worker script for ${host} because home doesn't have enough RAM available.    
                // `)
                continue;
            }


            // ns.tprint(`
            //     Starting ${WORKER_SCRIPT} on home for ${host}`)
            const pid = ns.exec(WORKER_SCRIPT, 'home', 1, host);


            if (!pid) {
                ns.tprint(`
                    Failed to start worker for ${host}
                    PID: ${pid}    
                `);
            }
        }

        await ns.sleep(5000);
    }
}