import { CSSProperties } from "react";

export const scoreGridStyles: CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
};

export const serverScoreTile: CSSProperties = {
    boxSizing: "border-box",
    flexBasis: "calc((100% - 8px) / 2)",
    padding: "8px",
    border: "1px solid #FFF",
};

export const summaryStyles: CSSProperties = {
    cursor: "pointer",
    margin: "8px 0",
};

export const metaStyles: CSSProperties = {
    fontSize: "12px",
    color: "#888",
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
};

export const meta: CSSProperties = {
    flexBasis: "calc((100% - 8px) / 2)",
};

export const serverTitle: CSSProperties = {
    marginBottom: "8px",
};
