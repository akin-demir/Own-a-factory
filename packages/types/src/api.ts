import type { SceneData } from './scene.js'

export interface AuthUser {
  id: string
  email: string
  name: string | null
  avatarUrl: string | null
}

export interface RegisterRequest {
  email: string
  password: string
  name?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  user: AuthUser
}

export interface Project {
  id: string
  name: string
  description: string | null
  isTemplate: boolean
  ownerId: string
  orgId: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateProjectRequest {
  name: string
  description?: string
}

export interface UpdateProjectRequest {
  name?: string
  description?: string
}

export interface SceneVersion {
  id: string
  projectId: string
  version: number
  isManual: boolean
  label: string | null
  createdAt: string
}

export interface SceneVersionWithData extends SceneVersion {
  data: SceneData
}

export interface SaveSceneRequest {
  data: SceneData
  isManual?: boolean
  label?: string
}

export interface ApiError {
  error: string
  message: string
  statusCode: number
}
