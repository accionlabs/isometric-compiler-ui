// @/components/ui/ModalPopup.tsx

import React from "react";
import { X } from "lucide-react";

interface ModalPopupProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  isImage?: boolean;
}

const ModalPopup: React.FC<ModalPopupProps> = ({ isOpen, onClose, content, isImage }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-4 max-w-2xl w-full shadow-lg relative">
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-2 right-2 p-2 bg-gray-200 rounded-full hover:bg-gray-300">
          <X className="w-5 h-5" />
        </button>

        {/* Modal Content */}
        {isImage ? (
          <img src={content} alt="Preview" className="w-full h-auto rounded-md" />
        ) : (
          <pre className="max-h-96 overflow-auto bg-gray-100 p-4 rounded-md text-sm text-black whitespace-pre-wrap">
            {JSON.stringify(JSON.parse(content), null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
};

export default ModalPopup;
