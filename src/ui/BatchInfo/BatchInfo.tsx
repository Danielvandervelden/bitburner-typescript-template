import { NS } from "@ns";
import React from "/lib/react.js";
import { createReactElement, ElementProps } from "../utils/createReactElement.js";
import { Modal } from "../common/Modal/Modal.js";
import { MostProfitableSection } from "./MostProfitableSection/MostProfitableSection.js";
import { BatchInformationSection } from "./BatchInformationSection/BatchInformationSection.js";

export async function main(ns: NS) {
    await createReactElement(ns, BatchInfoModal, "batch-info-modal");
}

function BatchInfoModal({ ns, onClose }: ElementProps) {
    return (
        <Modal id="batch-modal" ns={ns} onClose={onClose} title="Batch information modal">
            <MostProfitableSection ns={ns} />
            <BatchInformationSection ns={ns} />
        </Modal>
    );
}
