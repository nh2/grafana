import { createContext, useCallback, useContext, useMemo } from 'react';
import { useObservable } from 'react-use';

import { TreeScope } from '@grafana/data';

import { ScopesDashboardsService } from './ScopesDashboardsService';
import { ScopesSelectorService } from './ScopesSelectorService';

export let scopesSelectorService: ScopesSelectorService;
export let scopesDashboardsService: ScopesDashboardsService;

export function initializeScopes() {
  scopesSelectorService = new ScopesSelectorService();
  scopesDashboardsService = new ScopesDashboardsService();
}

export function getScopesSelectorService() {
  return scopesSelectorService;
}

export function getScopesDashboardsService() {
  return scopesDashboardsService;
}

export const ScopesSelectorContext = createContext<ScopesSelectorService>(getScopesSelectorService());
export const ScopesDashboardsContext = createContext<ScopesDashboardsService>(getScopesDashboardsService());

export function useScopes() {
  const scopesSelectorService = useContext(ScopesSelectorContext);
  const scopesDashboardsService = useContext(ScopesDashboardsContext);

  const selectorState = useObservable(scopesSelectorService.stateObservable, scopesSelectorService.state);
  const open = useCallback(() => scopesSelectorService.openPicker(), [scopesSelectorService]);
  const close = useCallback(() => scopesSelectorService.closePicker(), [scopesSelectorService]);
  const removeAllScopes = useCallback(() => scopesSelectorService.removeAllScopes(), [scopesSelectorService]);
  const resetDirtyScopeNames = useCallback(() => scopesSelectorService.resetDirtyScopeNames(), [scopesSelectorService]);
  const toggleNodeSelect = useCallback(
    (path: string[]) => scopesSelectorService.toggleNodeSelect(path),
    [scopesSelectorService]
  );
  const updateNode = useCallback(
    (path: string[], isExpanded: boolean, query: string) => scopesSelectorService.updateNode(path, isExpanded, query),
    [scopesSelectorService]
  );
  const updateScopes = useCallback(
    (treeScopes?: TreeScope[]) => scopesSelectorService.updateScopes(treeScopes),
    [scopesSelectorService]
  );
  const selector = useMemo(
    () => ({
      state: selectorState,
      open,
      close,
      removeAllScopes,
      resetDirtyScopeNames,
      toggleNodeSelect,
      updateNode,
      updateScopes,
    }),
    [close, open, removeAllScopes, resetDirtyScopeNames, selectorState, toggleNodeSelect, updateNode, updateScopes]
  );

  const dashboardsState = useObservable(scopesDashboardsService.stateObservable, scopesDashboardsService.state);
  const changeSearchQuery = useCallback(
    (searchQuery: string) => scopesDashboardsService.changeSearchQuery(searchQuery),
    [scopesDashboardsService]
  );
  const togglePanel = useCallback(() => scopesDashboardsService.togglePanel(), [scopesDashboardsService]);
  const updateFolder = useCallback(
    (path: string[], isExpanded: boolean) => scopesDashboardsService.updateFolder(path, isExpanded),
    [scopesDashboardsService]
  );
  const dashboards = useMemo(
    () => ({
      state: dashboardsState,
      changeSearchQuery,
      togglePanel,
      updateFolder,
    }),
    [changeSearchQuery, dashboardsState, togglePanel, updateFolder]
  );

  const enable = useCallback(() => {
    scopesSelectorService.enable();
    scopesDashboardsService.enable();
  }, [scopesDashboardsService, scopesSelectorService]);
  const disable = useCallback(() => {
    scopesSelectorService.disable();
    scopesDashboardsService.disable();
  }, [scopesDashboardsService, scopesSelectorService]);
  const enterReadOnly = useCallback(() => {
    scopesSelectorService.enterReadOnly();
    scopesDashboardsService.enterReadOnly();
  }, [scopesDashboardsService, scopesSelectorService]);
  const exitReadOnly = useCallback(() => {
    scopesSelectorService.exitReadOnly();
    scopesDashboardsService.exitReadOnly();
  }, [scopesDashboardsService, scopesSelectorService]);

  const context = useMemo(
    () => ({ selector, dashboards, enable, disable, enterReadOnly, exitReadOnly }),
    [selector, dashboards, enable, disable, enterReadOnly, exitReadOnly]
  );

  return context;
}
