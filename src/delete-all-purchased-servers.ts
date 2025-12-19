import { NS } from "@ns";

export async function main(ns: NS) {
    const certain = ns.prompt(
        "Are you sure you want to remove all the purchased servers?"
    );

    const currentServers = ns.getPurchasedServers();

    for (let i = 0; i < currentServers.length; ++i) {
        const serv = currentServers[i];
        ns.killall(serv);
        ns.deleteServer(serv);
    }
}
