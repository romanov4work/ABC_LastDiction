// Экраны
const micPermissionScreen = document.getElementById('micPermissionScreen');
const micDeniedScreen = document.getElementById('micDeniedScreen');
const gameScreen = document.getElementById('gameScreen');

// Кнопки
const requestMicBtn = document.getElementById('requestMicBtn');
const retryMicBtn = document.getElementById('retryMicBtn');

// Переменная для хранения потока микрофона
let micStream = null;
let hasMicPermission = false;

// Функция переключения экранов
function showScreen(screen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    screen.classList.add('active);
}

// Запрос доступа к микрофону (НЕ начинает запись, только получает разрешение)
async function requestMicrophone() {
    try {
        // Запрашиваем разрешение на микрофон
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // Сразу останавливаем поток - мы только проверили разрешение
        // Реальная запись начнется только когда пользователь нажмет кнопку записи
        micStream.getTracks().forEach(track => track.stop());

        hasMicPermission = true;
        console.log('✓ Разрешение на микрофон получено (микрофон НЕ слушает)');
        showScreen(gameScreen);
    } catch (error) {
        console.error('✗ Доступ к микрофону отклонен:', error);
        hasMicPermission = false;
        showScreen(micDeniedScreen);
    }
}

// Функция для начала записи (вызывается только при нажатии кнопки записи)
async function startRecording() {
    if (!hasMicPermission) {
        console.error('Нет разрешения на микрофон');
        return null;
    }

    try {
        // Только ЗДЕСЬ начинаем реально слушать микрофон
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('🎤 Микрофон начал запись');
        return micStream;
    } catch (error) {
        console.error('Ошибка при начале записи:', error);
        return null;
    }
}

// Функция для остановки записи
function stopRecording() {
    if (micStream) {
        micStream.getTracks().forEach(track => track.stop());
        micStream = null;
        console.log('⏹️ Запись остановлена');
    }
}

// Проверка при возвращении на страницу (visibility change)
document.addEventListener('visibilitychange', async () => {
    if (document.hidden) {
        // Пользователь ушел со страницы - останавливаем запись если она идет
        stopRecording();
        console.log('👋 Пользователь ушел - запись остановлена');
    } else {
        // Пользователь вернулся - проверяем разрешение микрофона
        if (hasMicPermission) {
            console.log('👋 Пользователь вернулся - разрешение есть');
            showScreen(gameScreen);
        } else {
            console.log('👋 Пользователь вернулся - нужно разрешение');
            showScreen(micPermissionScreen);
        }
    }
});

// Остановка записи при закрытии страницы
window.addEventListener('beforeunload', () => {
    stopRecording();
});

// Обработчики кнопок
requestMicBtn.addEventListener('click', requestMicrophone);
retryMicBtn.addEventListener('click', requestMicrophone);

// Проверка при загрузке страницы
window.addEventListener('load', () => {
    console.log('Игра "Прокачай Речь" загружена');
    console.log('Версия: v1.0.0');
});
