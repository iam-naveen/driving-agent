import "./style.css";
import * as THREE from "three";
import * as CANNON from "cannon-es";
import CannonDebugger from "cannon-es-debugger";

import SceneInit from "./lib/SceneInit.js";

// set up Three.js scene with axis helper
const frame = new SceneInit("canvas"); // frame is initialised
frame.animate();
const axesHelper = new THREE.AxesHelper(8);
frame.scene.add(axesHelper);

// set up world physics with gravity
const physicsWorld = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.8, 0),
});
physicsWorld.broadphase = new CANNON.SAPBroadphase(physicsWorld);
physicsWorld.defaultContactMaterial.friction = 0.2;

const groundMaterial = new CANNON.Material("groundMaterial");
const wheelMaterial = new CANNON.Material("wheelMaterial");
const wheelGroundContactMaterial = new CANNON.ContactMaterial(
  wheelMaterial,
  groundMaterial,
  {
    friction: 0.3,
    restitution: 0,
    contactEquationStiffness: 1000,
  }
);
physicsWorld.addContactMaterial(wheelGroundContactMaterial);

// create a ground body with a static plane
const groundBody = new CANNON.Body({
  mass: 0,
  type: CANNON.Body.STATIC,
  // infinte geometric plane
  shape: new CANNON.Plane(),
  material: new CANNON.Material("groundMaterial"),
});

const leftWallBody = new CANNON.Body({
  type: CANNON.Body.STATIC,
  shape: new CANNON.Box(new CANNON.Vec3(2.5, 2.5, 5000)),
  position: new CANNON.Vec3(-30, 0, 0),
});
const rightWallBody = new CANNON.Body({
  type: CANNON.Body.STATIC,
  shape: new CANNON.Box(new CANNON.Vec3(2.5, 2.5, 5000)),
  position: new CANNON.Vec3(30, 0, 0),
});
// for flat surface
// rotate ground body by 90 degrees
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);

physicsWorld.addBody(groundBody);
physicsWorld.addBody(leftWallBody);
physicsWorld.addBody(rightWallBody);

// // add a green wireframe to each object and visualize the physics world
const cannonDebugger = CannonDebugger(frame.scene, physicsWorld, {
  color: "lime",
  autoUpdate: false,
});

// add base vehicle body
const carBody = new CANNON.Body({
  mass: 1,
  position: new CANNON.Vec3(0, 5, 0),
  shape: new CANNON.Box(new CANNON.Vec3(2, 0.5, 4)),
});

const vehicle = new CANNON.RigidVehicle({
  chassisBody: carBody,
});

// add wheels to the vehicle
const mass = 1;
const axisWidth = 5;
const wheelShape = new CANNON.Sphere(1);
const down = new CANNON.Vec3(0, 0, -1);

const wheelBody1 = new CANNON.Body({ mass: mass, material: wheelMaterial });
wheelBody1.addShape(wheelShape);
wheelBody1.angularDamping = 0.4;
vehicle.addWheel({
  body: wheelBody1,
  position: new CANNON.Vec3(-axisWidth / 2, 0, -2),
  axis: new CANNON.Vec3(-1, 0, 0),
  direction: down,
});

const wheelBody2 = new CANNON.Body({ mass: mass, material: wheelMaterial });
wheelBody2.addShape(wheelShape);
wheelBody2.angularDamping = 0.4;
vehicle.addWheel({
  body: wheelBody2,
  position: new CANNON.Vec3(axisWidth / 2, 0, -2),
  axis: new CANNON.Vec3(-1, 0, 0),
  direction: down,
});

const wheelBody3 = new CANNON.Body({ mass: mass, material: wheelMaterial });
wheelBody3.addShape(wheelShape);
wheelBody3.angularDamping = 0.4;
vehicle.addWheel({
  body: wheelBody3,
  position: new CANNON.Vec3(axisWidth / 2, 0, 2),
  axis: new CANNON.Vec3(-1, 0, 0),
  direction: down,
});

const wheelBody4 = new CANNON.Body({ mass: mass, material: wheelMaterial });
wheelBody4.addShape(wheelShape);
wheelBody4.angularDamping = 0.4;
vehicle.addWheel({
  body: wheelBody4,
  position: new CANNON.Vec3(-axisWidth / 2, 0, 2),
  axis: new CANNON.Vec3(-1, 0, 0),
  direction: down,
});

vehicle.addToWorld(physicsWorld);

const maxSteerVal = Math.PI / 12;
const maxForce = 30;

