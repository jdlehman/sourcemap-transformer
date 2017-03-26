export const defaultNewFileRegex = /^(\s*)at file:\/\/(.+):(\d+)/;
export const defaultPrevFileRegex = /^(\s*)at.*:(\d+)/;

export function defaultNewFileFormattingSpaces (match) {
  return match[1] || '';
}

export function defaultNewFilePath (match) {
  return match[2];
}

export function defaultNewFileLineNumber (match) {
  return parseInt(match[3], 10);
}

export function defaultNewFileColumnNumber (match) {
  return 0;
}

export function defaultPrevFileFormattingSpaces (match) {
  return match[1] || '';
}

export function defaultPrevFileLineNumber (match) {
  return parseInt(match[2], 10);
}

export function defaultPrevFileColumnNumber (match) {
  return 0;
}
