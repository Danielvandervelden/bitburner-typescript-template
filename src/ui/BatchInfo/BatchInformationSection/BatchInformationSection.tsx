import React from "/lib/react";
import { NS } from "@ns";
import { getBatchableServers } from "/v3/modes/batch-mode-helpers";

interface BatchInformationSectionProps {
    ns: NS;
}

const fileNamesToLookFor = ["grow.js", "hack.js", "weaken.js"];

export const BatchInformationSection = ({ ns }: BatchInformationSectionProps) => {
    const { allServers } = getBatchableServers(ns);
    const [uniqueBatchIds, setUniqueBatchIds] = React.useState<string[]>([]);

    const getUniqueBatches = () => {
        const uniqueBatches = allServers.reduce((prevArray, server) => {
            const allProcessesOnServer = ns
                .ps(server)
                .filter(
                    (process) =>
                        fileNamesToLookFor.includes(process.filename) &&
                        process.args.length === 4
                );

            for (const process of allProcessesOnServer) {
                const batchId = process.args?.[3] as string;

                if (!batchId) {
                    continue;
                }

                if (!prevArray.includes(batchId)) {
                    return [...prevArray, batchId];
                }
            }

            return prevArray;
        }, [] as string[]);

        setUniqueBatchIds(uniqueBatches);
    };

    React.useEffect(() => {
        const interval = setInterval(() => {
            getUniqueBatches();
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return <div>Total unique batches currently running: {uniqueBatchIds.length}</div>;
};
