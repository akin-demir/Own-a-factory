import type { ComponentInstance } from './component.js'

export interface WiringEntry {
  /** e.g. "Sensor_1.output" */
  componentTag: string
  /** e.g. "I0.0" */
  plcAddress: string
}

export interface PLCProgram {
  language: 'ST'
  source: string
}

export interface ModbusRegisterMapping {
  register: string
  type: 'coil' | 'holding' | 'input'
  tag: string
}

export interface PLCConnection {
  protocol: 'modbus-tcp'
  host: string
  port: number
  pollInterval: number
  registerMap: ModbusRegisterMapping[]
}

export interface SceneData {
  version: number
  components: ComponentInstance[]
  wiring: WiringEntry[]
  plcProgram: PLCProgram
  plcConnection?: PLCConnection
}

export type PLCMode = 'software' | 'real'
