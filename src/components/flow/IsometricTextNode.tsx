import React, { useEffect, useRef, useState } from 'react';
import { Node, Handle, Position, NodeProps } from '@xyflow/react';
import type { CSSProperties } from 'react';

type Attachment = 'front-left' | 'front-right' | 'back-left' | 'back-right';
type Orientation = 'top-left' | 'top-right' | 'front-left' | 'front-right';
type VerticalAlign = 'top' | 'bottom';

const AttachmentMap: Record<Attachment, {
    orientation: Orientation;
    align: VerticalAlign;
    translateDirection: number;  // -1 for left translation, 1 for right translation
}> = {
    "front-left": {
        orientation: "top-right",
        align: "top",
        translateDirection: -1  // Translate right
    },
    "front-right": {
        orientation: "top-left",
        align: "top",
        translateDirection: -1  // Translate left
    },
    "back-left": {
        orientation: "top-left",
        align: "bottom",
        translateDirection: 2.5  // Translate lower
    },
    "back-right": {
        orientation: "top-right",
        align: "bottom",
        translateDirection: 2.5  // Translate left
    }
};

export interface IsometricTextNodeData extends Record<string, unknown> {
    text: string;
    attachment: Attachment;
    width: number;
    padding?: number;
    lineSpacing?: number;
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: 'normal' | 'bold';
    fontStyle?: 'normal' | 'italic';
    color?: string;
    scale?:number;
    isInteractive: boolean;
}

type IsometricTextNodeType = Node<IsometricTextNodeData>;

interface Transform {
    rotation: number;
    skewY: number;
    origin: string;
}

class TextMeasurer {
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;

    constructor() {
        this.canvas = document.createElement('canvas');
        const ctx = this.canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');
        this.context = ctx;
    }

    setFont(fontString: string) {
        this.context.font = fontString;
    }

    measureText(text: string): number {
        return this.context.measureText(text).width;
    }

    splitTextIntoLines(text: string, maxWidth: number): string[] {
        const manualLines = text.split('\n');
        const resultLines: string[] = [];

        manualLines.forEach(manualLine => {
            const words = manualLine.split(' ');
            let currentLine = '';

            words.forEach(word => {
                const testLine = currentLine ? `${currentLine} ${word}` : word;
                const testWidth = this.measureText(testLine);

                if (testWidth <= maxWidth) {
                    currentLine = testLine;
                } else {
                    if (currentLine) {
                        resultLines.push(currentLine);
                    }
                    if (this.measureText(word) > maxWidth) {
                        const hyphenatedLines = this.hyphenateWord(word, maxWidth);
                        resultLines.push(...hyphenatedLines);
                        currentLine = '';
                    } else {
                        currentLine = word;
                    }
                }
            });

            if (currentLine) {
                resultLines.push(currentLine);
            }
        });

        return resultLines;
    }

    private hyphenateWord(word: string, maxWidth: number): string[] {
        const lines: string[] = [];
        let remainingWord = word;

        while (this.measureText(remainingWord) > maxWidth) {
            let breakPoint = Math.floor((maxWidth / this.measureText(remainingWord)) * remainingWord.length);
            breakPoint = Math.min(breakPoint, remainingWord.length - 2);
            
            const firstPart = remainingWord.slice(0, breakPoint) + '-';
            if (this.measureText(firstPart) <= maxWidth) {
                lines.push(firstPart);
                remainingWord = remainingWord.slice(breakPoint);
            } else {
                breakPoint--;
                lines.push(remainingWord.slice(0, breakPoint) + '-');
                remainingWord = remainingWord.slice(breakPoint);
            }
        }
        
        if (remainingWord) {
            lines.push(remainingWord);
        }

        return lines;
    }
}

