import createContextHook from '@nkzw/create-context-hook';
import { useMemo } from 'react';
import { translations, Language } from '@/constants/translations';
import { useHospital } from './HospitalContext';

export const [LanguageProvider, useLanguage] = createContextHook(() => {
  const { hospitalSettings } = useHospital();
  const language = (hospitalSettings.language || 'de') as Language;

  const t = useMemo(() => translations[language], [language]);

  return useMemo(
    () => ({
      language,
      t,
    }),
    [language, t]
  );
});
