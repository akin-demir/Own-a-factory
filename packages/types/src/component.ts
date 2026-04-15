export type TagValueType = 'bool' | 'float' | 'int' | 'string'
export type ComponentCategory =
  | 'sensor'
  | 'actuator'
  | 'emitter'
  | 'storage'
  | 'signaling'
  | 'electrical'
export type ComponentTier = 'platform' | 'community' | 'user'

export interface IOTag {
  id: string
  label: string
  direction: 'input' | 'output'
  plcPerspective: 'input' | 'output'
  type: TagValueType
  description?: string
}

export interface ComponentParameter {
  id: string
  label: string
  type: 'float' | 'int' | 'bool' | 'enum' | 'string'
  default: number | boolean | string
  min?: number
  max?: number
  unit?: string
  options?: string[]
}

export type ComponentGeometry =
  | {
      type: 'gltf'
      assetPath: string
      scale?: [number, number, number]
      pivotOffset?: [number, number, number]
    }
  | {
      type: 'procedural'
      template: string
    }

export interface ComponentCollider {
  shape: 'box' | 'sphere' | 'capsule'
  size: number[]
  offset?: [number, number, number]
}

export interface ComponentPhysics {
  bodyType: 'static' | 'dynamic' | 'kinematic'
  colliders: ComponentCollider[]
}

export type ComponentBehavior =
  | { type: 'builtin'; script: string }
  | { type: 'custom'; scriptPath: string }

export interface ComponentDefinition {
  id: string
  version: string
  category: ComponentCategory
  subtype?: string
  displayName: string
  description?: string
  brand?: string | null
  model?: string | null
  datasheet?: string | null
  parentId?: string | null
  geometry: ComponentGeometry
  physics: ComponentPhysics
  parameters: ComponentParameter[]
  ioTags: IOTag[]
  behavior: ComponentBehavior
}

export interface ComponentInstance {
  instanceId: string
  typeId: string
  position: [number, number, number]
  rotation: [number, number, number]
  paramValues: Record<string, number | boolean | string>
  tagAlias: string
}

export interface ComponentAssetUrls {
  mesh?: string
  thumbnail?: string
  icon?: string
}

export interface ComponentWithAssets {
  definition: ComponentDefinition
  assets: ComponentAssetUrls
}
