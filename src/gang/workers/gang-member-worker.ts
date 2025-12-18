import { NS } from "@ns";
import { JOBS } from "../constants";

const jobNumbers = {
    [JOBS.RANSOMWARE]: {
        wanted_gain: 0.0001,
        hack_multiplier: 1.0,
        charisma_multiplier: 0.0,
    },
    [JOBS.PHISHING]: {
        wanted_gain: 0.003,
        hack_multiplier: 0.85,
        charisma_multiplier: 0.15,
    },
    [JOBS.IDENTITY_THEFT]: {
        wanted_gain: 0.075,
        hack_multiplier: 0.8,
        charisma_multiplier: 0.2,
    },
    [JOBS.DDOS_ATTACK]: {
        wanted_gain: 0.2,
        hack_multiplier: 1.0,
        charisma_multiplier: 0.0,
    },
    [JOBS.FRAUD_AND_COUNTERFEITING]: {
        wanted_gain: 0.3,
        hack_multiplier: 0.8,
        charisma_multiplier: 0.2,
    },
    [JOBS.PLANT_VIRUS]: {
        wanted_gain: 0.4,
        hack_multiplier: 1.0,
        charisma_multiplier: 0.0,
    },
    [JOBS.MONEY_LAUNDERING]: {
        wanted_gain: 1.25,
        hack_multiplier: 0.75,
        charisma_multiplier: 0.25,
    },
    [JOBS.CYBER_TERRORISM]: {
        wanted_gain: 6,
        hack_multiplier: 0.8,
        charisma_multiplier: 0.2,
    },
    [JOBS.ETHICAL_HACKING]: {
        wanted_gain: -0.001,
        hack_multiplier: 0.9,
        charisma_multiplier: 0.1,
    },
}

const ascensionMultiplier = 1.5;
const targetLevelPercentage = 0.95;
const charismaMinPercentage = 0.15;
const charismaMaxPercentage = 0.20;
let charismaTrainingCooldownActive = false;
const hackingJob = JOBS.PLANT_VIRUS;
const forceRatio = false;
const forceTrain = undefined;

const EQUIPMENT_TYPES = ["Rootkit", "Vehicle"];
const SPECIFIC_ITEMS = ["Neuralstimulator", "DataJack", "BitWire"]
const PREVIOUS_LEVELS_FILE = "/data/gang-member-previous-levels.txt";