// move car based on user input
document.addEventListener("keydown", (event) => {
  switch (event.key) {
    case "w":
    case "ArrowUp":
      vehicle.setWheelForce(maxForce, 2);
      vehicle.setWheelForce(maxForce, 3);
      break;

    case "s":
    case "ArrowDown":
      vehicle.setWheelForce(-maxForce / 2, 2);
      vehicle.setWheelForce(-maxForce / 2, 3);
      break;

    case "a":
    case "ArrowLeft":
      vehicle.setSteeringValue(maxSteerVal, 0);
      vehicle.setSteeringValue(maxSteerVal, 1);
      break;

    case "d":
    case "ArrowRight":
      vehicle.setSteeringValue(-maxSteerVal, 0);
      vehicle.setSteeringValue(-maxSteerVal, 1);
      break;
  }
});

// reset car force to zero when key is released
document.addEventListener("keyup", (event) => {
  switch (event.key) {
    case "w":
    case "ArrowUp":
      vehicle.setWheelForce(0, 2);
      vehicle.setWheelForce(0, 3);
      break;

    case "s":
    case "ArrowDown":
      vehicle.setWheelForce(0, 2);
      vehicle.setWheelForce(0, 3);
      break;

    case "a":
    case "ArrowLeft":
      vehicle.setSteeringValue(0, 0);
      vehicle.setSteeringValue(0, 1);
      break;

    case "d":
    case "ArrowRight":
      vehicle.setSteeringValue(0, 0);
      vehicle.setSteeringValue(0, 1);
      break;
  }
});

// sync game world with physics world

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

// MESH FOR CAR BODY
const boxGeometry = new THREE.BoxGeometry(4, 1, 8);
const boxMaterial = new THREE.MeshNormalMaterial();
const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
frame.scene.add(boxMesh);

// MESH FOR WHEELS
const sphereMaterial = new THREE.MeshNormalMaterial({ wireframe: false });
const sphereGeometry1 = new THREE.SphereGeometry(1);
const sphereMesh1 = new THREE.Mesh(sphereGeometry1, sphereMaterial);
frame.scene.add(sphereMesh1);

const sphereGeometry2 = new THREE.SphereGeometry(1);
const sphereMesh2 = new THREE.Mesh(sphereGeometry2, sphereMaterial);
frame.scene.add(sphereMesh2);

const sphereGeometry3 = new THREE.SphereGeometry(1);
const sphereMesh3 = new THREE.Mesh(sphereGeometry3, sphereMaterial);
frame.scene.add(sphereMesh3);

const sphereGeometry4 = new THREE.SphereGeometry(1);
const sphereMesh4 = new THREE.Mesh(sphereGeometry4, sphereMaterial);
frame.scene.add(sphereMesh4);

const obstacleMeshes: THREE.Mesh[] = [];
const obstacleBodies: CANNON.Body[] = [];
// the grid for the layout of the obstacles
const grid = [
  [1, 0, 1, 0, 0, 1, 0, 0, 1],
  [1, 0, 1, 0, 1, 0, 1, 0, 1],
  [0, 0, 0, 1, 0, 0, 0, 1, 0],
];
// Set obstacles based on the grid
let obstacleCount = 0;
for (let i = 0; i < grid.length; i++) {
  for (let j = 0; j < grid[0].length; j++)
    if (grid[i][j] >= 1) {
      obstacleCount++;
      const boxGeometry = new THREE.BoxGeometry(16, 2, 32);
      const boxMaterial = new THREE.MeshStandardMaterial({
        wireframe: false,
        color: "red",
      });
      const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
      const boxBody = new CANNON.Body({
        mass: 1,
        shape: new CANNON.Box(new CANNON.Vec3(8, 1, 16)),
        position: new CANNON.Vec3(
          // set the boxes to any one of the three lanes
          i == 0 ? -20 : i == 1 ? 0 : 20,
          1,
          // set the boxes to random positions on the z axis
          j * -100 - 100
        ),
      });
      physicsWorld.addBody(boxBody);
      frame.scene.add(boxMesh);
      obstacleMeshes.push(boxMesh);
      obstacleBodies.push(boxBody);
    }
}

const debug_enabled = true;

const numberOfRays = 50;
const rayLength = 50;
const raySpread = 2 * Math.PI;
// function lerp(a: number, b: number, t: number): number {
//   return a * (b - a) * t;
// }

const raycasters: THREE.Raycaster[] = [];
const raycasterLines: THREE.Line[] = [];
for (let i = 0; i < numberOfRays; i++) {
  // Create Raycaster
  const raycaster = new THREE.Raycaster();

  // Create Visual Representation
  const raycasterGeometry = new THREE.BufferGeometry().setFromPoints([
    boxMesh.position.clone(), // Start of the raycaster
    boxMesh.position.clone().add(new THREE.Vector3(0, 0, -rayLength)), // Length of the raycaster
  ]);
  const raycasterMaterial = new THREE.LineBasicMaterial({
    color: "red",
  });
  const raycasterLine = new THREE.Line(raycasterGeometry, raycasterMaterial);

  raycasters.push(raycaster);
  raycasterLines.push(raycasterLine);

  frame.scene.add(raycasterLine);
}

