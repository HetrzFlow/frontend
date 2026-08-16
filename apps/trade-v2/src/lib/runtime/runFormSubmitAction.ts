import { toast } from '@repo/ui';

interface SubmitStatusController {
  beginSubmit: () => void;
  endSubmit: () => void;
}

interface RunFormSubmitActionOptions<T> {
  submitStatus: SubmitStatusController;
  action: () => Promise<T>;
}

export const runFormSubmitAction = async <T>({
  submitStatus,
  action,
}: RunFormSubmitActionOptions<T>) => {
  submitStatus.beginSubmit();
  try {
    return await action();
  } catch (error) {
    toast.error((error as Error).message);
    throw error;
  } finally {
    submitStatus.endSubmit();
  }
};
