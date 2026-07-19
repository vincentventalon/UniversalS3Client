# Build for iOS
npx eas build --platform ios --profile production --auto-submit

npx eas build --platform ios --profile production --local
xcrun altool --upload-app --type ios --file dist/<nom_du_fichier>.ipa --username "tonAppleID" --password "@keychain:AppStoreConnect"
npx eas submit --platform ios --path
    monapp.ipa
