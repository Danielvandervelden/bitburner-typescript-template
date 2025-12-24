import { NS } from "@ns";
import React, { ReactDOM } from "../../lib/react.js";

export interface ElementProps {
    ns: NS;
    onClose: () => void;
}

export const createReactElement = async (
    ns: NS,
    ElementToRender: React.ComponentType<ElementProps>,
    windowId: string
) => {
    ns.disableLog("ALL");

    const doc = eval("document") as Document;
    const hostWindow = doc.createElement("div");

    hostWindow.id = windowId;

    hostWindow.style.display = "flex";
    hostWindow.style.height = "100%";

    doc.body.querySelector("#root")?.appendChild(hostWindow);

    const cleanup = () => {
        try {
            ReactDOM.unmountComponentAtNode(hostWindow);
        } catch {
            // ignore
        }
        try {
            hostWindow.remove();
        } catch {
            // ignore
        }
    };

    ns.atExit(cleanup);

    await new Promise<void>((resolve) => {
        const onClose = () => {
            cleanup();
            resolve();
        };
        ReactDOM.render(<ElementToRender ns={ns} onClose={onClose} />, hostWindow);
    });
};
