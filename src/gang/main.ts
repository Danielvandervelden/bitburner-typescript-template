import { NS } from "@ns";
import { runScriptIfNotAlreadyRunning } from "/v3/utils/helpers";
import { ASSIGN_JOBS_LOOP, RECRUIT_GANGMEMBER_WORKER } from "./constants";

export async function main(ns: NS) {
    runScriptIfNotAlreadyRunning(ns, RECRUIT_GANGMEMBER_WORKER);
    runScriptIfNotAlreadyRunning(ns, ASSIGN_JOBS_LOOP);
}
