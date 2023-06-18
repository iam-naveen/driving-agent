import * as THREE from "three";

export default class Sensor {
  scene: THREE.Scene;
  raycasters: THREE.Raycaster[] = [];
  raycasterLines: THREE.Line[] = [];
  rayCount = 80;
  raySpread = Math.PI / 4;
  rayLength = 50;

  constructor(scene: THREE.Scene, origin: THREE.Vector3) {
    this.scene = scene;
    for (let i = 0; i < this.rayCount; i++) {
      // Create Raycaster
      const raycaster = new THREE.Raycaster();
      // Create Visual Representation
      const raycasterGeometry = new THREE.BufferGeometry().setFromPoints([
        origin, // Start of the raycaster
        origin.clone().add(new THREE.Vector3(0, 0, -this.rayLength)), // Length of the raycaster
      ]);
      const raycasterMaterial = new THREE.LineBasicMaterial({
        color: "lightgrey",
      });
      const raycasterLine = new THREE.Line(
        raycasterGeometry,
        raycasterMaterial
      );
      this.raycasters.push(raycaster);
      this.raycasterLines.push(raycasterLine);
      this.scene.add(raycasterLine);
    }
  }

  update(origin: THREE.Vector3, rotation: THREE.Quaternion) {
    this.raycasters.forEach((raycaster, i) => {
      const rayAngle = THREE.MathUtils.lerp(
        this.raySpread / 2,
        -this.raySpread / 2,
        i / (this.rayCount - 1)
      );
      // Set the position and direction of each raycaster
      const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(rotation);
      direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), rayAngle);
      raycaster.set(origin, direction);
      // Update the position and rotation of each raycaster line to match the raycaster
      this.raycasterLines[i].position.copy(origin as THREE.Vector3);
      const rotationQuaternion = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        rayAngle
      );
      this.raycasterLines[i].quaternion
        .copy(rotation)
        .multiply(rotationQuaternion);
    });
  }

  getIntersection(objects: THREE.Mesh[]) {
    const intersections: THREE.Intersection[] = [];
    this.raycasters.forEach((raycaster) => {
      raycaster.intersectObjects(objects).forEach((intersection) => {
        if (intersection.distance < this.rayLength)
          intersections.push(intersection);
      });
    });
    return intersections;
  }

  remove() {
    this.raycasterLines.forEach((raycasterLine) => {
      this.scene.remove(raycasterLine);
    });
  }
}
