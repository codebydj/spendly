import React, { useMemo, useState } from 'react';
import { CalendarDays, Plus, Target, Trash2, X } from 'lucide-react';
import { useFeatures } from '../context/FeatureContext';
import { formatINR } from '../utils/currency';
import type { SavingsGoal } from '../types/finance';
import { calculateGoalProgress } from '../utils/goals';

const COLORS = ['#55D6B0', '#9C86F5', '#D3EF8B', '#F5A66B', '#69B7F5'];

export const GoalsView: React.FC = () => {
  const { goals, saveGoal, deleteGoal, addContribution, deleteContribution } = useFeatures();
  const [editing, setEditing] = useState<SavingsGoal | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [contributionGoal, setContributionGoal] = useState<SavingsGoal | null>(null);
  const [contributionAmount, setContributionAmount] = useState('');
  const [contributionNote, setContributionNote] = useState('');

  const totalPlanned = useMemo(() => goals.reduce((sum, goal) => sum + calculateGoalProgress(goal).allocated, 0), [goals]);
  const openForm = (goal?: SavingsGoal) => {
    setEditing(goal || null); setName(goal?.name || ''); setTarget(goal ? String(goal.targetAmount) : ''); setTargetDate(goal?.targetDate || ''); setColor(goal?.color || COLORS[0]); setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditing(null); };

  return (
    <div className="feature-page">
      <section className="feature-hero card-level-3">
        <div>
          <span className="eyebrow">PLANNING, NOT ACCOUNT WITHDRAWALS</span>
          <h2>Savings goals</h2>
          <p>Allocate planning values toward what matters. Contributions here never change account balances or net worth.</p>
        </div>
        <div className="feature-hero-stat"><span>Allocated</span><strong>{formatINR(totalPlanned)}</strong><small>{goals.length} active {goals.length === 1 ? 'goal' : 'goals'}</small></div>
        <button className="btn btn-primary" onClick={() => openForm()}><Plus size={18} /> New goal</button>
      </section>

      {goals.length === 0 ? (
        <section className="empty-feature card-level-2"><Target size={34} /><h3>Plan your first savings goal</h3><p>Set a target and optionally a date. Nothing is moved from your accounts.</p><button className="btn btn-primary" onClick={() => openForm()}>Create a goal</button></section>
      ) : (
        <div className="goal-grid">
          {goals.map((goal) => {
            const { allocated: saved, percentage: percent, requiredMonthly: required } = calculateGoalProgress(goal);
            return <article key={goal.id} className="goal-card card-level-2" style={{ '--goal-color': goal.color } as React.CSSProperties}>
              <div className="goal-card-head"><div className="goal-icon"><Target size={20} /></div><div><h3>{goal.name}</h3><p>{goal.targetDate ? `Target ${new Date(`${goal.targetDate}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'No target date'}</p></div><button className="btn-icon" aria-label={`Edit ${goal.name}`} onClick={() => openForm(goal)}>Edit</button></div>
              <div className="goal-amount"><strong>{formatINR(saved)}</strong><span>of {formatINR(goal.targetAmount)}</span></div>
              <div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-label={`${goal.name} ${percent}% funded`}><span style={{ width: `${percent}%`, background: goal.color }} /></div>
              <div className="goal-meta"><span>{percent}% funded</span><span>{formatINR(Math.max(0, goal.targetAmount - saved))} remaining</span></div>
              {required !== null && <p className="goal-guidance"><CalendarDays size={15} /> About {formatINR(required)} / month to meet the date</p>}
              <div className="goal-actions"><button className="btn btn-primary" onClick={() => { setContributionGoal(goal); setContributionAmount(''); setContributionNote(''); }}>Record allocation</button><button className="btn btn-secondary" onClick={() => { if (confirm(`Delete goal “${goal.name}” and its allocation history?`)) deleteGoal(goal.id); }}><Trash2 size={16} /> Delete</button></div>
              {goal.contributions.length > 0 && <details><summary>Allocation history ({goal.contributions.length})</summary><div className="contribution-list">{goal.contributions.map((item) => <div key={item.id}><span>{new Date(`${item.date}T00:00:00`).toLocaleDateString('en-IN')} {item.note && `· ${item.note}`}</span><strong>{formatINR(item.amount)}</strong><button className="btn-icon" aria-label="Delete allocation" onClick={() => deleteContribution(goal.id, item.id)}><X size={14} /></button></div>)}</div></details>}
            </article>;
          })}
        </div>
      )}

      {showForm && <div className="inline-dialog-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && closeForm()}><form className="inline-dialog card-level-3" role="dialog" aria-modal="true" aria-labelledby="goal-form-title" onSubmit={(e) => { e.preventDefault(); const amount = Number(target); if (!name.trim() || amount <= 0) return; saveGoal({ id: editing?.id, name: name.trim(), targetAmount: amount, targetDate: targetDate || undefined, color }); closeForm(); }}><div className="dialog-heading"><div><h2 id="goal-form-title">{editing ? 'Edit goal' : 'New savings goal'}</h2><p>Planning only · stored on this device</p></div><button className="btn-icon" type="button" onClick={closeForm} aria-label="Close goal form"><X /></button></div><label>Goal name<input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Emergency fund" /></label><label>Target amount (₹)<input required type="number" min="0.01" step="0.01" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} /></label><label>Target date (optional)<input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} /></label><fieldset><legend>Visual identity</legend><div className="color-options">{COLORS.map((item) => <button key={item} type="button" aria-label={`Use color ${item}`} aria-pressed={color === item} onClick={() => setColor(item)} style={{ background: item }} />)}</div></fieldset><div className="dialog-actions"><button className="btn btn-secondary" type="button" onClick={closeForm}>Cancel</button><button className="btn btn-primary" type="submit">Save goal</button></div></form></div>}

      {contributionGoal && <div className="inline-dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setContributionGoal(null)}><form className="inline-dialog card-level-3" role="dialog" aria-modal="true" aria-labelledby="contribution-title" onSubmit={(e) => { e.preventDefault(); const amount = Number(contributionAmount); if (amount <= 0) return; addContribution(contributionGoal.id, { amount, date: new Date().toISOString().slice(0, 10), note: contributionNote.trim() || undefined }); setContributionGoal(null); }}><div className="dialog-heading"><div><h2 id="contribution-title">Record allocation</h2><p>{contributionGoal.name} · does not move money</p></div><button className="btn-icon" type="button" onClick={() => setContributionGoal(null)} aria-label="Close allocation form"><X /></button></div><label>Amount (₹)<input autoFocus required type="number" min="0.01" step="0.01" inputMode="decimal" value={contributionAmount} onChange={(e) => setContributionAmount(e.target.value)} /></label><label>Note (optional)<input value={contributionNote} onChange={(e) => setContributionNote(e.target.value)} /></label><div className="dialog-actions"><button className="btn btn-secondary" type="button" onClick={() => setContributionGoal(null)}>Cancel</button><button className="btn btn-primary">Record allocation</button></div></form></div>}
    </div>
  );
};
