import type { WorldEntity, EntitySelectedEvent } from './types'

export type VirtualEventListener<T> = (data: T) => void

export class VirtualEventEmitter {
  private listeners: Map<string, Set<VirtualEventListener<any>>> = new Map()

  on<T>(event: string, listener: VirtualEventListener<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(listener)
    return () => this.off(event, listener)
  }

  off<T>(event: string, listener: VirtualEventListener<T>): void {
    const set = this.listeners.get(event)
    if (set) {
      set.delete(listener)
      if (set.size === 0) {
        this.listeners.delete(event)
      }
    }
  }

  emit<T>(event: string, data: T): void {
    const set = this.listeners.get(event)
    if (set) {
      for (const listener of set) {
        try {
          listener(data)
        } catch (err) {
          console.error(`[web-virtual] Error in event listener for "${event}":`, err)
        }
      }
    }
  }

  clear(): void {
    this.listeners.clear()
  }
}

export interface VirtualEvents {
  'entity:select': EntitySelectedEvent
  'entity:hover': { entity: WorldEntity | null; position?: [number, number, number] }
  'entity:action': { entity: WorldEntity; actionId: string }
  'camera:move': { position: [number, number, number]; target: [number, number, number] }
  'world:ready': { worldId: string }
}
