// Экраны
const micPermissionScreen = document.getElementById('micPermissionScreen');
const micDeniedScreen = document.getElementById('micDeniedScreen');
const gameScreen = document.getElementById('gameScreen');

// Кнопки
const requestMicBtn = document.getElementById('requestMicBtn');
const retryMicBtn = document.getElementById('retryMicBtn');

// Переменная для хранения потока микрофона
let micStream = null;

// Функция переключения экранов
function showScreen(screen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    screen.classList.add('active');
}

// Запрос доступа к микрофону
async function requestMicrophone() {
    try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('✓ Микрофон разрешен');
        showScreen(gameScreen);
    } catch (error) {
        console.error('✗ Доступ к микрофону отклонен:', error);
        showScreen(micDeniedScreen);
    }
}

// Обработчики кнопок
requestMicBtn.addEventListener('click', requestMicrophone);
retryMicBtn.addEventListener('click', requestMicrophone);

// Проверка при загрузке страницы
window.addEventListener('load', () => {
    console.log('Игра "Прокачай Речь" загружена');
});
