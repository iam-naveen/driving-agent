import * as CANNON from "cannon-es";
import * as THREE from "three";

export default class Car {
  body: CANNON.Body | undefined;
  bodyMesh: THREE.Mesh | undefined;
  vehicle: CANNON.RigidVehicle | undefined;
  wheelMeshes: THREE.Mesh[] = [];
  maxSteerVal = Math.PI / 8;
  maxForce = 30;

  constructor(world: CANNON.World, scene: THREE.Scene) {
    this.#createCar(world, scene);
    const wheelOptions = {
      dampingRelaxation: 2,
      dampingCompression: 4,
      maxSuspensionForce: 100000,
      rollInfluence: 0.01,
      suspensionStiffness: 100,
      suspensionRestLength: 0.5,
      suspensionRelaxation: 1,
      suspensionDamping: 0.3,
    };
    this.#addWheels(wheelOptions);

    this.#addListeners();
  }

  #addListeners() {
    document.addEventListener("keydown", (event) => {
      switch (event.key) {
        case "w":
        case "ArrowUp":
          this.vehicle?.setWheelForce(this.maxForce, 2);
          this.vehicle?.setWheelForce(this.maxForce, 3);
          break;

        case "s":
        case "ArrowDown":
          this.vehicle?.setWheelForce(-this.maxForce / 2, 2);
          this.vehicle?.setWheelForce(-this.maxForce / 2, 3);
          break;

        case "a":
        case "ArrowLeft":
          this.vehicle?.setSteeringValue(this.maxSteerVal, 0);
          this.vehicle?.setSteeringValue(this.maxSteerVal, 1);
          break;

        case "d":
        case "ArrowRight":
          this.vehicle?.setSteeringValue(-this.maxSteerVal, 0);
          this.vehicle?.setSteeringValue(-this.maxSteerVal, 1);
          break;
      }
    });

    // reset car force to zero when key is released
    document.addEventListener("keyup", (event) => {
      switch (event.key) {
        case "w":
        case "ArrowUp":
          this.vehicle?.setWheelForce(0, 2);
          this.vehicle?.setWheelForce(0, 3);
          break;

        case "s":
        case "ArrowDown":
          this.vehicle?.setWheelForce(0, 2);
          this.vehicle?.setWheelForce(0, 3);
          break;

        case "a":
        case "ArrowLeft":
          this.vehicle?.setSteeringValue(0, 0);
          this.vehicle?.setSteeringValue(0, 1);
          break;

        case "d":
        case "ArrowRight":
          this.vehicle?.setSteeringValue(0, 0);
          this.vehicle?.setSteeringValue(0, 1);
          break;
      }
    });
  }

  #addWheels(options: {}) {
    const axisWidth = 5;
    for (let i = 0; i < 4; i++) {
      this.vehicle?.addWheel({
        body: new CANNON.Body({ mass: 1, shape: new CANNON.Sphere(0.5) }),
        axis: new CANNON.Vec3(0, 1, 0),
        position: new CANNON.Vec3(
          i % 2 === 0 ? -axisWidth : axisWidth,
          -0.5,
          i < 2 ? 2.5 : -2.5
        ),
      });
    }
  }

  #createCar(world: CANNON.World, scene: THREE.Scene) {
    this.body = new CANNON.Body({
      mass: 10,
      position: new CANNON.Vec3(0, 5, 0),
      shape: new CANNON.Box(new CANNON.Vec3(2, 0.5, 4)),
    });
    this.vehicle = new CANNON.RigidVehicle({ chassisBody: this.body });
    this.bodyMesh = new THREE.Mesh(
      new THREE.BoxGeometry(4, 1, 8),
      new THREE.MeshLambertMaterial({ color: 0xff0000 })
    );
    this.bodyMesh.position.copy(this.body.position as any);
    this.bodyMesh.quaternion.copy(this.body.quaternion as any);

    this.vehicle.addToWorld(world);
    scene.add(this.bodyMesh);
  }

  update() {
    // update bodyMesh position
    this.bodyMesh?.position.copy(this.body?.position as any);
    this.bodyMesh?.quaternion.copy(this.body?.quaternion as any);
    // update wheelMeshes positions
    this.vehicle?.wheelBodies.forEach((wheel, i) => {
      this.wheelMeshes[i].position.copy(wheel.position as any);
    });
  }
}
