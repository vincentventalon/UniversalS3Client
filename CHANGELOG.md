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

### Changed
- Switched to Calendar Versioning (CalVer) format: YY.M.MICRO
- Improved header layout and organization
- Enhanced file list rendering with conditional view modes
- Better separation of concerns with modular components

### Dependencies
- Added `expo-clipboard` integration for path copying functionality
- Enhanced usage of existing React Native Paper components

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