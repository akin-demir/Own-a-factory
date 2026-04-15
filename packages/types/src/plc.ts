export type TagValue = boolean | number | string

export interface TagSnapshot {
  [tagAddress: string]: TagValue
}

/** Main thread → PLC Web Worker */
export interface PLCTickMessage {
  type: 'tick'
  inputs: TagSnapshot
  timestamp: number
}

/** PLC Web Worker → Main thread */
export interface PLCOutputMessage {
  type: 'outputs'
  outputs: TagSnapshot
  scanTime: number
  errors: string[]
}

/** WebSocket messages for real-time collaboration and protocol proxy */
export type WSMessageType =
  | 'join'
  | 'leave'
  | 'tag_delta'
  | 'status'
  | 'modbus_connect'
  | 'modbus_disconnect'
  | 'error'

export interface WSJoinMessage {
  type: 'join'
  sessionId: string
  token: string
}

export interface WSTagDeltaMessage {
  type: 'tag_delta'
  sessionId: string
  tags: TagSnapshot
  fromUserId?: string
}

export interface WSStatusMessage {
  type: 'status'
  sessionId: string
  componentCount: number
  scanHz: number
  isRunning: boolean
}

export interface WSModbusConnectMessage {
  type: 'modbus_connect'
  sessionId: string
  host: string
  port: number
  pollInterval: number
}

export interface WSErrorMessage {
  type: 'error'
  message: string
  code?: string
}

export type WSMessage =
  | WSJoinMessage
  | WSTagDeltaMessage
  | WSStatusMessage
  | WSModbusConnectMessage
  | WSErrorMessage
