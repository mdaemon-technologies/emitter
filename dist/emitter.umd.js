!function(n,e){"object"==typeof exports&&"undefined"!=typeof module?module.exports=e():"function"==typeof define&&define.amd?define(e):(n="undefined"!=typeof globalThis?globalThis:n||self).emitter=e()}(this,(function(){"use strict";is={string:function(n){return"string"==typeof n},object:function(n){return"object"==typeof n&&null!==n&&!Array.isArray(n)},array:function(n){return Array.isArray(n)},bool:function(n){return"boolean"==typeof n},number:function(n){return"number"==typeof n},func:function(n){return"function"==typeof n},nul:function(n){return null===n},undef:function(n){return void 0===n||void 0===n}};var n=is;function e(n,e,t){this.name=n,this.namespace=e,this.func=t}return function(){var t=[],i=[],r=function(n,e){for(var i=t.length;i--;)if(t[i].name===n&&t[i].namespace===e)return i;return-1};this.register=function(i,s,f){if(n.func(s))if(n.string(f)){var o=f;f=s,s=o}else f=s,s="all";if(i){var u=r(i,s),a=new e(i,s,f);-1===u?t.push(a):t[u]=a}},this.on=this.register,this.subscribe=this.register,this.once=function(n,t){if(n){var r=new e(n,"",t);i.push(r)}},this.onMany=function(n,e){if(e)for(var t in e)this.on(t,n,e[t])},this.unregister=function(n,e){if(e||(e="all"),n){var s=0;if("all"!==e)for(-1!==(s=r(n,e))&&t.splice(s,1),s=i.length;s--;)i[s].name===n&&i.splice(s,1);else for(s=t.length;s--;)"all"===t[s].namespace&&t.splice(s,1)}},this.off=this.unregister,this.unsubscribe=this.unregister,this.offAll=function(n){for(var e=t.length;e--;)t[e].namespace===n&&t.splice(e,1)},this.trigger=function(n,e){for(var r=function(n){for(var e=[],i=0,r=t.length;i<r;i++)t[i].name===n&&e.push(t[i]);return e}(n),s=0,f=r.length;s<f;s++)r[s].func(e,n);for(var o=i.length;o--;)i[o].name===n&&(i[o].func(e,n),i.splice(o,1))},this.emit=this.trigger,this.publish=this.trigger,this.propagate=function(n,e){this.trigger(e,n)},this.isRegistered=function(n,e){for(var i=t.length;i--;)if(t[i].namespace===e&&t[i].name===n)return!0;return!1}}}));
