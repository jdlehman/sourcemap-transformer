import stream from 'stream';
import {SourceMapConsumer} from 'source-map';
import {originalPositionStr, getRawSourceMap} from './helpers';
import {
  defaultNewFileRegex,
  defaultPrevFileRegex,
  defaultNewFileFormattingSpaces,
  defaultNewFilePath,
  defaultNewFileLineNumber,
  defaultNewFileColumnNumber,
  defaultPrevFileFormattingSpaces,
  defaultPrevFileLineNumber,
  defaultPrevFileColumnNumber
} from './defaultConfig';

const smcCache = {};

export function createSourceMapTransformer ({
  newFileRegex = defaultNewFileRegex,
  prevFileRegex = defaultPrevFileRegex,
  newFileFormattingSpaces = defaultNewFileFormattingSpaces,
  newFilePath = defaultNewFilePath,
  newFileLineNumber = defaultNewFileLineNumber,
  newFileColumnNumber = defaultNewFileColumnNumber,
  prevFileFormattingSpaces = defaultPrevFileFormattingSpaces,
  prevFileLineNumber = defaultPrevFileLineNumber,
  prevFileColumnNumber = defaultPrevFileColumnNumber
} = {}) {
  const sourceMapTransformer = new stream.Transform({objectMode: true});
  sourceMapTransformer._transform = function (chunk, something, done) {
    let lastSmc;
    const transformedChunk = chunk.toString().split('\n').map(function (line) {
      if (newFileRegex.test(line)) {
        const match = line.match(newFileRegex);
        const formattingSpaces = newFileFormattingSpaces(match);
        const filePath = newFilePath(match);
        const lineNumber = newFileLineNumber(match);
        const columnNumber = newFileColumnNumber(match);

        if (!smcCache[filePath]) {
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
        return originalPositionStr(formattingSpaces, originalPosition, line);
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
        return originalPositionStr(formattingSpaces, originalPosition, line);
      }
      return line;
    }).join('\n');
    this.push(transformedChunk);
    done();
  };

  sourceMapTransformer._flush = function (done) {
    done();
  };

  return sourceMapTransformer;
}
