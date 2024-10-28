// lib/svgUtils.ts

export const calculateBoundingBox = (svgElement: SVGSVGElement): { x: number, y: number, width: number, height: number } | null => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    svgElement.querySelectorAll(':scope > g').forEach((element) => {
        if (element instanceof SVGGraphicsElement) {
            const bbox = element.getBBox();
            const { x: translateX, y: translateY } = extractTranslation(element.getAttribute('transform'));

            minX = Math.min(minX, bbox.x + translateX);
            minY = Math.min(minY, bbox.y + translateY);
            maxX = Math.max(maxX, bbox.x + bbox.width + translateX);
            maxY = Math.max(maxY, bbox.y + bbox.height + translateY);
        }
    });

    if (minX !== Infinity && minY !== Infinity && maxX !== -Infinity && maxY !== -Infinity) {
        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }

    return null;
};

// Calculate bounding box from SVG string by temporarily rendering it
export const calculateSVGBoundingBox = (svgString: string): { x: number, y: number, width: number, height: number } | null => {
    try {
        // Create an invisible container
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.visibility = 'hidden';
        container.style.pointerEvents = 'none';
        document.body.appendChild(container);

        // Parse and append the SVG
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgString, 'image/svg+xml');
        
        // Get the SVG element and verify it's the correct type
        const svgElement = doc.querySelector('svg');
        if (!(svgElement instanceof SVGSVGElement)) {
            throw new Error('Invalid SVG string - could not get SVGSVGElement');
        }

        // Append to container
        container.appendChild(svgElement);

        // Calculate bounding box
        const boundingBox = calculateBoundingBox(svgElement);

        // Clean up
        document.body.removeChild(container);

        return boundingBox;

    } catch (error) {
        console.error('Error calculating SVG bounding box:', error);
        return null;
    }
};

export const cleanupSVG = (svgString: string): string => {
    // Remove sodipodi and inkscape elements
    svgString = svgString.replace(/<sodipodi:.*?>.*?<\/sodipodi:.*?>/g, '');
    svgString = svgString.replace(/<inkscape:.*?>.*?<\/inkscape:.*?>/g, '');

    // Remove sodipodi and inkscape attributes
    svgString = svgString.replace(/\s(sodipodi|inkscape):[^\s/>]+(?:="[^"]*")?\s?/g, ' ');

    // Remove empty defs element
    svgString = svgString.replace(/<defs.*?>.*?<\/defs>/g, '');

    // Remove unused namespace declarations
    svgString = svgString.replace(/\s+xmlns:(sodipodi|inkscape)="[^"]*"/g, '');

    //console.log(`Cleaned Up SVG:\n${svgString}`);

    return svgString;
};

export const extractTranslation = (transform: string | null): { x: number, y: number } => {
    if (!transform) return { x: 0, y: 0 };
    const match = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
    if (match) {
        return { x: parseFloat(match[1]), y: parseFloat(match[2]) };
    }
    return { x: 0, y: 0 };
};

export const clipSVGToContents = (
    svgContent: string, 
    boundingBox: { x: number, y: number, width: number, height: number } | null
): string => {
    if (!boundingBox) {
        console.warn('No bounding box available for clipping');
        return svgContent;
    }

    // Clean up the SVG string first
   let svgCleaned = cleanupSVG(svgContent);

    const parser = new DOMParser();
    const doc = parser.parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${svgCleaned}</svg>`, 'image/svg+xml');
    const svg = doc.documentElement;

    // Find minimum translation values
    let minTranslateX = Infinity;
    let minTranslateY = Infinity;
    svg.querySelectorAll(':scope > g').forEach(g => {
        const { x, y } = extractTranslation(g.getAttribute('transform'));
        minTranslateX = Math.min(minTranslateX, x);
        minTranslateY = Math.min(minTranslateY, y);
    });

    // Adjust all translations
    svg.querySelectorAll(':scope > g').forEach(g => {
        const { x, y } = extractTranslation(g.getAttribute('transform'));
        g.setAttribute('transform', `translate(${x - minTranslateX}, ${y - minTranslateY})`);
    });

    // Use the bounding box provided
    const { width, height } = boundingBox;

    // Add some padding
    const padding = 10;
    const newX = boundingBox.x-minTranslateX-padding;
    const newY = boundingBox.y-minTranslateY-padding;
    const newWidth = boundingBox.width + 2 * padding;
    const newHeight = boundingBox.height + 2 * padding;

    // Set new viewBox
    svg.setAttribute('viewBox', `${newX} ${newY} ${newWidth} ${newHeight}`);

    // Remove width and height attributes to make it scalable
    svg.removeAttribute('width');
    svg.removeAttribute('height');

    // Set a reasonable width and height
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');

    const resultSvg = new XMLSerializer().serializeToString(svg);

    return resultSvg;
};

export const toggleAttachmentPoints = (svgElement: SVGElement, show: boolean): SVGElement => {

    // Select all circles with ids starting with "attach-"
    const attachmentPoints = svgElement.querySelectorAll('circle[id^="attach-"]');

    attachmentPoints.forEach((point) => {
        if (show) {
            point.removeAttribute('display');
        } else {
            point.setAttribute('display', 'none');
        }
    });

    return svgElement;
};


