!function(t,e){"object"==typeof exports&&"undefined"!=typeof module?module.exports=e():"function"==typeof define&&define.amd?define(e):(t="undefined"!=typeof globalThis?globalThis:t||self).emitter=e()}(this,(function(){"use strict";const t={string:function(t){return"string"==typeof t},object:function(t){return"object"==typeof t&&null!==t&&!Array.isArray(t)},array:function(t){return Array.isArray(t)},bool:function(t){return"boolean"==typeof t},number:function(t){return"number"==typeof t},func:function(t){return"function"==typeof t},nul:function(t){return null===t},undef:function(t){return void 0===t||void 0===t}};function e(t,e,n){this.name=t,this.id=e,this.func=n}return function(){const n=[],i=[],r=(t,e)=>{let i=n.length;for(;i;)if(i-=1,n[i].name===t&&n[i].id===e)return i;return-1};this.register=(i,s,o)=>{if(!i)return;let f=o;if(t.func(s))if(t.string(f)){const t=f;f=s,s=t}else f=s,s="all";const u=r(i,s),l=new e(i,s,f);-1===u?n.push(l):n[u]=l},this.on=this.register,this.subscribe=this.register,this.once=(t,n)=>{if(!t)return;const r=new e(t,"",n);i.push(r)},this.onMany=(t,e)=>{e&&Object.keys(e).forEach((n=>{this.on(n,t,e[n])}))},this.unregister=(t,e)=>{if(!t)return;let s=0;if("all"!==(e=e||"all"))s=r(t,e),-1!==s&&n.splice(s,1);else{for(s=n.length;s;)s-=1,n[s].name===t&&"all"===n[s].id&&n.splice(s,1);for(s=i.length;s;)s-=1,i[s].name===t&&i.splice(s,1)}},this.off=this.unregister,this.unsubscribe=this.unregister,this.offAll=t=>{let e=n.length;for(;e;)e-=1,n[e].id===t&&n.splice(e,1)},this.trigger=(t,e)=>{const r=(t=>{const e=[];for(let i=0,r=n.length;i<r;i+=1)n[i].name===t&&e.push(n[i]);return e})(t);for(let n=0,i=r.length;n<i;n+=1)r[n].func(e,t);let s=i.length;for(;s;)s-=1,i[s].name===t&&(i[s].func(e,t),i.splice(s,1))},this.emit=this.trigger,this.publish=this.trigger,this.propagate=(t,e)=>{this.trigger(e,t)},this.isRegistered=(t,e)=>{e=e||"all";let r=n.length;for(;r;)if(r-=1,n[r].id===e&&n[r].name===t)return!0;for(r=i.length;r;)if(r-=1,i[r].name===t)return!0;return!1}}}));
