import { NS } from '@ns';
import { DEPLOY_SCRIPT, RUN_SCRIPT, NUKE_SCRIPT, HACK_SCRIPT, VERSION } from './v1-constants.js';
import { scriptWithVersion } from './helpers.js';

/** @param {NS} ns */
export async function main(ns: NS) {
  while (true) {
    const nukeScriptName = scriptWithVersion(NUKE_SCRIPT);
    const deployScript = scriptWithVersion(DEPLOY_SCRIPT);
    const runScript = scriptWithVersion(RUN_SCRIPT);

    ns.exec(nukeScriptName, 'home', 1);
    ns.exec(deployScript, 'home', 1);
    ns.exec(runScript, 'home', 1);

    // /** Run the v2 weaken script on 95% of home */
    /** const maxRam = ns.getServerMaxRam('home');
    const unusedRam = ns.getServerUsedRam('home');
    const availableRam = maxRam - unusedRam;
    const hackScriptRamCost = ns.getScriptRam(HACK_SCRIPT, 'home');
    const threadsAvailable = Math.floor((availableRam / hackScriptRamCost) * .95);

    if(threadsAvailable >= 3 && !ns.isRunning(HACK_SCRIPT, 'home')) {
      ns.tprint(`Running ${HACK_SCRIPT} on home with ${threadsAvailable} threads`);
      ns.exec(HACK_SCRIPT, 'home', threadsAvailable);
    }
**/
    await ns.sleep(10000);
  }
}
