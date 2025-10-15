import createContextHook from '@nkzw/create-context-hook';
import { useState, useMemo } from 'react';
import { translations, Language } from '@/constants/translations';

export const [LanguageProvider, useLanguage] = createContextHook(() => {
  const [language, setLanguage] = useState<Language>('de');

  const t = useMemo(() => translations[language], [language]);

  return useMemo(
    () => ({
      language,
      setLanguage,
      t,
    }),
    [language, t]
  );
});
