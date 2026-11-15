import * as THREE from 'three'
import type { MaterialPalette } from '../../engine/materials'
import { ModelLoader } from '../../engine/modelLoader'

export function createFicusPlant(materials: MaterialPalette): THREE.Group {
  const group = new THREE.Group()

  // Contact shadow under plant pot
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.7, 0.7),
    materials.getContactShadowMaterial(),
  )
  shadow.rotation.x = -Math.PI / 2
  shadow.position.set(0, 0.003, 0)
  group.add(shadow)

  const modelsContainer = new THREE.Group()
  group.add(modelsContainer)

  // Placeholder
  const placeholder = new THREE.Group()
  const potMat = materials.getTerracottaPotMaterial()
  const leafMat = materials.getPlantLeavesMaterial()
  const trunkMat = materials.getExecutiveWoodMaterial()

  const potGeo = new THREE.CylinderGeometry(0.32, 0.22, 0.55, 16)
  const pot = new THREE.Mesh(potGeo, potMat)
  pot.position.set(0, 0.275, 0)
  pot.castShadow = true
  placeholder.add(pot)

  const t1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.2, 8), trunkMat)
  t1.position.set(0, 1.0, 0)
  placeholder.add(t1)

  const cluster1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.38, 1), leafMat)
  cluster1.position.set(0, 1.55, 0)
  cluster1.castShadow = true
  placeholder.add(cluster1)

  group.add(placeholder)

  // Real 3D Plant Model
  const loader = ModelLoader.getInstance()
  void loader.load('decor:pottedPlant').then((plantModel) => {
    if (plantModel) {
      placeholder.visible = false
      plantModel.scale.set(1.4, 1.4, 1.4)
      plantModel.position.set(0, 0, 0)
      modelsContainer.add(plantModel)
    }
  })

  return group
}
