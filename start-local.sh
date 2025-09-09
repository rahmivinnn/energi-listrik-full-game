#!/bin/bash

echo "🎮 Starting Energy Quest: Misteri Hemat Listrik locally..."
echo ""

# Check if Python is available
if command -v python3 &> /dev/null; then
    echo "✅ Python3 found"
    echo "🚀 Starting local server on http://localhost:8000"
    echo ""
    echo "📋 Available pages:"
    echo "🎮 Main Game: http://localhost:8000/index.html"
    echo "🧪 Demo: http://localhost:8000/demo.html"
    echo "🔧 Test: http://localhost:8000/test.html"
    echo ""
    echo "🎯 Unity-Style Features:"
    echo "✅ Post-Processing Pipeline"
    echo "✅ Advanced Shaders"
    echo "✅ Physics Engine"
    echo "✅ UI System"
    echo "✅ Performance Optimization"
    echo "✅ Advanced Effects"
    echo "✅ Input System"
    echo "✅ Animation System"
    echo "✅ Audio System"
    echo "✅ Advanced Rendering"
    echo ""
    echo "🎮 Press Ctrl+C to stop server"
    echo ""
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    echo "✅ Python found"
    echo "🚀 Starting local server on http://localhost:8000"
    echo ""
    echo "📋 Available pages:"
    echo "🎮 Main Game: http://localhost:8000/index.html"
    echo "🧪 Demo: http://localhost:8000/demo.html"
    echo "🔧 Test: http://localhost:8000/test.html"
    echo ""
    echo "🎮 Press Ctrl+C to stop server"
    echo ""
    python -m http.server 8000
else
    echo "❌ Python not found. Please install Python to run local server."
    echo "💡 Alternative: Use any web server or deploy directly to Vercel"
fi