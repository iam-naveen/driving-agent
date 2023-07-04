import * as CANNON from "cannon-es";
import CannonDebugger from "cannon-es-debugger";
import * as THREE from "three";
import Car from "@/Car.js";
import NeuralNetwork from "@/Network";
import SceneInit from "@lib/SceneInit";
import "@/style.css";

// set up Three.js scene with axis helper
const frame = new SceneInit("canvas");
frame.animate();
const axesHelper = new THREE.AxesHelper(8);
frame.scene.add(axesHelper);

// set up world physics with gravity
const physicsWorld = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.8, 0),
});
physicsWorld.broadphase = new CANNON.SAPBroadphase(physicsWorld);
physicsWorld.defaultContactMaterial.friction = 1;

const material = new CANNON.Material("groundMaterial");
material.friction = 1;
const groundBody = new CANNON.Body({
  mass: 0,
  type: CANNON.Body.STATIC,
  // infinte geometric plane
  shape: new CANNON.Plane(),
  material: material,
});

const leftWallBody = new CANNON.Body({
  type: CANNON.Body.STATIC,
  shape: new CANNON.Box(new CANNON.Vec3(2.5, 2.5, 5000)),
  position: new CANNON.Vec3(-32, 0, 0),
});
const rightWallBody = new CANNON.Body({
  type: CANNON.Body.STATIC,
  shape: new CANNON.Box(new CANNON.Vec3(2.5, 2.5, 5000)),
  position: new CANNON.Vec3(32, 0, 0),
});
// for flat surface
// rotate ground body by 90 degrees
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);

groundBody.collisionFilterGroup = 2;
leftWallBody.collisionFilterGroup = 2;
rightWallBody.collisionFilterGroup = 2;
physicsWorld.addBody(groundBody);
physicsWorld.addBody(leftWallBody);
physicsWorld.addBody(rightWallBody);

// // add a green wireframe to each object and visualize the physics world
const cannonDebugger = CannonDebugger(frame.scene, physicsWorld, {
  color: "lime",
  autoUpdate: false,
});

function generateCars(N: number): Car[] {
  const cars = [];
  for (let i = 0; i < N; i++) {
    cars.push(new Car(physicsWorld, frame.scene));
  }
  return cars;
}

const cars = generateCars(20);
let bestCar = cars[0] as Car;
if (localStorage.getItem("bestBrain")) {
  cars.forEach((car, i) => {
    car.brain = JSON.parse(localStorage.getItem("bestBrain") as string);
    if (i != 0) NeuralNetwork.mutate(car.brain, 0.3);
  });
  console.log("Previous best brain loaded", bestCar.brain);
}

// Brain Controls - Listeners
window.addEventListener("keydown", (e) => {
  if (e.key == "b") {
    save(bestCar);
    console.log("saved");
  } else if (e.key == "n") {
    discard();
    console.log("discarded");
  } else if (e.key == "l") {
    upload();
    console.log("uploaded");
  } else if (e.key == "k") {
    download();
    console.log("downloaded");
  }
});

// MESH FOR GROUND
const planeGeometry = new THREE.PlaneGeometry(100, 10000, 100, 10000);
const planeMaterial = new THREE.MeshStandardMaterial({
  wireframe: false,
  color: "gray",
});
const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
frame.scene.add(planeMesh);

// MESH FOR WALLS
const leftwallGeometry = new THREE.BoxGeometry(5, 5, 10000);
const leftwallMaterial = new THREE.MeshStandardMaterial({
  color: "blue",
});
const rightwallGeometry = new THREE.BoxGeometry(5, 5, 10000);
const rightwallMaterial = new THREE.MeshStandardMaterial({
  color: "red",
});
const leftwallMesh = new THREE.Mesh(leftwallGeometry, leftwallMaterial);
const rightwallMesh = new THREE.Mesh(rightwallGeometry, rightwallMaterial);
frame.scene.add(leftwallMesh);
frame.scene.add(rightwallMesh);

