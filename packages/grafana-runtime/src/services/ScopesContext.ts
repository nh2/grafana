import { createContext, useContext, useMemo } from 'react';
import { useObservable } from 'react-use';
import { Observable } from 'rxjs';

import { Scope } from '@grafana/data';

export interface ScopesContextValue {
  state: {
    isEnabled: boolean;
    isLoading: boolean;
    isReadOnly: boolean;
    pendingScopes: string[] | null;
    value: Scope[];
  };
  stateObservable: Observable<ScopesContextValue['state']>;
  setNewScopes: (scopeNames: string[] | null) => void;
  setCurrentScopes: (scopes: Scope[]) => void;
  enterLoadingMode: () => void;
  exitLoadingMode: () => void;
  enterReadOnly: () => void;
  exitReadOnly: () => void;
  enable: () => void;
  disable: () => void;
}

const noop = () => undefined;
const defaultValue: ScopesContextValue = {
  state: {
    isEnabled: false,
    isLoading: false,
    isReadOnly: false,
    pendingScopes: null,
    value: [],
  },
  stateObservable: new Observable(),
  setNewScopes: noop,
  setCurrentScopes: noop,
  enterLoadingMode: noop,
  exitLoadingMode: noop,
  enterReadOnly: noop,
  exitReadOnly: noop,
  enable: noop,
  disable: noop,
};

export const ScopesContext = createContext<ScopesContextValue | undefined>(undefined);

export function useScopes() {
  const context = useContext(ScopesContext);

  if (!context) {
    return defaultValue;
  }

  const state = useObservable(context.stateObservable, context.state);

  return useMemo(() => {
    return {
      state,
      setNewScopes: context.setNewScopes.bind(context),
      setCurrentScopes: context.setCurrentScopes.bind(context),
      enterLoadingMode: context.enterLoadingMode.bind(context),
      exitLoadingMode: context.exitLoadingMode.bind(context),
      enterReadOnly: context.enterReadOnly.bind(context),
      exitReadOnly: context.exitReadOnly.bind(context),
      enable: context.enable.bind(context),
      disable: context.disable.bind(context),
    };
  }, [context, state]);
}
