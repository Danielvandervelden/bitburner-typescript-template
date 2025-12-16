import { NS } from "@ns";
import { copyNestedFilesToRootOfHost, determineWorkerExecution, getWorkerInfo } from "/v2/utils/helpers";

export async function main(ns: NS) {
    const host = ns.args[0] as string;
    const serverToHack = ns.args[1] as string;

    if (!ns.serverExists(host)) {
        ns.tprint(`Tried to run scripts on ${host}, but it seems it was already removed.`)
        return;
    }

    const { growthThreshold, maxThreadsAllScripts, securityThreshold } = getWorkerInfo(ns, host, serverToHack)

    if (maxThreadsAllScripts === Infinity) {
        ns.tprint(`Thread is Infinity -> host: ${host}, serverToHack: ${serverToHack}`);
        ns.tprint(`Copying weaken, grow, hack script to ${host} because we think that's the issue`);

        copyNestedFilesToRootOfHost(ns, 'home', '/v2/scripts/hacking/bits', [host])
        return;
    }

    while (true) {
        await determineWorkerExecution(ns, {
            host,
            serverToHack,
            growthThreshold,
            maxThreadsAllScripts,
            securityThreshold
        });
        return;
    }
}