const getTransformValues = (orientation: Orientation): Transform => {
    switch (orientation) {
        case 'top-left':
            return { rotation: -60, skewY: 30, origin: 'center' };
        case 'top-right':
            return { rotation: 60, skewY: -30, origin: 'center' };
        case 'front-left':
            return { rotation: 0, skewY: 30, origin: 'center' };
        case 'front-right':
            return { rotation: 0, skewY: -30, origin: 'center' };
    }
};

const IsometricTextNode: React.FC<NodeProps<IsometricTextNodeType>> = ({
    data,
    id,
    isConnectable = true
}) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [lines, setLines] = useState<string[]>([]);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [maxLineWidth, setMaxLineWidth] = useState(0);
    
    const {
        text,
        attachment,
        width: targetWidth,
        padding = 8,
        lineSpacing = 1.2,
        fontFamily = 'sans-serif',
        fontSize = 21,
        fontWeight = 'bold',
        fontStyle = 'bold',
        color = '#000000',
        isInteractive
    } = data;
    const scaledFontSize = (data.scale && data.scale!=0) ?fontSize*data.scale : fontSize;

    const { orientation, align, translateDirection } = AttachmentMap[attachment];
    const transform = getTransformValues(orientation);

    useEffect(() => {
        const measurer = new TextMeasurer();
        const fontString = `${fontStyle} ${fontWeight} ${scaledFontSize}px ${fontFamily}`;
        measurer.setFont(fontString);
        
        // Split text and measure the width of each line
        const wrappedLines = measurer.splitTextIntoLines(text, targetWidth);
        setLines(wrappedLines);

        // Find the maximum line width
        let maxWidth = 0;
        wrappedLines.forEach(line => {
            const width = measurer.measureText(line);
            maxWidth = Math.max(maxWidth, width);
        });
        setMaxLineWidth(maxWidth);

        // Calculate total height
        const totalHeight = wrappedLines.length * fontSize * lineSpacing;
        setDimensions({ width: maxWidth, height: totalHeight });
    }, [text, targetWidth, fontSize, fontFamily, fontStyle, fontWeight, lineSpacing]);

    // Calculate translation based on text width
    const getTransformString = () => {
        const translateY = padding * translateDirection;
        const rotateSkew = `rotate(${transform.rotation}deg) skewY(${transform.skewY}deg)`;
        const translation = `translate(${0}px, ${translateY}px)`;
        return `${translation} ${rotateSkew}`;
    };

    const getYOffset = () => {
        if (align === 'top') {
            return 0;
        } else {
            return -dimensions.height;
        }
    };

    const handleStyle: CSSProperties = {
        width: '4px',
        height: '4px',
        background: '#4F46E5',
        border: '1px solid white',
        borderRadius: '50%',
        opacity: isInteractive ? 0.5 : 0.25,
        transition: 'opacity 0.2s',
        position: 'absolute',
        transform: 'translate(-50%, -50%)',
    };

    return (
        <div className={`relative ${!isInteractive ? 'opacity-75' : ''}`}>
            <svg ref={svgRef} style={{ overflow: 'visible' }}>
                <g style={{
                    transformOrigin: transform.origin,
                    transform: getTransformString(),
                    transformBox: 'fill-box',
                }}>
                    {lines.map((line, index) => (
                        <text
                            key={index}
                            style={{
                                fontFamily,
                                fontSize: `${scaledFontSize}px`,
                                fontWeight,
                                fontStyle,
                                fill: color,
                                userSelect: 'none',
                            }}
                            x="0"
                            y={getYOffset() + (index * fontSize * lineSpacing)}
                            textAnchor="middle"
                            dominantBaseline="hanging"
                        >
                            {line}
                        </text>
                    ))}
                </g>
            </svg>

            <Handle
                type="source"
                position={Position.Right}
                id={`isometric-${id}-handle`}
                style={{
                    ...handleStyle,
                    left: 0,
                    top: 0,
                }}
                isConnectable={isConnectable && isInteractive}
            />
        </div>
    );
};

export default React.memo(IsometricTextNode);