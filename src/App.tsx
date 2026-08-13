import { useCallback, useEffect, useState } from 'react';
import { Plus, Target } from 'lucide-react';
import {
  createBudgetItem,
  createPlan,
  fetchBudgetItems,
  fetchPlans,
  formatBrl,
  type BudgetItem,
  type Plan,
} from './api';
import './styles.css';

type Tab = 'ppa' | 'ldo' | 'loa' | 'budget';

export default function PlanningApp() {
  const [tab, setTab] = useState<Tab>('ppa');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [planYear, setPlanYear] = useState(2026);
  const [planName, setPlanName] = useState('');
  const [planVersion, setPlanVersion] = useState('v1');

  const [itemPlanId, setItemPlanId] = useState('');
  const [itemCode, setItemCode] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemAmount, setItemAmount] = useState('');

  const planType: Plan['type'] | null = tab === 'budget' ? null : tab;

  const loadPlans = useCallback(async () => {
    const data = await fetchPlans(planType ?? undefined);
    setPlans(data);
    if (!itemPlanId && data[0]) setItemPlanId(data[0].id);
  }, [itemPlanId, planType]);

  const loadAllPlans = useCallback(async () => {
    const data = await fetchPlans();
    setPlans(data);
    if (!itemPlanId && data[0]) setItemPlanId(data[0].id);
  }, [itemPlanId]);

  const loadItems = useCallback(async () => {
    const data = await fetchBudgetItems(itemPlanId || undefined);
    setItems(data);
  }, [itemPlanId]);

  useEffect(() => {
    const loader = tab === 'budget' ? loadAllPlans : loadPlans;
    loader().catch((e) => setError(e instanceof Error ? e.message : 'Falha ao carregar planos'));
  }, [tab, loadPlans, loadAllPlans]);

  useEffect(() => {
    if (tab === 'budget') {
      loadItems().catch((e) => setError(e instanceof Error ? e.message : 'Falha ao carregar itens'));
    }
  }, [tab, loadItems]);

  async function handleCreatePlan(e: React.FormEvent) {
    e.preventDefault();
    if (!planName.trim() || !planType) return;
    setLoading(true);
    setError(null);
    try {
      await createPlan({
        type: planType,
        year: planYear,
        name: planName.trim(),
        version: planVersion.trim() || 'v1',
      });
      setPlanName('');
      await loadPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao criar plano');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateItem(e: React.FormEvent) {
    e.preventDefault();
    if (!itemPlanId || !itemCode.trim() || !itemDescription.trim()) return;
    const cents = Math.round(Number(itemAmount.replace(',', '.')) * 100);
    if (!Number.isFinite(cents) || cents < 0) {
      setError('Valor inválido');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await createBudgetItem({
        planId: itemPlanId,
        code: itemCode.trim(),
        description: itemDescription.trim(),
        amountCents: cents,
      });
      setItemCode('');
      setItemDescription('');
      setItemAmount('');
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao criar item');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface-muted p-4 lg:p-8">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">P03 — Planejamento</p>
        <h1 className="text-xl font-bold text-slate-900 lg:text-2xl">Orçamento e Performance</h1>
        <p className="mt-1 text-sm text-slate-500">Abas PPA / LDO / LOA com versões simplificadas</p>
      </header>

      {error ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</div>
      ) : null}

      <nav className="mb-6 flex gap-1 rounded-lg bg-slate-100 p-1 w-fit">
        {(
          [
            { id: 'ppa' as const, label: 'PPA' },
            { id: 'ldo' as const, label: 'LDO' },
            { id: 'loa' as const, label: 'LOA' },
            { id: 'budget' as const, label: 'Itens orçamentários' },
          ] as const
        ).map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-md px-3 h-8 text-xs font-medium ${
              tab === id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab !== 'budget' ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <form onSubmit={handleCreatePlan} className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Plus className="h-4 w-4" />
              Novo {tab.toUpperCase()}
            </div>
            <label className="mt-4 block text-xs font-semibold uppercase text-slate-500">Ano</label>
            <input
              type="number"
              className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
              value={planYear}
              onChange={(e) => setPlanYear(Number(e.target.value))}
              required
            />
            <label className="mt-3 block text-xs font-semibold uppercase text-slate-500">Versão</label>
            <input
              className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
              value={planVersion}
              onChange={(e) => setPlanVersion(e.target.value)}
              placeholder="v1"
              required
            />
            <label className="mt-3 block text-xs font-semibold uppercase text-slate-500">Nome</label>
            <input
              className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder={`${tab.toUpperCase()} ${planYear}`}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="mt-4 h-9 w-full rounded-lg bg-brand-500 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {loading ? 'Salvando…' : `Criar ${tab.toUpperCase()}`}
            </button>
          </form>

          <section className="lg:col-span-2 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Target className="h-4 w-4" />
              {tab.toUpperCase()} ({plans.length})
            </div>
            {plans.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                Nenhum {tab.toUpperCase()} cadastrado.
              </div>
            ) : (
              plans.map((plan) => (
                <article key={plan.id} className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-card">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{plan.name}</p>
                      <p className="text-xs uppercase text-slate-500">
                        {plan.type} · {plan.year} · {plan.version ?? 'v1'}
                      </p>
                    </div>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold uppercase text-slate-600">
                      {plan.status}
                    </span>
                  </div>
                </article>
              ))
            )}
          </section>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <form onSubmit={handleCreateItem} className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Plus className="h-4 w-4" />
              Novo item
            </div>
            <label className="mt-4 block text-xs font-semibold uppercase text-slate-500">Plano</label>
            <select
              className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
              value={itemPlanId}
              onChange={(e) => setItemPlanId(e.target.value)}
              required
            >
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.type.toUpperCase()} · {plan.name}
                </option>
              ))}
            </select>
            <label className="mt-3 block text-xs font-semibold uppercase text-slate-500">Código</label>
            <input
              className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 font-mono text-sm"
              value={itemCode}
              onChange={(e) => setItemCode(e.target.value)}
              placeholder="10.301.0001"
              required
            />
            <label className="mt-3 block text-xs font-semibold uppercase text-slate-500">Descrição</label>
            <input
              className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
              value={itemDescription}
              onChange={(e) => setItemDescription(e.target.value)}
              required
            />
            <label className="mt-3 block text-xs font-semibold uppercase text-slate-500">Valor (R$)</label>
            <input
              className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
              value={itemAmount}
              onChange={(e) => setItemAmount(e.target.value)}
              placeholder="1000000.00"
              required
            />
            <button
              type="submit"
              disabled={loading || !itemPlanId}
              className="mt-4 h-9 w-full rounded-lg bg-brand-500 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {loading ? 'Salvando…' : 'Criar item'}
            </button>
          </form>

          <section className="lg:col-span-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Descrição</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                      Nenhum item orçamentário.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-mono text-xs">{item.code}</td>
                      <td className="px-4 py-3">{item.description}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatBrl(item.amountCents)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>
        </div>
      )}
    </div>
  );
}
