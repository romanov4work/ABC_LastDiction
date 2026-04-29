from flask import Flask, request, jsonify
from flask_cors import CORS
import whisper
import os
import tempfile
import sys

# Добавляем ffmpeg в PATH
ffmpeg_bin = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                          'ffmpeg-master-latest-win64-gpl', 'bin')
os.environ['PATH'] = ffmpeg_bin + os.pathsep + os.environ.get('PATH', '')

print(f"ffmpeg PATH: {ffmpeg_bin}", flush=True)

app = Flask(__name__)
CORS(app)

# Загружаем модель
print("Загружаем Whisper small модель...", flush=True)
model = whisper.load_model("small")
print("Whisper small модель загружена!", flush=True)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'model': 'small', 'message': 'Whisper API работает!'})

@app.route('/transcribe', methods=['POST'])
def transcribe():
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'Нет аудио файла', 'success': False}), 400

        audio_file = request.files['audio']

        # Сохраняем во временный файл
        temp_fd, temp_path = tempfile.mkstemp(suffix='.wav')
        os.close(temp_fd)

        audio_file.save(temp_path)

        # Распознаем
        result = model.transcribe(temp_path, language='ru', fp16=False)
        text = result['text'].strip()

        # Удаляем файл
        os.remove(temp_path)

        return jsonify({'text': text, 'success': True})

    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

if __name__ == '__main__':
    print("Запускаем сервер на http://localhost:5000", flush=True)
    app.run(host='0.0.0.0', port=5000, debug=False)
