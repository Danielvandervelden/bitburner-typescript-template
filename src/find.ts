import { NS } from "@ns";

export async function main(ns: NS) {
    const targetHost = ns.args[0] || 'home';
    const hostTree = {};

    function getAttachedHosts(server: string) {
        const attachedHosts = ns.scan(server);
        
        /** Return attached hosts without home */
        return attachedHosts.filter(server => server !== 'home' && !server.startsWith('serb0r-'));
    }

    async function doLoopAndUpdateHostTree(server: string, parent: string, objectToAttachTo: Record<string, any>) {
        const children = getAttachedHosts(server).filter(server => server !== parent);
        
        for(let child of children) {
            objectToAttachTo[child] = {};
            await doLoopAndUpdateHostTree(child, server, objectToAttachTo[child]);
        }
    }

    function printHostTreeObject(object: Record<string, any>, depth = 0, prefix = '') {
        const keys = Object.keys(object);
        keys.forEach((host, index) => {
            const isLast = index === keys.length - 1;
            const branch = isLast ? '└─' : '├─';
            const connector = isLast ? '  ' : '| ';

            ns.tprint(prefix + branch + host);
            printHostTreeObject(object[host], depth + 1, prefix + connector);
        });
    }

    await doLoopAndUpdateHostTree(targetHost.toString(), '', hostTree);
    printHostTreeObject(hostTree);
}