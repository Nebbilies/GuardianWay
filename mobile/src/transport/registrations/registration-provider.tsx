import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import { useAuthStore } from '@/auth/auth-store';

import { loadRegistrationSession, type RegistrationSession } from './session';

type SessionState = { ready: RegistrationSession } | { error: string } | null;

const RegistrationContext = createContext<SessionState>(null);

export function useRegistrationAccess() {
  return useAuthStore(
    (state) =>
      __DEV__ && state.status === 'signedIn' && state.user?.role === 'PARENT',
  );
}

export function RegistrationProvider({ children }: { children: ReactNode }) {
  const enabled = useRegistrationAccess();
  const id = useAuthStore((state) => state.user?.id);
  const schoolId = useAuthStore((state) => state.user?.schoolId ?? null);
  const email = useAuthStore((state) => state.user?.email);
  const key =
    enabled && id && email ? JSON.stringify([schoolId, id, email]) : null;
  const [loaded, setLoaded] = useState<{
    key: string | null;
    value: SessionState;
  }>({ key, value: null });
  if (loaded.key !== key) setLoaded({ key, value: null });

  useEffect(() => {
    if (!key || !email) return;
    let active = true;
    void loadRegistrationSession(
      { role: 'PARENT', email, schoolId },
      {
        failOnce:
          process.env.EXPO_PUBLIC_REGISTRATION_FIXTURE_FAIL_ONCE === '1',
      },
    ).then(
      (ready) => {
        if (active) setLoaded({ key, value: { ready } });
      },
      () => {
        if (active)
          setLoaded({ key, value: { error: 'Không tải được đăng ký xe.' } });
      },
    );
    return () => {
      active = false;
    };
  }, [email, key, schoolId]);

  return (
    <RegistrationContext.Provider
      value={loaded.key === key ? loaded.value : null}
    >
      {children}
    </RegistrationContext.Provider>
  );
}

export function useRegistrationSession() {
  return useContext(RegistrationContext);
}
