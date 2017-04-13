import stream from 'stream';
import {SourceMapConsumer} from 'source-map';
import {getRawSourceMap} from './helpers';
import {
  defaultNewFileRegex,
  defaultPrevFileRegex,
  defaultNewFileFormattingSpaces,
  defaultNewFilePath,
  defaultNewFileLineNumber,
  defaultNewFileColumnNumber,
  defaultPrevFileFormattingSpaces,
  defaultPrevFileLineNumber,
  defaultPrevFileColumnNumber,
  defaultOriginalPositionString
} from './defaultConfig';

let smcCache = {};

export function emptyCache () {
  smcCache = {};
}

export function transformSourceMapString (sourceMapString, {
  newFileRegex = defaultNewFileRegex,
  prevFileRegex = defaultPrevFileRegex,
  newFileFormattingSpaces = defaultNewFileFormattingSpaces,
  newFilePath = defaultNewFilePath,
  newFileLineNumber = defaultNewFileLineNumber,
  newFileColumnNumber = defaultNewFileColumnNumber,
  prevFileFormattingSpaces = defaultPrevFileFormattingSpaces,
  prevFileLineNumber = defaultPrevFileLineNumber,
  prevFileColumnNumber = defaultPrevFileColumnNumber,
  originalPositionString = defaultOriginalPositionString,
  cache = true
} = {}) {
  let lastSmc;
  return sourceMapString.split('\n').map(function (line) {
    if (newFileRegex.test(line)) {
      const match = line.match(newFileRegex);
      const formattingSpaces = newFileFormattingSpaces(match);
      const filePath = newFilePath(match);
      const lineNumber = newFileLineNumber(match);
      const columnNumber = newFileColumnNumber(match);

      if (!smcCache[filePath] || !cache) {
        const rawSourceMap = getRawSourceMap(filePath);
        lastSmc = new SourceMapConsumer(rawSourceMap);
        smcCache[filePath] = lastSmc;
      } else {
        lastSmc = smcCache[filePath];
      }
      const originalPosition = lastSmc.originalPositionFor({
        line: lineNumber,
        column: columnNumber
      });
      return originalPositionString(formattingSpaces, originalPosition, line, match);
    }
    if (prevFileRegex.test(line) && lastSmc) {
      const match = line.match(prevFileRegex);
      const formattingSpaces = prevFileFormattingSpaces(match);
      const lineNumber = prevFileLineNumber(match);
      const columnNumber = prevFileColumnNumber(match);

      const originalPosition = lastSmc.originalPositionFor({
        line: lineNumber,
        column: columnNumber
      });
      return originalPositionString(formattingSpaces, originalPosition, line, match, true);
    }
    return line;
  }).join('\n');
}

export function createSourceMapTransformer (opts = {}) {
  const sourceMapTransformer = new stream.Transform({objectMode: true});
  sourceMapTransformer._transform = function (chunk, something, done) {
    const transformedChunk = transformSourceMapString(chunk.toString(), opts);
    this.push(transformedChunk);
    done();
  };

  sourceMapTransformer._flush = function (done) {
    if (opts.emptyCache) {
      emptyCache();
    }
    done();
  };

  return sourceMapTransformer;
}
