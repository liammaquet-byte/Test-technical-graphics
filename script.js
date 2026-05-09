import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const threeView = document.getElementById("threeView");
const solidType = document.getElementById("solidType");
const rotation = document.getElementById("rotation");
const hiddenToggle = document.getElementById("hiddenToggle");
const sectionToggle = document.getElementById("sectionToggle");
const quizToggle = document.getElementById("quizToggle");
const quizPanel = document.getElementById("quizPanel");
const quizFeedback = document.getElementById("quizFeedback");
const statusEl = document.getElementById("status");

const canvases = {
  front: document.getElementById("frontCanvas"),
  plan: document.getElementById("planCanvas"),
  side: document.getElementById("sideCanvas")
};

let scene, camera, renderer, controls, solid, sectionPlaneMesh;
let constructionStep = 1;

init3D();
createSolid();
drawProjections();

function init3D() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  camera = new THREE.PerspectiveCamera(45, threeView.clientWidth / threeView.clientHeight, 0.1, 100);
  camera.position.set(4, 3, 5);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(threeView.clientWidth, threeView.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  threeView.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  const light = new THREE.DirectionalLight(0xffffff, 1.2);
  light.position.set(5, 6, 4);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));

  const grid = new THREE.GridHelper(6, 12, 0xd1d5db, 0xe5e7eb);
  scene.add(grid);

  animate();
}

function createSolid() {
  if (solid) scene.remove(solid);
  if (sectionPlaneMesh) scene.remove(sectionPlaneMesh);

  const material = new THREE.MeshStandardMaterial({
    color: 0x93c5fd,
    roughness: 0.45,
    metalness: 0.05,
    transparent: true,
    opacity: sectionToggle.checked ? 0.72 : 1
  });

  let geometry;

  if (solidType.value === "cube") {
    geometry = new THREE.BoxGeometry(2, 2, 2);
  }

  if (solidType.value === "cylinder") {
    geometry = new THREE.CylinderGeometry(1, 1, 2.2, 48);
  }

  if (solidType.value === "cone") {
    geometry = new THREE.ConeGeometry(1.1, 2.4, 48);
  }

  if (solidType.value === "prism") {
    const shape = new THREE.Shape();
    shape.moveTo(-1, -0.8);
    shape.lineTo(1, -0.8);
    shape.lineTo(0, 0.9);
    shape.lineTo(-1, -0.8);

    geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 2,
      bevelEnabled: false
    });
    geometry.center();
  }

  solid = new THREE.Mesh(geometry, material);
  solid.rotation.y = THREE.MathUtils.degToRad(Number(rotation.value));
  scene.add(solid);

  const edges = new THREE.EdgesGeometry(geometry);
  const lines = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color: 0x111827 })
  );
  solid.add(lines);

  if (sectionToggle.checked) {
    const planeGeo = new THREE.PlaneGeometry(3.2, 3.2);
    const planeMat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide
    });

    sectionPlaneMesh = new THREE.Mesh(planeGeo, planeMat);
    sectionPlaneMesh.rotation.y = Math.PI / 2;
    scene.add(sectionPlaneMesh);
  }
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

function drawProjections() {
  drawView(canvases.front, "front");
  drawView(canvases.plan, "plan");
  drawView(canvases.side, "side");
}

function clearCanvas(canvas) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return ctx;
}

function drawView(canvas, view) {
  const ctx = clearCanvas(canvas);
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;

  ctx.lineWidth = 2;
  ctx.strokeStyle = "#111827";
  ctx.fillStyle = "#eff6ff";

  if (constructionStep >= 1) {
    if (solidType.value === "cube") drawRect(ctx, cx, cy, 120, 90);
    if (solidType.value === "cylinder") drawCylinderProjection(ctx, cx, cy, view);
    if (solidType.value === "cone") drawConeProjection(ctx, cx, cy, view);
    if (solidType.value === "prism") drawPrismProjection(ctx, cx, cy, view);
  }

  if (hiddenToggle.checked && constructionStep >= 2) {
    ctx.setLineDash([6, 5]);
    ctx.strokeStyle = "#6b7280";
    drawHiddenDetail(ctx, cx, cy, view);
    ctx.setLineDash([]);
  }

  if (sectionToggle.checked && constructionStep >= 3) {
    ctx.strokeStyle = "#f97316";
    ctx.lineWidth = 3;
    drawSectionLine(ctx, cx, cy, view);
  }
}

