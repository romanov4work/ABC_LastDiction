from flask import Flask, request, jsonify
from flask_cors import CORS
import whisper
import os
import tempfile

app = Flask(__name__)
CORS(app)  # Разрешаем запросы с GitHub Pages

# Загружаем большую модель Whisper (один раз при старте)
print("Загружаем Whisper large модель...")
model = whisper.load_model("large")
print("Whisper large модель загружена!")

@app.route('/transcribe', methods=['POST'])
def transcribe():
    """
    Принимает аудио файл, распознает речь, возвращает текст
    """
    if 'audio' not in request.files:
        return jsonify({'error': 'Нет аудио файла'}), 400

    audio_file = request.files['audio']

    # Сохраняем временно
    with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as temp_audio:
        audio_file.save(temp_audio.name)
        temp_path = temp_audio.name

    try:
        # Распознаем речь
        print(f"Распознаем аудио: {temp_path}")
        result = model.transcribe(temp_path, language='ru')

        text = result['text'].strip()
        print(f"Распознано: {text}")

        return jsonify({
            'text': text,
            'success': True
        })

    except Exception as e:
        print(f"Ошибка: {e}")
        return jsonify({'error': str(e)}), 500

    finally:
        # Удаляем временный файл
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.route('/health', methods=['GET'])
def health():
    """Проверка что сервер работает"""
    return jsonify({'status': 'ok', 'model': 'whisper-large'})

if __name__ == '__main__':
    print("Запускаем сервер на http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
