# WebToApp iOS Source

This is the complete Xcode source for your app.

## Run it
1. Install Xcode from the Mac App Store.
2. `brew install xcodegen` then run `xcodegen generate` in this folder.
3. Open `WebToApp.xcodeproj`, select a simulator, press Run.

## Publish it (your decision, your account)
1. Join the Apple Developer Program ($99/year) at developer.apple.com.
2. In Xcode: Signing & Capabilities -> select your team, let Xcode manage signing.
3. Product -> Archive -> Distribute App -> App Store Connect.

Note: Apple review (guideline 4.2) can reject simple website-wrapper apps. Adding
native touches (push notifications, offline content) improves approval odds.
