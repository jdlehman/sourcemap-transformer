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

var smcCache = {};

export function createSourceMapTransformer({
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
  var sourceMapTransformer = new stream.Transform({objectMode: true});
  sourceMapTransformer._transform = function(chunk, something, done){
    var lastSmc;
    var transformedChunk = chunk.toString().split('\n').map(function(line) {
      if (newFileRegex.test(line)) {
        let match = line.match(newFileRegex);
        let formattingSpaces = newFileFormattingSpaces(match);
        let filePath = newFilePath(match);
        let lineNumber = newFileLineNumber(match);
        let columnNumber = newFileColumnNumber(match);

        if (!smcCache[filePath]) {
          let rawSourceMap = getRawSourceMap(filePath);
          lastSmc = new SourceMapConsumer(rawSourceMap);
          smcCache[filePath] = lastSmc;
        } else {
          lastSmc = smcCache[filePath];
        }
        let originalPosition = lastSmc.originalPositionFor({
          line: lineNumber,
          column: columnNumber
        });
        return originalPositionStr(formattingSpaces, originalPosition, line);
      } else if (prevFileRegex.test(line) && lastSmc) {
        let match = line.match(prevFileRegex);
        let formattingSpaces = prevFileFormattingSpaces(match);
        let lineNumber = prevFileLineNumber(match);
        let columnNumber = prevFileColumnNumber(match);

        let originalPosition = lastSmc.originalPositionFor({
          line: lineNumber,
          column: columnNumber
        });
        return originalPositionStr(formattingSpaces, originalPosition, line);
      } else {
        return line;
      }
    }).join('\n');
    this.push(transformedChunk);
    done();
  };

  sourceMapTransformer._flush = function(done){
    done();
  };

  return sourceMapTransformer;
}
