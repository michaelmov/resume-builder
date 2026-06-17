const TEMPLATE_KEY = 'selected-template';

export const useTemplateLocalStorage = () => {
  const getTemplateId = (): string | undefined => {
    return window.localStorage.getItem(TEMPLATE_KEY) ?? undefined;
  };

  const saveTemplateId = (templateId: string): void => {
    window.localStorage.setItem(TEMPLATE_KEY, templateId);
  };

  return {
    getTemplateId,
    saveTemplateId,
  };
};