export async function main(ns: NS) {
    const member = ns.args[0] as string;
    const equipmentWeWant = ns.gang.getEquipmentNames().filter((equipmentName) => {
        return EQUIPMENT_TYPES.includes(ns.gang.getEquipmentType(equipmentName)) || SPECIFIC_ITEMS.includes(equipmentName);
    })

    if (!member) {
        ns.tprint(`ERROR: didn't get a member in the first arg: ${ns.args[0]}`);
        return;
    }

    while (true) {
        const gangInfo = ns.gang.getGangInformation();
        const wantedGain = gangInfo.wantedLevelGainRate;

        const memberInfo = ns.gang.getMemberInformation(member);
        const memberEquipment = [...memberInfo.upgrades, ...memberInfo.augmentations];
        const equipmentCostMultiplierBasedOnCurrentOwnMoney = 5;

        /** Buying equipment for gang members */
        for (let item of equipmentWeWant) {
            if (!memberEquipment.includes(item) && ns.gang.getEquipmentCost(item) * equipmentCostMultiplierBasedOnCurrentOwnMoney < ns.getServerMoneyAvailable('home')) {
                ns.tprint(`Going to try to buy ${item} for ${member}...`);
                const result = ns.gang.purchaseEquipment(member, item);

                if (!result) {
                    ns.tprint(`Failed to purchase ${item} for ${member}...`)
                }
            }
        }

        /** Ascension  */
        const ascensionResult = ns.gang.getAscensionResult(member);

        if (ascensionResult && (ascensionResult.hack >= ascensionMultiplier || ascensionResult.cha >= ascensionMultiplier)) {
            // Store previous level before ascending
            const previousLevels = readPreviousLevels(ns);
            previousLevels[member] = memberInfo.hack;
            writePreviousLevels(ns, previousLevels);

            const result = ns.gang.ascendMember(member);

            if (!result) {
                ns.tprint(`
                    ERROR: could not ascend ${member} for some reason
                    
                    Current hacking multiplier: ${memberInfo.hack_mult}
                    Ascension factor: ${ascensionResult.hack}
                `)
            }
        }

        /** Assignment of jobs */

        if (forceTrain !== undefined) {
            if (memberInfo.task !== forceTrain) {
                ns.gang.setMemberTask(member, forceTrain);
            }
            return;
        }

        if (forceRatio) {
            /** Force charisma to be around 20% of hacking */
            const charismaRatio = memberInfo.cha / memberInfo.hack
            if (charismaRatio < charismaMaxPercentage && !charismaTrainingCooldownActive) {
                if (memberInfo.task !== JOBS.TRAIN_CHARISMA) {
                    ns.gang.setMemberTask(member, JOBS.TRAIN_CHARISMA);
                }
                await ns.sleep(2001);
                return;
            } else if (charismaRatio >= charismaMaxPercentage && !charismaTrainingCooldownActive) {
                charismaTrainingCooldownActive = true;
            } else if (charismaRatio <= charismaMinPercentage && charismaTrainingCooldownActive) {
                charismaTrainingCooldownActive = false;
                ns.gang.setMemberTask(member, JOBS.TRAIN_CHARISMA)
                await ns.sleep(2000);
                return;
            }
        }

        // Check if we need to train to reach previous level
        const previousLevels = readPreviousLevels(ns);
        const previousHackLevel = previousLevels[member];

        if (previousHackLevel && memberInfo.hack < previousHackLevel * targetLevelPercentage) {
            if (memberInfo.task !== JOBS.TRAIN_HACKING) {
                ns.gang.setMemberTask(member, JOBS.TRAIN_HACKING);
            }
            return;
        }

        /** If we have a new gangmember... */
        if (memberInfo.task === JOBS.UNASSIGNED) {
            const result = ns.gang.setMemberTask(member, JOBS.TRAIN_HACKING);

            if (!result) {
                ns.tprint(`ERROR: Couldn't assign ${member} to task: ${JOBS.TRAIN_HACKING}`);
            }
            return;
        }

        /** If the hacking level of the current member is less than 50, assign to train hacking for now. */
        if (memberInfo.hack <= 50 && memberInfo.task !== JOBS.TRAIN_HACKING) {
            const result = ns.gang.setMemberTask(member, JOBS.TRAIN_HACKING);

            if (!result) {
                ns.tprint(`ERROR: Couldn't assign ${member} to task: ${JOBS.TRAIN_HACKING}`);
            }
            return;
        }

        /** Assign phishing or ethical hacking based on wanted gain. */
        if (memberInfo.hack > 50 && (memberInfo.task !== hackingJob || memberInfo.task !== JOBS.ETHICAL_HACKING) || wantedGain > 0) {
            /** Time to assign a different job */
            const hackingJobIncrease = jobNumbers[hackingJob].wanted_gain * jobNumbers[hackingJob].hack_multiplier * memberInfo.hack + jobNumbers[hackingJob].wanted_gain * jobNumbers[hackingJob].charisma_multiplier * memberInfo.hack;
            if ((wantedGain < 0 && Math.abs(wantedGain) < hackingJobIncrease) || memberInfo.task !== hackingJob) {
                const result = ns.gang.setMemberTask(member, hackingJob);

                if (!result) {
                    ns.tprint(`ERROR: Couldn't assign ${member} to task: ${JOBS.ETHICAL_HACKING}`);
                }
            } else if (wantedGain > 0) {
                const result = ns.gang.setMemberTask(member, JOBS.ETHICAL_HACKING);

                if (!result) {
                    ns.tprint(`ERROR: Couldn't assign ${member} to task: ${JOBS.ETHICAL_HACKING}`);
                }
            }
            return;
        }
    }
}

function readPreviousLevels(ns: NS): Record<string, number> {
    try {
        const content = ns.read(PREVIOUS_LEVELS_FILE);
        return JSON.parse(content);
    } catch {
        return {};
    }
}

function writePreviousLevels(ns: NS, levels: Record<string, number>): void {
    ns.write(PREVIOUS_LEVELS_FILE, JSON.stringify(levels), "w");
}