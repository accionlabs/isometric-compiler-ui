import { useEffect, useState, useRef } from "react";
import { BrainCircuit } from "lucide-react";

interface ProgressPopupProps {
    isOpen: boolean;
    onClose: () => void;
    messages: Array<{ time: number; message: string }>;
    duration?: number;
}

const ProgressPopup = ({
    isOpen,
    onClose,
    messages,
    duration = 10
}: ProgressPopupProps) => {
    const [secondsPassed, setSecondsPassed] = useState(0);
    const [durationCompleted, setDurationCompleted] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout>();
    const timeoutRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
        if (!isOpen) {
            setSecondsPassed(0);
            setDurationCompleted(false);
            return;
        }

        // Start the timer
        intervalRef.current = setInterval(() => {
            setSecondsPassed((prev) => {
                // Only increment until we reach the duration
                if (prev < duration) {
                    return prev + 1;
                }
                return prev;
            });
        }, 1000);

        // Mark duration as completed after specified time
        timeoutRef.current = setTimeout(() => {
            setDurationCompleted(true);
            // Clear the interval since we don't need to update secondsPassed anymore
            clearInterval(intervalRef.current);
        }, duration * 1000);

        return () => {
            clearInterval(intervalRef.current);
            clearTimeout(timeoutRef.current);
        };
    }, [isOpen, duration]);

    const getCurrentMessage = () => {
        const sortedMessages = [...messages].sort((a, b) => a.time - b.time);
        let currentMessage = sortedMessages[0]?.message || "Processing...";

        // If duration is completed, show the last message
        if (durationCompleted) {
            return (
                sortedMessages[sortedMessages.length - 1]?.message ||
                currentMessage
            );
        }

        // Otherwise show the appropriate message for the current time
        for (const message of sortedMessages) {
            if (secondsPassed >= message.time) {
                currentMessage = message.message;
            }
        }

        return currentMessage;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl flex justify-center items-center gap-4">
                {/* Animated Icon */}
                <BrainCircuit
                    className="animate-pulse text-blue-500"
                    size={40}
                />

                {/* Message */}
                <p className="text-gray-600 text-lg font-medium">
                    {getCurrentMessage()}
                </p>
            </div>
        </div>
    );
};

export default ProgressPopup;
