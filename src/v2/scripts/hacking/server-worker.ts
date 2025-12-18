import { NS } from "@ns";
import { copyNestedFilesToRootOfHost, determineWorkerExecution, getWorkerInfo } from "/v2/utils/helpers";
import { GROW_SCRIPT_NAME, HACK_SCRIPT_NAME, WEAKEN_SCRIPT_NAME } from "/v2/utils/constants";

export async function main(ns: NS) {
    const host = ns.args[0] as string;
    const serverToHack = ns.args[1] as string;

    if (!ns.serverExists(host)) {
        ns.tprint(`Tried to run scripts on ${host}, but it seems it was already removed.`)
        return;
    }

    while (true) {
        const { growthThreshold, maxThreadsAllScripts, securityThreshold } = getWorkerInfo(ns, host, serverToHack)

        if (maxThreadsAllScripts === 0) {
            const usedRamPercent = ns.getServerUsedRam(host) / ns.getServerMaxRam(host) * 100;

            if (usedRamPercent > 50) {
                await ns.sleep(5000);
                continue;
            }
            ns.tprint(`Threads were 0 for ${host} to hack ${serverToHack} continuing on... (should probably return?)`);
            return;
        }

        if (maxThreadsAllScripts === Infinity) {
            ns.tprint(`Thread is Infinity -> host: ${host}, serverToHack: ${serverToHack}`);
            ns.tprint(`Copying weaken, grow, hack script to ${host} because we think that's the issue`);

            copyNestedFilesToRootOfHost(ns, 'home', '/v2/scripts/hacking/bits', [host])
            continue;
        }

        if (!ns.fileExists(WEAKEN_SCRIPT_NAME, host) || !ns.fileExists(GROW_SCRIPT_NAME, host) || !ns.fileExists(HACK_SCRIPT_NAME, host)) {
            ns.tprint(`Copying weaken, grow, hack script to ${host} because it seems they don't exist there yet`);
            copyNestedFilesToRootOfHost(ns, 'home', '/v2/scripts/hacking/bits', [host])
            continue;
        }

        await determineWorkerExecution(ns, {
            host,
            serverToHack,
            growthThreshold,
            maxThreadsAllScripts,
            securityThreshold
        });
        await ns.sleep(150);
        continue;
    }
}