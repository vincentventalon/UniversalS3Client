---
name: release-ios
description: Cut an iOS App Store / TestFlight release of apps/app via EAS. Verifies the git tag matches app.json, pushes the tag to trigger the CI EAS build, then submits the finished build. User-triggered only.
disable-model-invocation: true
---

Release the Expo app in `apps/app` to TestFlight. Steps:

1. Read `apps/app/app.json` → `expo.version` (CalVer `YY.M.MICRO`, e.g. `26.5.1`). This is the release version.
2. Confirm the working tree is clean and on `master` (or ask the user which branch).
3. Confirm with the user that `expo.version` is the version they intend to ship. If they want a new version, have them bump `app.json` first and commit it (`ci:` or `chore:` prefix) — the tag must match.
4. Create and push the tag: `git tag v<version> && git push origin v<version>`. This triggers `.github/workflows/release-ios.yml`, which re-checks the tag/version match and queues an EAS `production` build on Expo's macOS workers (`--no-wait`, ~4 min, async).
5. Tell the user to watch the build at https://expo.dev. The build is NOT auto-submitted.
6. Once the build finishes, submit it from `apps/app`:
   ```
   npx eas submit -p ios --latest
   ```
   This uploads to App Store Connect / TestFlight.

Requirements: repo secret `EXPO_TOKEN` (for CI), and the user logged into EAS locally for the submit step. If the tag already exists, ask before force-retagging.
