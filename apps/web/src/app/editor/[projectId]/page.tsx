'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api, ApiError } from '@/lib/api'
import { isAuthenticated } from '@/lib/auth'
import { EditorLayout } from '@/components/editor/EditorLayout'
import type { Project, SceneData } from '@own-a-factory/types'

const EMPTY_SCENE: SceneData = {
  version: 1,
  components: [],
  wiring: [],
  plcProgram: { language: 'ST', source: '' },
}

export default function EditorPage() {
  const params = useParams<{ projectId: string }>()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [scene, setScene] = useState<SceneData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login')
      return
    }

    async function load() {
      try {
        const [proj, latestScene] = await Promise.allSettled([
          api.projects.get(params.projectId),
          api.scenes.latest(params.projectId),
        ])

        if (proj.status === 'rejected') throw new Error('Project not found')
        setProject(proj.value)

        if (latestScene.status === 'fulfilled') {
          setScene(latestScene.value.data)
        } else {
          setScene(EMPTY_SCENE)
        }
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load project')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [params.projectId, router])

  async function handleSave(sceneData: SceneData) {
    await api.scenes.save(params.projectId, { data: sceneData, isManual: true })
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#71717a', fontSize: 14 }}>
        Loading...
      </div>
    )
  }

  if (error || !project || !scene) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16, color: '#71717a' }}>
        <p>{error ?? 'Something went wrong'}</p>
        <button onClick={() => router.push('/dashboard')} style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>
          Back to dashboard
        </button>
      </div>
    )
  }

  return (
    <EditorLayout
      projectId={project.id}
      projectName={project.name}
      initialScene={scene}
      onSave={handleSave}
    />
  )
}
