import { NS } from "@ns";

export async function main(ns: NS) {
    const target = ns.args[0] as string;
    const path = findPath(ns, "home", target);

    if (path) {
        ns.tprint(path.join(" > "));
    } else {
        ns.tprint(`Could not find path to ${target}`);
    }
}

function findPath(ns: NS, start: string, target: string): string[] | null {
    const visited = new Set<string>();
    const queue: string[][] = [[start]];

    while (queue.length > 0) {
        const path = queue.shift()!;
        const current = path[path.length - 1];

        if (current === target) {
            return path;
        }

        if (visited.has(current)) continue;
        visited.add(current);

        for (const neighbor of ns.scan(current)) {
            if (!visited.has(neighbor)) {
                queue.push([...path, neighbor]);
            }
        }
    }

    return null;
}
