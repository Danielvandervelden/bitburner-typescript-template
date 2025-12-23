import { NS } from "@ns";
import React from "../../../../lib/react.js";
import { ReactNode } from "react";

interface ModalProps {
    ns: NS;
    id: string;
    children?: ReactNode;
}

export function Modal({ ns, children, id }: ModalProps) {
    console.log(ns);
    return <div id={id}>{children}</div>;
}
