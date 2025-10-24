import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { JsonEditor } from './json-editor';

// Mock Monaco Editor
jest.mock('@monaco-editor/react', () => {
  const MockedReact = require('react');
  
  return function MockedMonacoEditor(props: any) {
    const [value, setValue] = MockedReact.useState(props.value || '');
    
    // Simulate Monaco Editor API
    const editorRef = MockedReact.useRef({
      getValue: () => value,
      setValue: (newValue: string) => {
        setValue(newValue);
      },
      layout: jest.fn(),
      getAction: () => ({ run: jest.fn() })
    });

    MockedReact.useEffect(() => {
      setValue(props.value || '');
    }, [props.value]);

    MockedReact.useEffect(() => {
      if (props.onMount) {
        props.onMount(editorRef.current);
      }
    }, []);

    return MockedReact.createElement('div', { 'data-testid': 'monaco-editor' },
      MockedReact.createElement('textarea', {
        value: value,
        onChange: (e: any) => {
          setValue(e.target.value);
          props.onChange?.(e.target.value);
        },
        'data-testid': 'monaco-textarea'
      })
    );
  };
});

describe('JsonEditor', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  test('renders with null input', async () => {
    render(<JsonEditor input={null} onChange={mockOnChange} />);
    
    await waitFor(() => {
      const textarea = screen.getByTestId('monaco-textarea');
      expect(textarea).toHaveValue('{}');
    });
  });

  test('renders with undefined input', async () => {
    render(<JsonEditor input={undefined} onChange={mockOnChange} />);
    
    await waitFor(() => {
      const textarea = screen.getByTestId('monaco-textarea');
      expect(textarea).toHaveValue('{}');
    });
  });

  test('renders with object input', async () => {
    const testObject = { name: 'test', value: 123 };
    render(<JsonEditor input={testObject} onChange={mockOnChange} />);
    
    await waitFor(() => {
      const textarea = screen.getByTestId('monaco-textarea');
      expect(textarea).toHaveValue(JSON.stringify(testObject, null, 2));
    });
  });

  test('renders with valid JSON string input', async () => {
    const testJson = '{"name":"test","value":123}';
    render(<JsonEditor input={testJson} onChange={mockOnChange} />);
    
    await waitFor(() => {
      const textarea = screen.getByTestId('monaco-textarea');
      expect(textarea).toHaveValue(JSON.stringify(JSON.parse(testJson), null, 2));
    });
  });

  test('renders with invalid JSON string input', async () => {
    const invalidJson = 'invalid json string';
    render(<JsonEditor input={invalidJson} onChange={mockOnChange} />);
    
    await waitFor(() => {
      const textarea = screen.getByTestId('monaco-textarea');
      expect(textarea).toHaveValue(invalidJson);
    });
  });

  test('updates when input prop changes from null to object', async () => {
    const { rerender } = render(<JsonEditor input={null} onChange={mockOnChange} />);
    
    await waitFor(() => {
      const textarea = screen.getByTestId('monaco-textarea');
      expect(textarea).toHaveValue('{}');
    });

    const newData = { updated: true, count: 42 };
    rerender(<JsonEditor input={newData} onChange={mockOnChange} />);
    
    await waitFor(() => {
      const textarea = screen.getByTestId('monaco-textarea');
      expect(textarea).toHaveValue(JSON.stringify(newData, null, 2));
    });
  });

  test('handles fullscreen toggle', async () => {
    render(<JsonEditor input={{ test: 'data' }} onChange={mockOnChange} />);
    
    const fullscreenButton = screen.getByLabelText('Fullscreen');
    expect(fullscreenButton).toBeInTheDocument();
  });

  test('handles DOM changes and maintains editor value', async () => {
    const testObject = { name: 'test', value: 123 };
    const { container, rerender } = render(<JsonEditor input={testObject} onChange={mockOnChange} />);
    
    // Initial state
    await waitFor(() => {
      const textarea = screen.getByTestId('monaco-textarea');
      expect(textarea).toHaveValue(JSON.stringify(testObject, null, 2));
    });

    // Simulate DOM change by modifying container style
    const editorContainer = container.querySelector('[data-testid="monaco-editor"]');
    if (editorContainer) {
      // Change visibility
      (editorContainer as HTMLElement).style.display = 'none';
      await new Promise(resolve => setTimeout(resolve, 100));
      (editorContainer as HTMLElement).style.display = 'block';
      
      // Wait for editor to respond to DOM change
      await waitFor(() => {
        const textarea = screen.getByTestId('monaco-textarea');
        expect(textarea).toHaveValue(JSON.stringify(testObject, null, 2));
      }, { timeout: 2000 });
    }

    // Test with new data after DOM change
    const newData = { updated: true, afterDomChange: 'yes' };
    rerender(<JsonEditor input={newData} onChange={mockOnChange} />);
    
    await waitFor(() => {
      const textarea = screen.getByTestId('monaco-textarea');
      expect(textarea).toHaveValue(JSON.stringify(newData, null, 2));
    }, { timeout: 2000 });
  });
});
