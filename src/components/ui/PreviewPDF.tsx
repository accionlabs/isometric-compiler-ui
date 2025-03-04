import React, { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

// Configure PDF.js worker from CDN
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.338/pdf.worker.min.js`;

interface PDFModalViewerProps {
    presignedUrl: string;
    isOpen: boolean;
    onClose: () => void;
}

const PDFModalViewer: React.FC<PDFModalViewerProps> = ({
    presignedUrl,
    isOpen,
    onClose
}) => {
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);

    // Close modal on Escape key
    useEffect(() => {
        const handleEscapeKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("keydown", handleEscapeKey);
            return () => {
                document.removeEventListener("keydown", handleEscapeKey);
            };
        }
    }, [isOpen, onClose]);

    // Handle document load success
    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        setPageNumber(1);
        setLoading(false);
        setError(false);
    };

    // Handle document load error
    const onDocumentLoadError = (error: Error) => {
        console.error("PDF load error:", error);
        setLoading(false);
        setError(true);
    };

    // Page navigation functions
    const changePage = (offset: number) => {
        setPageNumber((prevPage) =>
            Math.max(1, Math.min(prevPage + offset, numPages))
        );
    };

    // If modal is not open, return null
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
            <div className="relative w-full max-w-4xl h-[90vh] bg-white rounded-lg shadow-xl flex flex-col">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-60 text-gray-600 hover:text-gray-900"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500"></div>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="flex items-center justify-center h-full text-red-500">
                        Failed to load document. Please try again.
                    </div>
                )}

                {/* PDF Viewer */}
                {!error && (
                    <div className="flex-grow overflow-auto flex flex-col">
                        <div className="flex-grow overflow-auto flex justify-center p-4">
                            <Document
                                file={presignedUrl}
                                onLoadSuccess={onDocumentLoadSuccess}
                                onLoadError={onDocumentLoadError}
                                className="shadow-lg"
                            >
                                <Page
                                    pageNumber={pageNumber}
                                    width={Math.min(
                                        window.innerWidth * 0.8,
                                        800
                                    )}
                                    renderTextLayer={true}
                                    renderAnnotationLayer={true}
                                />
                            </Document>
                        </div>

                        {/* Navigation Controls */}
                        <div className="flex justify-between items-center p-4 bg-gray-100 rounded-b-lg">
                            <button
                                onClick={() => changePage(-1)}
                                disabled={pageNumber <= 1}
                                className="p-2 rounded bg-blue-500 text-white disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <span className="text-gray-700">
                                Page {pageNumber} of {numPages}
                            </span>
                            <button
                                onClick={() => changePage(1)}
                                disabled={pageNumber >= numPages}
                                className="p-2 rounded bg-blue-500 text-white disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PDFModalViewer;
