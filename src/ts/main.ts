
declare function require(x: string): any;
let html = require('../pug/index.pug');
var css = require('../styl/main.styl');
import {hello} from './sub';

const message: string = 'Hello World';

// sub.jsに定義されたJavaScriptを実行する。
hello(message);
