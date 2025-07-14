import { FormEvent } from 'react';
import { useFormIntercept } from '../Context/FormInterceptorContext';

interface FormInterceptorOptions {
  isUpdate?: boolean;
  onSubmit: (data: any) => void;
  getFormData: (event: FormEvent<HTMLFormElement>) => any;
}

export const useFormInterceptor = ({
  isUpdate = false,
  onSubmit,
  getFormData,
}: FormInterceptorOptions) => {
  const { interceptForm } = useFormIntercept();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    // Extract form data using the provided function
    const formData = getFormData(event);
    
    // Intercept the form submission
    interceptForm(formData, isUpdate, onSubmit);
  };

  return { handleSubmit };
};