# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project uses [Calendar Versioning](https://calver.org/) (YY.M.MICRO).

## [25.8.0] - 2025-08-15

### Added
- **Image Thumbnails**: Image files now display actual thumbnails instead of generic file icons
  - Supports: JPG, JPEG, PNG, WebP, GIF, BMP, SVG, TIFF, ICO
  - Automatic fallback to generic icon if image fails to load
  - Smart file type detection based on file extensions

- **Multiple View Modes**: Added flexible viewing options for file browsing
  - **List View**: Traditional detailed list with file information
  - **Grid 2x2**: Large grid layout (120px items) perfect for image previews
  - **Grid 3x3**: Compact grid layout (80px items) for quick browsing

- **View Toggle Controls**: New header controls for switching between view modes
  - List view icon (`view-list`)
  - 2x2 grid icon (`view-grid`) 
  - 3x3 grid icon (`apps`)
  - Visual feedback with blue highlight for selected view

- **Grid View Features**:
  - File titles displayed as overlay on each grid item
  - File sizes shown for non-folder items
  - Responsive grid layout that adapts to screen width
  - Multi-select support with checkboxes
  - Pull-to-refresh functionality
  - Touch feedback and selection states
  - **Enhanced Grid Item Layout**: Improved visual styling and layout for grid items
    - Optimized dynamic item sizing with minimal spacing
    - Better file title display for folders and non-image files by default
    - Refactored grid file item component with improved styling

- **Title Visibility Toggle**: Eye icon to show/hide file titles in grid view
  - Only appears in grid modes (2x2 and 3x3)
  - Default: titles shown
  - Clean, minimalist view when titles are hidden
  - Better icon centering when titles are hidden

- **Copy Current Path**: New button to copy the current folder path to clipboard
  - Copies in S3 URI format (e.g., `s3://bucket-name/folder/path/`)
  - Smart path formatting with proper handling of root directory
  - User confirmation dialog showing the copied path

- **UI Improvements**:
  - Removed redundant bucket name from second header
  - Better header organization and spacing
  - Consistent button styling and spacing
  - Improved visual hierarchy

### Technical Improvements
- **New Components**:
  - `ImageThumbnail.tsx`: Displays image thumbnails with fallback
  - `GridFileItem.tsx`: Individual grid item component with title overlay
  - `GridView.tsx`: Grid layout container with responsive columns
  - `fileUtils.ts`: Utility functions for file type detection

- **Enhanced State Management**:
  - View mode state (`list`, `grid2`, `grid3`)
  - Title visibility state for grid views
  - Improved item selection handling

- **TypeScript Enhancements**:
  - Full type safety for all new components
  - Proper interface definitions for props
  - Enhanced error handling

- **Cross-Bucket Copy & Paste**: Advanced clipboard functionality for copying files between different buckets and providers
  - Copy files from one S3 provider and paste to another
  - Intelligent context handling with provider and bucket information
  - Enhanced S3 operations for cross-provider file transfers
  - Streamlined clipboard management with dedicated context system

- **Enhanced Image Preview**: Improved image handling across all S3-compatible providers
  - Consistent signed URL usage for secure image thumbnails
  - Better compatibility with non-AWS S3 providers (Hetzner, Cloudflare R2, etc.)
  - Improved error handling and fallback mechanisms
  - Enhanced image loading performance and reliability

- **Grid View Enhancements**:
  - Improved overlay text positioning on grid item images
  - Dynamic item sizing with optimized spacing
  - Smart title display logic (folders and non-image files show titles by default)
  - Better visual styling and layout consistency
  - Enhanced touch feedback and selection states

- **Enhanced Clipboard Path Copy**: Extended functionality for copying current folder paths
  - Improved integration with existing copy operations
  - Better path formatting and validation
  - Enhanced user feedback and confirmation dialogs

- **Legacy Migration Support**: Automatic migration system for legacy S3 provider configurations
  - Seamless upgrade path from older storage formats
  - Comprehensive migration guide documentation
  - Backward compatibility preservation

- **Security Improvements**: Enhanced secure storage implementation
  - Removed custom encryption in favor of native device keystore
  - Simplified security model with better performance
  - Reduced dependencies and improved reliability

- **Documentation & Localization**:
  - Complete translation of French documentation to English
  - Updated technical documentation and feature guides
  - Improved code comments and developer documentation
  - Comprehensive feature index and technical summaries

### Changed
- Switched to Calendar Versioning (CalVer) format: YY.M.MICRO
- Improved header layout and organization
- Enhanced file list rendering with conditional view modes
- Better separation of concerns with modular components

### Dependencies
- Added `expo-clipboard` integration for path copying functionality
- Enhanced usage of existing React Native Paper components
- Upgraded `react-native-safe-area-context` to version 5.6.0
- Streamlined dependencies with security-focused refactoring

---

## Previous Versions

### [1.1.1] - Previous Release
- Basic S3 file management functionality
- Provider configuration and management
- File upload, download, and basic operations
- Multi-provider support for various S3-compatible services

---

## Version Format

Starting with version 25.8.0, this project uses Calendar Versioning (CalVer):
- **YY**: Two-digit year (25 = 2025)
- **M**: Month without leading zero (8 = August) 
- **MICRO**: Incremental release number within the month

This format provides clear temporal context and makes it easy to understand when features were released.