const updateRay = () => {
  for (let i = 0; i < numberOfRays; i++) {
    const rayAngle = THREE.MathUtils.lerp(
      raySpread / 2,
      -raySpread / 2,
      i / (numberOfRays - 1)
    );

    // Set the position and direction of each raycaster
    const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(
      boxMesh.quaternion
    );
    direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), rayAngle);
    raycasters[i].set(boxMesh.position, direction);

    // Update the position and rotation of each raycaster line to match the raycaster
    raycasterLines[i].position.copy(boxMesh.position);
    const rotationQuaternion = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      rayAngle
    );
    raycasterLines[i].quaternion
      .copy(boxMesh.quaternion)
      .multiply(rotationQuaternion);
  }
};

const drawCar = () => {
  planeMesh.position.copy(groundBody.position as any);
  planeMesh.quaternion.copy(groundBody.quaternion as any);

  leftwallMesh.position.copy(leftWallBody.position as any);
  leftwallMesh.quaternion.copy(leftWallBody.quaternion as any);

  rightwallMesh.position.copy(rightWallBody.position as any);
  rightwallMesh.quaternion.copy(rightWallBody.quaternion as any);

  boxMesh.position.copy(carBody.position as any);
  boxMesh.quaternion.copy(carBody.quaternion as any);
  sphereMesh1.position.copy(wheelBody1.position as any);
  sphereMesh1.quaternion.copy(wheelBody1.quaternion as any);
  sphereMesh2.position.copy(wheelBody2.position as any);
  sphereMesh2.quaternion.copy(wheelBody2.quaternion as any);
  sphereMesh3.position.copy(wheelBody3.position as any);
  sphereMesh3.quaternion.copy(wheelBody3.quaternion as any);
  sphereMesh4.position.copy(wheelBody4.position as any);
  sphereMesh4.quaternion.copy(wheelBody4.quaternion as any);
};

let isDamaged = false;
// Funtion to detect whether the car collided the obstacles
function isColliding(): void {
  const box = new THREE.Box3().setFromObject(boxMesh);
  const leftWall = new THREE.Box3().setFromObject(leftwallMesh);
  const rightWall = new THREE.Box3().setFromObject(rightwallMesh);
  for (let obstacle of obstacleMeshes) {
    const obstacleBox = new THREE.Box3().setFromObject(obstacle);
    if (
      box.intersectsBox(obstacleBox) ||
      box.intersectsBox(leftWall) ||
      box.intersectsBox(rightWall)
    ) {
      isDamaged = true;
    }
  }
}

const setCameraFollow = () => {
  frame.camera.lookAt(
    boxMesh.position.x,
    boxMesh.position.y + 5,
    boxMesh.position.z - 5
  );
  frame.camera.position.set(
    boxMesh.position.x,
    boxMesh.position.y + 10,
    boxMesh.position.z + 25
  );
};

let touches: { point: THREE.Vector3; distance: number }[];
const detectTouch = (box: any) => {
  box.object.material.color.set("black");
  touches.push({
    point: box.point,
    distance: box.distance,
  });
};
const resetBoxes = () => {
  obstacleMeshes.forEach((box: any) => {
    box.material.color.set("red");
  });
  leftwallMesh.material.color.set("blue");
  rightwallMesh.material.color.set("red");
};
const removeCar = () => {
  vehicle.removeFromWorld(physicsWorld);
  frame.scene.remove(boxMesh);
  frame.scene.remove(sphereMesh1);
  frame.scene.remove(sphereMesh2);
  frame.scene.remove(sphereMesh3);
  frame.scene.remove(sphereMesh4);
  for (let i = 0; i < numberOfRays; i++) {
    frame.scene.remove(raycasterLines[i]);
  }
};

const animate = () => {
  physicsWorld.fixedStep();

  if (debug_enabled) cannonDebugger.update();

  // CHANGE COLOR OF THE SELECTED BOX ONLY
  resetBoxes(); // Reset the color back to original
  let intersects = [];
  for (let raycaster of raycasters) {
    intersects.push(
      raycaster.intersectObjects([
        ...obstacleMeshes,
        leftwallMesh,
        rightwallMesh,
      ])
    );
  }
  touches = [];
  for (let intersect of intersects) {
    if (intersect.length > 0 && intersect[0].distance < rayLength) {
      detectTouch(intersect[0]); // Set the color of the selected box
    }
  }

  drawCar();
  updateRay();
  isColliding();
  // stop the loop when the car collides
  if (isDamaged) {
    console.log("Collision detected");
    removeCar();
  }
  setCameraFollow();

  for (let i = 0; i < obstacleCount; i++) {
    obstacleMeshes[i].position.copy(obstacleBodies[i].position as any);
    obstacleMeshes[i].quaternion.copy(obstacleBodies[i].quaternion as any);
  }

  requestAnimationFrame(animate);
};
animate();
