#!/bin/bash

# Activate virtual environment
source /Users/bharat/PythonProjects/photo_organizer/venv/bin/activate

# Navigate to the backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Run pyinstaller
pyinstaller --name sortwise_backend --onefile --windowed main.py

# Move the executable to the dist folder
mkdir -p ../dist
mv dist/sortwise_backend ../dist/

# Clean up
rm -rf build dist spec