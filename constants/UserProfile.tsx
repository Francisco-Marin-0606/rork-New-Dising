import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';

interface UserProfile {
  nombre: string;
  apellido: string;
  nombrePreferido: string;
  email: string;
  fechaNacimiento: string;
  genero: string;
}

const PROFILE_STORAGE_KEY = '@user_profile';

export const [UserProfileProvider, useUserProfile] = createContextHook(() => {
  const [profile, setProfile] = useState<UserProfile>({
    nombre: '',
    apellido: '',
    nombrePreferido: '',
    email: '',
    fechaNacimiento: '',
    genero: '',
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const stored = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
      if (stored) {
        setProfile(JSON.parse(stored));
      }
    } catch (error) {
      console.log('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = useCallback(async (newProfile: Partial<UserProfile>) => {
    try {
      setProfile((prev) => {
        const updated = { ...prev, ...newProfile };
        AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated)).catch((error) =>
          console.log('Error saving profile:', error)
        );
        return updated;
      });
    } catch (error) {
      console.log('Error updating profile:', error);
    }
  }, []);

  const getDisplayName = useCallback((): string => {
    if (profile.nombre && profile.nombre.trim().length > 0) {
      return profile.nombre;
    }
    if (profile.nombrePreferido && profile.nombrePreferido.trim().length > 0) {
      return profile.nombrePreferido;
    }
    return '';
  }, [profile.nombre, profile.nombrePreferido]);

  return useMemo(
    () => ({
      profile,
      updateProfile,
      getDisplayName,
      isLoading,
    }),
    [profile, updateProfile, getDisplayName, isLoading]
  );
});
