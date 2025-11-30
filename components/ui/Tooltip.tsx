"use client";

import { ReactNode, useState } from "react";

interface TooltipProps {
    children: ReactNode;
    content: string;
    position?: "left" | "right" | "top" | "bottom";
}

export default function Tooltip({ children, content, position = "left" }: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);

    const positionClasses = {
        left: "right-full mr-2 top-1/2 -translate-y-1/2",
        right: "left-full ml-2 top-1/2 -translate-y-1/2",
        top: "bottom-full mb-2 left-1/2 -translate-x-1/2",
        bottom: "top-full mt-2 left-1/2 -translate-x-1/2",
    };

    const arrowClasses = {
        left: "left-full top-1/2 -translate-y-1/2 border-l-gray-900 border-l-4 border-y-transparent border-y-4 border-r-0",
        right: "right-full top-1/2 -translate-y-1/2 border-r-gray-900 border-r-4 border-y-transparent border-y-4 border-l-0",
        top: "top-full left-1/2 -translate-x-1/2 border-t-gray-900 border-t-4 border-x-transparent border-x-4 border-b-0",
        bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 border-b-4 border-x-transparent border-x-4 border-t-0",
    };

    return (
        <div
            className="relative inline-block"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {isVisible && (
                <div
                    className={`absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded shadow-lg whitespace-nowrap pointer-events-none ${positionClasses[position]}`}
                >
                    {content}
                    <div
                        className={`absolute w-0 h-0 ${arrowClasses[position]}`}
                    />
                </div>
            )}
        </div>
    );
}



