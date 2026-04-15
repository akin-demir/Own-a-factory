'use client'

import styles from './PropertiesPanel.module.css'
import type { ComponentInstance } from '@own-a-factory/types'

interface Props {
  selected: ComponentInstance | null
  isRunning: boolean
  liveTags?: Record<string, boolean | number | string>
}

export function PropertiesPanel({ selected, isRunning, liveTags = {} }: Props) {
  if (!selected) {
    return (
      <div className={styles.panel}>
        <div className={styles.empty}>
          <p>Select a component</p>
          <p className={styles.hint}>Click any component in the viewport to view its properties and I/O tags.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.typeId}>{selected.typeId}</span>
        <span className={styles.alias}>{selected.tagAlias}</span>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Parameters</div>
        {Object.entries(selected.paramValues).length === 0 ? (
          <div className={styles.sectionEmpty}>No configurable parameters</div>
        ) : (
          Object.entries(selected.paramValues).map(([key, val]) => (
            <div key={key} className={styles.row}>
              <span className={styles.rowLabel}>{key}</span>
              {isRunning ? (
                <span className={styles.rowValue}>{String(val)}</span>
              ) : (
                <span className={styles.rowValue}>{String(val)}</span>
              )}
            </div>
          ))
        )}
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Position</div>
        {(['x', 'y', 'z'] as const).map((axis, i) => (
          <div key={axis} className={styles.row}>
            <span className={styles.rowLabel}>{axis.toUpperCase()}</span>
            <span className={styles.rowValue}>{(selected.position[i] ?? 0).toFixed(3)}</span>
          </div>
        ))}
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>I/O Tags</div>
        <div className={styles.tagList}>
          {Object.entries(liveTags).length === 0 ? (
            <div className={styles.sectionEmpty}>No live tags — run simulation</div>
          ) : (
            Object.entries(liveTags).map(([tag, val]) => (
              <div key={tag} className={styles.tagRow}>
                <span className={styles.tagName}>{tag}</span>
                <span className={`${styles.tagValue} ${val === true ? styles.tagTrue : val === false ? styles.tagFalse : ''}`}>
                  {typeof val === 'boolean' ? (val ? 'TRUE' : 'FALSE') : String(val)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {!isRunning && (
        <div className={styles.deleteRow}>
          <button className={styles.deleteBtn}>Delete Component</button>
        </div>
      )}
    </div>
  )
}
