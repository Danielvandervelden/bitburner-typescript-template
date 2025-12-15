import { NS } from "@ns";
import { NUKE_SCRIPT, DEPLOY_HACKED_SCRIPT, DEPLOY_PURCHASED_SCRIPT, HACKING_LOOP } from "./utils/constants.js";
import { runScriptIfNotAlreadyRunning } from "./utils/helpers.js";

export async function main(ns: NS) {
    runScriptIfNotAlreadyRunning(ns, NUKE_SCRIPT);
    runScriptIfNotAlreadyRunning(ns, DEPLOY_HACKED_SCRIPT);
    // runScriptIfNotAlreadyRunning(ns, DEPLOY_PURCHASED_SCRIPT);
    runScriptIfNotAlreadyRunning(ns, HACKING_LOOP);

}