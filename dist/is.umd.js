!function(n,e){"object"==typeof exports&&"undefined"!=typeof module?module.exports=e():"function"==typeof define&&define.amd?define(e):(n="undefined"!=typeof globalThis?globalThis:n||self).is=e()}(this,(function(){"use strict";return is={string:function(n){return"string"==typeof n},object:function(n){return"object"==typeof n&&null!==n&&!Array.isArray(n)},array:function(n){return Array.isArray(n)},bool:function(n){return"boolean"==typeof n},number:function(n){return"number"==typeof n},func:function(n){return"function"==typeof n},nul:function(n){return null===n},undef:function(n){return void 0===n||void 0===n}},is}));
