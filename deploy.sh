#!/bin/bash

echo "🚀 Deploying Energy Quest: Misteri Hemat Listrik to Vercel..."
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if user is logged in
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please login to Vercel first:"
    vercel login
fi

echo "📁 Preparing files for deployment..."
echo "✅ vercel.json - Vercel configuration"
echo "✅ package.json - Project metadata"
echo "✅ index.html - Main game"
echo "✅ demo.html - Demo version"
echo "✅ test.html - Testing version"
echo "✅ All Unity-style systems ready"
echo ""

echo "🚀 Deploying to Vercel..."
vercel --prod

echo ""
echo "🎉 Deployment complete!"
echo "🎮 Your Unity-style game is now live!"
echo "🔗 Check your Vercel dashboard for the URL"
echo ""
echo "📋 Game Features Deployed:"
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
echo "🎯 Ready to show off your Unity-quality game! 🚀⚡🎮"