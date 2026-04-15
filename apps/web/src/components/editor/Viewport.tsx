'use client'

import styles from './Viewport.module.css'

interface Props {
  isRunning: boolean
}

export function Viewport({ isRunning }: Props) {
  return (
    <div className={styles.viewport}>
      <div className={styles.canvas} id="babylon-canvas">
        {/* Babylon.js will mount here */}
        <div className={styles.placeholder}>
          <div className={styles.placeholderIcon}>🏭</div>
          <div className={styles.placeholderText}>3D Viewport</div>
          <div className={styles.placeholderHint}>
            Babylon.js scene loads here
          </div>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.cameraControls}>
          <button className={styles.camBtn} title="Orbit view">Orbit</button>
          <button className={styles.camBtn} title="Top view">Top</button>
          <button className={styles.camBtn} title="Front view">Front</button>
          <button className={styles.camBtn} title="Isometric view">ISO</button>
        </div>
        <div className={styles.gridControls}>
          <label className={styles.toggle}>
            <input type="checkbox" defaultChecked />
            <span>Grid</span>
          </label>
          <label className={styles.toggle}>
            <input type="checkbox" defaultChecked />
            <span>Snap</span>
          </label>
        </div>
        {isRunning && (
          <div className={styles.runIndicator}>
            <span className={styles.runDot} />
            RUNNING
          </div>
        )}
      </div>
    </div>
  )
}
