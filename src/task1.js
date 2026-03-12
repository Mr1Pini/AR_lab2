import './style.css';
import * as THREE from 'three';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';

let camera, scene, renderer;
// Змінні для ваших фігур за 1 варіантом
let dodecahedron, extrudeObject, tubeObject;

init();
animate();

function init() {
    const container = document.createElement('div');
    document.body.appendChild(container);

    // 1. Створення сцени
    scene = new THREE.Scene();

    // 2. Створення камери (Кут огляду 70, пропорції екрану, ближня/дальня площина відсікання)
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

    // 3. Налаштування рендерера (малює графіку)
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // alpha: true робить фон прозорим для камери AR
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true; // ОБОВ'ЯЗКОВО: вмикаємо підтримку WebXR
    container.appendChild(renderer.domElement);

    // Додаємо кнопку AR на сторінку
    document.body.appendChild(ARButton.createButton(renderer));

    // Додаємо світло, щоб фігури не були чорними силуетами
    // 1. Базове освітлення (AmbientLight) - рівномірно підсвічує всі об'єкти з усіх боків, щоб не було абсолютно чорних тіней
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4); // Колір білий, інтенсивність 40%
    scene.add(ambientLight);

    // 2. Направлене світло (DirectionalLight) - імітує сонце, дає об'єм та відблиски на матеріалі Phong
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8); // Колір білий, інтенсивність 80%
    directionalLight.position.set(1, 2, 1); // Розміщуємо джерело світла зверху, спереду і трохи справа
    scene.add(directionalLight);

    // --- 1. ДОДЕКАЕДР (Металевий матеріал) ---
    const dodecahedronGeometry = new THREE.DodecahedronGeometry(0.15);
    const dodecahedronMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xff3333,     // Червоний колір
        metalness: 0.8,      // Сильний металевий відблиск (від 0 до 1)
        roughness: 0.2       // Гладка поверхня (від 0 до 1)
    }); 
    dodecahedron = new THREE.Mesh(dodecahedronGeometry, dodecahedronMaterial);
    dodecahedron.position.set(-0.5, 0, -1);
    scene.add(dodecahedron);

    // --- 2. EXTRUDE GEOMETRY (Напівпрозорий "скляний" матеріал) ---
    const shape = new THREE.Shape();
    shape.moveTo(0, 0.1);
    shape.lineTo(0.1, 0);
    shape.lineTo(0, -0.1);
    shape.lineTo(-0.1, 0);
    shape.lineTo(0, 0.1);
    
    const extrudeSettings = { 
        depth: 0.1, bevelEnabled: true, bevelSegments: 2, 
        steps: 2, bevelSize: 0.02, bevelThickness: 0.02 
    };
    const extrudeGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const extrudeMaterial = new THREE.MeshPhysicalMaterial({ 
        color: 0x00ff00,     // Зелений колір
        transparent: true,   // Вмикаємо підтримку прозорості
        opacity: 0.5,        // Напівпрозорий (50% видимості)
        transmission: 0.5,   // Ефект пропускання світла (як у скла)
        roughness: 0.1
    }); 
    extrudeObject = new THREE.Mesh(extrudeGeometry, extrudeMaterial);
    extrudeObject.position.set(0, 0, -1);
    scene.add(extrudeObject);

    // --- 3. TUBE GEOMETRY (Переливчастий каркасний матеріал) ---
    class CustomSinCurve extends THREE.Curve {
        constructor(scale = 1) { super(); this.scale = scale; }
        getPoint(t, optionalTarget = new THREE.Vector3()) {
            const tx = t * 3 - 1.5;
            const ty = Math.sin(2 * Math.PI * t) * 0.5;
            const tz = 0;
            return optionalTarget.set(tx, ty, tz).multiplyScalar(this.scale);
        }
    }
    const path = new CustomSinCurve(0.15); 
    const tubeGeometry = new THREE.TubeGeometry(path, 20, 0.04, 8, false); 
    // MeshNormalMaterial не потребує кольору, він генерує його сам на основі нормалей геометрії
    const tubeMaterial = new THREE.MeshNormalMaterial({ 
        wireframe: true      // Відображати лише лінії (каркас)
    }); 
    tubeObject = new THREE.Mesh(tubeGeometry, tubeMaterial);
    tubeObject.position.set(0.5, 0, -1);
    scene.add(tubeObject);
    
    // Обробник зміни розміру вікна
    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Запуск циклу анімації
function animate() {
    renderer.setAnimationLoop(render);
}

// Функція, яка викликається кожен кадр
// Функція, яка викликається кожен кадр
// Функція, яка викликається кожен кадр
function render() {
    const time = Date.now() * 0.002; 

    // --- Анімація 1: Додекаедр (Пульсація / Масштабування) ---
    if (dodecahedron) {
        const scale = 1 + Math.sin(time * 2) * 0.3; 
        dodecahedron.scale.set(scale, scale, scale);
        dodecahedron.rotation.x += 0.01; // Додамо легке обертання
    }

    // --- Анімація 2: Витиснена форма (Левітація та обертання навколо Y) ---
    if (extrudeObject) {
        extrudeObject.position.y = Math.sin(time) * 0.2; 
        extrudeObject.rotation.y += 0.02;
    }

    // --- Анімація 3: Труба (Складне обертання в усіх площинах) ---
    if (tubeObject) {
        tubeObject.rotation.x += 0.02;
        tubeObject.rotation.y += 0.03;
        tubeObject.rotation.z += 0.01;
    }

    // Рендеримо сцену через камеру
    renderer.render(scene, camera);
}