'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, ApiError } from '@/lib/api'
import { isAuthenticated, clearAuth, getUser } from '@/lib/auth'
import { ProjectCard } from '@/components/dashboard/ProjectCard'
import type { Project } from '@own-a-factory/types'
import styles from './dashboard.module.css'

export default function DashboardPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const user = getUser()

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login')
      return
    }
    api.projects
      .list()
      .then(setProjects)
      .catch(() => setProjects([]))
      .finally(() => setLoading(false))
  }, [router])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    try {
      const project = await api.projects.create({ name: newName.trim() })
      router.push(`/editor/${project.id}`)
    } catch {
      setCreating(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this project? This cannot be undone.')) return
    await api.projects.delete(id).catch(() => null)
    setProjects((prev) => prev.filter((p) => p.id !== id))
  }

  function handleSignOut() {
    clearAuth()
    router.push('/login')
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.logo}>⚙ Own-a-Factory</span>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.userName}>{user?.name ?? user?.email}</span>
          <button className={styles.signOut} onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>My Projects</h2>
            <button className={styles.newBtn} onClick={() => setShowCreate(true)}>
              + New Project
            </button>
          </div>

          {showCreate && (
            <form onSubmit={handleCreate} className={styles.createForm}>
              <input
                autoFocus
                type="text"
                placeholder="Project name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className={styles.createInput}
              />
              <button type="submit" className={styles.createSubmit} disabled={creating}>
                {creating ? 'Creating...' : 'Create'}
              </button>
              <button
                type="button"
                className={styles.createCancel}
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </button>
            </form>
          )}

          {loading ? (
            <div className={styles.empty}>Loading...</div>
          ) : projects.length === 0 ? (
            <div className={styles.empty}>
              <p>No projects yet.</p>
              <button className={styles.newBtn} onClick={() => setShowCreate(true)}>
                Create your first project
              </button>
            </div>
          ) : (
            <div className={styles.grid}>
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
