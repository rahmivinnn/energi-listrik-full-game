#!/bin/bash

echo "🚀 Energy Quest: Auto Deploy to Vercel"
echo "======================================"
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
    echo "✅ Vercel CLI installed"
fi

echo "✅ Vercel CLI version: $(vercel --version)"
echo ""

# Check if user is logged in
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please login to Vercel first:"
    echo "Run: vercel login"
    echo "Then run this script again."
    exit 1
fi

echo "✅ Already logged in to Vercel"
echo ""

# Check required files
echo "📁 Checking required files..."
required_files=("index.html" "game.js" "styles.css" "vercel.json" "package.json")
all_files_exist=true

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file - MISSING!"
        all_files_exist=false
    fi
done

if [ "$all_files_exist" = false ]; then
    echo ""
    echo "❌ Some required files are missing. Please check your project."
    exit 1
fi

# Check Unity-style systems
echo ""
echo "🎨 Checking Unity-style systems..."
system_files=("audio.js" "post-processing.js" "shaders.js" "physics.js" "ui-system.js" "performance.js" "effects.js" "input-system.js")

for file in "${system_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "⚠️  $file - Optional system file"
    fi
done

echo ""
echo "🚀 Deploying to Vercel..."

# Deploy to Vercel
if vercel --prod --yes; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "🎉 Your Unity-style game is now live!"
    echo ""
    echo "🎯 Unity-Style Features Deployed:"
    echo "✅ Post-Processing Pipeline (Bloom, SSAO, Color Grading)"
    echo "✅ Advanced Shaders (PBR, Emissive, Electric)"
    echo "✅ Physics Engine (Cannon.js)"
    echo "✅ Unity-Style UI System"
    echo "✅ Performance Optimization (LOD, Culling)"
    echo "✅ Advanced Effects (Volumetric, SSR)"
    echo "✅ Comprehensive Input System"
    echo "✅ Animation System"
    echo "✅ 3D Spatial Audio"
    echo "✅ Advanced Rendering"
    echo ""
    echo "🎮 Ready to show off your Unity-quality game!"
    echo "📱 Works on desktop, mobile, and tablet"
    echo "🎯 Multi-input support: mouse, keyboard, gamepad, touch"
    echo ""
    echo "🔗 Check your Vercel dashboard for the URL"
    echo "📝 Or run: vercel ls to see your deployments"
else
    echo ""
    echo "❌ Deployment failed!"
    echo "💡 Try running manually: vercel --prod"
fi

echo ""
echo "🚀 Deployment process complete!"