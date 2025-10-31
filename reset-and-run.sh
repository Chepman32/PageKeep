#!/bin/bash

echo "🧹 Cleaning React Native and iOS build..."

# Kill any running Metro bundler
pkill -f "react-native/cli" || true

# Clean React Native cache
echo "Cleaning Metro bundler cache..."
rm -rf $TMPDIR/metro-* || true
rm -rf $TMPDIR/haste-* || true

# Clean iOS
echo "Cleaning iOS build..."
cd ios
rm -rf build
rm -rf Pods
rm -rf Podfile.lock
pod cache clean --all || true
pod deintegrate || true
pod install
cd ..

# Clean node modules if needed (uncomment if you want full reset)
# rm -rf node_modules
# npm install

echo "✅ Clean complete!"
echo ""
echo "📱 Now delete the app from your simulator/device manually"
echo "   (Long press app icon and delete)"
echo ""
echo "▶️  Then run: npx react-native run-ios"
