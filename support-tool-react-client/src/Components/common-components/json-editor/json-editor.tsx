import MonacoEditor from '@monaco-editor/react';
import { makeStyles, createStyles } from '@mui/styles';
import React, { useRef, useEffect, useState } from 'react';
import { Box, CircularProgress, IconButton, Tooltip } from '@mui/material';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';

const editorStyles = makeStyles(() =>
  createStyles({
    editorContainer: {
      width: '100%',
      height: '100%',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '400px', // Set a minimum height to ensure visibility
    },
    editor: {
      flex: 1, // Make editor fill available space
      overflow: 'hidden',
      border: '1px solid rgba(0, 0, 0, 0.12)', // Add border for visibility
    },
    loaderContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      zIndex: 10,
    },
    fullscreenContainer: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1300,
      backgroundColor: '#fff',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      width: '100vw !important',
      height: '100vh !important',
    },
    fullscreenButton: {
      position: 'absolute',
      top: '0px',
      right: '0px',
      zIndex: 15,
      backgroundColor: 'rgba(255, 255, 255, 0.7)',
      '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
      },
    },
  }),
);

export const JsonEditor = (props: { 
  input: any; 
  onChange: any; 
  onEditorMount?: (editor: any) => void;
  customOptions?: any;
}) => {
  const { input, onChange, onEditorMount } = props;
  const classes = editorStyles();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<any>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [editorHeight, setEditorHeight] = useState('400px');
  const [editorWidth, setEditorWidth] = useState('100%');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullScreenHeight = 'calc(100vh - 24px) !important'; // Use !important to override any inline styles
  // Pretty-print the JSON input
  const formattedInput =
    typeof input === 'string'
      ? input
      : JSON.stringify(input, null, 2); // Format JSON with 2 spaces for indentation

  const handleEditorDidMount = (editor: any) => {
    setIsEditorReady(true);
    editorRef.current = editor;
    
    if (onEditorMount) {
      onEditorMount(editor);
    }
    
    // Format the document on initial load with a slight delay
    setTimeout(() => {
      editor?.getAction("editor.action.formatDocument")?.run();
    }, 300);
  };

  const toggleFullscreen = () => {
    const newFullscreenState = !isFullscreen;
    setIsFullscreen(newFullscreenState);
    
    // Force editor to recalculate its layout after state change
    setTimeout(() => {
      if (editorRef.current) {
        if (newFullscreenState) {
          // In fullscreen, use full viewport dimensions
          editorRef.current.layout({
            width: window.innerWidth - 32, // Account for padding
            height: window.innerHeight - 64 // Account for padding and button
          });
        } else {
          // When exiting fullscreen, use container dimensions
          const containerWidth = containerRef.current?.clientWidth || 0;
          editorRef.current.layout({
            width: containerWidth,
            height: parseInt(editorHeight)
          });
        }
      }
    }, 150); // Increased timeout to ensure DOM updates
  };

  // Handle escape key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
        // Force layout recalculation when exiting fullscreen via ESC
        setTimeout(() => {
          if (editorRef.current && containerRef.current) {
            editorRef.current.layout({
              width: containerRef.current.clientWidth,
              height: parseInt(editorHeight)
            });
          }
        }, 150);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen, editorHeight]);

  // Effect to handle fullscreen state changes and force layout
  useEffect(() => {
    if (editorRef.current) {
      setTimeout(() => {
        if (isFullscreen) {
          // Force fullscreen layout
          editorRef.current.layout({
            width: window.innerWidth - 32,
            height: window.innerHeight - 64
          });
        } else {
          // Force normal layout
          const containerWidth = containerRef.current?.clientWidth || 0;
          editorRef.current.layout({
            width: containerWidth,
            height: parseInt(editorHeight)
          });
        }
      }, 200); // Allow time for DOM to update
    }
  }, [isFullscreen]);

  // Handle window resize in fullscreen mode
  useEffect(() => {
    if (!isFullscreen) return;

    const handleFullscreenResize = () => {
      if (editorRef.current) {
        editorRef.current.layout({
          width: window.innerWidth - 32,
          height: window.innerHeight - 64
        });
      }
    };

    window.addEventListener('resize', handleFullscreenResize);
    return () => {
      window.removeEventListener('resize', handleFullscreenResize);
    };
  }, [isFullscreen]);

  // Fix for ResizeObserver loop error and ensure editor is displayed
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Set initial dimensions
    const setDimensions = () => {
      if (container.parentElement) {
        // Calculate a stable height based on parent or viewport
        const parentHeight = container.parentElement.clientHeight || window.innerHeight;
        const parentWidth = container.parentElement.clientWidth || window.innerWidth;
        const newHeight = Math.max(400, parentHeight - 40) + 'px';
        const newWidth = Math.max(300, parentWidth) + 'px';
        
        setEditorHeight(newHeight);
        setEditorWidth(newWidth);
        container.style.height = newHeight;
        container.style.width = newWidth;
        
        // Force editor layout if it exists
        if (editorRef.current && !isFullscreen) {
          editorRef.current.layout({
            width: parentWidth,
            height: parseInt(newHeight)
          });
        }
      }
    };

    // Observe size changes
    setDimensions();
    
    // Add resize listener with debouncing
    let resizeTimeout: any = null;
    const resizeHandler = () => {
      // Debounce the resize to prevent too many RecalculateObserver calls
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      
      resizeTimeout = setTimeout(() => {
        if (container && !isFullscreen) {
          setDimensions();
        }
      }, 100);
    };

    window.addEventListener('resize', resizeHandler);
    
    // Ensure the editor is visible by forcing a layout recalculation
    setTimeout(setDimensions, 100);
    
    return () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      window.removeEventListener('resize', resizeHandler);
    };
  }, [isFullscreen]);

  const editorContent = (
    <>
      {!isEditorReady && (
        <Box className={classes.loaderContainer}>
          <CircularProgress />
        </Box>
      )}
      
      <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
        <IconButton
          className={classes.fullscreenButton}
          onClick={toggleFullscreen}
          size="small"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            color: '#333',
            padding: '4px 8px',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
            },
          }}
        >
          {isFullscreen ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
          <span style={{ fontSize: '12px', fontWeight: '700' }}>
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </span>
        </IconButton>
      </Tooltip>
      
      <MonacoEditor
        height="100%"
        width="100%"
        theme="vs-dark"
        language="json"
        value={formattedInput}
        onMount={handleEditorDidMount}
        options={ props.customOptions && Object.keys(props.customOptions).length > 0 ? props.customOptions : {
          wordWrap: 'on',
          formatOnPaste: true,
          formatOnType: false,
          autoIndent: 'full',
          minimap: { enabled: false },
          tabSize: 2,
          insertSpaces: true,
          lineNumbers: 'on',
          scrollbar: {
            vertical: 'auto',
            horizontal: 'auto',
            alwaysConsumeMouseWheel: false,
          },
          folding: true,
          foldingStrategy: 'auto',
          renderLineHighlight: 'all',
          automaticLayout: false, // Disable automatic layout to prevent width issues
        }}
        onChange={(value) => {
          if (onChange && value !== undefined) {
            try {
              const parsedValue = JSON.parse(value || '{}');
              onChange(parsedValue);
            } catch (error) {
              // If not valid JSON during editing, pass the string value
              onChange(value);
            }
          }
        }}
        className={classes.editor}
      />
    </>
  );

  if (isFullscreen) {
    return (
      <Box 
        className={classes.fullscreenContainer}
        sx={{ 
          height: '100vh !important',
          width: '100vw !important',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 1300,
          backgroundColor: '#fff',
          padding: '16px',
          boxSizing: 'border-box'
        }}
      >
        {editorContent}
      </Box>
    );
  }

  return (
    <Box 
      ref={containerRef} 
      className={classes.editorContainer}
      sx={{ 
        height: editorHeight,
        width: editorWidth,
        maxWidth: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {editorContent}
    </Box>
  );
};