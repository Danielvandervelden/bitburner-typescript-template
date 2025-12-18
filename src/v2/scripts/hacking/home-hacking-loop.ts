import { NS } from "@ns";
import { determineWorkerExecution, getAllAvailableServersWithRootAccessMinusHackingLevel, getWorkerInfo } from "/v2/utils/helpers";
import { GROW_SCRIPT, HACK_SCRIPT, WEAKEN_SCRIPT } from "/v2/utils/constants";

export async function main(ns: NS) {
    const maxHomeRAM = ns.getServerMaxRam('home');
    const usedHomeRAM = ns.getServerUsedRam('home');
    const availableRAM = (maxHomeRAM - usedHomeRAM) * 0.7;

    // ns.tprint(`Available RAM on home: ${availableRAM}GB`);

    while (true) {
        const hackedServers = getAllAvailableServersWithRootAccessMinusHackingLevel(ns);
        const serverToHack = hackedServers[0];
        const { growthThreshold, maxThreadsAllScripts, securityThreshold } = getWorkerInfo(ns, 'home', serverToHack, availableRAM);

        // ns.tprint(`
        //     Server we're gonna hack from home: ${serverToHack}
        //     Amount of threads we use: ${maxThreadsAllScripts}    
        // `);

        await determineWorkerExecution(ns, {
            host: 'home',
            serverToHack: hackedServers[0],
            growthThreshold,
            maxThreadsAllScripts,
            securityThreshold,
            customGrowScriptPath: GROW_SCRIPT,
            customHackScriptPath: HACK_SCRIPT,
            customWeakenScriptPath: WEAKEN_SCRIPT
        })
        await ns.sleep(150);
    }
}