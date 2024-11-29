import { createContext, useContext, useMemo } from 'react';
import { useObservable } from 'react-use';

import { scopesService } from './ScopesService';

export const ScopesContext = createContext(scopesService);

export function useScopes() {
  const context = useContext(ScopesContext);
  const state = useObservable(context.stateObservable, context.state);

  return useMemo(() => {
    return {
      ...state,
      setScopes: context.setCurrentScopes.bind(context),
      enterLoadingMode: context.enterLoadingMode.bind(context),
      exitLoadingMode: context.exitLoadingMode.bind(context),
      enterReadOnly: context.enterReadOnly.bind(context),
      exitReadOnly: context.exitReadOnly.bind(context),
      enable: context.enable.bind(context),
      disable: context.disable.bind(context),
      openPicker: context.openPicker.bind(context),
      closePicker: context.closePicker.bind(context),
      openDrawer: context.openDrawer.bind(context),
      closeDrawer: context.closeDrawer.bind(context),
      toggleDrawer: context.toggleDrawer.bind(context),
    };
  }, [context, state]);
}
