from flask import Flask, request, jsonify
from flask_cors import CORS
import whisper
import os
import tempfile

# Добавляем ffmpeg в PATH
ffmpeg_path = os.path.join(os.path.dirname(__file__), 'ffmpeg-master-latest-win64-gpl', 'bin')
os.environ['PATH'] = ffmpeg_path + os.pathsep + os.environ.get('PATH', '')

app = Flask(__name__)
CORS(app)  # Разрешаем запросы с GitHub Pages

# Загружаем большую модель Whisper (один раз при старте)
print("Загружаем Whisper base модель...")
model = whisper.load_model("base")
print("Whisper base модель загружена!")

@app.route('/transcribe', methods=['POST'])
def transcribe():
    """
    Принимает аудио файл, распознает речь, возвращает текст
    """
    print("=== Получен запрос на /transcribe ===")

    if 'audio' not in request.files:
        print("Ошибка: нет файла audio в запросе")
        return jsonify({'error': 'Нет аудио файла'}), 400

    audio_file = request.files['audio']
    print(f"Получен файл: {audio_file.filename}, тип: {audio_file.content_type}")

    temp_path = None

    try:
        # Сохраняем временно (без автоудаления)
        temp_fd, temp_path = tempfile.mkstemp(suffix='.wav')
        os.close(temp_fd)  # Закрываем файловый дескриптор
        print(f"Создан временный файл: {temp_path}")

        # Сохраняем загруженный файл
        audio_file.save(temp_path)
        file_size = os.path.getsize(temp_path)
        print(f"Файл сохранен: {temp_path}, размер: {file_size} байт")

        # Проверяем что файл существует
        if not os.path.exists(temp_path):
            raise Exception(f"Файл не найден после сохранения: {temp_path}")

        # Распознаем речь
        print(f"Начинаем распознавание...")
        result = model.transcribe(temp_path, language='ru', fp16=False)

        text = result['text'].strip()
        print(f"Распознано: '{text}'")

        return jsonify({
            'text': text,
            'success': True
        })

    except Exception as e:
        print(f"!!! ОШИБКА: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

    finally:
        # Удаляем временный файл
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
                print(f"Файл удален: {temp_path}")
            except Exception as e:
                print(f"Ошибка при удалении файла: {e}")

@app.route('/health', methods=['GET'])
def health():
    """Проверка что сервер работает"""
    return jsonify({'status': 'ok', 'model': 'whisper-large'})

if __name__ == '__main__':
    print("Запускаем сервер на http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=False)
