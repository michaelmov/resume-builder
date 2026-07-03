const MARGIN_KEY = 'selected-margin';

export const useMarginLocalStorage = () => {
  const getMarginId = (): string | undefined => {
    return window.localStorage.getItem(MARGIN_KEY) ?? undefined;
  };

  const saveMarginId = (marginId: string): void => {
    window.localStorage.setItem(MARGIN_KEY, marginId);
  };

  return {
    getMarginId,
    saveMarginId,
  };
};
