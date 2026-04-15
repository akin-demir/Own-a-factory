'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { ComponentLibrary } from './ComponentLibrary'
import { PropertiesPanel } from './PropertiesPanel'
import { Viewport } from './Viewport'
import { BottomPanel } from './BottomPanel'
import styles from './EditorLayout.module.css'
import type { ComponentInstance, WiringEntry, SceneData } from '@own-a-factory/types'

interface Props {
  projectId: string
  projectName: string
  initialScene: SceneData
  onSave: (scene: SceneData) => Promise<void>
}

export function EditorLayout({ projectId: _projectId, projectName, initialScene, onSave }: Props) {
  const [scene, setScene] = useState<SceneData>(initialScene)
  const [isRunning, setIsRunning] = useState(false)
  const [selected, setSelected] = useState<ComponentInstance | null>(null)
  const [consoleLogs, setConsoleLogs] = useState<string[]>([])
  const [liveTags, setLiveTags] = useState<Record<string, boolean | number | string>>({})
  const [saving, setSaving] = useState(false)
  const [saveLabel, setSaveLabel] = useState<'saved' | 'saving' | 'unsaved'>('saved')

  function log(msg: string) {
    const ts = new Date().toLocaleTimeString('en-GB', { hour12: false })
    setConsoleLogs((prev) => [...prev.slice(-199), `[${ts}] ${msg}`])
  }

  function handleRun() {
    setIsRunning(true)
    log('Simulation started')
  }

  function handleStop() {
    setIsRunning(false)
    setLiveTags({})
    log('Simulation stopped')
  }

  function handlePause() {
    log('Simulation paused')
  }

  async function handleSave() {
    setSaving(true)
    setSaveLabel('saving')
    try {
      await onSave(scene)
      setSaveLabel('saved')
    } catch {
      setSaveLabel('unsaved')
    } finally {
      setSaving(false)
    }
  }

  const handlePlcChange = useCallback((src: string) => {
    setScene((prev) => ({ ...prev, plcProgram: { language: 'ST', source: src } }))
    setSaveLabel('unsaved')
  }, [])

  return (
    <div className={styles.shell}>
      {/* Top Bar */}
      <header className={styles.topBar}>
        <div className={styles.topLeft}>
          <Link href="/dashboard" className={styles.backBtn} title="Back to dashboard">
            ←
          </Link>
          <span className={styles.projectName}>{projectName}</span>
          <button
            className={`${styles.saveBtn} ${saveLabel === 'unsaved' ? styles.saveBtnUnsaved : ''}`}
            onClick={handleSave}
            disabled={saving || saveLabel === 'saved'}
          >
            {saveLabel === 'saving' ? 'Saving...' : saveLabel === 'saved' ? 'Saved' : 'Save'}
          </button>
        </div>

        <div className={styles.topCenter}>
          {!isRunning ? (
            <button className={styles.runBtn} onClick={handleRun}>
              ▶ Run
            </button>
          ) : (
            <>
              <button className={styles.stopBtn} onClick={handleStop}>
                ■ Stop
              </button>
              <button className={styles.pauseBtn} onClick={handlePause}>
                ⏸ Pause
              </button>
              <span className={styles.runningBadge}>
                <span className={styles.runDot} /> RUNNING
              </span>
            </>
          )}
        </div>

        <div className={styles.topRight}>
          <button className={styles.shareBtn}>Share</button>
        </div>
      </header>

      {/* Main 3-panel body */}
      <div className={styles.body}>
        {/* Left: Component Library (edit) / Tag Monitor (run) */}
        <aside className={styles.leftPanel}>
          <div className={styles.panelLabel}>
            {isRunning ? 'LIVE TAGS' : 'COMPONENTS'}
          </div>
          {isRunning ? (
            <div className={styles.liveTagList}>
              {Object.entries(liveTags).length === 0 ? (
                <div className={styles.panelEmpty}>Waiting for tag data...</div>
              ) : (
                Object.entries(liveTags).map(([k, v]) => (
                  <div key={k} className={styles.liveTagRow}>
                    <span className={styles.liveTagName}>{k}</span>
                    <span className={`${styles.liveTagVal} ${v === true ? styles.liveTrue : ''}`}>
                      {typeof v === 'boolean' ? (v ? 'TRUE' : 'FALSE') : String(v)}
                    </span>
                  </div>
                ))
              )}
            </div>
          ) : (
            <ComponentLibrary
              onDragStart={(id) => console.log('drag start:', id)}
            />
          )}
        </aside>

        {/* Center: 3D Viewport */}
        <main className={styles.viewport}>
          <Viewport isRunning={isRunning} />
        </main>

        {/* Right: Properties */}
        <aside className={styles.rightPanel}>
          <div className={styles.panelLabel}>PROPERTIES</div>
          <PropertiesPanel
            selected={selected}
            isRunning={isRunning}
            liveTags={selected ? Object.fromEntries(
              Object.entries(liveTags).filter(([k]) => k.startsWith(selected.tagAlias + '.'))
            ) : {}}
          />
        </aside>
      </div>

      {/* Bottom Panel */}
      <div className={styles.bottomPanel}>
        <BottomPanel
          components={scene.components}
          wiring={scene.wiring}
          plcSource={scene.plcProgram.source}
          onPlcChange={handlePlcChange}
          isRunning={isRunning}
          consoleLogs={consoleLogs}
          liveTags={liveTags}
        />
      </div>
    </div>
  )
}
