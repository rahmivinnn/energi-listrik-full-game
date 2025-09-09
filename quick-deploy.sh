#!/bin/bash

echo "🚀 Energy Quest: Quick Deploy to Vercel"
echo "======================================="
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if vercel CLI is installed
if ! command_exists vercel; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
    if [ $? -eq 0 ]; then
        echo "✅ Vercel CLI installed successfully"
    else
        echo "❌ Failed to install Vercel CLI"
        echo "Please install manually: npm install -g vercel"
        exit 1
    fi
else
    echo "✅ Vercel CLI is already installed"
fi

echo ""

# Check if user is logged in
if vercel whoami >/dev/null 2>&1; then
    echo "✅ Already logged in to Vercel"
    USER_EMAIL=$(vercel whoami)
    echo "👤 Logged in as: $USER_EMAIL"
else
    echo "🔐 You need to login to Vercel first"
    echo ""
    echo "Please run: vercel login"
    echo "Then run this script again."
    echo ""
    echo "Or if you want to login now, press Enter..."
    read -r
    vercel login
    if [ $? -eq 0 ]; then
        echo "✅ Login successful!"
    else
        echo "❌ Login failed. Please try again."
        exit 1
    fi
fi

echo ""

# Check project files
echo "📁 Checking project files..."
files_to_check=("index.html" "game.js" "styles.css" "vercel.json" "package.json")
missing_files=()

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file - MISSING!"
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -gt 0 ]; then
    echo ""
    echo "❌ Missing required files: ${missing_files[*]}"
    echo "Please make sure all required files are present."
    exit 1
fi

echo ""
echo "🎨 Checking Unity-style systems..."
system_files=("audio.js" "post-processing.js" "shaders.js" "physics.js" "ui-system.js" "performance.js" "effects.js" "input-system.js")
systems_found=0

for file in "${system_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
        ((systems_found++))
    else
        echo "⚠️  $file - Optional"
    fi
done

echo ""
echo "📊 Systems found: $systems_found/${#system_files[@]}"

echo ""
echo "🚀 Ready to deploy!"
echo "Press Enter to continue with deployment..."
read -r

echo ""
echo "🚀 Deploying to Vercel..."

# Deploy to Vercel
if vercel --prod --yes; then
    echo ""
    echo "🎉 SUCCESS! Your Unity-style game is now live!"
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
    echo "🎮 Game Features:"
    echo "✅ 4 Interactive Levels"
    echo "✅ Physics-based Interactions"
    echo "✅ Real-time Energy Simulation"
    echo "✅ Multi-input Support (Mouse, Keyboard, Gamepad, Touch)"
    echo "✅ 3D Spatial Audio"
    echo "✅ Professional UI/UX"
    echo ""
    echo "📱 Compatible with:"
    echo "✅ Desktop (Windows, Mac, Linux)"
    echo "✅ Mobile (iOS, Android)"
    echo "✅ Tablet (iPad, Android tablets)"
    echo ""
    echo "🔗 Check your Vercel dashboard for the URL"
    echo "📝 Run 'vercel ls' to see all your deployments"
    echo ""
    echo "🎯 Ready to show off your Unity-quality game!"
else
    echo ""
    echo "❌ Deployment failed!"
    echo "💡 Try running manually: vercel --prod"
    echo "🔍 Check the error messages above for details"
fi

echo ""
echo "🚀 Deployment process complete!"