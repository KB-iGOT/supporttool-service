import { useActionIntercept } from '../Context/AppContext';

interface ActionInterceptorOptions {
  actionType: string;
  onComplete: (data: any) => void;
  getPayload?: () => any;
}

export const useActionInterceptor = ({
  actionType,
  onComplete,
  getPayload = () => ({}),
}: ActionInterceptorOptions) => {
  const { interceptAction } = useActionIntercept();

  const handleAction = () => {
    const payload = getPayload();
    interceptAction(actionType, payload, onComplete);
  };

  return { handleAction };
};