import { NS } from "@ns";
import { GROW_SCRIPT, GROW_SCRIPT_NAME, HACK_SCRIPT, HACK_SCRIPT_NAME, WEAKEN_SCRIPT, WEAKEN_SCRIPT_NAME } from "/v2/utils/constants";

export async function main(ns: NS) {
    const host = ns.args[0] as string;

    const growthThreshold = 1.5;
    const securityThreshold = 10;

    const hackScriptRam = ns.getScriptRam(HACK_SCRIPT);
    const weakenScriptRam = ns.getScriptRam(WEAKEN_SCRIPT);
    const growScriptRam = ns.getScriptRam(GROW_SCRIPT);

    while (true) {
        const totalHostMemory = ns.getServerMaxRam(host);

        const maxThreadsAllScripts = Math.floor(totalHostMemory / Math.max(hackScriptRam, weakenScriptRam, growScriptRam));

        if (maxThreadsAllScripts === 0) {
            ns.tprint(`${host} has ${maxThreadsAllScripts} available, not running anything here.`)
            return;
        }
        // Everything for growth
        const maximumMoney = ns.getServerMaxMoney(host);
        const currentMoney = ns.getServerMoneyAvailable(host);
        const growthTime = ns.getGrowTime(host);


        // Weaken
        const currentSecurity = ns.getServerSecurityLevel(host);
        const weakenTime = ns.getWeakenTime(host);

        const hackingTime = ns.getHackTime(host);

        // ns.tprintRaw(`
        //     Max RAM: ${totalHostMemory}

        //     Growth info for ${host}:
        //     - Max money: ${maximumMoney}
        //     - Current money available: ${currentMoney}
        //     - Growth time: ${growthTime} 
        //     - Growth analyze: ${growthAnalyze}   

        //     Weaken info for ${host}:
        //     - currentSecurity: ${currentSecurity}
        //     - minSecurity: ${minSecurity}
        //     - weakenTime: ${weakenTime}

        //     Hacking info for ${host}:
        //     - Hacking time: ${hackingTime}
        // `)

        const growth = maximumMoney / currentMoney;

        if (currentSecurity >= securityThreshold) {
            ns.tprint(`Executing weaken on ${host} with ${maxThreadsAllScripts} threads, will take ${weakenTime / 1000} seconds`);
            ns.exec(WEAKEN_SCRIPT_NAME, host, maxThreadsAllScripts);
            await ns.sleep(weakenTime);
            continue;
        }

        if (growth > growthThreshold) {
            ns.tprint(`Executing grow on ${host} with ${maxThreadsAllScripts} threads, will take ${growthTime / 1000} seconds`);
            ns.exec(GROW_SCRIPT_NAME, host, maxThreadsAllScripts);
            await ns.sleep(growthTime);
            continue;
        }

        ns.tprint(`Executing hack on ${host} with ${maxThreadsAllScripts} threads, will take ${hackingTime / 1000} seconds`);
        ns.exec(HACK_SCRIPT_NAME, host, maxThreadsAllScripts);
        await ns.sleep(hackingTime);
    }
}