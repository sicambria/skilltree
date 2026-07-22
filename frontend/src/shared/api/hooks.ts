import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { authResponseSchema, loginSchema, registerSchema, userDataSchema, skillSchema, treeSchema, trainingSchema, planSchema, historyEntrySchema, communityFeedItemSchema, planProgressSchema, recommendationSchema, submitAllSchema, type UserData, type Skill, type Tree, type Training, type HistoryEntry, type Plan, type PlanProgress, type CommunityFeedItem, type Recommendation, type LoginInput, type RegisterInput, type SubmitAllInput } from './schemas';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/backend';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? document.cookie.match(/token=([^;]+)/)?.[1] : null;
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    credentials: 'include',
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

interface PaginatedResponse<T> {
  skills: T[];
  total: number;
  page: number;
  totalPages: number;
}

export function useSkills(params?: { category?: string; search?: string; page?: number; limit?: number }) {
  const searchParams = new URLSearchParams();
  if (params?.category) searchParams.set('category', params.category);
  if (params?.search) searchParams.set('search', params.search);
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());

  return useQuery<PaginatedResponse<Skill>>({
    queryKey: ['skills', params],
    queryFn: () => fetchJson<PaginatedResponse<Skill>>(`/protected/skills?${searchParams}`),
  });
}

export function useSkill(id: string) {
  return useQuery({
    queryKey: ['skill', id],
    queryFn: () => fetchJson<Skill>(`/protected/skills/${id}`),
    enabled: !!id,
  });
}

// Trees
export function useTrees(params?: { search?: string; page?: number; limit?: number }) {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set('search', params.search);
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());

  return useQuery({
    queryKey: ['trees', params],
    queryFn: () => fetchJson<Tree[]>(`/protected/trees?${searchParams}`),
  });
}

export function useTree(id: string) {
  return useQuery({
    queryKey: ['tree', id],
    queryFn: () => fetchJson<Tree>(`/protected/trees/${id}`),
    enabled: !!id,
  });
}

// Trainings
export function useTrainings(skillId?: string) {
  return useQuery({
    queryKey: ['trainings', skillId],
    queryFn: () => fetchJson<Training[]>(skillId ? `/protected/skills/${skillId}/trainings` : '/protected/trainings'),
    enabled: !!skillId,
  });
}

// Plan
export function usePlan() {
  return useQuery({
    queryKey: ['plan'],
    queryFn: () => fetchJson<Plan>('/protected/plan'),
  });
}

export function usePlanProgress() {
  return useQuery({
    queryKey: ['plan', 'progress'],
    queryFn: () => fetchJson<PlanProgress[]>('/protected/plan/progress'),
  });
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (plan: Plan) => fetchJson<Plan>('/protected/plan', {
      method: 'POST',
      body: JSON.stringify(plan),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan'] });
      queryClient.invalidateQueries({ queryKey: ['plan', 'progress'] });
    },
  });
}

// History
export function useHistory() {
  return useQuery({
    queryKey: ['history'],
    queryFn: () => fetchJson<HistoryEntry[]>('/allHistory'),
  });
}

// Community
export function useFeed(params?: { page?: number; limit?: number }) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());

  return useQuery({
    queryKey: ['feed', params],
    queryFn: () => fetchJson<CommunityFeedItem[]>(`/protected/feed?${searchParams}`),
  });
}

export function useRecommendations() {
  return useQuery({
    queryKey: ['recommendations'],
    queryFn: () => fetchJson<Recommendation[]>('/protected/recommendations'),
  });
}

// Submit skills (rating)
export function useSubmitSkills() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SubmitAllInput) => fetchJson<unknown>('/protected/submitall', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['history'] });
      queryClient.invalidateQueries({ queryKey: ['plan', 'progress'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

// Admin
export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => fetchJson<UserData[]>('/admin/users'),
  });
}

export function useSetAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) =>
      fetchJson(`/admin/users/${userId}/role`, {
        method: 'POST',
        body: JSON.stringify({ isAdmin }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}