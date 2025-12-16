import { NS } from "@ns";
import { determineWorkerExecution, getWorkerInfo } from "/v2/utils/helpers";

export async function main(ns: NS) {
    const host = ns.args[0] as string;

    const { growthThreshold, maxThreadsAllScripts, securityThreshold } = getWorkerInfo(ns, host);

    if (maxThreadsAllScripts === 0) {
        // ns.tprint(`${host} has ${maxThreadsAllScripts} available, not running anything here.`)
        return;
    }

    while (true) {
        await determineWorkerExecution(ns, {
            host,
            serverToHack: host,
            growthThreshold,
            maxThreadsAllScripts,
            securityThreshold
        });
        return;
    }
}