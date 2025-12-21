import { NS } from "@ns";
import { runScriptIfNotAlreadyRunning } from "./v2/utils/helpers";

export async function main(ns: NS) {
    runScriptIfNotAlreadyRunning(ns, "v3/main.js", "home");
    // runScriptIfNotAlreadyRunning(ns, 'gang/main.js', 'home');
    // runScriptIfNotAlreadyRunning(ns, "ui/PurchasedServers/PurchasedServers.js", "home");
}
