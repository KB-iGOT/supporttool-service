import { useEffect, useRef, useState } from 'react';
import * as monaco from 'monaco-editor';
import { makeStyles, createStyles } from '@mui/styles';
import { systemSettingsService } from '../../services/system-settings.service';
import { useParams } from 'react-router-dom';
import { config } from 'process';

const editorStyles = makeStyles(() =>
  createStyles({
    editor: {
      width: '100%',
      height: '100%',
    },
  }),
);

export const Editor = () => {
  const classes = editorStyles();
  const monacoRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [input, setInput] = useState<string>('');
  const { id } = useParams();
  const [configData, setConfigData] = useState<any>({});
  const handleDataChange = (data: string) => {
    setInput(data);
  };

  useEffect(() => {

    const getConfigData =  () => {
      systemSettingsService.getConfig(id).then((res: any) => {
        if (res.responseCode === 'OK') {
          setConfigData(res.result.response);
          setInput(JSON.parse(res.result.response.value));
          let response = "{\"wfstates\":[{\"state\":\"INITIATE\",\"isStartState\":true,\"isLastState\":false,\"isNotificationEnable\":false,\"actions\":[{\"action\":\"INITIATE\",\"nextState\":\"WF_INITIATED\",\"roles\":[\"USER\"]}]},{\"state\":\"WF_INITIATED\",\"isStartState\":false,\"isLastState\":false,\"isNotificationEnable\":true,\"actions\":[{\"action\":\"APPROVE\",\"nextState\":\"WF_APPROVED\",\"roles\":[\"MDO_ADMIN\"]},{\"action\":\"REJECT\",\"nextState\":\"WF_DENIED\",\"roles\":[\"MDO_ADMIN\"]}]},{\"state\":\"WF_APPROVED\",\"isStartState\":false,\"isLastState\":true,\"isNotificationEnable\":true,\"actions\":[]},{\"state\":\"WF_DENIED\",\"isStartState\":false,\"isLastState\":true,\"isNotificationEnable\":true,\"actions\":[]}]}";
          const container: HTMLElement | null = document.getElementById('monaco-container');
          if (!container) return;

          if (monaco && !monacoRef.current ) {
            const editor = monaco.editor.create(container, {
              value: JSON.stringify(configData.value, null, 2),
              language: 'json',
              automaticLayout: true,
              minimap: { enabled: false },
              wordWrap: 'off',
              fontSize: 12,
              readOnly: false,
              scrollBeyondLastLine: false,
            });

            import('./monokaibright.json').then((data: any) => {
              monaco.editor.defineTheme('monokaibright', data);
              monaco.editor.setTheme('monokaibright');
            });

            monacoRef.current = editor;
          }
        }
        return res;
      })
    }

    getConfigData()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const editor = monacoRef.current;
    if (!editor) return;

    const debounce = (func: (...args: any[]) => void, wait: number) => {
      let timeout: NodeJS.Timeout;
      return (...args: any[]) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
      };
    };

    const debouncedValidation = debounce((data: string) => {
      handleDataChange(data);
    }, 50);

    editor.onDidChangeModelContent(() => {
      const data = editor.getValue();
      if (!data) {
        setInput('');
      }
      debouncedValidation(data);
    });
  }, []);

  return <div id="monaco-container" className={classes.editor} />;
};