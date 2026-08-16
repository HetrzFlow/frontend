import { create } from 'zustand';

interface FormSubmitStore {
  submittingCount: number;
  beginSubmit: () => void;
  endSubmit: () => void;
}

export const createFormSubmitStatus = () => {
  const useFormSubmitStore = create<FormSubmitStore>((set) => ({
    submittingCount: 0,
    beginSubmit: () => {
      set((state) => ({ submittingCount: state.submittingCount + 1 }));
    },
    endSubmit: () => {
      set((state) => ({
        submittingCount: Math.max(state.submittingCount - 1, 0),
      }));
    },
  }));

  return {
    submitStatus: {
      beginSubmit: () => useFormSubmitStore.getState().beginSubmit(),
      endSubmit: () => useFormSubmitStore.getState().endSubmit(),
    },
    useIsSubmitting: () =>
      useFormSubmitStore((state) => state.submittingCount > 0),
  };
};