function drawRect(ctx, cx, cy, width, height) {
  ctx.beginPath();
  ctx.rect(cx - width / 2, cy - height / 2, width, height);
  ctx.fill();
  ctx.stroke();
}

function drawCylinderProjection(ctx, cx, cy, view) {
  if (view === "plan") {
    ctx.beginPath();
    ctx.arc(cx, cy, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    drawRect(ctx, cx, cy, 95, 115);
    ctx.beginPath();
    ctx.ellipse(cx, cy - 57, 47, 12, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx, cy + 57, 47, 12, 0, 0, Math.PI);
    ctx.stroke();
  }
}

function drawConeProjection(ctx, cx, cy, view) {
  if (view === "plan") {
    ctx.beginPath();
    ctx.arc(cx, cy, 50, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#111827";
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(cx, cy - 65);
    ctx.lineTo(cx - 55, cy + 60);
    ctx.lineTo(cx + 55, cy + 60);
    ctx.closePath();
    ctx.fillStyle = "#eff6ff";
    ctx.fill();
    ctx.stroke();
  }
}

function drawPrismProjection(ctx, cx, cy, view) {
  if (view === "front") {
    ctx.beginPath();
    ctx.moveTo(cx, cy - 60);
    ctx.lineTo(cx - 65, cy + 55);
    ctx.lineTo(cx + 65, cy + 55);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    drawRect(ctx, cx, cy, 130, 80);
  }
}

function drawHiddenDetail(ctx, cx, cy, view) {
  if (view === "plan") {
    ctx.beginPath();
    ctx.moveTo(cx - 60, cy);
    ctx.lineTo(cx + 60, cy);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(cx, cy - 60);
    ctx.lineTo(cx, cy + 60);
    ctx.stroke();
  }
}

function drawSectionLine(ctx, cx, cy, view) {
  if (view === "plan") {
    ctx.beginPath();
    ctx.moveTo(cx - 70, cy - 35);
    ctx.lineTo(cx + 70, cy + 35);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(cx - 70, cy);
    ctx.lineTo(cx + 70, cy);
    ctx.stroke();
  }
}

function refresh() {
  createSolid();
  drawProjections();
}

solidType.addEventListener("change", refresh);

rotation.addEventListener("input", () => {
  if (solid) {
    solid.rotation.y = THREE.MathUtils.degToRad(Number(rotation.value));
  }
  drawProjections();
});

hiddenToggle.addEventListener("change", drawProjections);

sectionToggle.addEventListener("change", refresh);

quizToggle.addEventListener("change", () => {
  quizPanel.hidden = !quizToggle.checked;
});

document.getElementById("resetBtn").addEventListener("click", () => {
  solidType.value = "cube";
  rotation.value = 25;
  hiddenToggle.checked = true;
  sectionToggle.checked = false;
  quizToggle.checked = false;
  quizPanel.hidden = true;
  constructionStep = 3;
  refresh();
  statusEl.textContent = "Reset complete.";
});

document.getElementById("animateBtn").addEventListener("click", () => {
  constructionStep = 0;
  statusEl.textContent = "Construction animation running...";

  const timer = setInterval(() => {
    constructionStep++;
    drawProjections();

    if (constructionStep >= 3) {
      clearInterval(timer);
      statusEl.textContent = "Construction complete: outline, hidden detail, and section detail shown.";
    }
  }, 700);
});

document.querySelectorAll(".quizAnswer").forEach((button) => {
  button.addEventListener("click", () => {
    const answer = button.dataset.answer;

    if (answer === "plan") {
      quizFeedback.textContent = "Correct — the plan is the view from above.";
      quizFeedback.style.color = "#065f46";
    } else {
      quizFeedback.textContent = "Not quite. The plan shows the object from above.";
      quizFeedback.style.color = "#991b1b";
    }
  });
});

window.addEventListener("resize", () => {
  camera.aspect = threeView.clientWidth / threeView.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(threeView.clientWidth, threeView.clientHeight);
});
