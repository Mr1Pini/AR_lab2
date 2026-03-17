import './style.css';
import * as THREE from 'three';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

let camera, scene, renderer;
let controller;
let reticle;
let hitTestSource = null;
let hitTestSourceRequested = false;

// Масив для збереження моделей
let loadedModels = [];
// Змінна, яка запам'ятовує, чия зараз черга з'являтися
let currentSpawnIndex = 0; 

init();
animate();

function init() {
    const container = document.createElement('div');
    document.body.appendChild(container);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

    const ambientLight = new THREE.AmbientLight(0xffffff, 2.0);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 3.0);
    directionalLight.position.set(1, 4, 2);
    scene.add(directionalLight);
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);
    hemisphereLight.position.set(0, 2, 0);
    scene.add(hemisphereLight);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);

    document.body.appendChild(ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] }));

    const loader = new GLTFLoader();
    
    // Жорстко задаємо порядок: 0 - Фастфуд, 1 - Пиво, 2 - Тортик
    const modelPaths = [
        'models/fastfood/low_poly_hamburger.glb',
        'models/beer/roxie_rootbeer.glb',
        'models/cake/valentines_birthday_ice_cream_cake.glb'
    ];

    modelPaths.forEach((path, index) => {
        loader.load(path, function (gltf) {
            const model = gltf.scene;
            model.scale.set(0.2, 0.2, 0.2);
            // Записуємо модель чітко на її місце в масиві, щоб зберегти порядок
            loadedModels[index] = model; 
            console.log(`Модель ${path} завантажена на позицію ${index}`);
        }, undefined, function (error) {
            console.error(`Помилка завантаження ${path}:`, error);
        });
    });

    const reticleGeometry = new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2);
    const reticleMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    reticle = new THREE.Mesh(reticleGeometry, reticleMaterial);
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);

    controller = renderer.xr.getController(0);
    controller.addEventListener('select', onSelect);
    scene.add(controller);

    window.addEventListener('resize', onWindowResize);
}

function onSelect() {
    // Якщо приціл бачить підлогу І потрібна нам модель вже встигла завантажитися
    if (reticle.visible && loadedModels[currentSpawnIndex]) {
        
        // Беремо модель строго по черзі
        const modelToSpawn = loadedModels[currentSpawnIndex].clone();
        
        // Ставимо копію на координати прицілу
        modelToSpawn.position.setFromMatrixPosition(reticle.matrix);
        scene.add(modelToSpawn);

        // Переходимо до наступного об'єкта
        currentSpawnIndex++;
        
        // Якщо ми поставили тортик (останній індекс), починаємо знову з фастфуду
        if (currentSpawnIndex >= loadedModels.length) {
            currentSpawnIndex = 0;
        }
    } else if (reticle.visible) {
        console.log("Модель ще завантажується, зачекайте...");
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
                
                reticle.visible = true;
                reticle.matrix.fromArray(pose.transform.matrix);
            } else {
                reticle.visible = false;
            }
        }
    }
    renderer.render(scene, camera);
}