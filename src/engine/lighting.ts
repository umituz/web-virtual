import * as THREE from 'three'
import type { LightingConfiguration } from '../core/types'

export class WorldLighting {
  private ambientLight: THREE.AmbientLight
  private mainSun: THREE.DirectionalLight
  private fillLight: THREE.DirectionalLight
  private nightLight: THREE.DirectionalLight
  private hemisphereLight: THREE.HemisphereLight

  constructor(
    private scene: THREE.Scene,
    private config: LightingConfiguration = {},
  ) {
    const ambientColor = new THREE.Color(config.ambientColor || '#ffffff')
    this.ambientLight = new THREE.AmbientLight(ambientColor, config.ambientIntensity ?? 0.85)
    this.scene.add(this.ambientLight)

    this.hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444455, 0.4)
    this.hemisphereLight.position.set(0, 50, 0)
    this.scene.add(this.hemisphereLight)

    const sunColor = new THREE.Color(config.sunColor || '#fff5ea')
    this.mainSun = new THREE.DirectionalLight(sunColor, config.sunIntensity ?? 1.1)
    const sunPos = config.sunPosition || [20, 30, 15]
    this.mainSun.position.set(sunPos[0], sunPos[1], sunPos[2])

    if (config.shadows !== false) {
      this.mainSun.castShadow = true
      this.mainSun.shadow.mapSize.width = 2048
      this.mainSun.shadow.mapSize.height = 2048
      this.mainSun.shadow.camera.near = 0.5
      this.mainSun.shadow.camera.far = 100
      this.mainSun.shadow.camera.left = -30
      this.mainSun.shadow.camera.right = 30
      this.mainSun.shadow.camera.top = 30
      this.mainSun.shadow.camera.bottom = -30
      this.mainSun.shadow.bias = -0.0005
    }
    this.scene.add(this.mainSun)

    this.fillLight = new THREE.DirectionalLight(0xdbeafe, 0.4)
    this.fillLight.position.set(-20, 18, -15)
    this.scene.add(this.fillLight)

    this.nightLight = new THREE.DirectionalLight(
      new THREE.Color(config.nightSunColor || '#60a5fa'),
      0,
    )
    this.nightLight.position.set(-15, 25, 20)
    this.scene.add(this.nightLight)
  }

  setNightMode(isNight: boolean): void {
    if (isNight) {
      this.ambientLight.intensity = this.config.nightAmbientIntensity ?? 0.35
      this.ambientLight.color.set(this.config.nightAmbientColor || '#1e293b')
      this.mainSun.intensity = 0.15
      this.mainSun.color.set('#3b82f6')
      this.fillLight.intensity = 0.1
      this.nightLight.intensity = this.config.nightSunIntensity ?? 0.5
      this.hemisphereLight.intensity = 0.15
    } else {
      this.ambientLight.intensity = this.config.ambientIntensity ?? 0.85
      this.ambientLight.color.set(this.config.ambientColor || '#ffffff')
      this.mainSun.intensity = this.config.sunIntensity ?? 1.1
      this.mainSun.color.set(this.config.sunColor || '#fff5ea')
      this.fillLight.intensity = 0.4
      this.nightLight.intensity = 0
      this.hemisphereLight.intensity = 0.4
    }
  }

  dispose(): void {
    this.scene.remove(this.ambientLight)
    this.scene.remove(this.mainSun)
    this.scene.remove(this.fillLight)
    this.scene.remove(this.nightLight)
    this.scene.remove(this.hemisphereLight)
  }
}
