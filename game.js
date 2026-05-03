// === ВЕРСИЯ 5.0.0 ===

// Скороговорки для каждого уровня
const tongueTwisters = {
    1: "Белый снег белый мел",
    2: "Мама мыла Милу мылом",
    3: "Три сороки три трещотки",
    4: "Четыре чёрненьких чумазеньких чертёнка",
    5: "На дворе трава на траве дрова",
    6: "Корабли лавировали лавировали да не вылавировали",
    7: "Расскажите про покупки про какие про покупки",
    8: "" // Озвучь мультик (пустой уровень)
};

// Экраны
const micPermissionScreen = document.getElementById('micPermissionScreen');
const micDeniedScreen = document.getElementById('micDeniedScreen');
const firefoxWarningScreen = document.getElementById('firefoxWarningScreen');
const gameScreen = document.getElementById('gameScreen');

// Кнопки
const requestMicBtn = document.getElementById('requestMicBtn');
const retryMicBtn = document.getElementById('retryMicBtn');
const copyLinkBtn = document.getElementById('copyLinkBtn');

// Переменная для хранения потока микрофона
let micStream = null;
let hasMicPermission = false;

// Переменная для хранения объекта распознавания речи
let currentRecognition = null;

// Переменная для хранения текущего аудио
let currentAudio = null;

// Флаг для онбординга
let onboardingCompleted = false;

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
        hasMicPermission = true;
        return micStream;
    } catch (error) {
        console.error('✗ Ошибка доступа к микрофону:', error);
        hasMicPermission = false;

        // Показываем экран отказа
        showScreen(micDeniedScreen);

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

// Кнопка копирования ссылки (для Firefox)
copyLinkBtn.addEventListener('click', () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
        console.log('✓ Ссылка скопирована:', url);
        // Показываем подсказку
        const hint = document.querySelector('.copy-hint');
        if (hint) {
            hint.style.display = 'block';
            setTimeout(() => {
                hint.style.display = 'none';
            }, 3000);
        }
    }).catch(err => {
        console.error('Ошибка копирования:', err);
        alert('Ссылка: ' + url);
    });
});

// Проверка при загрузке страницы
window.addEventListener('load', async () => {
    console.log('Игра "Прокачай Речь" загружена');
    console.log('Версия: v2.0.0');
    initLevelMap();
    initControlButtons();
    initLevelScreen();

    // Проверяем доступ к микрофону
    await checkMicrophonePermission();

    // Добавляем начальное состояние в историю
    history.pushState({ screen: 'menu' }, '', '');
});

// Обработка аппаратной кнопки "Назад"
window.addEventListener('popstate', (event) => {
    const levelScreen = document.getElementById('levelScreen');

    // Если мы в уровне - возвращаемся в меню
    if (levelScreen && levelScreen.classList.contains('active')) {
        // Останавливаем аудио при выходе из уровня
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            currentAudio = null;
        }

        // Возвращаемся на карту
        showScreen(gameScreen);
        initLevelMap();
        console.log('Возврат на карту уровней (аппаратная кнопка)');

        // Добавляем состояние меню обратно
        history.pushState({ screen: 'menu' }, '', '');
    }
});

// Функция проверки доступа к микрофону
async function checkMicrophonePermission() {
    // Проверяем поддержку Web Speech API (Firefox не поддерживает)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        console.warn('⚠️ Web Speech API не поддерживается (возможно Firefox)');
        showScreen(firefoxWarningScreen);
        return;
    }

    try {
        // Проверяем через Permissions API
        if (navigator.permissions && navigator.permissions.query) {
            const permissionStatus = await navigator.permissions.query({ name: 'microphone' });

            console.log(`🎤 Статус микрофона: ${permissionStatus.state}`);

            if (permissionStatus.state === 'granted') {
                // Доступ уже есть - сразу показываем игру
                hasMicPermission = true;
                showScreen(gameScreen);
                return; // ВАЖНО: выходим из функции
            } else if (permissionStatus.state === 'denied') {
                // Доступ запрещен - показываем экран отказа
                hasMicPermission = false;
                showScreen(micDeniedScreen);
                return; // ВАЖНО: выходим из функции
            }

            // Если state === 'prompt' - продолжаем ниже

            // Слушаем изменения разрешения
            permissionStatus.onchange = () => {
                console.log(`🎤 Статус микрофона изменился: ${permissionStatus.state}`);
                if (permissionStatus.state === 'denied') {
                    showScreen(micDeniedScreen);
                } else if (permissionStatus.state === 'granted') {
                    hasMicPermission = true;
                    showScreen(gameScreen);
                }
            };
        }

        // Если Permissions API не поддерживается ИЛИ state === 'prompt'
        // Показываем экран запроса
        showScreen(micPermissionScreen);
    } catch (error) {
        console.error('Ошибка проверки микрофона:', error);
        showScreen(micPermissionScreen);
    }
}

