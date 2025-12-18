import { NS } from "@ns";
import { GANG_MEMBER_WORKER } from "../constants";

export async function main(ns: NS) {
    while (true) {
        const allGangMembers = ns.gang.getMemberNames();

        // ns.tprint(`
        //     All gang members: ${JSON.stringify(allGangMembers)}   
        // `)

        for (let member of allGangMembers) {
            const workerRunningOnHome = ns.isRunning(GANG_MEMBER_WORKER, 'home', member);

            // ns.tprint(`
            //     Worker already running on home: ${workerRunningOnHome}   
            //     Script name ${GANG_MEMBER_WORKER}
            //     For member: ${member}
            // `)

            if (workerRunningOnHome) {
                continue;
            }

            // ns.tprint(`RUNNING FOR: ${host}`);
            // ns.tprint(`Starting worker for ${host}`);
            const pid = ns.exec(GANG_MEMBER_WORKER, 'home', 1, member);

            if (!pid) {
                ns.tprint(`Failed to start worker for ${member}`);
            }

            await ns.sleep(2000);
        }

        await ns.sleep(10000);
    }
}