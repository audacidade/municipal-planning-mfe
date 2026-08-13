import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Pencil, Plus, Target, Trash2 } from 'lucide-react';
import {
  approvePlan,
  createBudgetItem,
  createPlan,
  createPlanVersion,
  deleteBudgetItem,
  deletePlan,
  fetchBudgetItems,
  fetchPlans,
  formatBrl,
  updateBudgetItem,
  updatePlan,
  type BudgetItem,
  type Plan,
} from './api';
import {
  cardClass,
  dangerBtnClass,
  fieldClass,
  filterClass,
  labelClass,
  primaryBtnClass,
  secondaryBtnClass,
} from './ui';
import './styles.css';

type Tab = 'ppa' | 'ldo' | 'loa' | 'budget';

function Pagination({
  page,
  totalPages,
  total,
  onChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onChange: (p: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 pt-3">
      <p className="text-xs text-slate-500">
        {total} registro{total === 1 ? '' : 's'} · página {page} de {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <button type="button" className={secondaryBtnClass} disabled={page <= 1} onClick={() => onChange(page - 1)}>
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className={secondaryBtnClass}
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function PlanningApp() {
  const [tab, setTab] = useState<Tab>('ppa');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [planTotal, setPlanTotal] = useState(0);
  const [planPages, setPlanPages] = useState(1);
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [itemTotal, setItemTotal] = useState(0);
  const [itemPages, setItemPages] = useState(1);
  const [allPlans, setAllPlans] = useState<Plan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);

  const [planYear, setPlanYear] = useState(2026);
  const [planName, setPlanName] = useState('');
  const [planVersion, setPlanVersion] = useState('v1');

  const [itemPlanId, setItemPlanId] = useState('');
  const [itemCode, setItemCode] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemAmount, setItemAmount] = useState('');
  const [itemQ, setItemQ] = useState('');

  const planType: Plan['type'] | null = tab === 'budget' ? null : tab;
  const pageSize = 8;

  const loadPlans = useCallback(async () => {
    if (!planType) return;
    const data = await fetchPlans({
      type: planType,
      status: statusFilter || undefined,
      q: q || undefined,
      page,
      pageSize,
    });
    setPlans(data.items);
    setPlanTotal(data.total);
    setPlanPages(data.totalPages);
  }, [planType, statusFilter, q, page]);

  const loadItems = useCallback(async () => {
    const data = await fetchBudgetItems({
      planId: itemPlanId || undefined,
      q: itemQ || undefined,
      page,
      pageSize,
    });
    setItems(data.items);
    setItemTotal(data.total);
    setItemPages(data.totalPages);
  }, [itemPlanId, itemQ, page]);

  useEffect(() => {
    setPage(1);
  }, [tab, q, statusFilter, itemPlanId, itemQ]);

  useEffect(() => {
    if (tab === 'budget') {
      fetchPlans({ page: 1, pageSize: 100 })
        .then((data) => {
          setAllPlans(data.items);
          if (!itemPlanId && data.items[0]) setItemPlanId(data.items[0].id);
        })
        .catch((e) => setError(e instanceof Error ? e.message : 'Falha ao carregar planos'));
      loadItems().catch((e) => setError(e instanceof Error ? e.message : 'Falha ao carregar itens'));
    } else {
      loadPlans().catch((e) => setError(e instanceof Error ? e.message : 'Falha ao carregar planos'));
    }
  }, [tab, loadPlans, loadItems, itemPlanId]);

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

  async function handleSavePlan(e: React.FormEvent) {
    e.preventDefault();
    if (!editingPlan) return;
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget as HTMLFormElement);
    try {
      await updatePlan(editingPlan.id, {
        name: String(form.get('name')),
        year: Number(form.get('year')),
        version: String(form.get('version')),
      });
      setEditingPlan(null);
      await loadPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao atualizar plano');
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
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">Planejamento</p>
        <h1 className="text-xl font-bold text-slate-900 lg:text-2xl">Orçamento e Performance</h1>
        <p className="mt-1 text-sm text-slate-500">PPA, LDO, LOA e itens orçamentários</p>
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
          <form onSubmit={handleCreatePlan} className={`${cardClass} p-5`}>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Plus className="h-4 w-4" />
              Novo {tab.toUpperCase()}
            </div>
            <label className={`mt-4 block ${labelClass}`}>Ano</label>
            <input
              type="number"
              className={fieldClass}
              value={planYear}
              onChange={(e) => setPlanYear(Number(e.target.value))}
              required
            />
            <label className={`mt-3 block ${labelClass}`}>Versão</label>
            <input
              className={fieldClass}
              value={planVersion}
              onChange={(e) => setPlanVersion(e.target.value)}
              placeholder="v1"
              required
            />
            <label className={`mt-3 block ${labelClass}`}>Nome</label>
            <input
              className={fieldClass}
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder={`${tab.toUpperCase()} ${planYear}`}
              required
            />
            <button type="submit" disabled={loading} className={`${primaryBtnClass} mt-4 w-full`}>
              {loading ? 'Salvando…' : `Criar ${tab.toUpperCase()}`}
            </button>
          </form>

          <section className="lg:col-span-2 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 mr-auto">
                <Target className="h-4 w-4" />
                {tab.toUpperCase()}
              </div>
              <input
                className={`${filterClass} min-w-[160px]`}
                placeholder="Buscar…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <select
                className={filterClass}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="draft">Rascunho</option>
                <option value="approved">Aprovado</option>
              </select>
            </div>

            {editingPlan && (
              <form onSubmit={handleSavePlan} className={`${cardClass} p-4 space-y-3`}>
                <p className="text-sm font-semibold text-slate-800">Editar plano</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input name="name" required defaultValue={editingPlan.name} className={fieldClass} />
                  <input
                    name="year"
                    type="number"
                    required
                    defaultValue={editingPlan.year}
                    className={fieldClass}
                  />
                  <input name="version" required defaultValue={editingPlan.version} className={fieldClass} />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className={primaryBtnClass} disabled={loading}>
                    Salvar
                  </button>
                  <button type="button" className={secondaryBtnClass} onClick={() => setEditingPlan(null)}>
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            {plans.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                Nenhum {tab.toUpperCase()} cadastrado.
              </div>
            ) : (
              plans.map((plan) => (
                <article key={plan.id} className={`${cardClass} px-5 py-4`}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{plan.name}</p>
                      <p className="text-xs uppercase text-slate-500">
                        {plan.type} · {plan.year} · {plan.version ?? 'v1'}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold uppercase text-slate-600">
                        {plan.status === 'draft' ? 'Rascunho' : 'Aprovado'}
                      </span>
                      {plan.status === 'draft' ? (
                        <>
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => setEditingPlan(plan)}
                            className={secondaryBtnClass}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Editar
                          </button>
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() =>
                              approvePlan(plan.id)
                                .then(loadPlans)
                                .catch((err) =>
                                  setError(err instanceof Error ? err.message : 'Falha ao aprovar'),
                                )
                            }
                            className={secondaryBtnClass}
                          >
                            Aprovar
                          </button>
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() =>
                              deletePlan(plan.id)
                                .then(loadPlans)
                                .catch((err) =>
                                  setError(err instanceof Error ? err.message : 'Falha ao excluir'),
                                )
                            }
                            className={dangerBtnClass}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Excluir
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() =>
                            createPlanVersion(plan.id)
                              .then(loadPlans)
                              .catch((err) =>
                                setError(err instanceof Error ? err.message : 'Falha ao versionar'),
                              )
                          }
                          className={secondaryBtnClass}
                        >
                          Nova versão
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))
            )}
            <Pagination page={page} totalPages={planPages} total={planTotal} onChange={setPage} />
          </section>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <form onSubmit={handleCreateItem} className={`${cardClass} p-5`}>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Plus className="h-4 w-4" />
              Novo item
            </div>
            <label className={`mt-4 block ${labelClass}`}>Plano</label>
            <select
              className={fieldClass}
              value={itemPlanId}
              onChange={(e) => setItemPlanId(e.target.value)}
              required
            >
              {allPlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.type.toUpperCase()} · {plan.name}
                </option>
              ))}
            </select>
            <label className={`mt-3 block ${labelClass}`}>Código</label>
            <input
              className={`${fieldClass} font-mono`}
              value={itemCode}
              onChange={(e) => setItemCode(e.target.value)}
              placeholder="10.301.0001"
              required
            />
            <label className={`mt-3 block ${labelClass}`}>Descrição</label>
            <input
              className={fieldClass}
              value={itemDescription}
              onChange={(e) => setItemDescription(e.target.value)}
              required
            />
            <label className={`mt-3 block ${labelClass}`}>Valor (R$)</label>
            <input
              className={fieldClass}
              value={itemAmount}
              onChange={(e) => setItemAmount(e.target.value)}
              placeholder="1000000.00"
              required
            />
            <button
              type="submit"
              disabled={loading || !itemPlanId}
              className={`${primaryBtnClass} mt-4 w-full`}
            >
              {loading ? 'Salvando…' : 'Criar item'}
            </button>
          </form>

          <section className={`lg:col-span-2 ${cardClass}`}>
            <div className="flex flex-wrap gap-2 px-5 py-4 border-b border-slate-100">
              <input
                className={`${filterClass} flex-1 min-w-[160px]`}
                placeholder="Buscar código ou descrição…"
                value={itemQ}
                onChange={(e) => setItemQ(e.target.value)}
              />
            </div>
            {editingItem && (
              <form
                className="px-5 py-4 border-b border-slate-100 space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = new FormData(e.currentTarget);
                  const cents = Math.round(Number(String(form.get('amount')).replace(',', '.')) * 100);
                  updateBudgetItem(editingItem.id, {
                    code: String(form.get('code')),
                    description: String(form.get('description')),
                    amountCents: cents,
                  })
                    .then(() => {
                      setEditingItem(null);
                      return loadItems();
                    })
                    .catch((err) => setError(err instanceof Error ? err.message : 'Falha ao editar'));
                }}
              >
                <p className="text-sm font-semibold">Editar item</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input name="code" required defaultValue={editingItem.code} className={fieldClass} />
                  <input
                    name="description"
                    required
                    defaultValue={editingItem.description}
                    className={fieldClass}
                  />
                  <input
                    name="amount"
                    required
                    defaultValue={(Number(editingItem.amountCents) / 100).toFixed(2)}
                    className={fieldClass}
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className={primaryBtnClass}>
                    Salvar
                  </button>
                  <button type="button" className={secondaryBtnClass} onClick={() => setEditingItem(null)}>
                    Cancelar
                  </button>
                </div>
              </form>
            )}
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Descrição</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                  <th className="px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                      Nenhum item orçamentário.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-mono text-xs">{item.code}</td>
                      <td className="px-4 py-3">{item.description}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatBrl(item.amountCents)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className={secondaryBtnClass}
                            onClick={() => setEditingItem(item)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Editar
                          </button>
                          <button
                            type="button"
                            className={dangerBtnClass}
                            onClick={() =>
                              deleteBudgetItem(item.id)
                                .then(loadItems)
                                .catch((err) =>
                                  setError(err instanceof Error ? err.message : 'Falha ao excluir'),
                                )
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="px-5 pb-4">
              <Pagination page={page} totalPages={itemPages} total={itemTotal} onChange={setPage} />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
