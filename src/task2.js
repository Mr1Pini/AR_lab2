import './style.css';
import * as THREE from 'three';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

let camera, scene, renderer;
let mixer; // Для анімації
const clock = new THREE.Clock();

init();
animate();

function init() {
    const container = document.createElement('div');
    document.body.appendChild(container);

    scene = new THREE.Scene();

    // Камера
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

    // --- ОСВІТЛЕННЯ (щоб модель була красивою і кольоровою) ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.0);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 3.0);
    directionalLight.position.set(1, 4, 2);
    scene.add(directionalLight);

    // Рендерер
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true; // Вмикаємо WebXR
    container.appendChild(renderer.domElement);

    // Звичайна кнопка AR (БЕЗ hit-test)
    document.body.appendChild(ARButton.createButton(renderer));

    // --- ЗАВАНТАЖЕННЯ 3D-МОДЕЛІ ---
    const loader = new GLTFLoader();
    
    // ВКАЖІТЬ ТУТ ШЛЯХ ДО ВАШОЇ НОВОЇ МОДЕЛІ (наприклад, 'bus/model.glb' або 'bus/scene.gltf')
    loader.load('./bus/scene.gltf', function (gltf) {
        const model = gltf.scene;
        
        // Розміщуємо модель: 0 по X, 0 по Y, і -2 по Z (це означає 2 метри ПРЯМО ПЕРЕД КАМЕРОЮ)
        model.position.set(0, -1, -2); 
        
        // Масштаб (змініть, якщо модель буде занадто великою/малою)
        model.scale.set(0.3, 0.3, 0.3); 

        scene.add(model);

        // Запуск анімації
        if (gltf.animations && gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(model);
            const action = mixer.clipAction(gltf.animations[0]); // Граємо першу анімацію
            action.play();
        }
    }, undefined, function (error) {
        console.error('Помилка завантаження моделі:', error);
    });

    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    renderer.setAnimationLoop(render);
}

function render() {
    // Оновлюємо анімацію кожен кадр
    const delta = clock.getDelta();
    if (mixer) {
        mixer.update(delta);
    }

    renderer.render(scene, camera);
}