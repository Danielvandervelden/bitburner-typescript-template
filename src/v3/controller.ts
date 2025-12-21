import { NS } from "@ns";
import { BATCH_MODE, HACK_MODE, LOOP_MODE } from "./utils/constants";

export async function main(ns: NS) {
    if (HACK_MODE === "loop") {
        const result = ns.run(LOOP_MODE);

        if (!result) {
            ns.tprint(`Failed to run LOOP mode`);
        }
        return;
    } else if (HACK_MODE === "batch") {
        ns.tprint(`Trying to start batch mode`);
        const result = ns.run(BATCH_MODE);

        if (!result) {
            ns.tprint(`Failed to run BATCH mode`);
        }
        return;
    }

    ns.tprint(`Unknown hack mode argument received: ${HACK_MODE}`);
}
