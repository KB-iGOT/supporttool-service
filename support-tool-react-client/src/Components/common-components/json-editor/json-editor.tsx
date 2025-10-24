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
  const [editorWidth, setEditorWidth] = useState('100%');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullScreenHeight = 'calc(100vh - 24px) !important'; // Use !important to override any inline styles
  
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
    
    // Format the document on initial load with a slight delay
    setTimeout(() => {
      editor?.getAction("editor.action.formatDocument")?.run();
    }, 300);
  };

  // Effect to handle input changes and update editor value
  useEffect(() => {
    if (editorRef.current && isEditorReady) {
      const currentValue = editorRef.current.getValue();
      if (currentValue !== formattedInput) {
        // Force editor to update its value
        editorRef.current.setValue(formattedInput);
        
        // Trigger layout update to ensure editor is visible
        setTimeout(() => {
          editorRef.current?.layout();
          editorRef.current?.getAction("editor.action.formatDocument")?.run();
        }, 100);
        
        // Additional layout update after formatting
        setTimeout(() => {
          editorRef.current?.layout();
        }, 400);
      }
    }
  }, [formattedInput, isEditorReady]);

  // Effect to handle DOM changes and ensure editor visibility
  useEffect(() => {
    if (editorRef.current && isEditorReady && formattedInput) {
      // Force layout recalculation when input becomes available
      const forceUpdate = () => {
        if (editorRef.current) {
          editorRef.current.layout();
          // Double-check the value is set
          const currentValue = editorRef.current.getValue();
          if (!currentValue || currentValue.trim() === '' || currentValue === '{}') {
            editorRef.current.setValue(formattedInput);
            setTimeout(() => {
              editorRef.current?.getAction("editor.action.formatDocument")?.run();
            }, 100);
          }
        }
      };

      // Immediate update
      forceUpdate();
      
      // Delayed update to handle DOM changes
      const timeouts = [
        setTimeout(forceUpdate, 200),
        setTimeout(forceUpdate, 500),
        setTimeout(forceUpdate, 1000)
      ];

      return () => {
        timeouts.forEach(timeout => clearTimeout(timeout));
      };
    }
  }, [formattedInput, isEditorReady, input]); // Include input to trigger on data changes

  // Effect to observe DOM changes and update editor accordingly
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !editorRef.current || !isEditorReady || typeof MutationObserver === 'undefined') return;

    const observer = new MutationObserver((mutations) => {
      let shouldUpdate = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' || mutation.type === 'childList') {
          shouldUpdate = true;
        }
      });

      if (shouldUpdate && editorRef.current) {
        // Debounce the update to avoid excessive calls
        setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.layout();
            
            // Ensure the value is still correct after DOM changes
            const currentValue = editorRef.current.getValue();
            if (currentValue !== formattedInput) {
              editorRef.current.setValue(formattedInput);
            }
          }
        }, 100);
      }
    });

    // Observe the container and its subtree
    observer.observe(container, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['style', 'class']
    });

    return () => {
      observer.disconnect();
    };
  }, [isEditorReady, formattedInput]);

  // Effect to observe visibility changes and update editor when it becomes visible
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !editorRef.current || !isEditorReady || typeof IntersectionObserver === 'undefined') return;

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && editorRef.current) {
            // Editor became visible, force update
            setTimeout(() => {
              if (editorRef.current) {
                editorRef.current.layout();
                
                // Ensure the value is set when editor becomes visible
                const currentValue = editorRef.current.getValue();
                if (currentValue !== formattedInput) {
                  editorRef.current.setValue(formattedInput);
                  setTimeout(() => {
                    editorRef.current?.getAction("editor.action.formatDocument")?.run();
                  }, 100);
                }
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
  }, [isEditorReady, formattedInput]);

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
        key={`editor-${typeof input}-${input === null ? 'null' : typeof input === 'object' ? Object.keys(input || {}).length : 'primitive'}`} // Force re-render on input type changes
        height="100%"
        width="100%"
        theme="vs-dark"
        language="json"
        value={formattedInput}
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