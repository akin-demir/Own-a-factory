import Link from 'next/link'
import type { Project } from '@own-a-factory/types'
import styles from './ProjectCard.module.css'

interface Props {
  project: Project
  onDelete: (id: string) => void
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export function ProjectCard({ project, onDelete }: Props) {
  return (
    <div className={styles.card}>
      <div className={styles.preview}>
        <span className={styles.previewIcon}>🏭</span>
      </div>
      <div className={styles.body}>
        <h3 className={styles.name}>{project.name}</h3>
        {project.description && (
          <p className={styles.description}>{project.description}</p>
        )}
        <span className={styles.meta}>Updated {timeAgo(project.updatedAt)}</span>
      </div>
      <div className={styles.actions}>
        <Link href={`/editor/${project.id}`} className={styles.btnPrimary}>
          Edit
        </Link>
        <Link href={`/editor/${project.id}?run=1`} className={styles.btnSecondary}>
          Run
        </Link>
        <button
          className={styles.btnDanger}
          onClick={() => onDelete(project.id)}
          aria-label="Delete project"
        >
          Delete
        </button>
      </div>
    </div>
  )
}
