import * as React from "react";
import { useEffect, useState, useRef } from "react";
import { Tooltip } from "@mui/material";

interface EllipsisCellProps {
  text: string | null | undefined;
  maxWidth: number;
}

export const EllipsisCell: React.FC<EllipsisCellProps> = ({ text, maxWidth }) => {
    // Create a ref to check if content is overflowing
    const cellRef = useRef<HTMLDivElement>(null);
    const [isOverflowing, setIsOverflowing] = useState(false);
  
    // Check if content is overflowing on mount and window resize
    useEffect(() => {
      const checkOverflow = () => {
        if (cellRef.current) {
          const isTextOverflowing = cellRef.current.scrollWidth > cellRef.current.clientWidth;
          setIsOverflowing(isTextOverflowing);
        }
      };
  
      // Check initially
      checkOverflow();
  
      // Check on window resize
      window.addEventListener('resize', checkOverflow);
      
      return () => {
        window.removeEventListener('resize', checkOverflow);
      };
    }, [text]);
  
    return (
      <Tooltip title={isOverflowing ? text : ""} arrow placement="top">
        <div 
          ref={cellRef}
          style={{ 
            maxWidth: maxWidth,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {text}
        </div>
      </Tooltip>
    );
  };