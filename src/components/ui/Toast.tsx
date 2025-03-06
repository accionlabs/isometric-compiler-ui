import { useState, useEffect, FC, ReactNode } from "react";
 
// Define types for component props
type ToastPosition =
    | "top-left"
    | "top-right"
    | "top-center"
    | "bottom-left"
    | "bottom-right"
    | "bottom-center";
export type ToastType = "info" | "success" | "error";
 
interface ToastProps {
    message?: string;
    type?: ToastType;
    duration?: number | null; // null will represent infinite duration
    position?: ToastPosition;
    onClose?: () => void;
    visible?: boolean;
}
 
interface ToastTypeStyle {
    bg: string;
    icon: ReactNode;
}
 
const Toast: FC<ToastProps> = ({
    message = "This is a notification",
    type = "info",
    duration = 3000, // Default duration, null means infinite
    position = "bottom-right",
    onClose = () => {},
    visible = true
}) => {
    const [isVisible, setIsVisible] = useState<boolean>(visible);
    const [isLeaving, setIsLeaving] = useState<boolean>(false);
 
    // Handle auto-dismiss only if duration is not null
    useEffect(() => {
        if (visible && duration !== null) {
            const timer = setTimeout(() => {
                handleClose();
            }, duration);
 
            return () => clearTimeout(timer);
        }
    }, [visible, duration]);
 
    // Set visibility based on prop changes
    useEffect(() => {
        if (visible) {
            setIsVisible(true);
            setIsLeaving(false);
        }
    }, [visible]);
 
    const handleClose = (): void => {
        setIsLeaving(true);
        setTimeout(() => {
            setIsVisible(false);
            onClose();
        }, 300); // Match the exit animation duration
    };
 
    // Don't render if not visible
    if (!isVisible) return null;
 
    // Toast position classes
    const positionClasses: Record<ToastPosition, string> = {
        "top-left": "top-4 left-4",
        "top-right": "top-4 right-4",
        "top-center": "top-4 left-1/2 -translate-x-1/2",
        "bottom-left": "bottom-4 left-4",
        "bottom-right": "bottom-4 right-4",
        "bottom-center": "bottom-4 left-1/2 -translate-x-1/2"
    };
 
    // Toast type styles
    const typeStyles: Record<ToastType, ToastTypeStyle> = {
        info: {
            bg: "bg-blue-500",
            icon: (
                <svg
                    className="w-5 h-5 text-white"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                    />
                </svg>
            )
        },
        success: {
            bg: "bg-green-500",
            icon: (
                <svg
                    className="w-5 h-5 text-white"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                    />
                </svg>
            )
        },
        error: {
            bg: "bg-red-500",
            icon: (
                <svg
                    className="w-5 h-5 text-white"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                    />
                </svg>
            )
        }
    };
 
    return (
        <div
            className={`fixed ${
                positionClasses[position]
            } z-50 flex items-center max-w-xs
        transform transition-all duration-300 ease-in-out
        ${isLeaving ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}
        >
            <div
                className={`flex items-center p-4 rounded-lg shadow-lg ${typeStyles[type].bg} text-white`}
            >
                <div className="mr-3">{typeStyles[type].icon}</div>
                <div className="flex-1 mr-2">{message}</div>
                <button
                    onClick={handleClose}
                    className="text-white hover:text-gray-200 focus:outline-none"
                >
                    <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            </div>
        </div>
    );
};
 
export default Toast;