import { RefObject } from 'react';
import { create } from 'zustand';

interface LayoutStore {
  rightBoxRef: RefObject<HTMLDivElement | null> | null;
  setRightBoxRef: (ref: RefObject<HTMLDivElement | null> | null) => void;
}

export const useLayoutStore = create<LayoutStore>((set, get) => ({
  rightBoxRef: null,
  setRightBoxRef: (ref) => {
    set({ rightBoxRef: ref });
  },
}));
