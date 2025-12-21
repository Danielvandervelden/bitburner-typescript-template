import { NS } from "@ns";

export function isTargetPrepped(
    ns: NS,
    serverToHack: string
): { money: boolean; security: boolean } {
    const serverCurrentMoney = ns.getServerMoneyAvailable(serverToHack);
    const serverMaxMoney = ns.getServerMaxMoney(serverToHack);

    const serverCurrentSecurity = ns.getServerSecurityLevel(serverToHack);
    const serverMinSecurity = ns.getServerMinSecurityLevel(serverToHack);

    const isMoneyReady = serverCurrentMoney === serverMaxMoney;
    const isSecurityRead = serverCurrentSecurity === serverMinSecurity;

    return {
        money: isMoneyReady,
        security: isSecurityRead,
    };
}
