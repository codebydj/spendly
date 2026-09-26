import type { SavingsGoal } from '../types/finance';

export function calculateGoalProgress(goal: Pick<SavingsGoal, 'targetAmount' | 'targetDate' | 'contributions'>, now = new Date()) {
  const allocated = goal.contributions.reduce((sum, item) => sum + item.amount, 0);
  const remaining = Math.max(0, goal.targetAmount - allocated);
  const percentage = goal.targetAmount > 0 ? Math.min(100, Math.round((allocated / goal.targetAmount) * 100)) : 0;
  if (!goal.targetDate) return { allocated, remaining, percentage, requiredMonthly: null };
  const target = new Date(`${goal.targetDate}T23:59:59`);
  const monthsRemaining = Math.max(1, Math.ceil((target.getTime() - now.getTime()) / 2629800000));
  return { allocated, remaining, percentage, requiredMonthly: remaining / monthsRemaining };
}
