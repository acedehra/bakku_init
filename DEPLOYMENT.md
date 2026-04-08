# Deployment Guide

This guide covers building, packaging, and deploying Kordix for production distribution.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Building for Production](#building-for-production)
  - [macOS](#macos)
  - [Windows](#windows)
  - [Linux](#linux)
- [Code Signing](#code-signing)
- [GitHub Releases](#github-releases)
- [Version Management](#version-management)
- [Post-Release Steps](#post-release-steps)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Common Requirements

- **Node.js**: 18.0.0 or higher
- **Bun**: 1.0.0 or higher
- **Git**: Latest version
- **Rust**: 1.70.0 or higher (for Tauri)

### Platform-Specific Prerequisites

#### macOS

- **Xcode Command Line Tools**:
  ```bash
  xcode-select --install
  ```

- **Apple Developer Account** (for code signing):
  - Free account for basic distribution
  - Paid account ($99/year) for Mac App Store distribution

#### Windows

- **Microsoft Visual C++ Redistributable**: Latest version
- **Rust**: Install via rustup
- **Windows SDK**: Latest version

- **Code Signing Certificate** (optional, recommended):
  - Purchase from a certificate authority (DigiCert, GlobalSign, etc.)
  - Import to your Windows certificate store

#### Linux

- **Debian/Ubuntu**:
  ```bash
  sudo apt update
  sudo apt install -y libwebkit2gtk-4.0-dev build-essential curl wget file libssl-dev libayatana-appindicator3-dev librsvg2-dev
  ```

- **Fedora**:
  ```bash
  sudo dnf install -y webkit2gtk4.0-devel openssl-devel curl wget file libappindicator-gtk3-devel librsvg2-devel
  ```

- **Arch Linux**:
  ```bash
  sudo pacman -S webkit2gtk-4.0 base-devel curl wget file openssl libappindicator-gtk3 librsvg
  ```

## Building for Production

### Preparation

1. **Update Version Numbers**:
   - Update `package.json` version
   - Update `src-tauri/tauri.conf.json` version
   - Update CHANGELOG.md

2. **Clean Build Artifacts**:
   ```bash
   rm -rf dist/
   rm -rf node_modules/
   bun install
   ```

3. **Run Tests**:
   ```bash
   bun test
   bun run lint
   ```

### macOS

#### Building

```bash
# Build for current architecture
bun run tauri build

# Build for universal binary (Intel + Apple Silicon)
bun run tauri build --target universal-apple-dmg

# Build for specific architecture
bun run tauri build --target aarch64-apple-dmg  # Apple Silicon
bun run tauri build --target x86_64-apple-dmg  # Intel
```

#### Build Outputs

- **DMG Installer**: `src-tauri/target/release/bundle/dmg/kordix_<version>_aarch64.dmg`
- **App Bundle**: `src-tauri/target/release/bundle/macos/kordix.app`

#### Code Signing

```bash
# Enable code signing in tauri.conf.json
{
  "bundle": {
    "macOS": {
      "signingIdentity": "Developer ID Application: Your Name",
      "entitlements": null,
      "hardenedRuntime": true
    }
  }
}

# Build with signing
bun run tauri build
```

#### Notarization (for distribution)

```bash
# Install notarization tool
cargo install cargo-notary

# Notarize the app
cargo-notary submit --file kordix.dmg --apple-id "your@email.com" --password "app-specific-password"
```

### Windows

#### Building

```bash
# Build MSI installer
bun run tauri build --target msi

# Build NSIS installer
bun run tauri build --target nsis

# Build for both architectures
bun run tauri build --target nsis --target x64_64-pc-windows-msvc
bun run tauri build --target nsis --target i686-pc-windows-msvc
```

#### Build Outputs

- **MSI Installer**: `src-tauri/target/release/bundle/msi/kordix_<version>_x64_en-US.msi`
- **NSIS Installer**: `src-tauri/target/release/bundle/nsis/kordix_<version>_x64-setup.exe`
- **Executable**: `src-tauri/target/release/kordix.exe`

#### Code Signing

```bash
# Enable code signing in tauri.conf.json
{
  "bundle": {
    "windows": {
      "signCommand": "signtool sign /f certificate.pfx /p password /t http://timestamp.digicert.com"
    }
  }
}

# Or sign manually after build
signtool sign /f certificate.pfx /p password /t http://timestamp.digicert.com /fd sha256 kordix.exe
```

### Linux

#### Building

```bash
# Build DEB package (Debian, Ubuntu)
bun run tauri build --target deb

# Build AppImage (universal)
bun run tauri build --target appimage

# Build RPM package (Fedora, openSUSE)
bun run tauri build --target rpm
```

#### Build Outputs

- **DEB Package**: `src-tauri/target/release/bundle/deb/kordix_<version>_amd64.deb`
- **AppImage**: `src-tauri/target/release/bundle/appimage/kordix_<version>_amd64.AppImage`
- **RPM Package**: `src-tauri/target/release/bundle/rpm/kordix-<version>.x86_64.rpm`

#### Repository Setup (Optional)

For easy installation on Linux, set up a package repository:

```bash
# Create a simple repo structure
mkdir -p repo/{binary,source}
cp src-tauri/target/release/bundle/deb/*.deb repo/binary/

# Create Packages file
dpkg-scanpackages binary /dev/null | gzip -9c > binary/Packages.gz
```

## Code Signing

### macOS

1. **Obtain Developer Certificate**:
   - Sign in to [Apple Developer Portal](https://developer.apple.com/)
   - Go to Certificates, IDs & Profiles
   - Create a "Developer ID Application" certificate

2. **Configure Signing**:
   - Open `src-tauri/tauri.conf.json`
   - Add signing configuration:
     ```json
     {
       "bundle": {
         "macOS": {
           "signingIdentity": "Developer ID Application: Your Name (TEAM_ID)",
           "hardenedRuntime": true,
           "entitlements": "entitlements.plist"
         }
       }
     }
     ```

3. **Create Entitlements File** (`entitlements.plist`):
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
   <plist version="1.0">
     <dict>
       <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
       <true/>
       <key>com.apple.security.cs.disable-library-validation</key>
       <true/>
     </dict>
   </plist>
   ```

### Windows

1. **Obtain Code Signing Certificate**:
   - Purchase from a trusted certificate authority
   - Install in your Windows certificate store

2. **Configure Signing**:
   - Open `src-tauri/tauri.conf.json`
   - Add signing configuration:
     ```json
     {
       "bundle": {
         "windows": {
           "signCommand": "signtool sign /f certificate.pfx /p password /t http://timestamp.digicert.com /fd sha256"
         }
       }
     }
     ```

## GitHub Releases

### Automated Release Workflow

1. **Create Release Tag**:
   ```bash
   git tag -a v0.1.0 -m "Release v0.1.0"
   git push origin v0.1.0
   ```

2. **Create GitHub Release**:
   - Go to GitHub repository
   - Click "Releases" → "Create a new release"
   - Select the tag you just pushed
   - Add release notes (copy from CHANGELOG.md)
   - Upload build artifacts:
     - macOS: DMG file
     - Windows: MSI/NSIS installer
     - Linux: DEB/AppImage

3. **Publish Release**:
   - Click "Publish release"
   - This will trigger the auto-updater for existing users

### Release Checklist

- [ ] Version numbers updated in package.json and tauri.conf.json
- [ ] CHANGELOG.md updated with release notes
- [ ] All tests passing
- [ ] Linting passes
- [ ] Build artifacts tested on target platforms
- [ ] Code signing verified
- [ ] Release notes reviewed
- [ ] Build artifacts uploaded
- [ ] Release published

## Version Management

### Semantic Versioning

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Incompatible API changes
- **MINOR**: New functionality (backwards compatible)
- **PATCH**: Bug fixes (backwards compatible)

Examples:
- `0.1.0` → `0.1.1` (bug fix)
- `0.1.0` → `0.2.0` (new feature)
- `0.9.0` → `1.0.0` (major release)

### Version Updates

1. **Update package.json**:
   ```json
   {
     "version": "0.2.0"
   }
   ```

2. **Update src-tauri/tauri.conf.json**:
   ```json
   {
     "version": "0.2.0"
   }
   ```

3. **Create Git Tag**:
   ```bash
   git tag -a v0.2.0 -m "Release v0.2.0"
   git push origin v0.2.0
   ```

4. **Update CHANGELOG.md**:
   - Add new version section
   - Move unreleased changes to new version
   - Update links at bottom of file

## Post-Release Steps

1. **Update Auto-Updater**:
   - Ensure `latest.json` is updated with new version
   - Verify auto-updater endpoint is accessible

2. **Announce Release**:
   - Update website with new version
   - Post announcement on social media
   - Send email newsletter (if applicable)

3. **Monitor Issues**:
   - Watch for reported issues with new release
   - Address critical bugs quickly

4. **Archive Old Releases**:
   - Keep last 3-5 releases available for download
   - Archive older releases to storage

## Troubleshooting

### Build Failures

#### macOS

**Problem**: "codesign failed"
```
Solution:
1. Check your signing certificate is installed
2. Verify certificate hasn't expired
3. Check signing identity matches your certificate name
```

**Problem**: "notarization failed"
```
Solution:
1. Verify your Apple ID and app-specific password
2. Ensure you have internet connectivity
3. Check Apple Developer account status
```

#### Windows

**Problem**: "signtool not found"
```
Solution:
1. Install Windows SDK
2. Add signtool to PATH
3. Or use full path: C:\Program Files (x86)\Windows Kits\10\bin\<version>\x64\signtool.exe
```

**Problem**: "certificate not found"
```
Solution:
1. Verify certificate is installed in certificate store
2. Check certificate store location (Local Machine vs Current User)
3. Import certificate if missing
```

#### Linux

**Problem**: "missing dependencies"
```
Solution:
1. Install platform-specific dependencies (see Prerequisites)
2. Update package manager: sudo apt update / sudo dnf upgrade
3. Install build tools: sudo apt install build-essential
```

### Runtime Issues

**Problem**: "Failed to load resources"
```
Solution:
1. Verify frontendDist path in tauri.conf.json
2. Ensure build completed successfully
3. Check for typos in asset paths
```

**Problem**: "Auto-updater not working"
```
Solution:
1. Verify latest.json is accessible
2. Check version numbers match
3. Ensure updater endpoint is correct in tauri.conf.json
```

### Performance Issues

**Problem**: "App is slow to start"
```
Solution:
1. Check build mode (use --release for production)
2. Profile with browser dev tools
3. Optimize large bundles
```

**Problem**: "High memory usage"
```
Solution:
1. Check for memory leaks
2. Implement proper cleanup in useEffect
3. Use React.memo for expensive components
```

## Additional Resources

- [Tauri Documentation](https://tauri.app/v1/guides/)
- [Tauri CLI Reference](https://tauri.app/v1/api/cli/)
- [Rust Documentation](https://doc.rust-lang.org/)
- [React Documentation](https://react.dev/)

## Support

If you encounter issues not covered in this guide:

1. Check the [GitHub Issues](https://github.com/acedehra/kordix_init/issues)
2. Search existing issues before creating a new one
3. Provide detailed information about your environment and the issue
4. Include logs and screenshots if applicable

---

**Last Updated**: 2024-01-XX
