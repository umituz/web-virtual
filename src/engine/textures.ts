import * as THREE from 'three'

export class ProceduralTextureFactory {
  private static cache: Map<string, THREE.CanvasTexture> = new Map()

  // 1. Warm Architectural Wood Parquet Texture
  static getWoodParquetTexture(): THREE.CanvasTexture {
    const key = 'tex:wood:parquet'
    if (this.cache.has(key)) return this.cache.get(key)!

    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')

    if (ctx) {
      // Base wood tone
      ctx.fillStyle = '#b68957'
      ctx.fillRect(0, 0, 512, 512)

      const plankHeight = 32
      const numPlanks = 512 / plankHeight
      const tones = ['#b88d5c', '#ae8250', '#c29664', '#a87a48', '#bc9261', '#9f7241']

      for (let i = 0; i < numPlanks; i++) {
        const y = i * plankHeight
        const tone = tones[i % tones.length] || '#b88d5c'
        ctx.fillStyle = tone
        ctx.fillRect(0, y, 512, plankHeight - 1)

        // Wood grain micro-fibers
        ctx.fillStyle = 'rgba(0, 0, 0, 0.04)'
        for (let g = 0; g < 4; g++) {
          const gy = y + Math.random() * plankHeight
          ctx.fillRect(0, gy, 512, 1)
        }

        // Dark bevel seam
        ctx.fillStyle = 'rgba(40, 20, 5, 0.25)'
        ctx.fillRect(0, y + plankHeight - 1, 512, 1)

        // Vertical plank end joints staggered
        const offset = (i % 3) * 170
        for (let x = offset; x < 512; x += 170) {
          ctx.fillStyle = 'rgba(40, 20, 5, 0.3)'
          ctx.fillRect(x, y, 1, plankHeight)
        }
      }
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(4, 4)
    this.cache.set(key, texture)
    return texture
  }

  // 2. Modern Porcelain Floor Tile Texture
  static getTileFloorTexture(): THREE.CanvasTexture {
    const key = 'tex:floor:tile'
    if (this.cache.has(key)) return this.cache.get(key)!

    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')

    if (ctx) {
      // Base off-white tile tone
      ctx.fillStyle = '#f1f5f9'
      ctx.fillRect(0, 0, 512, 512)

      const tileSize = 64
      for (let x = 0; x < 512; x += tileSize) {
        for (let y = 0; y < 512; y += tileSize) {
          // Subtle tone variation
          const shade = (x / tileSize + y / tileSize) % 2 === 0 ? '#f8fafc' : '#f1f5f9'
          ctx.fillStyle = shade
          ctx.fillRect(x, y, tileSize - 1, tileSize - 1)

          // Grout seam
          ctx.fillStyle = '#cbd5e1'
          ctx.fillRect(x + tileSize - 1, y, 1, tileSize)
          ctx.fillRect(x, y + tileSize - 1, tileSize, 1)
        }
      }
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(6, 6)
    this.cache.set(key, texture)
    return texture
  }

  // 3. Realistic Dark-Mode Active Dashboard / Code Screen
  static getScreenTexture(type: 'code' | 'dashboard' | 'charts' = 'dashboard'): THREE.CanvasTexture {
    const key = `tex:screen:${type}`
    if (this.cache.has(key)) return this.cache.get(key)!

    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 288
    const ctx = canvas.getContext('2d')

    if (ctx) {
      // Screen background
      ctx.fillStyle = '#090d16'
      ctx.fillRect(0, 0, 512, 288)

      // Top titlebar
      ctx.fillStyle = '#1e293b'
      ctx.fillRect(0, 0, 512, 28)

      // 3 OS window control dots
      ctx.fillStyle = '#ef4444'
      ctx.beginPath()
      ctx.arc(14, 14, 4, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#f59e0b'
      ctx.beginPath()
      ctx.arc(28, 14, 4, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#22c55e'
      ctx.beginPath()
      ctx.arc(42, 14, 4, 0, Math.PI * 2)
      ctx.fill()

      // Left sidebar
      ctx.fillStyle = '#0f172a'
      ctx.fillRect(0, 28, 48, 260)

      if (type === 'code') {
        // Code lines
        const colors = ['#c084fc', '#38bdf8', '#4ade80', '#fbbf24', '#f43f5e', '#e2e8f0']
        let curY = 48
        for (let i = 0; i < 14; i++) {
          const indent = 64 + (i % 3) * 24
          const width = 80 + (Math.sin(i * 3.7) * 0.5 + 0.5) * 220
          ctx.fillStyle = colors[i % colors.length] || '#38bdf8'
          ctx.fillRect(indent, curY, width, 8)
          curY += 16
        }
      } else {
        // Dashboard cards & graphs
        // Card 1: Metric stat
        ctx.fillStyle = '#1e293b'
        ctx.fillRect(64, 42, 120, 60)
        ctx.fillStyle = '#38bdf8'
        ctx.fillRect(74, 52, 60, 6)
        ctx.fillStyle = '#4ade80'
        ctx.fillRect(74, 68, 80, 14)

        // Card 2: Metric stat
        ctx.fillStyle = '#1e293b'
        ctx.fillRect(198, 42, 120, 60)
        ctx.fillStyle = '#a855f7'
        ctx.fillRect(208, 52, 60, 6)
        ctx.fillStyle = '#38bdf8'
        ctx.fillRect(208, 68, 70, 14)

        // Card 3: Line chart
        ctx.fillStyle = '#1e293b'
        ctx.fillRect(332, 42, 160, 60)
        ctx.strokeStyle = '#38bdf8'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(344, 85)
        ctx.lineTo(370, 65)
        ctx.lineTo(400, 78)
        ctx.lineTo(440, 52)
        ctx.lineTo(480, 62)
        ctx.stroke()

        // Big Bottom Analytics Area
        ctx.fillStyle = '#1e293b'
        ctx.fillRect(64, 116, 428, 154)

        // Multi-bar chart
        const barColors = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']
        for (let b = 0; b < 10; b++) {
          const bx = 84 + b * 40
          const h = 30 + ((b * 19) % 90)
          const by = 240 - h
          ctx.fillStyle = barColors[b % barColors.length] || '#3b82f6'
          ctx.fillRect(bx, by, 24, h)
        }
      }
    }

    const texture = new THREE.CanvasTexture(canvas)
    this.cache.set(key, texture)
    return texture
  }

  // 4. Soft Contact Ambient Occlusion Drop Shadow Texture
  static getSoftShadowTexture(): THREE.CanvasTexture {
    const key = 'tex:shadow:contact'
    if (this.cache.has(key)) return this.cache.get(key)!

    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128
    const ctx = canvas.getContext('2d')

    if (ctx) {
      const grad = ctx.createRadialGradient(64, 64, 10, 64, 64, 60)
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.55)')
      grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.22)')
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)')

      ctx.fillStyle = grad
      ctx.fillRect(0, 0, 128, 128)
    }

    const texture = new THREE.CanvasTexture(canvas)
    this.cache.set(key, texture)
    return texture
  }
}
