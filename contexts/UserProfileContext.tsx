import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserProfile {
  name: string;
  gender: 'Hombre' | 'Mujer';
  birthdate: string;
}

interface UserProfileContextType {
  profile: UserProfile | null;
  saveProfile: (profile: UserProfile) => Promise<void>;
  isLoading: boolean;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

const USER_PROFILE_KEY = '@user_profile';

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const stored = await AsyncStorage.getItem(USER_PROFILE_KEY);
      if (stored) {
        setProfile(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfile = async (newProfile: UserProfile) => {
    try {
      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(newProfile));
      setProfile(newProfile);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const value = useMemo(
    () => ({ profile, saveProfile, isLoading }),
    [profile, isLoading]
  );

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
}
