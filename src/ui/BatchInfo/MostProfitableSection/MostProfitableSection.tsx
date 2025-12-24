import { NS } from "@ns";
import {
    meta,
    metaStyles,
    scoreGridStyles,
    serverScoreTile,
    serverTitle,
    summaryStyles,
} from "./MostProfitableSection.styles";
import React from "/lib/react";
import { BestServer, getMostProfitableServersToHack } from "/v3/utils/helpers";

interface MostProfitableSectionProps {
    ns: NS;
}

const formatScore = (score: number) => {
    return Math.floor(score);
};

export const MostProfitableSection = ({ ns }: MostProfitableSectionProps) => {
    const [currentMostProfitableServers, setCurrentMostProfitableServers] =
        React.useState<BestServer[]>(getMostProfitableServersToHack(ns, "batch"));

    const refreshCurrentMostProfitableServers = () => {
        const refreshedMostProfitableServers = getMostProfitableServersToHack(
            ns,
            "batch"
        );

        setCurrentMostProfitableServers(refreshedMostProfitableServers);
    };

    React.useEffect(() => {
        const interval = setInterval(() => {
            refreshCurrentMostProfitableServers();
        }, 1000);

        return () => clearInterval(interval);
    }, []);
    
    return (
        <details>
            <summary style={summaryStyles}>Show top 6 most profitable servers</summary>
            <div style={scoreGridStyles}>
                {currentMostProfitableServers.slice(0, 6).map((server, index) => {
                    return (
                        <div style={serverScoreTile}>
                            <div>
                                <div style={serverTitle}>
                                    {index + 1}: {server.hostName} (
                                    {formatScore(server.bestScore)})
                                </div>
                                <div style={metaStyles}>
                                    <div style={meta}>
                                        Max $:{" "}
                                        {Number(server.maxMoney / 1000000).toFixed(2)} mil
                                    </div>
                                    <div style={meta}>
                                        Current $:{" "}
                                        {Number(server.currentMoney / 1000000).toFixed(2)}{" "}
                                        mil
                                    </div>
                                    <div style={meta}>
                                        Cycle time:{" "}
                                        {Math.floor(server.cycleTimeInSeconds)}
                                    </div>
                                    <div style={meta}>
                                        Weaken threads: {server.weakenThreadsNeeded}
                                    </div>
                                    <div style={meta}>
                                        Money p/c:{" "}
                                        {Number(
                                            server.expectedMoneyPerCycle / 1000000
                                        ).toFixed(2)}{" "}
                                        mil
                                    </div>
                                    <div style={meta}>
                                        Grow threads: {server.growThreads}
                                    </div>
                                    <div style={meta}>
                                        Hack chance: {server.hackChance.toFixed(2)}
                                    </div>
                                    <div style={meta}>
                                        Hack threads: {server.hackThreads}
                                    </div>
                                    <div style={meta}>
                                        RAM cost p/c: {server.ramCostPerCycle.toFixed(2)}
                                    </div>
                                    <div style={meta}>
                                        Hack sec inc: {server.securityIncrease.toFixed(3)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </details>
    );
};
