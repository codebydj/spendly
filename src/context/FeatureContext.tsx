import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { DashboardWidget, GoalContribution, SavingsGoal, TransactionTemplate } from '../types/finance';
import { useApp } from './AppContext';

const DEFAULT_WIDGETS: DashboardWidget[] = ['accounts', 'spending', 'budgets', 'bills', 'goals', 'insights', 'activity'];

interface FeatureContextValue {
  goals: SavingsGoal[];
  templates: TransactionTemplate[];
  dashboardWidgets: DashboardWidget[];
  pendingTemplate: TransactionTemplate | null;
  saveGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt' | 'contributions'> & { id?: string }) => void;
  deleteGoal: (id: string) => void;
  addContribution: (goalId: string, contribution: Omit<GoalContribution, 'id'>) => void;
  deleteContribution: (goalId: string, contributionId: string) => void;
  saveTemplate: (template: Omit<TransactionTemplate, 'id' | 'updatedAt'> & { id?: string }) => void;
  deleteTemplate: (id: string) => void;
  applyTemplate: (template: TransactionTemplate) => void;
  clearPendingTemplate: () => void;
  toggleDashboardWidget: (widget: DashboardWidget) => void;
  restoreDashboardWidgets: () => void;
}

const FeatureContext = createContext<FeatureContextValue | null>(null);

const safeParse = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
};

export const FeatureProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { user, setIsAddTransactionOpen, showToast } = useApp();
  const suffix = user?.id || 'guest';
  const goalsKey = `spendly_${suffix}_goals_v1`;
  const templatesKey = `spendly_${suffix}_templates_v1`;
  const widgetsKey = `spendly_${suffix}_dashboard_widgets_v1`;
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [templates, setTemplates] = useState<TransactionTemplate[]>([]);
  const [dashboardWidgets, setDashboardWidgets] = useState<DashboardWidget[]>(DEFAULT_WIDGETS);
  const [pendingTemplate, setPendingTemplate] = useState<TransactionTemplate | null>(null);

  useEffect(() => {
    setGoals(safeParse(localStorage.getItem(goalsKey), []));
    setTemplates(safeParse(localStorage.getItem(templatesKey), []));
    setDashboardWidgets(safeParse(localStorage.getItem(widgetsKey), DEFAULT_WIDGETS));
  }, [goalsKey, templatesKey, widgetsKey]);

  const persistGoals = useCallback((next: SavingsGoal[]) => { setGoals(next); localStorage.setItem(goalsKey, JSON.stringify(next)); }, [goalsKey]);
  const persistTemplates = useCallback((next: TransactionTemplate[]) => { setTemplates(next); localStorage.setItem(templatesKey, JSON.stringify(next)); }, [templatesKey]);

  const value = useMemo<FeatureContextValue>(() => ({
    goals, templates, dashboardWidgets, pendingTemplate,
    saveGoal: (input) => {
      const now = new Date().toISOString();
      const existing = input.id ? goals.find((g) => g.id === input.id) : undefined;
      const next: SavingsGoal = { ...input, id: input.id || crypto.randomUUID(), contributions: existing?.contributions || [], createdAt: existing?.createdAt || now, updatedAt: now };
      persistGoals(existing ? goals.map((g) => g.id === next.id ? next : g) : [next, ...goals]);
      showToast(existing ? 'Goal updated on this device' : 'Goal created on this device', 'success');
    },
    deleteGoal: (id) => persistGoals(goals.filter((g) => g.id !== id)),
    addContribution: (goalId, input) => persistGoals(goals.map((g) => g.id === goalId ? { ...g, contributions: [{ ...input, id: crypto.randomUUID() }, ...g.contributions], updatedAt: new Date().toISOString() } : g)),
    deleteContribution: (goalId, contributionId) => persistGoals(goals.map((g) => g.id === goalId ? { ...g, contributions: g.contributions.filter((c) => c.id !== contributionId), updatedAt: new Date().toISOString() } : g)),
    saveTemplate: (input) => {
      const next: TransactionTemplate = { ...input, id: input.id || crypto.randomUUID(), updatedAt: new Date().toISOString() };
      persistTemplates(input.id ? templates.map((t) => t.id === input.id ? next : t) : [next, ...templates]);
      showToast('Template saved on this device', 'success');
    },
    deleteTemplate: (id) => persistTemplates(templates.filter((t) => t.id !== id)),
    applyTemplate: (template) => { setPendingTemplate(template); setIsAddTransactionOpen(true); },
    clearPendingTemplate: () => setPendingTemplate(null),
    toggleDashboardWidget: (widget) => {
      const next = dashboardWidgets.includes(widget) ? dashboardWidgets.filter((item) => item !== widget) : [...dashboardWidgets, widget];
      setDashboardWidgets(next); localStorage.setItem(widgetsKey, JSON.stringify(next));
    },
    restoreDashboardWidgets: () => { setDashboardWidgets(DEFAULT_WIDGETS); localStorage.setItem(widgetsKey, JSON.stringify(DEFAULT_WIDGETS)); },
  }), [goals, templates, dashboardWidgets, pendingTemplate, persistGoals, persistTemplates, setIsAddTransactionOpen, showToast, widgetsKey]);

  return <FeatureContext.Provider value={value}>{children}</FeatureContext.Provider>;
};

export const useFeatures = () => {
  const value = useContext(FeatureContext);
  if (!value) throw new Error('useFeatures must be used within FeatureProvider');
  return value;
};

