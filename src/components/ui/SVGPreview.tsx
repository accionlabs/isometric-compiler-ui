import React from 'react';

interface SVGPreviewProps {
    svgContent: string;
    className?: string;
}

const SVGPreview: React.FC<SVGPreviewProps> = ({ svgContent, className = '' }) => {
    const renderSVG = () => {
        // Parse the SVG content
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
        const svgElement = svgDoc.documentElement;

        // Get the viewBox
        let viewBox = svgElement.getAttribute('viewBox');
        if (!viewBox) {
            // If viewBox is not present, create one based on width and height
            const width = svgElement.getAttribute('width') || '100';
            const height = svgElement.getAttribute('height') || '100';
            viewBox = `0 0 ${width} ${height}`;
        }

        // Create a new SVG element with our desired properties
        const newSvgContent = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
                ${svgElement.innerHTML}
            </svg>
        `;

        return newSvgContent;
    };

    return (
        <div className={`flex items-center justify-center p-1 bg-gray-700 rounded ${className}`}>
            <div 
                className="w-full h-full"
                dangerouslySetInnerHTML={{ __html: renderSVG() }} 
            />
        </div>
    );
};

export default SVGPreview;