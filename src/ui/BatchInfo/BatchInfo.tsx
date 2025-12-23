import { NS } from "@ns";
import React from "../../lib/react.js";
import { createReactElement, ElementProps } from "../utils/createReactElement.js";
import { Modal } from "./common/Modal/Modal.js";

export async function main(ns: NS) {
    await createReactElement(ns, BatchInfoModal, "batch-info-modal");
}

function BatchInfoModal({ ns, onClose }: ElementProps) {
    return (
        <Modal id="batch-modal" ns={ns}>
            <div style={{ background: "red", color: "white" }}>
                This is a test, hello!
            </div>
        </Modal>
    );
}
