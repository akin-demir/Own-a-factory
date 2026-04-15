import type {
  AuthResponse,
  RegisterRequest,
  LoginRequest,
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
  SceneVersion,
  SceneVersionWithData,
  SaveSceneRequest,
} from '@own-a-factory/types'

const BASE_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('oaf_token') : null

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }))
    throw new ApiError(res.status, (body as { message?: string }).message ?? res.statusText)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

export const api = {
  auth: {
    register: (body: RegisterRequest) =>
      request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),

    login: (body: LoginRequest) =>
      request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

    me: () => request<AuthResponse['user']>('/auth/me'),
  },

  projects: {
    list: () => request<Project[]>('/projects'),

    create: (body: CreateProjectRequest) =>
      request<Project>('/projects', { method: 'POST', body: JSON.stringify(body) }),

    get: (id: string) => request<Project>(`/projects/${id}`),

    update: (id: string, body: UpdateProjectRequest) =>
      request<Project>(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

    delete: (id: string) => request<void>(`/projects/${id}`, { method: 'DELETE' }),
  },

  scenes: {
    list: (projectId: string) =>
      request<SceneVersion[]>(`/projects/${projectId}/scenes`),

    latest: (projectId: string) =>
      request<SceneVersionWithData>(`/projects/${projectId}/scenes/latest`),

    get: (projectId: string, version: number) =>
      request<SceneVersionWithData>(`/projects/${projectId}/scenes/${version}`),

    save: (projectId: string, body: SaveSceneRequest) =>
      request<SceneVersionWithData>(`/projects/${projectId}/scenes`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },
}
