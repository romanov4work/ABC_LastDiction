import whisper
import os
import sys

# Добавляем ffmpeg в PATH
ffmpeg_bin = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                          'ffmpeg-master-latest-win64-gpl', 'bin')
os.environ['PATH'] = ffmpeg_bin + os.pathsep + os.environ.get('PATH', '')

print(f"ffmpeg PATH: {ffmpeg_bin}")

# Проверяем ffmpeg
import subprocess
result = subprocess.run(['ffmpeg', '-version'], capture_output=True, text=True)
print(f"ffmpeg: {result.stdout.split()[2]}")

# Загружаем модель
print("\nЗагружаем Whisper base...")
model = whisper.load_model("base")
print("Модель загружена!")

# Тестируем на файле
test_file = r"C:\Windows\Media\Alarm01.wav"
print(f"\nТестируем на файле: {test_file}")
print(f"Файл существует: {os.path.exists(test_file)}")

try:
    print("\nНачинаем распознавание...")
    result = model.transcribe(test_file, language='ru', fp16=False)
    print("\nУСПЕХ!")
    print(f"Распознано: '{result['text']}'")
except Exception as e:
    print(f"\nОШИБКА: {e}")
    import traceback
    traceback.print_exc()
