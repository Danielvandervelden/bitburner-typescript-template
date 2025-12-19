import { NS } from "@ns";
import { NUKE_SCRIPT, DEPLOY_HACKED_SCRIPT, DEPLOY_PURCHASED_SCRIPT, HACKING_LOOP, SERVER_HACKING_LOOP, PURCHASE_SERVER, HOME_HACKING } from "./utils/constants.js";
import { runScriptIfNotAlreadyRunning } from "./utils/helpers.js";

export async function main(ns: NS) {
    runScriptIfNotAlreadyRunning(ns, NUKE_SCRIPT);
    await ns.sleep(200);
    runScriptIfNotAlreadyRunning(ns, DEPLOY_HACKED_SCRIPT);
    await ns.sleep(200);
    runScriptIfNotAlreadyRunning(ns, DEPLOY_PURCHASED_SCRIPT);
    await ns.sleep(200);
    runScriptIfNotAlreadyRunning(ns, PURCHASE_SERVER);
    await ns.sleep(200);
    runScriptIfNotAlreadyRunning(ns, HACKING_LOOP);
    await ns.sleep(200);
    runScriptIfNotAlreadyRunning(ns, SERVER_HACKING_LOOP);
    await ns.sleep(1000);
    runScriptIfNotAlreadyRunning(ns, HOME_HACKING);
}