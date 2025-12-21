import { NS } from "@ns";
import { runScriptIfNotAlreadyRunning } from "./utils/helpers";
import { CONTROLLER, NUKE_LOOP, PURCHASE_SERVERS } from "./utils/constants";

export async function main(ns: NS) {
    runScriptIfNotAlreadyRunning(ns, NUKE_LOOP, "home");
    runScriptIfNotAlreadyRunning(ns, CONTROLLER, "home");
    // runScriptIfNotAlreadyRunning(ns, PURCHASE_SERVERS, "home");
}
