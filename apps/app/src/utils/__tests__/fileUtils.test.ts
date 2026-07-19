import {
  getFileExtension,
  getFileType,
  isCsvFile,
  isHeicFile,
  isImageFile,
  isJsonFile,
  isTextFile,
  isYamlFile,
} from '../fileUtils';

describe('getFileExtension', () => {
  it('returns the lowercased extension including the dot', () => {
    expect(getFileExtension('photo.JPG')).toBe('.jpg');
    expect(getFileExtension('archive.tar.gz')).toBe('.gz');
  });

  it('returns empty string when there is no usable extension', () => {
    expect(getFileExtension('README')).toBe('');
    expect(getFileExtension('trailingdot.')).toBe('');
  });
});

describe('file type predicates', () => {
  it('detects images (including HEIC)', () => {
    expect(isImageFile('pic.png')).toBe(true);
    expect(isHeicFile('pic.heic')).toBe(true);
    expect(isImageFile('notes.txt')).toBe(false);
  });

  it('detects data formats', () => {
    expect(isCsvFile('data.csv')).toBe(true);
    expect(isJsonFile('config.json')).toBe(true);
    expect(isYamlFile('config.yml')).toBe(true);
    expect(isTextFile('index.ts')).toBe(true);
  });
});

describe('getFileType', () => {
  it('maps filenames to a display type', () => {
    expect(getFileType('a.png')).toBe('image');
    expect(getFileType('a.csv')).toBe('csv');
    expect(getFileType('a.json')).toBe('json');
    expect(getFileType('a.yaml')).toBe('yaml');
    expect(getFileType('a.md')).toBe('text');
    expect(getFileType('a.bin')).toBe('file');
  });
});
