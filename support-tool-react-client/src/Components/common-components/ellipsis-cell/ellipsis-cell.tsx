import * as React from "react";
import { useEffect, useState, useRef } from "react";
import { Tooltip } from "@mui/material";

interface EllipsisCellProps {
  text: string | null | undefined;
  maxWidth?: number;
  maxLines?: number;  // New prop to control number of lines
  lineHeight?: number; // Line height in pixels
}

export const EllipsisCell: React.FC<EllipsisCellProps> = ({ 
  text, 
  maxWidth = 250, 
  maxLines = 1,
  lineHeight = 20
}) => {
    // Create a ref to check if content is overflowing
    const cellRef = useRef<HTMLDivElement>(null);
    const [isOverflowing, setIsOverflowing] = useState(false);
  
    // Check if content is overflowing on mount and window resize
    useEffect(() => {
      const checkOverflow = () => {
        if (cellRef.current) {
          if (maxLines === 1) {
            // For single line, check width overflow
            const isTextOverflowing = cellRef.current.scrollWidth > cellRef.current.clientWidth;
            setIsOverflowing(isTextOverflowing);
          } else {
            // For multiple lines, check height overflow
            const maxHeight = lineHeight * maxLines;
            const isTextOverflowing = cellRef.current.scrollHeight > maxHeight;
            setIsOverflowing(isTextOverflowing);
          }
        }
      };
  
      // Check initially
      checkOverflow();
  
      // Check on window resize
      window.addEventListener('resize', checkOverflow);
      
      return () => {
        window.removeEventListener('resize', checkOverflow);
      };
    }, [text, maxLines, lineHeight]);
  
    // Set the style based on maxLines
    const cellStyle: React.CSSProperties = {
      maxWidth: maxWidth,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      lineHeight: `${lineHeight}px`,
    };
    
    // Apply different styles based on maxLines
    if (maxLines === 1) {
      cellStyle.whiteSpace = 'nowrap';
    } else {
      cellStyle.display = '-webkit-box';
      cellStyle.WebkitLineClamp = maxLines;
      cellStyle.WebkitBoxOrient = 'vertical';
      cellStyle.wordBreak = 'break-word';
      cellStyle.maxHeight = `${maxLines * lineHeight}px`;
    }

    return (
      <Tooltip 
        title={isOverflowing ? text || "" : ""} 
        arrow 
        placement="top"
      >
        <div ref={cellRef} style={cellStyle}>
          {text || ""}
        </div>
      </Tooltip>
    );
  };