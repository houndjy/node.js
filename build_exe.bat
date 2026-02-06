@echo off
REM Windows standalone executable build script
python -m pip install -r requirements.txt
pyinstaller --noconfirm --onefile --windowed --name kimtaenyeon_news app.py

echo Build complete. Executable: dist\kimtaenyeon_news.exe
