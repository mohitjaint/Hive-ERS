/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import { membersApi } from './api';
import { devBypassMember, isDevAuthBypassEnabled } from './dev-auth-bypass';

const MemberContext = createContext(null);

export function MemberProvider({ session, children }) {
  const [state, setState] = useState(() => ({
    member: isDevAuthBypassEnabled ? devBypassMember : null,
    loading: isDevAuthBypassEnabled ? false : Boolean(session),
  }));

  useEffect(() => {
    // DEV ONLY - MOBILE UI TESTING
    // The mock member is local UI state only; never request /members/me.
    if (isDevAuthBypassEnabled) {
      return undefined;
    }

    let cancelled = false;

    membersApi.me()
      .then((res) => {
        if (!cancelled) {
          setState({ member: res.data, loading: false });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState({ member: null, loading: false });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [session]);

  return (
    <MemberContext.Provider value={{
      ...state,
      setMember: (member) => setState((prev) => ({ ...prev, member })),
    }}>
      {children}
    </MemberContext.Provider>
  );
}

export function useMember() {
  return useContext(MemberContext);
}

export function useIsCoordinator() {
  const { member } = useMember();
  return member?.role === 'coordinator';
}

export function useIsManager() {
  const { member } = useMember();
  return member?.role === 'inventory_manager' || member?.role === 'coordinator';
}
