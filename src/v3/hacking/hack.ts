import { NS } from "@ns";

export async function main(ns: NS) {
    const server = ns.args[0] as string;
    // ns.tprint(`Running hack server is set to: ${server}`);
    await ns.hack(server);
}
