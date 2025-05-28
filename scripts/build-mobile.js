
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting mobile app build process...');

// Verificar se as plataformas estão adicionadas
const checkPlatforms = () => {
  console.log('📱 Checking installed platforms...');
  
  const androidExists = fs.existsSync(path.join(process.cwd(), 'android'));
  const iosExists = fs.existsSync(path.join(process.cwd(), 'ios'));
  
  if (!androidExists) {
    console.log('📱 Adding Android platform...');
    execSync('npx cap add android', { stdio: 'inherit' });
  }
  
  if (!iosExists) {
    console.log('📱 Adding iOS platform...');
    execSync('npx cap add ios', { stdio: 'inherit' });
  }
  
  return { androidExists, iosExists };
};

// Build do projeto web
const buildWeb = () => {
  console.log('🔨 Building web project...');
  execSync('npm run build', { stdio: 'inherit' });
};

// Sync com as plataformas nativas
const syncPlatforms = () => {
  console.log('🔄 Syncing with native platforms...');
  execSync('npx cap sync', { stdio: 'inherit' });
};

// Build para Android
const buildAndroid = () => {
  console.log('🤖 Building Android APK...');
  try {
    execSync('npx cap build android', { stdio: 'inherit' });
    console.log('✅ Android build completed! APK location: android/app/build/outputs/apk/');
  } catch (error) {
    console.error('❌ Android build failed:', error.message);
    console.log('💡 You may need to open Android Studio and build manually');
    console.log('💡 Run: npx cap open android');
  }
};

// Build para iOS
const buildIOS = () => {
  console.log('🍎 Building iOS IPA...');
  try {
    execSync('npx cap build ios', { stdio: 'inherit' });
    console.log('✅ iOS build completed! Open Xcode to archive and export IPA');
    console.log('💡 Run: npx cap open ios');
  } catch (error) {
    console.error('❌ iOS build failed:', error.message);
    console.log('💡 You may need to open Xcode and build manually');
    console.log('💡 Run: npx cap open ios');
  }
};

// Processo principal
const main = () => {
  try {
    // 1. Verificar e adicionar plataformas se necessário
    checkPlatforms();
    
    // 2. Build do projeto web
    buildWeb();
    
    // 3. Sync com plataformas nativas
    syncPlatforms();
    
    // 4. Build das plataformas
    const platform = process.argv[2];
    
    if (platform === 'android') {
      buildAndroid();
    } else if (platform === 'ios') {
      buildIOS();
    } else {
      console.log('🤖 Building Android...');
      buildAndroid();
      
      console.log('🍎 Building iOS...');
      buildIOS();
    }
    
    console.log('🎉 Mobile build process completed!');
    console.log('');
    console.log('📱 Next steps:');
    console.log('- For Android: Check android/app/build/outputs/apk/ for APK files');
    console.log('- For iOS: Open Xcode to archive and export IPA file');
    console.log('- Run "npx cap open android" to open Android Studio');
    console.log('- Run "npx cap open ios" to open Xcode');
    
  } catch (error) {
    console.error('❌ Build process failed:', error.message);
    process.exit(1);
  }
};

main();
