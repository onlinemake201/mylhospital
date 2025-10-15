import createContextHook from '@nkzw/create-context-hook';
import { useMemo, useState, useCallback } from 'react';
import { translations, Language } from '@/constants/translations';

export const [LanguageProvider, useLanguage] = createContextHook(() => {
  const [language, setLanguageState] = useState<Language>('de');

  const t = useMemo(() => translations[language], [language]);

  const setLanguage = useCallback((newLanguage: Language) => {
    console.log('LanguageContext: Setting language to:', newLanguage);
    setLanguageState(newLanguage);
  }, []);

  return useMemo(
    () => ({
      language,
      t,
      setLanguage,
    }),
    [language, t, setLanguage]
  );
});
