import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, Language } from '@/constants/translations';

const LANGUAGE_KEY = '@app_language';

export const [LanguageProvider, useLanguage] = createContextHook(() => {
  const [language, setLanguage] = useState<Language>('de');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (stored && (stored === 'de' || stored === 'en')) {
          console.log('LanguageContext: Loaded language:', stored);
          setLanguage(stored as Language);
        } else {
          console.log('LanguageContext: Using default language: de');
        }
      } catch (error) {
        console.error('LanguageContext: Failed to load language:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadLanguage();
  }, []);

  const changeLanguage = useCallback(async (newLanguage: Language) => {
    console.log('LanguageContext: Changing language to:', newLanguage);
    setLanguage(newLanguage);
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, newLanguage);
      console.log('LanguageContext: Language saved');
    } catch (error) {
      console.error('LanguageContext: Failed to save language:', error);
    }
  }, []);

  const t = useMemo(() => translations[language], [language]);

  return useMemo(
    () => ({
      language,
      changeLanguage,
      t,
      isLoading,
    }),
    [language, changeLanguage, t, isLoading]
  );
});
