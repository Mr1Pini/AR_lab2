import './style.css';
import * as THREE from 'three';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';

let camera, scene, renderer;
let controller;

// Змінні для Hit Test
let reticle;
let hitTestSource = null;
let hitTestSourceRequested = false;

init();
animate();

function init() {
    const container = document.createElement('div');
    document.body.appendChild(container);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

    // Додаємо гарне освітлення, щоб грані октаедра було добре видно
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 2);
    light.position.set(0.5, 1, 0.25);
    scene.add(light);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true; // Вмикаємо WebXR
    container.appendChild(renderer.domElement);

    // ВАЖЛИВО: Кнопка з вимогою Hit Test
    document.body.appendChild(ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] }));

    // --- СТВОРЕННЯ МІТКИ ПОВЕРХНІ (Reticle) ---
    const reticleGeometry = new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2);
    const reticleMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // Зелене кільце
    reticle = new THREE.Mesh(reticleGeometry, reticleMaterial);
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);

    // --- ОБРОБКА ВЗАЄМОДІЇ З ЕКРАНОМ (Тап) ---
    controller = renderer.xr.getController(0);
    controller.addEventListener('select', onSelect);
    scene.add(controller);

    window.addEventListener('resize', onWindowResize);
}

// Функція, яка спрацьовує при тапі на екран
function onSelect() {
    if (reticle.visible) {
        // Створюємо ОКТАЕДР (ваше індивідуальне завдання)
        // 0.1 - це радіус фігури (10 см)
        const geometry = new THREE.OctahedronGeometry(0.1); 
        
        // Робимо матеріал, який щоразу отримує випадковий колір, щоб було цікавіше ставити багато фігур
        const material = new THREE.MeshStandardMaterial({ 
            color: 0xffffff * Math.random(), 
            roughness: 0.3, 
            metalness: 0.2 
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        
        // Ставимо фігуру на координати мітки
        mesh.position.setFromMatrixPosition(reticle.matrix);
        scene.add(mesh);
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    renderer.setAnimationLoop(render);
}

// Головний цикл рендерингу та логіка Hit Test
function render(timestamp, frame) {
    if (frame) {
        const referenceSpace = renderer.xr.getReferenceSpace();
        const session = renderer.xr.getSession();

        if (hitTestSourceRequested === false) {
            session.requestReferenceSpace('viewer').then(function (referenceSpace) {
                session.requestHitTestSource({ space: referenceSpace }).then(function (source) {
                    hitTestSource = source;
                });
            });
            session.addEventListener('end', function () {
                hitTestSourceRequested = false;
                hitTestSource = null;
            });
            hitTestSourceRequested = true;
        }

        if (hitTestSource) {
            const hitTestResults = frame.getHitTestResults(hitTestSource);
            if (hitTestResults.length > 0) {
                const hit = hitTestResults[0];
                const pose = hit.getPose(referenceSpace);
                
                // Якщо знайшли поверхню - показуємо мітку
                reticle.visible = true;
                reticle.matrix.fromArray(pose.transform.matrix);
            } else {
                reticle.visible = false;
            }
        }
    }
    renderer.render(scene, camera);
}