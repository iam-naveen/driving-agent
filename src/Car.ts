import * as CANNON from "cannon-es";
import * as THREE from "three";
import Sensor from "@/Sensor";
import NeuralNetwork from "@/Network";

export default class Car {
  body: CANNON.Body | undefined;
  bodyMesh: THREE.Mesh | undefined;
  vehicle: CANNON.RigidVehicle | undefined;
  wheelMeshes: THREE.Mesh[] = [];
  controls = { forward: false, backward: false, left: false, right: false };
  maxSteerVal = Math.PI / 8;
  maxForce = 3000;
  speedLimit = 15;
  world: CANNON.World;
  scene: THREE.Scene;
  sensor: Sensor;
  obstacles: THREE.Mesh[] | undefined;
  intersections: THREE.Intersection[] = [];
  isDamaged = false;
  brain: NeuralNetwork;
  connectAI: boolean = true;

  constructor(world: CANNON.World, scene: THREE.Scene) {
    this.world = world;
    this.scene = scene;
    this.#createCar();
    this.#addWheels();
    this.vehicle?.addToWorld(this.world);
    this.#addListeners();
    this.sensor = new Sensor(
      this.scene,
      this.bodyMesh?.position as THREE.Vector3
    );
    // the array argument is the number of neurons in each layer
    // input: 10 (rayCount), hidden: 6, output: 4
    this.brain = new NeuralNetwork([this.sensor.rayCount, 6, 4]);
  }

  setObstacles(obstacles: THREE.Mesh[]) {
    this.obstacles = obstacles;
  }

  #addListeners() {
    document.addEventListener("keydown", (event) => {
      switch (event.key) {
        case "w":
        case "ArrowUp":
          this.controls.forward = true;
          break;

        case "s":
        case "ArrowDown":
          this.controls.backward = true;
          break;

        case "a":
        case "ArrowLeft":
          this.controls.left = true;
          break;

        case "d":
        case "ArrowRight":
          this.controls.right = true;
          break;
      }
      // console.table(this.controls);
    });

    // reset car force to zero when key is released
    document.addEventListener("keyup", (event) => {
      switch (event.key) {
        case "w":
        case "ArrowUp":
          this.controls.forward = false;
          break;

        case "s":
        case "ArrowDown":
          this.controls.backward = false;
          this.vehicle?.setWheelForce(0, 0);
          this.vehicle?.setWheelForce(0, 1);
          break;

        case "a":
        case "ArrowLeft":
          this.controls.left = false;
          this.vehicle?.setSteeringValue(0, 2);
          this.vehicle?.setSteeringValue(0, 3);
          break;

        case "d":
        case "ArrowRight":
          this.controls.right = false;
          this.vehicle?.setSteeringValue(0, 2);
          this.vehicle?.setSteeringValue(0, 3);
          break;
      }
      // console.table(this.controls);
    });

    this.vehicle?.chassisBody.addEventListener("collide", (event: any) => {
      if (event.body.id !== 0) this.isDamaged = true;
    });

