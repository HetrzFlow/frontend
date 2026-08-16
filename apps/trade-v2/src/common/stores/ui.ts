import { create } from 'zustand';

interface AppUiState {
  announcementStackHeight: number;
  setAnnouncementStackHeight: (height: number) => void;
}

export const useAppUiStore = create<AppUiState>((set) => ({
  announcementStackHeight: 0,
  setAnnouncementStackHeight: (announcementStackHeight) =>
    set({ announcementStackHeight }),
}));
