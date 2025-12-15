import { NS } from "@ns";
import { getAllPurchasedServers } from "/v2/utils/helpers";

export async function main(ns: NS) {
    const hosts = getAllPurchasedServers(ns);
    const files = ns.ls('home', 'v2/scripts/hacking/bits');

    for (let file of files) {
        const splitFileName = file.split('/');
        const flatFileName = splitFileName[splitFileName.length - 1];
        const content = ns.read(file);
        await ns.write(flatFileName, content, 'w');

        for (let host of hosts) {
            const successfullyCopiedFile = ns.scp(flatFileName, host);

            if (!successfullyCopiedFile) {
                ns.tprint(`Couldn't successfuly copy ${flatFileName} to ${host}`);
            }
        }

        ns.rm(flatFileName);
    }
}