import './style.css'
// Читаємо параметр з адресного рядка (наприклад, ?task=4)
const urlParams = new URLSearchParams(window.location.search);
const task = urlParams.get('task');

// Якщо ми вибрали якесь завдання...
if (task) {
    // 1. Ховаємо головне меню
    document.getElementById('menu').style.display = 'none';
    
    // 2. Показуємо кнопку "В меню" у лівому верхньому куті
    document.getElementById('backBtn').style.display = 'block';

    // 3. Динамічно завантажуємо потрібний файл завдання
    if (task === '1') import('./task1.js');
    if (task === '2') import('./task2.js');
    if (task === '3') import('./task3.js');
    if (task === '4') import('./task4.js');
}
// Якщо параметра немає (ми щойно зайшли на сайт), нічого не робимо – показується меню.і