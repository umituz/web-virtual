import * as THREE from 'three'
import type { LightingConfiguration } from '../core/types'

export class WorldLighting {
  private ambientLight: THREE.AmbientLight
  private mainSun: THREE.DirectionalLight
  private fillLight: THREE.DirectionalLight
  private nightLight: THREE.DirectionalLight
  private hemisphereLight: THREE.HemisphereLight
  private execSpot: THREE.SpotLight
  private confSpot: THREE.SpotLight

  constructor(
    private scene: THREE.Scene,
    private config: LightingConfiguration = {},
  ) {
    const ambientColor = new THREE.Color(config.ambientColor || '#ffffff')
    this.ambientLight = new THREE.AmbientLight(ambientColor, config.ambientIntensity ?? 0.82)
    this.scene.add(this.ambientLight)

    this.hemisphereLight = new THREE.HemisphereLight(0xfffbf5, 0x334155, 0.45)
    this.hemisphereLight.position.set(0, 50, 0)
    this.scene.add(this.hemisphereLight)

    const sunColor = new THREE.Color(config.sunColor || '#fff7ed')
    this.mainSun = new THREE.DirectionalLight(sunColor, config.sunIntensity ?? 1.15)
    const sunPos = config.sunPosition || [22, 32, 18]
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
      this.mainSun.shadow.bias = -0.0003
    }
    this.scene.add(this.mainSun)

    this.fillLight = new THREE.DirectionalLight(0xe0f2fe, 0.38)
    this.fillLight.position.set(-20, 18, -15)
    this.scene.add(this.fillLight)

    // Warm Architectural Interior Downlights
    this.execSpot = new THREE.SpotLight(0xfef3c7, 0.55, 18, Math.PI / 4, 0.5, 1.2)
    this.confSpot = new THREE.SpotLight(0xfef3c7, 0.55, 18, Math.PI / 3.5, 0.5, 1.2)
    if (config.interiorSpots === false) {
      this.execSpot.intensity = 0
      this.confSpot.intensity = 0
    } else {
      this.execSpot.position.set(11, 7.5, -5.5)
      this.execSpot.target.position.set(11, 0, -5.5)
      this.scene.add(this.execSpot)
      this.scene.add(this.execSpot.target)

      this.confSpot.position.set(11, 7.5, 2.5)
      this.confSpot.target.position.set(11, 0, 2.5)
      this.scene.add(this.confSpot)
      this.scene.add(this.confSpot.target)
    }

    this.nightLight = new THREE.DirectionalLight(
      new THREE.Color(config.nightSunColor || '#38bdf8'),
      0,
    )
    this.nightLight.position.set(-15, 25, 20)
    this.scene.add(this.nightLight)
  }

  setNightMode(isNight: boolean): void {
    const spotsOn = this.config.interiorSpots !== false
    if (isNight) {
      this.ambientLight.intensity = this.config.nightAmbientIntensity ?? 0.3
      this.ambientLight.color.set(this.config.nightAmbientColor || '#1e293b')
      this.mainSun.intensity = 0.1
      this.mainSun.color.set('#3b82f6')
      this.fillLight.intensity = 0.1
      this.nightLight.intensity = this.config.nightSunIntensity ?? 0.6
      this.hemisphereLight.intensity = 0.15
      this.execSpot.intensity = spotsOn ? 0.8 : 0
      this.confSpot.intensity = spotsOn ? 0.8 : 0
    } else {
      this.ambientLight.intensity = this.config.ambientIntensity ?? 0.82
      this.ambientLight.color.set(this.config.ambientColor || '#ffffff')
      this.mainSun.intensity = this.config.sunIntensity ?? 1.15
      this.mainSun.color.set(this.config.sunColor || '#fff7ed')
      this.fillLight.intensity = 0.38
      this.nightLight.intensity = 0
      this.hemisphereLight.intensity = 0.45
      this.execSpot.intensity = spotsOn ? 0.55 : 0
      this.confSpot.intensity = spotsOn ? 0.55 : 0
    }
  }

  dispose(): void {
    this.scene.remove(this.ambientLight)
    this.scene.remove(this.mainSun)
    this.scene.remove(this.fillLight)
    this.scene.remove(this.nightLight)
    this.scene.remove(this.hemisphereLight)
    this.scene.remove(this.execSpot)
    this.scene.remove(this.execSpot.target)
    this.scene.remove(this.confSpot)
    this.scene.remove(this.confSpot.target)
  }
}
