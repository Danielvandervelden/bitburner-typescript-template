import { CSSProperties } from "react";

export const modalWrapperStyles: CSSProperties = {
    border: "1px solid rgb(0, 204, 0)",
    color: "#F2f2f2",
    width: "800px",
    position: "fixed",
    zIndex: "9999",
    top: "0",
    left: "0",
    backgroundColor: "#000",
    fontFamily:
        '"Lucida Console", "Lucida Sans Unicode", "Fira Mono", Consolas, "Courier New", Courier, monospace, "Times New Roman"',
};

export const modalHeaderStyles: CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px",
    borderBottom: "1px solid rgb(0, 204, 0)",
};

export const modalContentStyles: CSSProperties = {
    boxSizing: "border-box",
    maxHeight: "600px",
    overflow: "auto",
    padding: "8px",
};

export const modalActionsWrapper: CSSProperties = {
    display: "flex",
    gap: "8px",
};
