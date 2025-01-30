import React, { useState } from "react";
import { X } from "lucide-react";

interface ModalProps {
    onClose: () => void;
    children: React.ReactNode; // Allow any UI component
}

const Modal: React.FC<ModalProps> = ({ onClose, children }) => {
    // Center modal initially
    const [position, setPosition] = useState({
        x: window.innerWidth / 2 - 150, // Center horizontally
        y: window.innerHeight / 2 - 150, // Center vertically
    });

    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });

    // Handle drag start
    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        setIsDragging(true);
        setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    // Handle dragging movement
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (!isDragging) return;
        setPosition({ x: e.clientX - startPos.x, y: e.clientY - startPos.y });
    };

    // Handle drag end
    const handleMouseUp = () => {
        setIsDragging(false);
    };

    return (
        <div
            className="fixed z-50 cursor-move"
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                position: "absolute",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
        >
            <div className="relative inline-block bg-white p-4 rounded-lg shadow-lg border border-black">
                {/* Close Button */}
                <button
                    className="absolute -top-3 -right-3 bg-white rounded-full p-1 shadow-md"
                    onClick={onClose}
                >
                    <X className="w-5 h-5 text-black" />
                </button>

                {/* Render Dynamic Content */}
                <div className="p-2">{children}</div>
            </div>
        </div>
    );
};

export default Modal;
