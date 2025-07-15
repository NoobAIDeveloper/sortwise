import '@testing-library/jest-dom';

Object.defineProperty(window, 'electronAPI', {
  value: {
    selectFolders: jest.fn(),
    sortFiles: jest.fn(),
    onSortProgress: jest.fn(),
    undoSort: jest.fn(),
  },
  writable: true
});