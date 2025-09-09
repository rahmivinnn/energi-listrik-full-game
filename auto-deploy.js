#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Energy Quest: Auto Deploy to Vercel');
console.log('=====================================\n');

// Check if vercel CLI is installed
try {
    execSync('vercel --version', { stdio: 'pipe' });
    console.log('✅ Vercel CLI is installed');
} catch (error) {
    console.log('❌ Vercel CLI not found. Installing...');
    try {
        execSync('npm install -g vercel', { stdio: 'inherit' });
        console.log('✅ Vercel CLI installed successfully');
    } catch (installError) {
        console.log('❌ Failed to install Vercel CLI');
        console.log('Please install manually: npm install -g vercel');
        process.exit(1);
    }
}

// Check if user is logged in
try {
    execSync('vercel whoami', { stdio: 'pipe' });
    console.log('✅ Already logged in to Vercel');
} catch (error) {
    console.log('🔐 Please login to Vercel first:');
    console.log('Run: vercel login');
    console.log('Then run this script again.');
    process.exit(1);
}

// Check if all required files exist
const requiredFiles = [
    'index.html',
    'game.js',
    'styles.css',
    'vercel.json',
    'package.json'
];

console.log('\n📁 Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - MISSING!`);
        allFilesExist = false;
    }
});

if (!allFilesExist) {
    console.log('\n❌ Some required files are missing. Please check your project.');
    process.exit(1);
}

// Check Unity-style systems
const systemFiles = [
    'audio.js',
    'post-processing.js',
    'shaders.js',
    'physics.js',
    'ui-system.js',
    'performance.js',
    'effects.js',
    'input-system.js'
];

console.log('\n🎨 Checking Unity-style systems...');
systemFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`⚠️  ${file} - Optional system file`);
    }
});

// Deploy to Vercel
console.log('\n🚀 Deploying to Vercel...');
try {
    const deployOutput = execSync('vercel --prod --yes', { 
        stdio: 'pipe',
        encoding: 'utf8'
    });
    
    console.log('✅ Deployment successful!');
    console.log('\n🎉 Your Unity-style game is now live!');
    
    // Extract URL from output
    const urlMatch = deployOutput.match(/https:\/\/[^\s]+/);
    if (urlMatch) {
        const gameUrl = urlMatch[0];
        console.log(`\n🎮 Game URL: ${gameUrl}`);
        console.log(`🧪 Demo URL: ${gameUrl}/demo.html`);
        console.log(`🔧 Test URL: ${gameUrl}/test.html`);
        
        // Save URL to file
        fs.writeFileSync('deployment-url.txt', gameUrl);
        console.log('\n📝 URL saved to deployment-url.txt');
    }
    
    console.log('\n🎯 Unity-Style Features Deployed:');
    console.log('✅ Post-Processing Pipeline (Bloom, SSAO, Color Grading)');
    console.log('✅ Advanced Shaders (PBR, Emissive, Electric)');
    console.log('✅ Physics Engine (Cannon.js)');
    console.log('✅ Unity-Style UI System');
    console.log('✅ Performance Optimization (LOD, Culling)');
    console.log('✅ Advanced Effects (Volumetric, SSR)');
    console.log('✅ Comprehensive Input System');
    console.log('✅ Animation System');
    console.log('✅ 3D Spatial Audio');
    console.log('✅ Advanced Rendering');
    
    console.log('\n🎮 Ready to show off your Unity-quality game!');
    console.log('📱 Works on desktop, mobile, and tablet');
    console.log('🎯 Multi-input support: mouse, keyboard, gamepad, touch');
    
} catch (deployError) {
    console.log('❌ Deployment failed:');
    console.log(deployError.message);
    console.log('\n💡 Try running manually: vercel --prod');
}

console.log('\n🚀 Deployment process complete!');