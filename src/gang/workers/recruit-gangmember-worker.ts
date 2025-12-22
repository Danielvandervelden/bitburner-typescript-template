import { NS } from "@ns";
import { createRandomIdentifier } from "/v3/utils/helpers";

export async function main(ns: NS) {
    while (true) {
        const canRecruitNewMember = ns.gang.canRecruitMember();

        if (canRecruitNewMember) {
            const randomIdentifier = createRandomIdentifier();
            const newMember = ns.gang.recruitMember(`Vinnie-${randomIdentifier}`);

            if (!newMember) {
                ns.tprint(
                    `Failed to recruit new member for whatever reason. Tried to create Vinnie-${randomIdentifier}`
                );
                continue;
            } else {
                ns.tprint(
                    `Recruited new gang member! Welcome to Vinnie-${randomIdentifier}`
                );
            }
        }

        await ns.sleep(10000);
    }
}
