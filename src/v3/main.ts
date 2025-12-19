import { NS } from "@ns";
import { runScriptIfNotAlreadyRunning } from "./utils/helpers";
import { CONTROLLER } from "./utils/constants";

export async function main(ns: NS) {
    runScriptIfNotAlreadyRunning(ns, CONTROLLER, "home");
}
