import MonacoEditor from '@monaco-editor/react';
import { makeStyles, createStyles } from '@mui/styles';
import React, { useRef, useEffect, useState, useMemo } from 'react';
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Pretty-print the JSON input with proper null/undefined handling
  const formattedInput = useMemo(() => {
    if (input === null || input === undefined) {
      return '{}'; // Default to empty object for null/undefined
    }
    
    if (typeof input === 'string') {
      try {
        // Validate and reformat if it's a JSON string
        const parsed = JSON.parse(input);
        const formatted = JSON.stringify(parsed, null, 2);
        return formatted;
      } catch {
        // If not valid JSON, return as-is
        return input;
      }
    }
    
    const formatted = JSON.stringify(input, null, 2);
    return formatted; // Format JSON with 2 spaces for indentation
  }, [input]);

  const handleEditorDidMount = (editor: any) => {
    setIsEditorReady(true);
    editorRef.current = editor;
    
    if (onEditorMount) {
      onEditorMount(editor);
    }
    
    // Ensure the editor has the correct initial value
    if (formattedInput !== editor.getValue()) {
      editor.setValue(formattedInput);
    }
    
    // Mark that initial input has been set
    initialInputSet.current = true;
    
    // Format the document on initial load with a slight delay
    setTimeout(() => {
      editor?.getAction("editor.action.formatDocument")?.run();
    }, 300);
  };

  // Effect to handle input changes and update editor value only on initial mount
  const initialInputSet = useRef(false);

  // Initial layout only - removed the second useEffect that was redundant

  // Effect to observe DOM changes and update editor layout only (not value)
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !editorRef.current || !isEditorReady || typeof MutationObserver === 'undefined') return;

    let debounceTimer: any = null;
    
    const observer = new MutationObserver((mutations) => {
      let shouldUpdate = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          shouldUpdate = true;
        }
      });

      if (shouldUpdate && editorRef.current) {
        // Debounce the update to avoid excessive calls
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }
        
        debounceTimer = setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.layout();
          }
        }, 150);
      }
    });

    // Observe only style changes on the container
    observer.observe(container, {
      attributes: true,
      attributeFilter: ['style']
    });

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      observer.disconnect();
    };
  }, [isEditorReady]);

  // Effect to observe visibility changes and update editor layout when it becomes visible
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !editorRef.current || !isEditorReady || typeof IntersectionObserver === 'undefined') return;

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && editorRef.current) {
            // Editor became visible, update layout only
            setTimeout(() => {
              if (editorRef.current) {
                editorRef.current.layout();
              }
            }, 100);
          }
        });
      },
      { threshold: 0.1 }
    );

    intersectionObserver.observe(container);

    return () => {
      intersectionObserver.disconnect();
    };
  }, [isEditorReady]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    
    // Force editor to recalculate its layout after state change
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.layout();
      }
    }, 200);
  };

  // Handle escape key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
        // Force layout recalculation when exiting fullscreen via ESC
        setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.layout();
          }
        }, 150);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

  // Effect to handle fullscreen state changes and force layout
  useEffect(() => {
    if (editorRef.current) {
      setTimeout(() => {
        editorRef.current.layout();
      }, 200);
    }
  }, [isFullscreen]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (editorRef.current) {
        editorRef.current.layout();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Set initial height based on parent container
  useEffect(() => {
    const container = containerRef.current;
    if (!container || isFullscreen) return;

    const setHeight = () => {
      if (container.parentElement) {
        const parentHeight = container.parentElement.clientHeight || window.innerHeight;
        const newHeight = Math.max(400, parentHeight - 40) + 'px';
        setEditorHeight(newHeight);
      }
    };

    setHeight();
    
    // Trigger layout update after height change
    const timer = setTimeout(() => {
      if (editorRef.current && !isFullscreen) {
        editorRef.current.layout();
      }
    }, 100);
    
    return () => {
      clearTimeout(timer);
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
        defaultValue={formattedInput}
        onMount={handleEditorDidMount}
        beforeMount={(monaco) => {
          // Ensure Monaco is ready before mounting
          monaco.editor.setModelLanguage(monaco.editor.createModel('', 'json'), 'json');
        }}
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
          automaticLayout: true, // Enable automatic layout to handle DOM changes
          readOnly: false,
          domReadOnly: false,
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
        width: '100%',
        maxWidth: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {editorContent}
    </Box>
  );
};