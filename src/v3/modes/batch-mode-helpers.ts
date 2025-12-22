import { NS } from "@ns";
import { GROWTH_TARGET } from "../utils/constants";

export function isTargetPrepped(
    ns: NS,
    serverToHack: string
): { money: boolean; security: boolean } {
    const serverCurrentMoney = ns.getServerMoneyAvailable(serverToHack);
    const serverMaxMoney = ns.getServerMaxMoney(serverToHack);

    const serverCurrentSecurity = ns.getServerSecurityLevel(serverToHack);
    const serverMinSecurity = ns.getServerMinSecurityLevel(serverToHack);

    const isMoneyReady = serverCurrentMoney >= serverMaxMoney * GROWTH_TARGET;
    const isSecurityReady = serverCurrentSecurity <= serverMinSecurity + 0.05;

    // ns.tprint(`
    //   Target prep info for ${serverToHack}
    //   =======
    //   Current money = ${serverCurrentMoney}
    //   Max money: ${serverMaxMoney}

    //   Server security: ${serverCurrentSecurity}
    //   Server min security: ${serverMinSecurity}

    //   Growth target: ${GROWTH_TARGET}

    //   Is money ready: ${isMoneyReady}
    //   Is security ready: ${isSecurityReady}
    // `);

    return {
        money: isMoneyReady,
        security: isSecurityReady,
    };
}

export function getCombinedServerRam(ns: NS, allServers: string[]) {
    return allServers.reduce((prevTotalRam, server) => {
        if (ns.serverExists(server)) {
            const serverRamAvailable =
                ns.getServerMaxRam(server) - ns.getServerUsedRam(server);

            return prevTotalRam + serverRamAvailable;
        }

        return prevTotalRam;
    }, 0);
}

export function serverHasRamAvailable(ns: NS, server: string, amountOfRam: number) {
    const totalAvailableRamOfServer =
        ns.getServerMaxRam(server) - ns.getServerUsedRam(server);

    return totalAvailableRamOfServer >= amountOfRam;
}

export function getRamAvailableOnServer(ns: NS, server: string) {
    return ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
}
