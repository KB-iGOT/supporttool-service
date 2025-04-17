import MonacoEditor from '@monaco-editor/react';
import { makeStyles, createStyles } from '@mui/styles';
import React from 'react';

const editorStyles = makeStyles(() =>
  createStyles({
    editor: {
      width: '100%',
      height: 'calc(100vh - 150px)',
    },
  }),
);

export const Editor = (props: { input: any; onChange: any }) => {
  const { input, onChange } = props;
  const classes = editorStyles();

  // Pretty-print the JSON input
  const formattedInput =
    typeof input === 'string'
      ? input
      : JSON.stringify(input, null, 2); // Format JSON with 2 spaces for indentation


  const handleEditorDidMount = (editorInstance: any) => {
    editorInstance?.getAction("editor.action.formatDocument")?.run();
  };

  return (
    <MonacoEditor
      height="100%"
      width="100%"
      theme="monokaibright"
      language="json"
      value={formattedInput}
      onMount={handleEditorDidMount}
      options={{
        wordWrap: 'on',
        formatOnPaste: true,
        formatOnType: true,
        autoIndent: 'full',
        minimap: { enabled: false },
        tabSize: 2,
        insertSpaces: true,
        lineNumbers: 'on',
        scrollbar: {
          vertical: 'auto',
          horizontal: 'auto',
        },
        folding: true,
        foldingStrategy: 'auto',
        renderLineHighlight: 'all',
      }}
      onChange={(value) => {
        if (onChange) {
          try {
            const parsedValue = JSON.parse(value || '{}');
            onChange(parsedValue);
          } catch (error) {
            console.error('Invalid JSON:', error);
          }
        }
      }}
      className={classes.editor}
    />
  )
};
