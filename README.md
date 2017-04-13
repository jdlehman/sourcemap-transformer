[![npm version](https://badge.fury.io/js/sourcemap-transformer.svg)](http://badge.fury.io/js/sourcemap-transformer)

# sourcemap-transformer

`sourcemap-transformer` takes a stream of data containing references to files and line numbers (eg. stack traces) from compiled/built JavaScript and transforms the output to reference the original files and line numbers.

## Installation

```sh
npm install --save sourcemap-transformer
```

## Usage (Streams)

```js
const createSourceMapTransformer = require('sourcemap-transformer').createSourceMapTransformer;
const sourceMapTransformer = createSourceMapTransformer(optionalOptions);

yourDataStream.pipe(sourceMapTransformer).pipe(console.log);
```

## Usage (Strings)

```js
const transformSourceMapString = require('sourcemap-transformer').transformSourceMapString;
console.log(transformSourceMapString(yourDataString, optionalOptions));
```

## Configuration

Mileage may vary with the default configuration options as they assume [Mocha](https://mochajs.org/) using [PhantomJS](http://phantomjs.org/) stack trace output (from errors or failures in tests). This project initially came out of the need to support source maps in an older version of PhantomJS that did not support source maps out of the box. See the configuration options further down for handling stack traces in a different format. That said, the default configuration could handle the following:

```sh
# example input
1) App renders:
     AssertionError: expected 1 to equal 2
      at file:///tmp/testBundle.js:15315
      at file:///tmp/testBundle.js:17432
      at file:///tmp/testBundle.js:56073
      at callFn (:4202)
      at :4195
      at :4661
      at :4790
      at next (:4581)
      at :4591
      at next (:4523)
      at :4559
      at timeslice (:12326)

# example output
1) App renders:
     AssertionError: expected 1 to equal 2
      webpack:///~/chai/lib/chai/assertion.js:111
      webpack:///~/chai/lib/chai/interface/assert.js:126
      webpack:///test/components/App_test.js:31
      webpack:///~/samsam/lib/samsam.js:73
      at :4195
      webpack:///~/sinon/lib/sinon/spy.js:127
      webpack:///~/sinon/lib/sinon/spy.js:256
      webpack:///~/sinon/lib/sinon/spy.js:47
      webpack:///~/sinon/lib/sinon/spy.js:57
      webpack:///~/samsam/lib/samsam.js:394
      webpack:///~/sinon/lib/sinon/spy.js:25
      at timeslice (:12326)
```

Notice that lines that do not contain information regarding file or line numbers are not transformed. Also notice that in the case that the line number is not found in the source map, it is also unchanged.

Clearly assuming a similar structure of data is limiting. For this reason, the `createSourceMapTransformer` and `transformSourceMapString` functions take a configuration option to handle input streams in different formats.

### Configuration options

The first distinction to make before diving into the options is that there are three general cases that the transformer handles.

- The input stream contains data referencing a file and potentially a line number, column number etc
- The input stream contains data just referencing a line number (the previously used file is assumed to still hold true)
- The input stream does not contain any relevant information, and the transformer does nothing

The first case we will refer to as the "new file" case, and the second we will refer to as the "previous file" case. We are able to customize the regular expressions that identify these cases as well as how matched data (file name, line number, etc) is retrieved.

#### newFileRegex

> RegExp

This is a regular expression that matches the first case mentioned above, when a new file is referenced.

The default regular expression matches input like: `at file:///tmp/testBundle.js:15315`

#### prevFileRegex

> RegExp

This is a regular expression that matches the first case mentioned above, when a new file is not provided, so the previous file is used in conjunction with the newly provided line number or any other data.

The default regular expression matches input like: `at callFn (:4202)`

#### newFileFormattingSpaces

> (match: Array): spaceStr: String

Used in conjunction with the `newFileRegex`, this option is a function that receives the match array from the `newFileRegex` and returns a string of white space to be placed at the beginning of the output in order to keep formatting consistent.

#### prevFileFormattingSpaces

> (match: Array): spaceStr: String

Used in conjunction with the `prevFileRegex`, this option is a function that receives the match array from the `prevFileRegex` and returns a string of white space to be placed at the beginning of the output in order to keep formatting consistent.

#### newFilePath

> (match: Array): filePath: String

Used in conjunction with the `newFileRegex`, this option is a function that receives the match array from the `newFileRegex` and returns a string representing the path to the file referenced in the input stream.

#### newFileLineNumber

> (match: Array): lineNumber: String

Used in conjunction with the `newFileRegex`, this option is a function that receives the match array from the `newFileRegex` and returns a string representing the line number referenced in the input stream.

#### prevFileLineNumber

> (match: Array): lineNumber: String

Used in conjunction with the `prevFileRegex`, this option is a function that receives the match array from the `prevFileRegex` and returns a string representing the line number referenced in the input stream.

#### newFileColumnNumber

> (match: Array): columnNumber: String

Used in conjunction with the `newFileRegex`, this option is a function that receives the match array from the `newFileRegex` and returns a string representing the column number referenced in the input stream.

#### prevFileColumnNumber

> (match: Array): columnNumber: String

Used in conjunction with the `prevFileRegex`, this option is a function that receives the match array from the `prevFileRegex` and returns a string representing the column number referenced in the input stream.

#### originalPositionString

> (formattingSpaces: String, originalPosition: {source: String, line: Number|String, column: Number|String}, untransformedOutput: String, match: Array, prev: Boolean): originalPosition: String

This option is a function that receives the original spaces for formatting as a string; an object containing the source file (if one could be found), the source line number, and the source column number; the untransformed output as a string; the whole regular expression match; and a boolean indicating whether this formatting is for a match with `prevFileRegex` (`true`) or the usual `newFileRegex`. The function returns the formatted line.

#### cache

> boolean = true

Determines whether to cache parsed source maps for reuse.

#### emptyCache

> boolean = false

Only available to `createSourceMapTransformer`. Automatically empties the cache after a stream is completed.

### emptyCache()

This method will empty any cache built up by `createSourceMapTransformer` or `transformSourceMapString`.

### Example using custom configuration

```js
const createSourceMapTransformer = require('sourcemap-transformer').createSourceMapTransformer;
const sourceMapTransformer = createSourceMapTransformer({
  newFileRegex: /(.*) at (\d*):(\d*)/
  newFileFormattingSpaces: function() {
    return '  ';
  },
  newFilePath: function(match) {
    return match[1];
  },
  newFileLineNumber: function(match) {
    return match[2];
  },
  newFileColumnNumber: function(match) {
    return match[3] || 0;
  },
  prevFileRegex: /(\d*):?(\d*)/,
  prevFileFormattingSpaces: function() {
    return '  ';
  },
  newFileLineNumber: function(match) {
    return match[1];
  },
  newFileColumnNumber: function(match) {
    return return match[2] || 0;
  }
});

yourDataStream.pipe(sourceMapTransformer).pipe(console.log);
```

```sh
# example input
1) App renders:
 AssertionError: expected 1 to equal 2
    at /tmp/testBundle.js:15315:14
    at /tmp/testBundle.js:17432
    4202:23
    at /tmp/testBundle2.js:17432
    6432

# example output
1) App renders:
 AssertionError: expected 1 to equal 2
  webpack:///~/chai/lib/chai/assertion.js:111:4
  webpack:///test/components/App_test.js:31:0
  webpack:///test/components/App_test.js:43:12
  webpack:///~/sinon/lib/sinon/spy.js:227:42
  webpack:///~/sinon/lib/sinon/spy.js:3256:0
```

## Notes

`sourcemap-transformer` assumes a node environment as it uses core libraries like `path` and `fs` to read and parse the source maps.

## Thanks

- [@demerzel3](https://github.com/demerzel3) for [karma-sourcemap-loader](https://github.com/demerzel3/karma-sourcemap-loader) that was the basis and inspiration for `sourcemap-transformer`, but with the goal of working in environments outside of [karma](http://karma-runner.github.io/0.13/index.html).
- [mozilla](https://github.com/mozilla) for the awesome [source-map](https://github.com/mozilla/source-map/) library that is being utilized to parse the retrieved source maps.
- [@whatknight](https://github.com/whatknight) for pairing/helping debug some earlier and uglier prototypes
