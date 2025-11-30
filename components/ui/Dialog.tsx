"use client";

import { ReactNode, useEffect } from "react";
import { X, AlertTriangle, CheckCircle2, Info, AlertCircle } from "lucide-react";

export type DialogType = "confirm" | "alert" | "success" | "error" | "info";

interface DialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm?: () => void;
    title: string;
    message: string | ReactNode;
    type?: DialogType;
    confirmText?: string;
    cancelText?: string;
    confirmButtonColor?: string;
    showCancel?: boolean;
}

export default function Dialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    type = "confirm",
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    confirmButtonColor = "bg-blue-600 hover:bg-blue-700",
    showCancel = true,
}: DialogProps) {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            document.body.style.overflow = "hidden";
        }

        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "unset";
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (type === "confirm" && onConfirm) {
            onConfirm();
        }
        onClose();
    };

    const getIcon = () => {
        const iconClass = "w-6 h-6";
        switch (type) {
            case "confirm":
                return <AlertTriangle className={`${iconClass} text-yellow-500`} />;
            case "success":
                return <CheckCircle2 className={`${iconClass} text-green-500`} />;
            case "error":
                return <AlertCircle className={`${iconClass} text-red-500`} />;
            case "info":
                return <Info className={`${iconClass} text-blue-500`} />;
            default:
                return <AlertTriangle className={`${iconClass} text-yellow-500`} />;
        }
    };

    const getDefaultButtonColor = () => {
        switch (type) {
            case "success":
                return "bg-green-600 hover:bg-green-700";
            case "error":
                return "bg-red-600 hover:bg-red-700";
            case "info":
                return "bg-blue-600 hover:bg-blue-700";
            default:
                return confirmButtonColor;
        }
    };

    const shouldShowCancel = type === "confirm" ? showCancel : false;

    return (
        <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 text-gray-900 animate-fadeIn"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md animate-slideUp"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0 mt-0.5">
                        {getIcon()}
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold mb-2">{title}</h2>
                        <div className="text-gray-600">
                            {typeof message === "string" ? (
                                <p className="whitespace-pre-wrap">{message}</p>
                            ) : (
                                message
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                        aria-label="Fechar"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                    {shouldShowCancel && (
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        onClick={handleConfirm}
                        className={`px-4 py-2 text-white rounded-md transition-colors ${getDefaultButtonColor()}`}
                    >
                        {type === "confirm" ? confirmText : "OK"}
                    </button>
                </div>
            </div>
        </div>
    );
}

