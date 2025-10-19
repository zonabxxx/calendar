#!/bin/bash

# Production Planner - Startup Script
# Quick start script for running the application

echo "🚀 Production Planner - Starting..."
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Check if dependencies are installed
if [ ! -f "venv/lib/python*/site-packages/fastapi/__init__.py" ]; then
    echo "📦 Installing dependencies..."
    pip install -r requirements.txt
    echo "✅ Dependencies installed"
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found!"
    echo "📝 Creating .env from example..."
    cp .env.example .env
    echo ""
    echo "❗ Please edit .env file and add your API keys:"
    echo "   - OPENAI_API_KEY"
    echo "   - WEATHER_API_KEY"
    echo ""
    echo "Press Enter to continue or Ctrl+C to exit..."
    read
fi

# Run setup test
echo ""
echo "🧪 Running setup test..."
python test_setup.py

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Setup test failed. Please check the errors above."
    exit 1
fi

echo ""
echo "="
echo "🎉 Starting server..."
echo "="
echo ""
echo "📍 Backend API: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo "🌐 Frontend: Open frontend/index.html in browser"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000


