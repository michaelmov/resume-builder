const ACCENT_KEY = 'selected-accent';

export const useAccentLocalStorage = () => {
  const getAccentId = (): string | null => {
    return window.localStorage.getItem(ACCENT_KEY);
  };

  const saveAccentId = (accentId: string | null): void => {
    if (accentId === null) {
      window.localStorage.removeItem(ACCENT_KEY);
      return;
    }

    window.localStorage.setItem(ACCENT_KEY, accentId);
  };

  return {
    getAccentId,
    saveAccentId,
  };
};
