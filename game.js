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
    console.log('Версия: v1.6.1-ngrok');
    initLevelMap();
    initControlButtons();
    initLevelScreen();
});

// ========== КНОПКИ УПРАВЛЕНИЯ ==========

function initControlButtons() {
    const backBtn = document.getElementById('backBtn');
    const fullscreenBtn = document.getElementById('fullscreenBtn');

    // Кнопка "Назад" - возвращает в меню если в уровне, иначе на Учи.ру
    backBtn.addEventListener('click', () => {
        const levelScreen = document.getElementById('levelScreen');

        if (levelScreen.classList.contains('active')) {
            // Если в уровне - возвращаемся на карту
            showScreen(gameScreen);
            console.log('Возврат на карту уровней');
        } else {
            // Если в меню - переход на Учи.ру
            alert('Переход на сайт Учи.ру');
            console.log('Нажата кнопка "Назад на Учи.ру"');
        }
    });

    // Кнопка "Полноэкранный режим"
    fullscreenBtn.addEventListener('click', toggleFullscreen);
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        // Включить полноэкранный режим
        document.documentElement.requestFullscreen().catch(err => {
            console.error('Ошибка при включении полноэкранного режима:', err);
        });
    } else {
        // Выключить полноэкранный режим
        document.exitFullscreen();
    }
}

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
        console.log('📊 Загружен прогресс:', playerProgress);
    } else {
        console.log('📊 Прогресс не найден, начинаем с нуля');
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

    console.log('🗺️ Инициализация карты уровней');
    console.log('📊 Пройденные уровни:', playerProgress.completedLevels);

    const islands = document.querySelectorAll('.level-island');

    islands.forEach(island => {
        const levelNum = parseInt(island.dataset.level);
        const content = island.querySelector('.island-content');

        console.log(`🏝️ Уровень ${levelNum}: completed=${isLevelCompleted(levelNum)}, unlocked=${isLevelUnlocked(levelNum)}`);

        // Удаляем старые замочки и галочки если есть
        const oldLock = content.querySelector('.island-lock');
        const oldCheck = content.querySelector('.island-check');
        const oldDecoration = content.querySelector('.island-decoration');

        if (oldLock) oldLock.remove();
        if (oldCheck) oldCheck.remove();
        if (oldDecoration) oldDecoration.remove();

        // Устанавливаем состояние острова
        if (isLevelCompleted(levelNum)) {
            console.log(`✅ Уровень ${levelNum} ПРОЙДЕН - добавляем звездочку`);
            island.classList.remove('locked', 'unlocked');
            island.classList.add('completed');
            // Добавляем звездочку
            const star = document.createElement('div');
            star.className = 'island-decoration';
            star.textContent = '⭐';
            content.appendChild(star);
        } else if (isLevelUnlocked(levelNum)) {
            console.log(`🔓 Уровень ${levelNum} ОТКРЫТ - добавляем цветочек`);
            island.classList.remove('locked', 'completed');
            island.classList.add('unlocked');
            // Добавляем цветочек
            const flower = document.createElement('div');
            flower.className = 'island-decoration';
            flower.textContent = '🌸';
            content.appendChild(flower);
        } else {
            console.log(`🔒 Уровень ${levelNum} ЗАКРЫТ - добавляем замочек`);
            island.classList.remove('unlocked', 'completed');
            island.classList.add('locked');
            // Добавляем замочек
            const lock = document.createElement('div');
            lock.className = 'island-lock';
            lock.textContent = '🔒';
            content.appendChild(lock);
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

    // Скрываем карту, показываем экран уровня
    showScreen(document.getElementById('levelScreen'));

    // Устанавливаем номер уровня
    document.getElementById('currentLevelNum').textContent = levelNum;

    // Скрываем результаты
    document.getElementById('resultSection').style.display = 'none';

    // Сохраняем текущий уровень
    window.currentLevel = levelNum;
}

// Завершение уровня (вызывается после прохождения)
function completeLevel(levelNum) {
    if (!playerProgress.completedLevels.includes(levelNum)) {
        playerProgress.completedLevels.push(levelNum);
        saveProgress();
        console.log(`✅ Уровень ${levelNum} пройден!`);
        console.log('📊 Обновленный прогресс:', playerProgress);
        initLevelMap(); // Обновляем карту
    } else {
        console.log(`ℹ️ Уровень ${levelNum} уже был пройден ранее`);
    }
}

// ========== ЭКРАН УРОВНЯ ==========

// Инициализация экрана уровня
function initLevelScreen() {
    const backToMapBtn = document.getElementById('backToMapBtn');
    const listenBtn = document.getElementById('listenBtn');
    const recordBtn = document.getElementById('recordBtn');
    const retryBtn = document.getElementById('retryBtn');
    const nextLevelBtn = document.getElementById('nextLevelBtn');

    // Кнопка "Послушать" - озвучка скороговорки
    listenBtn.addEventListener('click', () => {
        const text = document.getElementById('tonguetwisterText').textContent;
        speakText(text);
    });

    // Кнопка "Записать голос" - реальная запись с Whisper
    recordBtn.addEventListener('click', async () => {
        await recordAndTranscribe();
    });

    // Кнопка "Повторить"
    retryBtn.addEventListener('click', () => {
        document.getElementById('resultSection').style.display = 'none';
    });

    // Кнопка "Следующий уровень"
    nextLevelBtn.addEventListener('click', () => {
        const currentLevel = window.currentLevel || 1;

        // Отмечаем уровень как пройденный
        completeLevel(currentLevel);

        // Переходим на следующий уровень если он открыт
        const nextLevel = currentLevel + 1;
        if (isLevelUnlocked(nextLevel)) {
            startLevel(nextLevel);
        } else {
            // Возвращаемся на карту
            showScreen(gameScreen);
        }
    });
}

// Озвучка текста через Web Speech API
function speakText(text) {
    if ('speechSynthesis' in window) {
        // Останавливаем предыдущую озвучку если есть
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ru-RU';
        utterance.rate = 0.9; // Немного медленнее для детей
        utterance.pitch = 1.2; // Чуть выше для детского голоса

        window.speechSynthesis.speak(utterance);
        console.log('🔊 Озвучка:', text);
    } else {
        alert('Озвучка не поддерживается в этом браузере');
    }
}

// Показать mock результаты (для демонстрации)
function showMockResults() {
    const resultSection = document.getElementById('resultSection');
    const timeResult = document.getElementById('timeResult');
    const dictionResult = document.getElementById('dictionResult');

    // Mock данные
    const mockTime = (Math.random() * 2 + 2).toFixed(1); // 2.0-4.0 сек
    const mockDiction = Math.floor(Math.random() * 20 + 75); // 75-95%

    timeResult.textContent = `${mockTime} сек`;
    dictionResult.textContent = `${mockDiction}%`;

    // Показываем результаты
    resultSection.style.display = 'block';

    console.log(`📊 Mock результаты: ${mockTime} сек, ${mockDiction}%`);
}

// ========== ЗАПИСЬ И РАСПОЗНАВАНИЕ ГОЛОСА ==========

const WHISPER_API_URL = 'https://pried-isolation-joystick.ngrok-free.dev'; // Ngrok tunnel к Whisper

let mediaRecorder = null;
let audioChunks = [];
let recordingStartTime = 0;

async function recordAndTranscribe() {
    const recordBtn = document.getElementById('recordBtn');
    const expectedText = document.getElementById('tonguetwisterText').textContent;

    try {
        if (!mediaRecorder || mediaRecorder.state === 'inactive') {
            // Начинаем запись
            console.log('🎤 Начинаем запись...');
            recordBtn.textContent = '⏹️ Остановить запись';
            recordBtn.style.background = 'linear-gradient(145deg, #ff4444, #cc0000)';

            const stream = await startRecording();
            if (!stream) return;

            audioChunks = [];
            recordingStartTime = Date.now();

            mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const recordingTime = ((Date.now() - recordingStartTime) / 1000).toFixed(1);
                console.log(`⏱️ Время записи: ${recordingTime} сек`);

                // Создаем аудио blob
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                console.log(`📦 Размер аудио: ${(audioBlob.size / 1024).toFixed(1)} KB`);

                // Останавливаем микрофон
                stream.getTracks().forEach(track => track.stop());

                // Отправляем на Whisper
                recordBtn.textContent = '⏳ Распознаем...';
                recordBtn.disabled = true;

                try {
                    const recognizedText = await sendToWhisper(audioBlob);
                    console.log(`📝 Распознано: "${recognizedText}"`);

                    // Сравниваем с эталоном
                    const accuracy = calculateAccuracy(expectedText, recognizedText);
                    console.log(`🎯 Точность: ${accuracy}%`);

                    // Показываем результаты
                    showResults(recordingTime, accuracy);

                } catch (error) {
                    console.error('❌ Ошибка распознавания:', error);
                    alert('Ошибка распознавания речи. Попробуй еще раз!');
                } finally {
                    recordBtn.textContent = '🎤 Записать голос';
                    recordBtn.style.background = 'linear-gradient(145deg, #ff6b6b, #ee5a6f)';
                    recordBtn.disabled = false;
                }
            };

            mediaRecorder.start();

        } else {
            // Останавливаем запись
            console.log('⏹️ Останавливаем запись...');
            mediaRecorder.stop();
            recordBtn.textContent = '🎤 Записать голос';
            recordBtn.style.background = 'linear-gradient(145deg, #ff6b6b, #ee5a6f)';
        }

    } catch (error) {
        console.error('❌ Ошибка записи:', error);
        alert('Ошибка доступа к микрофону!');
        recordBtn.textContent = '🎤 Записать голос';
        recordBtn.style.background = 'linear-gradient(145deg, #ff6b6b, #ee5a6f)';
        recordBtn.disabled = false;
    }
}

// Отправка аудио на Whisper API
async function sendToWhisper(audioBlob) {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    const response = await fetch(`${WHISPER_API_URL}/transcribe`, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.text;
}

// Сравнение текстов и расчет точности
function calculateAccuracy(expected, recognized) {
    // Нормализуем тексты (убираем знаки препинания, приводим к нижнему регистру)
    const normalize = (text) => text.toLowerCase()
        .replace(/[.,!?;:]/g, '')
        .trim()
        .split(/\s+/);

    const expectedWords = normalize(expected);
    const recognizedWords = normalize(recognized);

    // Считаем совпадения слов
    let matches = 0;
    for (const word of recognizedWords) {
        if (expectedWords.includes(word)) {
            matches++;
        }
    }

    // Процент совпадения
    const accuracy = Math.round((matches / expectedWords.length) * 100);
    return Math.min(accuracy, 100); // Максимум 100%
}

// Показать реальные результаты
function showResults(time, accuracy) {
    const resultSection = document.getElementById('resultSection');
    const timeResult = document.getElementById('timeResult');
    const dictionResult = document.getElementById('dictionResult');

    timeResult.textContent = `${time} сек`;
    dictionResult.textContent = `${accuracy}%`;

    resultSection.style.display = 'block';

    console.log(`✅ Результаты: ${time} сек, ${accuracy}%`);
}
