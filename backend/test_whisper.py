import requests
import io
from pydub import AudioSegment
from pydub.generators import Sine

# Создаем простой тестовый звук (1 секунда, 440 Hz)
print("Создаем тестовый аудио файл...")
sound = Sine(440).to_audio_segment(duration=1000)

# Сохраняем в память как WAV
buffer = io.BytesIO()
sound.export(buffer, format="wav")
buffer.seek(0)

# Отправляем на Whisper API
print("Отправляем на Whisper API...")
files = {'audio': ('test.wav', buffer, 'audio/wav')}

try:
    response = requests.post('http://localhost:5000/transcribe', files=files, timeout=30)

    print(f"Статус: {response.status_code}")
    print(f"Ответ: {response.text}")

    if response.status_code == 200:
        data = response.json()
        print(f"✅ Успех! Распознано: '{data.get('text', '')}'")
    else:
        print(f"❌ Ошибка: {response.status_code}")

except Exception as e:
    print(f"❌ Ошибка: {e}")
