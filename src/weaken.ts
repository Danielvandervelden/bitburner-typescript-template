import { NS } from "@ns";

export async function main(ns: NS) {
    const server = ns.args[0] as string;
    const delay = ns.args[1] as number;

    await ns.sleep(delay);
    await ns.weaken(server);
}
