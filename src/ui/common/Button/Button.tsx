import React from "../../../lib/react";
import { buttonStyles, iconButtonStyles } from "./Button.styles";

interface ButtonProps {
    children?: string;
    iconButton?: boolean;
    onClick?: () => void;
}

export const Button = ({ children, onClick, iconButton }: ButtonProps) => {
    const allButtonStyles = {
        ...buttonStyles,
        ...(iconButton ? iconButtonStyles : {}),
    };
    return (
        <button style={{ ...allButtonStyles }} onClick={onClick}>
            {children}
        </button>
    );
};
