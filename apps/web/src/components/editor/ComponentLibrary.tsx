'use client'

import { useState } from 'react'
import styles from './ComponentLibrary.module.css'

interface ComponentEntry {
  id: string
  displayName: string
  category: string
  subtype: string
}

const BUILTIN_COMPONENTS: ComponentEntry[] = [
  // Sensors
  { id: 'ir-proximity-generic', displayName: 'IR Proximity', category: 'sensor', subtype: 'proximity' },
  { id: 'photoelectric-generic', displayName: 'Photoelectric', category: 'sensor', subtype: 'photoelectric' },
  { id: 'inductive-generic', displayName: 'Inductive', category: 'sensor', subtype: 'inductive' },
  { id: 'capacitive-generic', displayName: 'Capacitive', category: 'sensor', subtype: 'capacitive' },
  { id: 'ultrasonic-generic', displayName: 'Ultrasonic', category: 'sensor', subtype: 'ultrasonic' },
  { id: 'encoder-generic', displayName: 'Encoder', category: 'sensor', subtype: 'encoder' },
  { id: 'vision-generic', displayName: 'Vision Camera', category: 'sensor', subtype: 'vision' },
  // Actuators
  { id: 'conveyor-straight', displayName: 'Conveyor (Straight)', category: 'actuator', subtype: 'conveyor' },
  { id: 'conveyor-curved', displayName: 'Conveyor (Curved)', category: 'actuator', subtype: 'conveyor' },
  { id: 'pneumatic-cylinder', displayName: 'Pneumatic Cylinder', category: 'actuator', subtype: 'cylinder' },
  { id: 'rotary-table', displayName: 'Rotary Table', category: 'actuator', subtype: 'rotary' },
  { id: 'pick-place-robot', displayName: 'Pick & Place Robot', category: 'actuator', subtype: 'robot' },
  // Emitters
  { id: 'box-emitter', displayName: 'Box Emitter', category: 'emitter', subtype: 'emitter' },
  { id: 'pallet-emitter', displayName: 'Pallet Emitter', category: 'emitter', subtype: 'emitter' },
  // Storage
  { id: 'shelf-rack', displayName: 'Shelf Rack', category: 'storage', subtype: 'rack' },
  // Signaling
  { id: 'signal-tower', displayName: 'Signal Tower', category: 'signaling', subtype: 'tower' },
  { id: 'hmi-panel', displayName: 'HMI Panel', category: 'signaling', subtype: 'hmi' },
]

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'sensor', label: 'Sensors' },
  { id: 'actuator', label: 'Actuators' },
  { id: 'emitter', label: 'Emitters' },
  { id: 'storage', label: 'Storage' },
  { id: 'signaling', label: 'Signaling' },
]

const CATEGORY_ICONS: Record<string, string> = {
  sensor: '◎',
  actuator: '▶',
  emitter: '⊕',
  storage: '▣',
  signaling: '◈',
}

interface Props {
  onDragStart?: (componentId: string) => void
}

export function ComponentLibrary({ onDragStart }: Props) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  const filtered = BUILTIN_COMPONENTS.filter((c) => {
    const matchesSearch =
      !search || c.displayName.toLowerCase().includes(search.toLowerCase())
    const matchesCategory =
      activeCategory === 'all' || c.category === activeCategory
    return matchesSearch && matchesCategory
  })

  // Group by category
  const groups: Record<string, ComponentEntry[]> = {}
  for (const c of filtered) {
    if (!groups[c.category]) groups[c.category] = []
    groups[c.category]!.push(c)
  }

  return (
    <div className={styles.panel}>
      <div className={styles.search}>
        <span className={styles.searchIcon}>🔍</span>
        <input
          type="text"
          placeholder="Search components..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.categories}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className={`${styles.catBtn} ${activeCategory === cat.id ? styles.catBtnActive : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className={styles.list}>
        {Object.entries(groups).map(([category, items]) => (
          <div key={category} className={styles.group}>
            <div className={styles.groupLabel}>
              <span>{CATEGORY_ICONS[category] ?? '◆'}</span>
              {category.charAt(0).toUpperCase() + category.slice(1)}s
            </div>
            {items.map((item) => (
              <div
                key={item.id}
                className={styles.item}
                draggable
                onDragStart={() => onDragStart?.(item.id)}
                title={`Drag to place ${item.displayName}`}
              >
                <span className={styles.itemIcon}>{CATEGORY_ICONS[item.category] ?? '◆'}</span>
                <span className={styles.itemName}>{item.displayName}</span>
              </div>
            ))}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className={styles.empty}>No components found</div>
        )}
      </div>

      <div className={styles.footer}>
        <button className={styles.newCompBtn}>+ Create Component</button>
      </div>
    </div>
  )
}
