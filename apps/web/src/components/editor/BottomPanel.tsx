'use client'

import { useState } from 'react'
import styles from './BottomPanel.module.css'
import type { ComponentInstance, WiringEntry } from '@own-a-factory/types'

type Tab = 'tree' | 'tags' | 'plc' | 'wiring' | 'console'

interface Props {
  components: ComponentInstance[]
  wiring: WiringEntry[]
  plcSource: string
  onPlcChange: (src: string) => void
  isRunning: boolean
  consoleLogs: string[]
  liveTags: Record<string, boolean | number | string>
}

export function BottomPanel({
  components,
  wiring,
  plcSource,
  onPlcChange,
  isRunning,
  consoleLogs,
  liveTags,
}: Props) {
  const [tab, setTab] = useState<Tab>('tree')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'tree', label: 'Scene Tree' },
    { id: 'tags', label: 'Tag Monitor' },
    { id: 'plc', label: 'PLC Editor' },
    { id: 'wiring', label: 'Wiring' },
    { id: 'console', label: 'Console' },
  ]

  return (
    <div className={styles.panel}>
      <div className={styles.tabs}>
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {tab === 'tree' && (
          <div className={styles.tree}>
            {components.length === 0 ? (
              <div className={styles.empty}>No components placed. Drag from the library.</div>
            ) : (
              components.map((c) => (
                <div key={c.instanceId} className={styles.treeItem}>
                  <span className={styles.treeIcon}>◎</span>
                  <span className={styles.treeName}>{c.tagAlias}</span>
                  <span className={styles.treeType}>{c.typeId}</span>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'tags' && (
          <div className={styles.tagMonitor}>
            <div className={styles.tagHeader}>
              <span>Tag Name</span>
              <span>Value</span>
              <span>Type</span>
            </div>
            {Object.entries(liveTags).length === 0 ? (
              <div className={styles.empty}>Run simulation to see live tag values</div>
            ) : (
              Object.entries(liveTags).map(([name, val]) => (
                <div key={name} className={styles.tagRow}>
                  <span className={styles.tagName}>{name}</span>
                  <span className={`${styles.tagVal} ${val === true ? styles.valTrue : val === false ? styles.valFalse : ''}`}>
                    {typeof val === 'boolean' ? (val ? 'TRUE' : 'FALSE') : String(val)}
                  </span>
                  <span className={styles.tagType}>{typeof val === 'boolean' ? 'BOOL' : typeof val === 'number' ? 'REAL' : 'STR'}</span>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'plc' && (
          <div className={styles.plcEditor}>
            <textarea
              className={styles.plcTextarea}
              value={plcSource}
              onChange={(e) => onPlcChange(e.target.value)}
              disabled={isRunning}
              spellCheck={false}
              placeholder={`PROGRAM main\n  VAR\n    Sensor1 AT %IX0.0 : BOOL;\n    Conveyor1 AT %QX0.0 : BOOL;\n  END_VAR\n\n  IF Sensor1 THEN\n    Conveyor1 := TRUE;\n  END_IF;\n\nEND_PROGRAM`}
            />
            {isRunning && (
              <div className={styles.plcRunning}>PLC running — stop simulation to edit</div>
            )}
          </div>
        )}

        {tab === 'wiring' && (
          <div className={styles.wiring}>
            <div className={styles.wiringHeader}>
              <span>Component Tag</span>
              <span>PLC Address</span>
            </div>
            {wiring.length === 0 ? (
              <div className={styles.empty}>No wiring configured. Connect tags to PLC addresses.</div>
            ) : (
              wiring.map((w, i) => (
                <div key={i} className={styles.wiringRow}>
                  <span className={styles.wiringTag}>{w.componentTag}</span>
                  <span className={styles.wiringArrow}>→</span>
                  <span className={styles.wiringAddr}>{w.plcAddress}</span>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'console' && (
          <div className={styles.console}>
            {consoleLogs.length === 0 ? (
              <div className={styles.empty}>Console output will appear here</div>
            ) : (
              consoleLogs.map((log, i) => (
                <div key={i} className={styles.logLine}>{log}</div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
