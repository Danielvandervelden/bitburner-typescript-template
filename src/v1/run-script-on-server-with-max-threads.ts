import { NS } from "@ns";
import { getMaximumAvailableThreads } from "./helpers.js";

export async function main(ns: NS) {
    const server = ns.args[0].toString();
    const scriptName = ns.args[1].toString();

    if(!ns.args[0] || !ns.args[1]) {
        ns.tprint("Please provide the correct arguments. First argument: server name, second argument: script name.");
    }

    const maxAvailableThreads = getMaximumAvailableThreads(ns, server, scriptName);

    ns.exec(scriptName, server, maxAvailableThreads);
};