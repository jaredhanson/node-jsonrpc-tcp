# JSONRPC-TCP

[JSON-RPC](http://json-rpc.org/) over TCP/IP for [Node](http://nodejs.org).

## Installation

Install from source code repository:

    $ git clone git@github.com:jaredhanson/node-jsonrpc-tcp.git
    $ npm install

Through [jsonsp](https://github.com/jaredhanson/node-jsonsp), jsonrpc-tcp
depends on [YAJL](http://lloyd.github.com/yajl/) and the
[YAJL binding for Node.js](https://github.com/vibornoff/node-yajl).  libyajl
must be installed on your system prior to installing jsonrpc-tcp.

Install YAJL via [Homebrew](http://mxcl.github.com/homebrew/) on Mac OS X:

    $ brew install yajl

## License

(The MIT License)

Copyright (c) 2011 Jared Hanson

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
