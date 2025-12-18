import { NS } from "@ns";

export async function main(ns: NS) {

    function getAllServers(
        ns: NS,
        server = "home",
        visited = new Set<string>(),
        result: { name: string, required_hacking_level: number }[] = []
    ): { name: string, required_hacking_level: number }[] {
        if (visited.has(server)) return result;

        visited.add(server);
        result.push({ name: server, required_hacking_level: ns.getServerRequiredHackingLevel(server) });

        for (const adjacent of ns.scan(server)) {
            getAllServers(ns, adjacent, visited, result);
        }

        return result;
    }

    const allServers = getAllServers(ns)

    const filteredServers = allServers.filter((server) => !server.name.startsWith('serb0r'))

    filteredServers.sort((a, b) => {
        return a.required_hacking_level - b.required_hacking_level
    })

    ns.tprint(JSON.stringify(filteredServers, null, 2))
}