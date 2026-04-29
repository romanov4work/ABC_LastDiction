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
    screen.classList.add('active');
}

// Запрос доступа к микрофону (показывает системное окно браузера)
async function requestMicrophone() {
    try {
        // Запрашиваем разрешение - БРАУЗЕР ПОКАЖЕТ СИСТЕМНОЕ ОКНО
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

        hasMicPermission = true;
        console.log('✓ Разрешение на микрофон получено');

        // Останавливаем поток - реальная запись начнется при нажатии кнопки записи
        micStream.getTracks().forEach(track => track.stop());
        micStream = null;

        // Убираем окошко, показываем только облака
        showScreen(gameScreen);
    } catch (error) {
        console.error('✗ Доступ к микрофону отклонен:', error);
        hasMicPermission = false;
        showScreen(micDeniedScreen);
    }
}

// Функция для начала записи (вызывается только при нажатии кнопки записи в уровне)
async function startRecording() {
    if (!hasMicPermission) {
        console.error('Нет разрешения на микрофон');
        showScreen(micPermissionScreen);
        return null;
    }

    try {
        // Только ЗДЕСЬ начинаем реально слушать микрофон
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('🎤 Микрофон начал запись');
        return micStream;
    } catch (error) {
        console.error('Ошибка при начале записи:', error);
        hasMicPermission = false;
        showScreen(micPermissionScreen);
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

// Проверка при возвращении на страницу
document.addEventListener('visibilitychange', async () => {
    if (document.hidden) {
        // Пользователь ушел - останавливаем запись если идет
        stopRecording();
        console.log('👋 Пользователь ушел - запись остановлена');
    } else {
        // Пользователь вернулся
        console.log('👋 Пользователь вернулся');
        if (hasMicPermission) {
            showScreen(gameScreen);
        } else {
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
    console.log('Версия: v1.2.0');
    initLevelMap();
});

// ========== СИСТЕМА УРОВНЕЙ ==========

// Прогресс игрока (сохраняется в localStorage)
let playerProgress = {
    completedLevels: [] // массив пройденных уровней [1, 2, 3...]
};

// Загрузка прогресса из localStorage
function loadProgress() {
    const saved = localStorage.getItem('speechGameProgress');
    if (saved) {
        playerProgress = JSON.parse(saved);
    }
}

// Сохранение прогресса в localStorage
function saveProgress() {
    localStorage.setItem('speechGameProgress', JSON.stringify(playerProgress));
}

// Проверка, пройден ли уровень
function isLevelCompleted(levelNum) {
    return playerProgress.completedLevels.includes(levelNum);
}

// Проверка, открыт ли уровень
function isLevelUnlocked(levelNum) {
    if (levelNum === 1) return true; // Первый уровень всегда открыт

    // Уровень 2 и 3 открываются после уровня 1
    if (levelNum === 2 || levelNum === 3) {
        return isLevelCompleted(1);
    }

    // Уровень 4 открывается после уровня 2 ИЛИ 3
    if (levelNum === 4) {
        return isLevelCompleted(2) || isLevelCompleted(3);
    }

    // Уровень 5 открывается после уровня 4
    if (levelNum === 5) {
        return isLevelCompleted(4);
    }

    // Уровни 6, 7, 8 открываются последовательно после уровня 5
    if (levelNum === 6) {
        return isLevelCompleted(5);
    }

    if (levelNum === 7) {
        return isLevelCompleted(6);
    }

    if (levelNum === 8) {
        return isLevelCompleted(7);
    }

    // Остальные уровни открываются последовательно
    return isLevelCompleted(levelNum - 1);
}

// Инициализация карты уровней
function initLevelMap() {
    loadProgress();

    const islands = document.querySelectorAll('.level-island');

    islands.forEach(island => {
        const levelNum = parseInt(island.dataset.level);

        // Устанавливаем состояние острова
        if (isLevelCompleted(levelNum)) {
            island.classList.remove('locked', 'unlocked');
            island.classList.add('completed');
            // Добавляем галочку
            const check = document.createElement('div');
            check.className = 'island-check';
            check.textContent = '✓';
            island.querySelector('.island-content').appendChild(check);
        } else if (isLevelUnlocked(levelNum)) {
            island.classList.remove('locked', 'completed');
            island.classList.add('unlocked');
        } else {
            island.classList.remove('unlocked', 'completed');
            island.classList.add('locked');
        }

        // Обработчик клика
        island.addEventListener('click', () => handleIslandClick(levelNum, island));
    });
}

// Обработка клика по острову
function handleIslandClick(levelNum, island) {
    if (island.classList.contains('locked')) {
        // Закрытый уровень - показываем сообщение
        console.log(`Уровень ${levelNum} закрыт. Пройди предыдущие уровни!`);
        // TODO: показать всплывающее сообщение
        return;
    }

    // Открытый или пройденный уровень - запускаем
    console.log(`Запуск уровня ${levelNum}`);
    startLevel(levelNum);
}

// Запуск уровня
function startLevel(levelNum) {
    console.log(`🎮 Начинаем уровень ${levelNum}`);
    // TODO: здесь будет переход на экран уровня
    alert(`Уровень ${levelNum} скоро будет готов!`);
}

// Завершение уровня (вызывается после прохождения)
function completeLevel(levelNum) {
    if (!playerProgress.completedLevels.includes(levelNum)) {
        playerProgress.completedLevels.push(levelNum);
        saveProgress();
        initLevelMap(); // Обновляем карту
        console.log(`✅ Уровень ${levelNum} пройден!`);
    }
}
