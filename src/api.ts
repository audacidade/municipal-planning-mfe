export interface Plan {
  id: string;
  type: 'ppa' | 'ldo' | 'loa';
  year: number;
  name: string;
  version: string;
  status: string;
}

export interface BudgetItem {
  id: string;
  planId: string;
  code: string;
  description: string;
  amountCents: string;
}

export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function toPage<T>(data: T[] | PageResult<T>, page: number, pageSize: number): PageResult<T> {
  if (Array.isArray(data)) {
    return {
      items: data,
      total: data.length,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(data.length / pageSize) || 1),
    };
  }
  return data;
}

export async function fetchPlans(params: {
  type?: Plan['type'];
  status?: string;
  q?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<PageResult<Plan>> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  const qs = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (params.type) qs.set('type', params.type);
  if (params.status) qs.set('status', params.status);
  if (params.q) qs.set('q', params.q);
  const response = await fetch(`/core/plans?${qs}`);
  return toPage(await parseJson(response), page, pageSize);
}

export async function createPlan(input: {
  type: Plan['type'];
  year: number;
  name: string;
  version?: string;
}): Promise<Plan> {
  const response = await fetch('/core/plans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseJson(response);
}

export async function updatePlan(
  id: string,
  input: { name?: string; year?: number; version?: string },
): Promise<Plan> {
  const response = await fetch(`/core/plans/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseJson(response);
}

export async function deletePlan(id: string): Promise<void> {
  await parseJson(await fetch(`/core/plans/${id}`, { method: 'DELETE' }));
}

export async function approvePlan(id: string): Promise<Plan> {
  return parseJson(await fetch(`/core/plans/${id}/approve`, { method: 'POST' }));
}

export async function createPlanVersion(id: string): Promise<Plan> {
  return parseJson(await fetch(`/core/plans/${id}/new-version`, { method: 'POST' }));
}

export async function fetchBudgetItems(params: {
  planId?: string;
  q?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<PageResult<BudgetItem>> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  const qs = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (params.planId) qs.set('planId', params.planId);
  if (params.q) qs.set('q', params.q);
  const response = await fetch(`/core/budget-items?${qs}`);
  return toPage(await parseJson(response), page, pageSize);
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

export async function updateBudgetItem(
  id: string,
  input: { code?: string; description?: string; amountCents?: number },
): Promise<BudgetItem> {
  const response = await fetch(`/core/budget-items/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseJson(response);
}

export async function deleteBudgetItem(id: string): Promise<void> {
  await parseJson(await fetch(`/core/budget-items/${id}`, { method: 'DELETE' }));
}

export function formatBrl(cents: string | number): string {
  const value = typeof cents === 'string' ? Number(cents) : cents;
  return (value / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