const obstacleMeshes: THREE.Mesh[] = [];
const obstacleBodies: CANNON.Body[] = [];
// the grid for the layout of the obstacles
const grid = [
  [0, 1, 0, 0, 0, 1, 0, 0, 1],
  [1, 0, 1, 0, 1, 0, 1, 0, 1],
  [0, 1, 0, 1, 0, 0, 0, 1, 0],
];
// Set obstacles based on the grid
for (let i = 0; i < grid.length; i++) {
  for (let j = 0; j < grid[0].length; j++)
    if (grid[i][j] >= 1) {
      const boxGeometry = new THREE.BoxGeometry(15, 2, 10);
      const boxMaterial = new THREE.MeshStandardMaterial({
        wireframe: false,
        color: "red",
      });
      const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
      const boxBody = new CANNON.Body({
        mass: 9000,
        shape: new CANNON.Box(new CANNON.Vec3(7.5, 1, 5)),
        position: new CANNON.Vec3(
          // set the boxes to any one of the three lanes
          i == 0 ? -20 : i == 1 ? 0 : 20,
          1,
          // set the boxes to random positions on the z axis
          j * -100 - 100
        ),
      });
      boxBody.collisionFilterGroup = 2;
      physicsWorld.addBody(boxBody);
      frame.scene.add(boxMesh);
      obstacleMeshes.push(boxMesh);
      obstacleBodies.push(boxBody);
    }
}

// save the best brain
function save(bestCar: Car) {
  localStorage.setItem("bestBrain", JSON.stringify(bestCar.brain));
}
function discard() {
  localStorage.removeItem("bestBrain");
}
function download() {
  // download the best brain as a json file
  const dataStr =
    "data:text/json;charset=utf-8," +
    encodeURIComponent(JSON.stringify(bestCar.brain));
  const downloadAnchorNode = document.createElement("a");
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "bestBrain.json");
  document.body.appendChild(downloadAnchorNode); // required for firefox
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}
function upload() {
  // upload a json file as the best brain
  const input = document.createElement("input");
  input.type = "file";
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0] as File;
    const reader = new FileReader();
    reader.readAsText(file, "UTF-8");
    reader.onload = (readerEvent) => {
      const content = readerEvent.target?.result;
      bestCar.brain = JSON.parse(content as string);
    };
  };
  input.click();
}

const setCameraFollow = (bestCar: Car) => {
  frame.camera.position.set(
    bestCar.bodyMesh?.position.x as number,
    (bestCar.bodyMesh?.position.y as number) + 150,
    bestCar.bodyMesh?.position.z as number
  );
  frame.camera.lookAt(bestCar.bodyMesh?.position as THREE.Vector3);
};

const resetBoxes = () => {
  obstacleMeshes.forEach((box: any) => {
    box.material.color.set("red");
  });
  leftwallMesh.material.color.set("blue");
  rightwallMesh.material.color.set("red");
};

cars.forEach((car) => {
  car.setObstacles([...obstacleMeshes, leftwallMesh, rightwallMesh]);
});
const debug_enabled = false;

function animate() {
  physicsWorld.fixedStep();

  if (debug_enabled) cannonDebugger.update();

  resetBoxes();
  cars.forEach((car) => {
    car.update();
    if (car.isDamaged) {
      car.remove();
    }
  });

  bestCar = cars.find(
    (car) =>
      car.body?.position.z ==
      Math.min(...cars.map((car) => car.body?.position.z as number))
  ) as Car;

  // console.log(bestCar.controls)

  planeMesh.position.copy(groundBody.position as any);
  planeMesh.quaternion.copy(groundBody.quaternion as any);
  leftwallMesh.position.copy(leftWallBody.position as any);
  leftwallMesh.quaternion.copy(leftWallBody.quaternion as any);
  rightwallMesh.position.copy(rightWallBody.position as any);
  rightwallMesh.quaternion.copy(rightWallBody.quaternion as any);

  // stop the loop when the car collides
  setCameraFollow(bestCar as Car);

  obstacleBodies.forEach((box: any, i) => {
    obstacleMeshes[i].position.copy(box.position as any);
    obstacleMeshes[i].quaternion.copy(box.quaternion as any);
  });

  requestAnimationFrame(animate);
}
animate();
