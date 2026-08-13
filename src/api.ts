export interface Plan {
  id: string;
  type: 'ppa' | 'ldo' | 'loa';
  year: number;
  name: string;
  status: string;
}

export interface BudgetItem {
  id: string;
  planId: string;
  code: string;
  description: string;
  amountCents: string;
}

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchPlans(): Promise<Plan[]> {
  const response = await fetch('/core/plans');
  const data = await parseJson<Plan[] | { items: Plan[] }>(response);
  return Array.isArray(data) ? data : data.items ?? [];
}

export async function createPlan(input: {
  type: Plan['type'];
  year: number;
  name: string;
}): Promise<Plan> {
  const response = await fetch('/core/plans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseJson(response);
}

export async function fetchBudgetItems(planId?: string): Promise<BudgetItem[]> {
  const qs = planId ? `?planId=${encodeURIComponent(planId)}` : '';
  const response = await fetch(`/core/budget-items${qs}`);
  const data = await parseJson<BudgetItem[] | { items: BudgetItem[] }>(response);
  return Array.isArray(data) ? data : data.items ?? [];
}

export async function createBudgetItem(input: {
  planId: string;
  code: string;
  description: string;
  amountCents: number;
}): Promise<BudgetItem> {
  const response = await fetch('/core/budget-items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseJson(response);
}

export function formatBrl(cents: string | number): string {
  const value = typeof cents === 'string' ? Number(cents) : cents;
  return (value / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
