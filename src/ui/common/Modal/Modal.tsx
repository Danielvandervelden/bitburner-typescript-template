import { NS } from "@ns";
import React from "../../../lib/react";
import { Button } from "../Button/Button.js";
import {
  modalActionsWrapper,
    modalContentStyles,
    modalHeaderStyles,
    modalWrapperStyles,
} from "./Modal.styles.js";

interface ModalProps {
    ns: NS;
    id: string;
    children?: React.ReactNode;
    title: string;
    onClose: () => void;
}

export function Modal({ ns, children, id, title, onClose }: ModalProps) {
    const [top, setTop] = React.useState(0);
    const [left, setLeft] = React.useState(0);
    const [isDragging, setIsDragging] = React.useState(false);
    const [minimized, setMinimized] = React.useState(false);

    const handleOnMouseDown = () => {
        setIsDragging(true);
    };

    const handleOnMouseUp = () => {
        setIsDragging(false);
    };

    const handleOnMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            setTop((prev) => prev + e.movementY);
            setLeft((prev) => prev + e.movementX);
        }
    };

    const handleOnMouseOut = () => setIsDragging(false);

    const handleMinimize = () => {
        setMinimized(!minimized);
    };

    return (
        <div
            id={id}
            style={{
                ...modalWrapperStyles,
                top: `${top}px`,
                left: `${left}px`,
                ...(isDragging ? { cursor: "grab" } : {}),
            }}>
            <header
                style={modalHeaderStyles}
                onMouseDown={handleOnMouseDown}
                onMouseUp={handleOnMouseUp}
                onMouseMove={handleOnMouseMove}
                onMouseOut={handleOnMouseOut}>
                <div style={{ pointerEvents: "none" }}>{title}</div>
                <div style={modalActionsWrapper}>
                    <Button iconButton onClick={handleMinimize}>
                        {minimized ? "+" : "-"}
                    </Button>
                    <Button iconButton onClick={onClose}>
                        X
                    </Button>
                </div>
            </header>
            <div
                style={{
                    ...modalContentStyles,
                    ...(minimized ? { display: "none" } : { display: "block" }),
                }}>
                {children}
            </div>
        </div>
    );
}
