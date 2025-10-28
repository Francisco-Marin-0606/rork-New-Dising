import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';

export type Language = 'es' | 'en';

const LANGUAGE_STORAGE_KEY = '@app_language';

export const [LanguageProvider, useLanguage] = createContextHook(() => {
  const [language, setLanguageState] = useState<Language>('es');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (stored === 'es' || stored === 'en') {
          setLanguageState(stored);
        }
      } catch (error) {
        console.log('[Language] Error loading language:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLanguage();
  }, []);

  const setLanguage = useCallback(async (newLanguage: Language) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, newLanguage);
      setLanguageState(newLanguage);
      console.log('[Language] Changed to:', newLanguage);
    } catch (error) {
      console.log('[Language] Error saving language:', error);
    }
  }, []);

  return useMemo(() => ({
    language,
    setLanguage,
    isLoading,
  }), [language, setLanguage, isLoading]);
});
