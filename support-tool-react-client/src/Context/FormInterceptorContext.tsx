import React, { createContext, useState, useContext, ReactNode } from 'react';

interface FormData {
  [key: string]: any;
}

interface FormInterceptContextType {
  interceptForm: (formData: FormData, isUpdate: boolean, onSubmit: (data: FormData) => void) => void;
  isIntercepting: boolean;
  currentFormData: FormData | null;
  currentIsUpdate: boolean;
  currentSubmitHandler: ((data: FormData) => void) | null;
  completeSubmission: (jiraLink: string) => void;
  cancelSubmission: () => void;
}

const FormInterceptContext = createContext<FormInterceptContextType | undefined>(undefined);

interface FormInterceptProviderProps {
  children: ReactNode;
}

export const FormInterceptProvider: React.FC<FormInterceptProviderProps> = ({ children }) => {
  const [isIntercepting, setIsIntercepting] = useState(false);
  const [currentFormData, setCurrentFormData] = useState<FormData | null>(null);
  const [currentIsUpdate, setCurrentIsUpdate] = useState(false);
  const [currentSubmitHandler, setCurrentSubmitHandler] = useState<((data: FormData) => void) | null>(null);

  const interceptForm = (
    formData: FormData, 
    isUpdate: boolean, 
    onSubmit: (data: FormData) => void
  ) => {
    setCurrentFormData(formData);
    setCurrentIsUpdate(isUpdate);
    setCurrentSubmitHandler(() => onSubmit);
    setIsIntercepting(true);
  };

  const completeSubmission = (jiraLink: string) => {
    if (currentFormData && currentSubmitHandler) {
      const enhancedFormData = {
        ...currentFormData,
        jiraLink
      };
      currentSubmitHandler(enhancedFormData);
    }
    resetState();
  };

  const cancelSubmission = () => {
    resetState();
  };

  const resetState = () => {
    setIsIntercepting(false);
    setCurrentFormData(null);
    setCurrentSubmitHandler(null);
  };

  return (
    <FormInterceptContext.Provider
      value={{
        interceptForm,
        isIntercepting,
        currentFormData,
        currentIsUpdate,
        currentSubmitHandler,
        completeSubmission,
        cancelSubmission
      }}
    >
      {children}
    </FormInterceptContext.Provider>
  );
};

export const useFormIntercept = (): FormInterceptContextType => {
  const context = useContext(FormInterceptContext);
  if (context === undefined) {
    throw new Error('useFormIntercept must be used within a FormInterceptProvider');
  }
  return context;
};