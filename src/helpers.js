import fs from 'fs';
import path from 'path';

function fileStr(filePath) {
  return fs.readFileSync(filePath).toString();
}

function decodeInlineSourceMap(inlineSourceMap){
  var encoding = /^(?:;charset=utf-8)?;base64,/;
  if (encoding.test(inlineSourceMap)) {
    var buffer = new Buffer(inlineSourceMap.slice(inlineSourceMap.match(encoding)[0].length), 'base64');
    return buffer.toString();
  } else {
    return decodeURIComponent(inlineSourceMap);
  }
}

export function getRawSourceMap(filePath) {
  var fileData = fileStr(filePath);
  var lines = fileData.split(/\n/);
  var lastLine = lines.pop();
  while (new RegExp("^\\s*$").test(lastLine)) {
    lastLine = lines.pop();
  }

  var match = /^\/\/#\s*sourceMappingURL=(.+)$/.exec(lastLine);
  var sourceMapUrl = match && match[1];
  var rawSourceMap;
  if (!sourceMapUrl) {
    rawSourceMap = fileStr(filePath + '.map');
  } else if (/^data:application\/json/.test(sourceMapUrl)) {
    rawSourceMap = decodeInlineSourceMap(sourceMapUrl.slice('data:application/json'.length));
  } else {
    rawSourceMap = fileStr(path.resolve(path.dirname(filePath), sourceMapUrl));
  }

  return JSON.parse(rawSourceMap);
}

export function originalPositionStr(formattingSpaces, originalPosition, untransformedOutput) {
  if (originalPosition.source) {
    return formattingSpaces + originalPosition.source + ':' + originalPosition.line + ':' + originalPosition.column;
  } else {
    return untransformedOutput;
  }
}