// ========== КНОПКИ УПРАВЛЕНИЯ ==========

function initControlButtons() {
    const backBtn = document.getElementById('backBtn');
    const fullscreenBtn = document.getElementById('fullscreenBtn');

    // Кнопка "Назад" - возвращает в меню если в уровне, иначе на Учи.ру
    backBtn.addEventListener('click', () => {
        const levelScreen = document.getElementById('levelScreen');

        if (levelScreen.classList.contains('active')) {
            // Останавливаем аудио при выходе из уровня
            if (currentAudio) {
                currentAudio.pause();
                currentAudio.currentTime = 0;
                currentAudio = null;
            }

            // Если в уровне - возвращаемся на карту
            showScreen(gameScreen);
            initLevelMap(); // Обновляем карту со звездами
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
        // Инициализируем levelStars если его нет
        if (!playerProgress.levelStars) {
            playerProgress.levelStars = {};
        }
        console.log('📊 Загружен прогресс:', playerProgress);
    } else {
        console.log('📊 Прогресс не найден, начинаем с нуля');
    }

    // Проверяем онбординг
    const onboardingDone = localStorage.getItem('onboardingCompleted');
    onboardingCompleted = onboardingDone === 'true';
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

        // Удаляем старые элементы
        const oldLock = content.querySelector('.island-lock');
        const oldCheck = content.querySelector('.island-check');
        const oldDecoration = content.querySelector('.island-decoration');
        const oldStars = content.querySelector('.island-stars');

        if (oldLock) oldLock.remove();
        if (oldCheck) oldCheck.remove();
        if (oldDecoration) oldDecoration.remove();
        if (oldStars) oldStars.remove();

        // Убираем анимацию пульсации со всех уровней
        island.classList.remove('pulse-animation');

        // Устанавливаем состояние острова
        if (isLevelCompleted(levelNum)) {
            const stars = getLevelStars(levelNum);
            console.log(`✅ Уровень ${levelNum} ПРОЙДЕН - ${stars} звезд`);
            island.classList.remove('locked', 'unlocked');
            island.classList.add('completed');

            // Добавляем звезды СВЕРХУ (перед номером)
            const starsDiv = document.createElement('div');
            starsDiv.className = 'island-stars';
            // Используем HTML символы звезд (не эмодзи!)
            starsDiv.innerHTML = '<span class="filled-stars">' + '★'.repeat(stars) + '</span>' +
                                '<span class="empty-stars">' + '☆'.repeat(3 - stars) + '</span>';
            starsDiv.style.cssText = 'font-size: 0.9em; line-height: 1; margin-bottom: 2px;';

            // Стили для закрашенных и незакрашенных звезд
            const filledStars = starsDiv.querySelector('.filled-stars');
            const emptyStars = starsDiv.querySelector('.empty-stars');

            if (filledStars) {
                filledStars.style.cssText = 'color: white; -webkit-text-stroke: 1.5px gold; text-shadow: 0 0 8px rgba(255, 215, 0, 0.6);';
            }
            if (emptyStars) {
                emptyStars.style.cssText = 'color: #666; -webkit-text-stroke: 1px #999;';
            }

            // Вставляем ПЕРЕД номером уровня
            content.insertBefore(starsDiv, content.firstChild);
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

    // Добавляем анимацию пульсации на уровень 1, если онбординг не пройден
    if (!onboardingCompleted && isLevelUnlocked(1)) {
        const level1 = document.querySelector('.level-island[data-level="1"]');
        if (level1) {
            level1.classList.add('pulse-animation');
        }
    }
}

// Обработка клика по острову
function handleIslandClick(levelNum, island) {
    if (island.classList.contains('locked')) {
        // Закрытый уровень - показываем сообщение
        console.log(`Уровень ${levelNum} закрыт. Пройди предыдущие уровни!`);
        return;
    }

    // Открытый или пройденный уровень - запускаем
    console.log(`Запуск уровня ${levelNum}`);
    startLevel(levelNum);
}

// Запуск уровня
function startLevel(levelNum) {
    console.log(`🎮 Начинаем уровень ${levelNum}`);

    // Добавляем состояние уровня в историю
    history.pushState({ screen: 'level', levelNum: levelNum }, '', '');

    // Скрываем карту, показываем экран уровня
    showScreen(document.getElementById('levelScreen'));

    // Устанавливаем номер уровня
    document.getElementById('currentLevelNum').textContent = levelNum;

    // Получаем элементы
    const tonguetwisterBox = document.querySelector('.tongue-twister-box');
    const resultSection = document.getElementById('resultSection');

    // Для уровня 8 - пустой экран (Озвучь мультик)
    if (levelNum === 8) {
        if (tonguetwisterBox) tonguetwisterBox.style.display = 'none';
        if (resultSection) resultSection.style.display = 'none';
        window.currentLevel = levelNum;
        return;
    }

    // Загружаем скороговорку для уровня
    const twister = tongueTwisters[levelNum];

    if (twister) {
        // Разбиваем текст по 2 слова на строку
        const words = twister.split(' ');
        let formattedText = '';
        for (let i = 0; i < words.length; i += 2) {
            if (i > 0) formattedText += '<br>';
            formattedText += words[i];
            if (words[i + 1]) formattedText += ' ' + words[i + 1];
        }
        document.getElementById('tonguetwisterText').innerHTML = formattedText;

        // Сохраняем оригинальный текст для распознавания
        window.currentTwister = twister;
    } else {
        document.getElementById('tonguetwisterText').textContent = "Озвучь персонажа мультика";
        window.currentTwister = null;
    }

    // Показываем скороговорку, скрываем результаты
    if (tonguetwisterBox) tonguetwisterBox.style.display = 'block';
    if (resultSection) resultSection.style.display = 'none';

    // Сохраняем текущий уровень
    window.currentLevel = levelNum;

    // Если это уровень 1 и онбординг не пройден - показываем онбординг
    if (levelNum === 1 && !onboardingCompleted) {
        showOnboarding();
        // Не воспроизводим аудио, пока онбординг не закрыт
        return;
    }

    // Автоматически проигрываем скороговорку при входе на уровень
    if (twister) {
        // Останавливаем предыдущее аудио если оно играет
        if (currentAudio) {
            currentAudio.pause();
            currentAudio = null;
        }

        const audioPath = `assets/audio/level${levelNum}.mp3`;
        currentAudio = new Audio(audioPath);

        // Предзагружаем аудио для быстрого старта
        currentAudio.preload = 'auto';

        // Начинаем воспроизведение как только можно
        currentAudio.addEventListener('canplay', () => {
            currentAudio.play().catch(error => {
                console.error('Ошибка автовоспроизведения:', error);
            });
        }, { once: true });

        // Загружаем аудио
        currentAudio.load();
    }
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

// Сохранение звезд для уровня
function saveLevelStars(levelNum, stars, time) {
    if (!playerProgress.levelStars) {
        playerProgress.levelStars = {};
    }
    if (!playerProgress.bestTimes) {
        playerProgress.bestTimes = {};
    }

    // Сохраняем только если новый результат лучше
    const currentStars = playerProgress.levelStars[levelNum] || 0;
    if (stars > currentStars) {
        playerProgress.levelStars[levelNum] = stars;
        saveProgress();
        console.log(`⭐ Уровень ${levelNum}: ${stars} звезд (было ${currentStars})`);
        console.log(`📊 Все звезды:`, playerProgress.levelStars);
    } else {
        console.log(`⭐ Уровень ${levelNum}: оставляем ${currentStars} звезд (новый результат ${stars})`);
    }

    // Сохраняем лучшее время (только если прошел уровень)
    if (stars > 0) {
        const currentBestTime = playerProgress.bestTimes[levelNum];
        if (!currentBestTime || time < currentBestTime) {
            playerProgress.bestTimes[levelNum] = time;
            saveProgress();
            console.log(`⏱️ Уровень ${levelNum}: новый рекорд ${time} сек (было ${currentBestTime || '-'})`);
        }
    }

    // Если набрал хотя бы 1 звезду - уровень пройден
    if (stars > 0) {
        completeLevel(levelNum);
    }
}

// Получение звезд для уровня
function getLevelStars(levelNum) {
    if (!playerProgress.levelStars) {
        return 0;
    }
    return playerProgress.levelStars[levelNum] || 0;
}

// Получение лучшего времени для уровня
function getBestTime(levelNum) {
    if (!playerProgress.bestTimes) {
        return null;
    }
    return playerProgress.bestTimes[levelNum] || null;
}

// ========== ЭКРАН УРОВНЯ ==========

// Инициализация экрана уровня
function initLevelScreen() {
    const backToMapBtn = document.getElementById('backToMapBtn');
    const listenBtn = document.getElementById('listenBtn');
    const recordBtn = document.getElementById('recordBtn');
    const retryBtn = document.getElementById('retryBtn');
    const nextLevelBtn = document.getElementById('nextLevelBtn');

    // Кнопка "Назад на карту"
    if (backToMapBtn) {
        backToMapBtn.addEventListener('click', () => {
            // Останавливаем аудио при выходе
            if (currentAudio) {
                currentAudio.pause();
                currentAudio.currentTime = 0;
                currentAudio = null;
            }
            showScreen(document.getElementById('gameScreen'));
        });
    }

    // Кнопка "Послушать" - озвучка скороговорки
    listenBtn.addEventListener('click', () => {
        // Останавливаем предыдущее аудио если оно играет
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            currentAudio = null;
        }

        // Проигрываем аудиофайл для текущего уровня
        const audioPath = `assets/audio/level${currentLevel}.mp3`;
        currentAudio = new Audio(audioPath);
        currentAudio.play().catch(error => {
            console.error('Ошибка воспроизведения:', error);
        });
    });

    // Кнопка "Записать голос" / "Завершить запись"
    recordBtn.addEventListener('click', async () => {
        // Если запись идет - останавливаем
        if (currentRecognition) {
            currentRecognition.stop();
            return;
        }

        // Иначе начинаем запись
        await recordAndTranscribe();
    });

    // Кнопка "Повторить"
    retryBtn.addEventListener('click', () => {
        // Останавливаем аудио
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            currentAudio = null;
        }

        const resultSection = document.getElementById('resultSection');
        const tonguetwisterBox = document.querySelector('.tongue-twister-box');

        resultSection.style.display = 'none';
        tonguetwisterBox.style.display = 'block';

        // Обновляем карту уровней (на случай если пользователь вернется)
        initLevelMap();
    });

    // Кнопка "Следующий уровень"
    nextLevelBtn.addEventListener('click', () => {
        // Останавливаем аудио
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            currentAudio = null;
        }

        const currentLevel = window.currentLevel || 1;

        // Отмечаем уровень как пройденный (уже сделано в saveLevelStars)
        // completeLevel уже вызван в saveLevelStars

        // Скрываем результат, показываем скороговорку для следующего уровня
        const resultSection = document.getElementById('resultSection');
        const tonguetwisterBox = document.querySelector('.tongue-twister-box');

        resultSection.style.display = 'none';
        tonguetwisterBox.style.display = 'block';

        // Переходим на следующий уровень
        const nextLevel = currentLevel + 1;

        if (nextLevel <= 8 && tongueTwisters[nextLevel] !== undefined) {
            // Запускаем следующий уровень
            startLevel(nextLevel);
        } else {
            // Все уровни пройдены - возвращаемся на карту
            showScreen(gameScreen);
            initLevelMap(); // Обновляем карту со звездами
        }
    });
}

// ========== ЗАПИСЬ И РАСПОЗНАВАНИЕ ГОЛОСА ==========

async function recordAndTranscribe() {
    const recordBtn = document.getElementById('recordBtn');
    const expectedText = window.currentTwister || document.getElementById('tonguetwisterText').textContent;

    // Для остальных уровней - используем Web Speech API (Google)
    try {
        recordBtn.textContent = '⏹️ Завершить запись';
        recordBtn.style.background = 'linear-gradient(145deg, #ff4444, #cc0000)';
        recordBtn.disabled = false; // Оставляем активной для возможности остановки

        const startTime = Date.now();
        const response = await recognizeWithWebSpeech(expectedText);
        const recordingTime = ((Date.now() - startTime) / 1000).toFixed(1);

        const recognizedText = response.text;
        console.log(`📝 Распознано: "${recognizedText}"`);

        // Сравниваем с эталоном
        const accuracy = calculateAccuracy(expectedText, recognizedText);
        console.log(`🎯 Точность: ${accuracy}%`);

        // Показываем результаты
        showResults(recordingTime, accuracy, recognizedText);

    } catch (error) {
        console.error('❌ Ошибка Web Speech API:', error);

        // Показываем дружелюбное сообщение вместо технической ошибки
        if (error.message.includes('Ничего не услышано')) {
            alert('😔 ' + error.message);
        } else {
            alert('Ошибка распознавания речи. Попробуй еще раз!\n\n' + error.message);
        }
    } finally {
        recordBtn.textContent = '🎤 Записать голос';
        recordBtn.style.background = 'linear-gradient(145deg, #ff6b6b, #ee5a6f)';
        recordBtn.disabled = false;
        currentRecognition = null; // Очищаем на всякий случай
    }
}

// ========== WEB SPEECH API (GOOGLE) ==========

function recognizeWithWebSpeech(expectedText) {
    return new Promise((resolve, reject) => {
        // Проверяем поддержку Web Speech API
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            reject(new Error('Web Speech API не поддерживается в этом браузере'));
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'ru-RU';
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        // Сохраняем в глобальную переменную для возможности остановки
        currentRecognition = recognition;

        let hasResult = false;
        let timeoutId = null;

        // Таймаут на 15 секунд
        timeoutId = setTimeout(() => {
            console.log('⏱️ Таймаут записи (15 сек)');
            if (currentRecognition) {
                currentRecognition.stop();
            }
        }, 15000);

        recognition.onresult = (event) => {
            hasResult = true;
            clearTimeout(timeoutId);

            const transcript = event.results[0][0].transcript;
            const confidence = event.results[0][0].confidence;

            console.log(`📝 Web Speech API распознал: "${transcript}" (уверенность: ${(confidence * 100).toFixed(1)}%)`);

            resolve({
                text: transcript,
                confidence: confidence,
                success: true
            });
        };

        recognition.onerror = (event) => {
            clearTimeout(timeoutId);
            console.error('❌ Ошибка Web Speech API:', event.error);
            currentRecognition = null;

            // Обрабатываем ошибку "no-speech" отдельно
            if (event.error === 'no-speech') {
                reject(new Error('Ничего не услышано. Попробуй говорить громче!'));
            } else {
                reject(new Error(`Web Speech API ошибка: ${event.error}`));
            }
        };

        recognition.onend = () => {
            clearTimeout(timeoutId);
            console.log('🎤 Web Speech API завершил работу');
            currentRecognition = null;

            // Если не было результата и не было ошибки - пользователь молчал
            if (!hasResult) {
                reject(new Error('Ничего не услышано. Попробуй еще раз!'));
            }
        };

        // Запускаем распознавание
        recognition.start();
        console.log('🎤 Web Speech API начал слушать...');
    });
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
function showResults(time, accuracy, recognizedText) {
    const resultSection = document.getElementById('resultSection');
    const tonguetwisterBox = document.querySelector('.tongue-twister-box');
    const timeResult = document.getElementById('timeResult');
    const dictionResult = document.getElementById('dictionResult');
    const bestTimeResult = document.getElementById('bestTimeResult');
    const nextLevelBtn = document.getElementById('nextLevelBtn');

    timeResult.textContent = `${time} сек`;
    dictionResult.textContent = `${accuracy}%`;

    // Определяем количество звезд
    let stars = 0;
    let message = '';
    let showConfetti = false;

    if (accuracy >= 90 && time <= 3) {
        stars = 3;
        message = '🌟 Невероятно! Ты настоящий мастер!';
        showConfetti = true;
    } else if (accuracy >= 80 || time <= 3) {
        stars = 2;
        message = '✅ Отлично! Так держать!';
        showConfetti = true;
    } else if (accuracy >= 70) {
        stars = 1;
        message = '👍 Хорошо! Уровень пройден!';
        showConfetti = true;
    } else {
        stars = 0;
        message = '⚠️ Попробуй еще раз! Нужно минимум 70% дикции';
        showConfetti = false;
    }

    // Сохраняем звезды и время для текущего уровня
    const currentLevel = window.currentLevel || 1;
    const timeNum = parseFloat(time);
    saveLevelStars(currentLevel, stars, timeNum);

    // Получаем лучшее время
    const bestTime = getBestTime(currentLevel);
    const isNewRecord = bestTime === timeNum && stars > 0;

    // Отображаем лучшее время
    if (bestTime) {
        bestTimeResult.textContent = `${bestTime} сек`;
        // Убираем изменение цвета - всегда обычный цвет
    } else {
        bestTimeResult.textContent = '-';
    }

    // Добавляем сообщение "Новый рекорд!" под строкой с рекордом
    let newRecordMessage = document.getElementById('newRecordMessage');
    if (!newRecordMessage) {
        newRecordMessage = document.createElement('div');
        newRecordMessage.id = 'newRecordMessage';
        newRecordMessage.style.cssText = 'font-size: 1.2em; font-weight: 800; color: #FFD93D; margin-top: 5px;';
        document.querySelector('.best-time-row').parentNode.insertBefore(newRecordMessage, document.querySelector('.best-time-row').nextSibling);
    }

    if (isNewRecord) {
        newRecordMessage.textContent = 'Новый рекорд!';
        newRecordMessage.style.display = 'block';
    } else {
        newRecordMessage.style.display = 'none';
    }

    // Показываем/скрываем кнопку "Следующий уровень"
    if (stars > 0) {
        nextLevelBtn.style.display = 'inline-block';
    } else {
        nextLevelBtn.style.display = 'none';
    }

    // Добавляем сообщение с результатом
    let messageElement = document.getElementById('resultMessage');
    if (!messageElement) {
        messageElement = document.createElement('div');
        messageElement.id = 'resultMessage';
        messageElement.style.cssText = 'font-size: 1.5em; font-weight: 800; margin-bottom: 20px; color: var(--text-dark);';
        resultSection.insertBefore(messageElement, resultSection.querySelector('.result-stats'));
    }
    messageElement.textContent = message;

    // Добавляем звезды
    let starsElement = document.getElementById('resultStars');
    if (!starsElement) {
        starsElement = document.createElement('div');
        starsElement.id = 'resultStars';
        starsElement.style.cssText = 'font-size: 3em; margin-bottom: 15px;';
        resultSection.insertBefore(starsElement, messageElement);
    }
    // Используем HTML символы вместо эмодзи
    starsElement.innerHTML = '<span class="filled-stars">' + '★'.repeat(stars) + '</span>' +
                             '<span class="empty-stars">' + '☆'.repeat(3 - stars) + '</span>';

    // Стили для звезд
    const filledStars = starsElement.querySelector('.filled-stars');
    const emptyStars = starsElement.querySelector('.empty-stars');

    if (filledStars) {
        filledStars.style.cssText = 'color: gold; text-shadow: 0 0 10px rgba(255, 215, 0, 0.8);';
    }
    if (emptyStars) {
        emptyStars.style.cssText = 'color: #666; -webkit-text-stroke: 1px #999;';
    }

    // Добавляем отображение распознанного текста
    let recognizedTextElement = document.getElementById('recognizedText');
    if (!recognizedTextElement) {
        recognizedTextElement = document.createElement('div');
        recognizedTextElement.id = 'recognizedText';
        recognizedTextElement.style.cssText = 'margin: 15px 0; padding: 10px; background: rgba(255,255,255,0.2); border-radius: 10px; font-size: 14px;';
        resultSection.insertBefore(recognizedTextElement, resultSection.querySelector('.result-stats'));
    }
    recognizedTextElement.innerHTML = `<strong>Распознано:</strong> "${recognizedText}"`;

    // Скрываем скороговорку, показываем результат
    tonguetwisterBox.style.display = 'none';
    resultSection.style.display = 'block';

    // Запускаем конфетти только если прошел уровень
    if (showConfetti) {
        confetti({
            particleCount: stars === 3 ? 150 : 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    }

    console.log(`✅ Результаты: ${time} сек, ${accuracy}%, ${stars} звезд, распознано: "${recognizedText}"`);
}

// ========== МОДАЛЬНОЕ ОКНО РАЗРАБОТЧИКА ==========

// Инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    const versionBtn = document.getElementById('versionBtn');
    const devModal = document.getElementById('devModal');
    const devCloseBtn = document.getElementById('devCloseBtn');

    if (!versionBtn || !devModal) {
        console.warn('Dev menu elements not found');
        return;
    }

    // Открытие модального окна при клике на версию
    versionBtn.addEventListener('click', () => {
        devModal.style.display = 'flex';
    });

    // Закрытие модального окна
    devCloseBtn.addEventListener('click', () => {
        devModal.style.display = 'none';
    });

    // Закрытие при клике вне окна
    devModal.addEventListener('click', (e) => {
        if (e.target === devModal) {
            devModal.style.display = 'none';
        }
    });

    // Кнопка "Сбросить прогресс"
    const devResetBtn = document.getElementById('devResetBtn');
    if (devResetBtn) {
        devResetBtn.addEventListener('click', () => {
            if (confirm('Вы уверены? Это удалит все звезды и пройденные уровни!')) {
                // Очищаем прогресс
                localStorage.removeItem('speechGameProgress');

                // Сбрасываем в памяти
                playerProgress = {
                    completedLevels: [],
                    levelStars: {}
                };

                console.log('🔄 Прогресс сброшен!');

                // Закрываем окно
                devModal.style.display = 'none';

                // Обновляем карту
                initLevelMap();

                alert('Прогресс сброшен! Игра как для нового пользователя.');
            }
        });
    }
});

// ========== ОНБОРДИНГ ==========

function showOnboarding() {
    const modal = document.getElementById('onboardingModal');
    if (modal) {
        modal.classList.add('active');
        console.log('📖 Показан онбординг');
    }
}

function hideOnboarding() {
    const modal = document.getElementById('onboardingModal');
    if (modal) {
        modal.classList.remove('active');

        // Отмечаем онбординг как пройденный
        onboardingCompleted = true;
        localStorage.setItem('onboardingCompleted', 'true');

        // Убираем анимацию пульсации с уровня 1
        const level1 = document.querySelector('.level-island[data-level="1"]');
        if (level1) {
            level1.classList.remove('pulse-animation');
        }

        console.log('✅ Онбординг завершен');

        // Воспроизводим аудио для уровня 1
        const levelNum = window.currentLevel || 1;
        const twister = tongueTwisters[levelNum];

        if (twister) {
            // Останавливаем предыдущее аудио если оно играет
            if (currentAudio) {
                currentAudio.pause();
                currentAudio = null;
            }

            const audioPath = `assets/audio/level${levelNum}.mp3`;
            currentAudio = new Audio(audioPath);

            // Предзагружаем аудио для быстрого старта
            currentAudio.preload = 'auto';

            // Начинаем воспроизведение как только можно
            currentAudio.addEventListener('canplay', () => {
                currentAudio.play().catch(error => {
                    console.error('Ошибка воспроизведения:', error);
                });
            }, { once: true });

            // Загружаем аудио
            currentAudio.load();
        }
    }
}

// Инициализация онбординга
document.addEventListener('DOMContentLoaded', () => {
    const onboardingPlayBtn = document.getElementById('onboardingPlayBtn');

    if (onboardingPlayBtn) {
        onboardingPlayBtn.addEventListener('click', hideOnboarding);
    }

    // Пасхалка при клике на название игры
    const gameTitle = document.querySelector('.game-title');
    if (gameTitle) {
        gameTitle.addEventListener('click', activateEasterEgg);
    }

    // Применяем сохраненные настройки пасхалки при загрузке страницы
    loadEasterEggSettings();
});

// ========== ПАСХАЛКА ==========

function activateEasterEgg() {
    console.log('🎉 Пасхалка активирована!');

    // Загружаем сохраненные настройки из localStorage
    const savedSunEnabled = localStorage.getItem('easterEgg_sunEnabled') === 'true'; // по умолчанию false
    const savedCloudsCount = parseInt(localStorage.getItem('easterEgg_cloudsCount')) || 8;
    const savedWindSpeed = parseInt(localStorage.getItem('easterEgg_windSpeed')) || 3;

    // Создаем модальное окно динамически
    const modal = document.createElement('div');
    modal.id = 'easterEggModal';
    modal.className = 'easter-egg-modal active';

    const windLabels = ['Очень медленный', 'Медленный', 'Средняя', 'Быстрый', 'Очень быстрый'];

    modal.innerHTML = `
        <div class="easter-egg-content">
            <button class="easter-egg-close" id="easterEggCloseBtn">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 5L5 15M5 5L15 15" stroke="white" stroke-width="3" stroke-linecap="round"/>
                </svg>
            </button>
            <h2>Секретное меню</h2>

            <div class="easter-egg-controls">
                <div class="easter-egg-control">
                    <label>
                        ☀️ Солнышко
                        <label class="toggle-switch">
                            <input type="checkbox" id="sunToggle" ${savedSunEnabled ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </label>
                </div>

                <div class="easter-egg-control">
                    <label>
                        ☁️ Количество облаков: <span class="value-display" id="cloudsValue">${savedCloudsCount}</span>
                    </label>
                    <input type="range" id="cloudsSlider" min="4" max="16" value="${savedCloudsCount}" step="1">
                </div>

                <div class="easter-egg-control">
                    <label>
                        💨 Скорость ветра: <span class="value-display" id="windValue">${windLabels[savedWindSpeed - 1]}</span>
                    </label>
                    <input type="range" id="windSlider" min="1" max="5" value="${savedWindSpeed}" step="1">
                </div>
            </div>

            <button id="easterEggApplyBtn" class="easter-egg-apply-btn">🎮 Применить</button>
        </div>
    `;

    document.body.appendChild(modal);

    // Добавляем обработчики для слайдеров
    const cloudsSlider = document.getElementById('cloudsSlider');
    const cloudsValue = document.getElementById('cloudsValue');
    cloudsSlider.addEventListener('input', (e) => {
        const count = e.target.value;
        cloudsValue.textContent = count;
        // Применяем изменение облаков сразу
        updateCloudsCount(parseInt(count));
    });

    const windSlider = document.getElementById('windSlider');
    const windValue = document.getElementById('windValue');
    windSlider.addEventListener('input', (e) => {
        const speed = e.target.value;
        windValue.textContent = windLabels[speed - 1];
        // Применяем изменение скорости ветра сразу
        updateWindSpeed(parseInt(speed));
    });

    // Обработчик для переключателя солнца
    const sunToggle = document.getElementById('sunToggle');
    sunToggle.addEventListener('change', (e) => {
        // Применяем изменение солнца сразу
        updateSunVisibility(e.target.checked);
    });

    // Обработчик кнопки "Применить"
    const applyBtn = document.getElementById('easterEggApplyBtn');
    applyBtn.addEventListener('click', () => {
        // Запускаем конфетти
        if (typeof confetti !== 'undefined') {
            confetti({
                particleCount: 200,
                spread: 100,
                origin: { y: 0.4 },
                colors: ['#FFD93D', '#FF6B6B', '#7EC850', '#6FBAFF', '#FFA94D']
            });

            setTimeout(() => {
                confetti({
                    particleCount: 150,
                    spread: 80,
                    origin: { y: 0.5 },
                    colors: ['#FFD93D', '#FF6B6B', '#7EC850', '#6FBAFF', '#FFA94D']
                });
            }, 300);
        }

        // Удаляем модальное окно
        modal.remove();
    });

    // Обработчик кнопки закрытия
    const closeBtn = document.getElementById('easterEggCloseBtn');
    closeBtn.addEventListener('click', () => {
        modal.remove();
    });
}

// Функции для применения настроек в реальном времени
function updateCloudsCount(count) {
    const clouds = document.querySelectorAll('.cloud');
    clouds.forEach((cloud, index) => {
        if (index < count) {
            cloud.style.display = 'block';
        } else {
            cloud.style.display = 'none';
        }
    });
    // Сохраняем в localStorage
    localStorage.setItem('easterEgg_cloudsCount', count);
}

function updateWindSpeed(speed) {
    const clouds = document.querySelectorAll('.cloud');
    clouds.forEach((cloud, index) => {
        const baseSpeed = [50, 40, 45, 42, 38, 50, 43, 47, 38, 44, 41, 39, 43, 46, 37, 42][index] || 40;
        const speedMultiplier = 6 - speed; // 5 = медленно, 1 = быстро
        const newSpeed = baseSpeed * speedMultiplier / 3;
        cloud.style.animationDuration = `${newSpeed}s`;
    });
    // Сохраняем в localStorage
    localStorage.setItem('easterEgg_windSpeed', speed);
}

function updateSunVisibility(enabled) {
    if (enabled) {
        document.body.classList.add('easter-egg-mode');
    } else {
        document.body.classList.remove('easter-egg-mode');
    }
    // Сохраняем в localStorage
    localStorage.setItem('easterEgg_sunEnabled', enabled);
}

// Загрузка сохраненных настроек пасхалки при старте
function loadEasterEggSettings() {
    const savedSunEnabled = localStorage.getItem('easterEgg_sunEnabled') === 'true'; // по умолчанию false
    const savedCloudsCount = parseInt(localStorage.getItem('easterEgg_cloudsCount')) || 8;
    const savedWindSpeed = parseInt(localStorage.getItem('easterEgg_windSpeed')) || 3;

    // Применяем сохраненные настройки
    updateSunVisibility(savedSunEnabled);
    updateCloudsCount(savedCloudsCount);
    updateWindSpeed(savedWindSpeed);

    console.log(`🎨 Загружены настройки: Солнце=${savedSunEnabled}, Облака=${savedCloudsCount}, Ветер=${savedWindSpeed}`);
}

function applyEasterEggSettings(sunEnabled, cloudsCount, windSpeed) {
    // Эта функция больше не используется, все применяется в реальном времени
    console.log('applyEasterEggSettings deprecated');
}
