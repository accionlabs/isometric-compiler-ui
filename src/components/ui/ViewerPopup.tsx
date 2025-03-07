// @/components/ui/ModelPopup.tsx

import React from "react";
import { X } from "lucide-react";

interface ViewerPopupProps {
  isOpen: boolean;
  onClose: () => void;
  content: React.ReactNode
}

const ViewerPopup: React.FC<ViewerPopupProps> = ({ isOpen, onClose, content }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-4 w-[700px] h-[500px] shadow-lg relative flex flex-col">
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-2 right-2 p-2 bg-gray-200 rounded-full hover:bg-gray-300">
          <X className="w-5 h-5" />
        </button>

        {/* Model Content */}
        {/* {content} */}
        <div className="flex-grow overflow-auto p-2 border rounded bg-gray-100 text-black max-h-[450px]">
          {content}
        </div>
      </div>
    </div>
  );
};

export default ViewerPopup;
