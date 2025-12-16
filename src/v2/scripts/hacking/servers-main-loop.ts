import { NS } from "@ns";
import { getAllAvailableServersWithRootAccessMinusHackingLevel, getAllPurchasedServers } from "/v2/utils/helpers";
import { SERVER_WORKER_SCRIPT } from "/v2/utils/constants";

interface SpawnedServerWorker {
    target: string;
    count: number;
}

export async function main(ns: NS) {

    const hackedServers = getAllAvailableServersWithRootAccessMinusHackingLevel(ns);

    const sortedHackedServersByHighestMaxMoney = hackedServers.filter((server) => {
        return ns.getServerMaxMoney(server) !== 0;
    }).sort((a, b) => {
        const maxMoneyServerA = ns.getServerMaxMoney(a);
        const maxMoneyServerB = ns.getServerMaxMoney(b);

        // ns.tprint(`Server A: ${a} -> ${maxMoneyServerA}`)
        // ns.tprint(`Server B: ${b} -> ${maxMoneyServerB}`)

        return maxMoneyServerB - maxMoneyServerA;
    })

    // ns.tprint(hackedServers);
    // ns.tprint(sortedHackedServersByHighestMaxMoney);

    const spawnedServerWorkers: SpawnedServerWorker[] = sortedHackedServersByHighestMaxMoney.map((server) => ({
        target: server,
        count: 0
    }))

    while (true) {
        const hosts = getAllPurchasedServers(ns);


        for (let host of hosts) {

            const serverToHack = spawnedServerWorkers.reduce((previousServerWorker, currentServerWorker) => {
                if (previousServerWorker.count === Infinity) {
                    return currentServerWorker;
                }

                if (currentServerWorker.count < previousServerWorker.count) {
                    return currentServerWorker;
                }

                return previousServerWorker
            }, { target: '', count: Infinity } as SpawnedServerWorker);

            const workerRunningOnHome = (() => {
                return hackedServers.some((hackedServer) => ns.isRunning(SERVER_WORKER_SCRIPT, 'home', host, hackedServer))
            })();

            if (workerRunningOnHome) {
                // ns.tprint(`Server worker for ${host} to hack ${serverToHack.target} already running`);
                continue;
            }

            const serverWorker = spawnedServerWorkers.find((serverWorker) => serverToHack.target === serverWorker.target)

            if (!serverWorker) {
                ns.tprint(`Something bad happened, couldn't find server worker: ${serverToHack}`);
                return;
            }

            serverWorker.count++

            // ns.tprint(`Starting server worker for ${host} hacking: ${serverToHack.target}`);
            const pid = ns.exec(SERVER_WORKER_SCRIPT, 'home', 1, host, serverToHack.target);


            if (!pid) {
                ns.tprint(`Something went wrong, could spawn server worker for ${host}`)
            }
        }

        // ns.tprintRaw(`
        //     Spawned server worker status:
        //         ${JSON.stringify(spawnedServerWorkers, null, 2)}    

        //     Created server worker for server:
        //         ${createdWorkerForServer}
        // `)

        await ns.sleep(5000);
    }
}