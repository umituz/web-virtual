import * as THREE from 'three'
import type { MaterialPalette } from '../../engine/materials'

export function createFicusPlant(materials: MaterialPalette): THREE.Group {
  const group = new THREE.Group()

  const potMat = materials.getTerracottaPotMaterial()
  const leafMat = materials.getPlantLeavesMaterial()
  const trunkMat = materials.getExecutiveWoodMaterial()

  // Terracotta pot
  const potGeo = new THREE.CylinderGeometry(0.32, 0.22, 0.55, 16)
  const pot = new THREE.Mesh(potGeo, potMat)
  pot.position.set(0, 0.275, 0)
  pot.castShadow = true
  group.add(pot)

  // Soil
  const soilGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 16)
  const soilMat = materials.getDarkSlate('#26180b')
  const soil = new THREE.Mesh(soilGeo, soilMat)
  soil.position.set(0, 0.53, 0)
  group.add(soil)

  // Trunks
  const t1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.2, 8), trunkMat)
  t1.position.set(0, 1.0, 0)
  t1.rotation.z = -0.08
  group.add(t1)

  const t2 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 1.0, 8), trunkMat)
  t2.position.set(0.08, 0.9, 0.05)
  t2.rotation.z = 0.12
  group.add(t2)

  // Foliage clusters
  const leafClusterGeo = new THREE.DodecahedronGeometry(0.32, 1)

  const cluster1 = new THREE.Mesh(leafClusterGeo, leafMat)
  cluster1.position.set(-0.1, 1.5, 0.05)
  cluster1.scale.set(1.2, 1.0, 1.1)
  cluster1.castShadow = true
  group.add(cluster1)

  const cluster2 = new THREE.Mesh(leafClusterGeo, leafMat)
  cluster2.position.set(0.18, 1.35, -0.08)
  cluster2.scale.set(1.0, 1.1, 1.0)
  cluster2.castShadow = true
  group.add(cluster2)

  const cluster3 = new THREE.Mesh(leafClusterGeo, leafMat)
  cluster3.position.set(0, 1.75, 0)
  cluster3.scale.set(0.9, 0.9, 0.9)
  cluster3.castShadow = true
  group.add(cluster3)

  return group
}
