import { NS } from "@ns";

export async function main(ns: NS) {
    const server = ns.getHostname();
    await ns.grow(server)
}