    this.vehicle?.wheelBodies.forEach((wheel) => {
      wheel.addEventListener("collide", (event: any) => {
        if (event.body.id !== 0) this.isDamaged = true;
      });
    });
  }

  #addWheels() {
    const axisWidth = 5;
    for (let i = 0; i < 4; i++) {
      const material = new CANNON.Material("wheelMaterial");
      material.friction = 1;
      const wheelBody = new CANNON.Body({
        mass: 10,
        shape: new CANNON.Sphere(1),
        material: material,
      });
      // set this body to Collision group 1
      wheelBody.collisionFilterGroup = 1;
      wheelBody.collisionFilterMask &= ~1;
      this.vehicle?.addWheel({
        body: wheelBody,
        axis: new CANNON.Vec3(1, 0, 0),
        position: new CANNON.Vec3(
          i % 2 === 0 ? -axisWidth / 2 : axisWidth / 2,
          0,
          i < 2 ? 2.5 : -2.5
        ),
      });
      const wheelGeometry = new THREE.SphereGeometry(1);
      const wheelMaterial = new THREE.MeshLambertMaterial({ color: "black" });
      const wheelMesh = new THREE.Mesh(wheelGeometry, wheelMaterial);
      this.wheelMeshes.push(wheelMesh);
      this.scene.add(wheelMesh);
    }
  }

  #createCar() {
    this.body = new CANNON.Body({
      mass: 1000,
      position: new CANNON.Vec3(0, 0.5, 0),
      shape: new CANNON.Box(new CANNON.Vec3(2, 0.5, 4)),
    });
    // set this body to Collision group 1
    this.body.collisionFilterGroup = 1;
    this.body.collisionFilterMask &= ~1;
    this.vehicle = new CANNON.RigidVehicle({ chassisBody: this.body });
    this.bodyMesh = new THREE.Mesh(
      new THREE.BoxGeometry(4, 1, 8),
      new THREE.MeshLambertMaterial({})
    );
    this.bodyMesh.position.copy(this.body.position as any);
    this.bodyMesh.quaternion.copy(this.body.quaternion as any);

    this.vehicle.addToWorld(this.world);
    this.scene.add(this.bodyMesh);
  }

  update() {
    // console.table(this.controls);
    const speed = this.vehicle?.getWheelSpeed(0) as number;

    if (this.controls.forward && speed > -this.speedLimit) {
      this.vehicle?.applyWheelForce(-this.maxForce, 0);
      this.vehicle?.applyWheelForce(-this.maxForce, 1);
    } else if (!this.controls.forward && speed < 0) {
      this.vehicle?.applyWheelForce(this.maxForce, 0);
      this.vehicle?.applyWheelForce(this.maxForce, 1);
    }
    if (this.controls.backward && speed < this.speedLimit / 2) {
      this.vehicle?.applyWheelForce(this.maxForce / 2, 0);
      this.vehicle?.applyWheelForce(this.maxForce / 2, 1);
    } else if (!this.controls.backward && speed > 0) {
      this.vehicle?.applyWheelForce(-this.maxForce, 0);
      this.vehicle?.applyWheelForce(-this.maxForce, 1);
    }
    if (this.controls.left) {
      this.vehicle?.setSteeringValue(this.maxSteerVal, 2);
      this.vehicle?.setSteeringValue(this.maxSteerVal, 3);
    }
    if (this.controls.right) {
      this.vehicle?.setSteeringValue(-this.maxSteerVal, 2);
      this.vehicle?.setSteeringValue(-this.maxSteerVal, 3);
    }
    // update bodyMesh position
    this.bodyMesh?.position.copy(this.body?.position as any);
    this.bodyMesh?.quaternion.copy(this.body?.quaternion as any);
    // update wheelMeshes positions
    this.vehicle?.wheelBodies.forEach((wheel, i) => {
      this.wheelMeshes[i].position.copy(wheel.position as any);
      this.wheelMeshes[i].quaternion.copy(wheel.quaternion as any);
    });

    this.sensor.update(
      this.bodyMesh?.position as any,
      this.bodyMesh?.quaternion as any
    );

    this.intersections = this.sensor.getIntersection(
      this.obstacles as THREE.Mesh[]
    );
    this.intersections.forEach((box) => {
      // @ts-ignore
      box.object.material.color.set("black");
    });

    const offsets = this.intersections.map((intersection) => {
      return 10 - intersection.distance;
    });
    // console.log(offsets[25]);
    const outputs = NeuralNetwork.feedForward(offsets, this.brain);
    if (this.connectAI) {
      this.controls.forward = outputs[0] === 1;
      this.controls.left = outputs[1] === 1;
      this.controls.right = outputs[2] === 1;
      this.controls.backward = outputs[3] === 1;
    }
    // console.log(outputs);
  }

  remove() {
    this.wheelMeshes.forEach((wheel) => {
      this.scene.remove(wheel);
    });
    this.scene.remove(this.bodyMesh as THREE.Mesh);
    this.sensor.remove();
    this.vehicle?.removeFromWorld(this.world);
  }
}
