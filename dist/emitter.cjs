"use strict";const t={string:function(t){return"string"==typeof t},object:function(t){return"object"==typeof t&&null!==t&&!Array.isArray(t)},array:function(t){return Array.isArray(t)},bool:function(t){return"boolean"==typeof t},number:function(t){return"number"==typeof t},func:function(t){return"function"==typeof t},nul:function(t){return null===t},undef:function(t){return void 0===t||void 0===t}};function e(t,e,n){this.name=t,this.id=e,this.func=n}module.exports=function(){const n=[],r=[],i=(t,e)=>{let r=n.length;for(;r;)if(r-=1,n[r].name===t&&n[r].id===e)return r;return-1};this.register=(r,s,o)=>{const u=r;let f=o,l=s;if(t.func(l))if(t.string(f)){const t=f;f=l,l=t}else f=s,l="all";if(!u)return;const h=i(u,l),c=new e(u,l,f);-1===h?n.push(c):n[h]=c},this.on=this.register,this.subscribe=this.register,this.once=(t,n)=>{if(!t)return;const i=new e(t,"",n);r.push(i)},this.onMany=(t,e)=>{e&&Object.keys(e).forEach((n=>{this.on(n,t,e[n])}))},this.unregister=(t,e)=>{if(!t)return;let s=0;if("all"!==(e||"all"))for(s=i(t,e),-1!==s&&n.splice(s,1),s=r.length;s;)s-=1,r[s].name===t&&r.splice(s,1);else for(s=n.length;s;)s-=1,"all"===n[s].id&&n.splice(s,1)},this.off=this.unregister,this.unsubscribe=this.unregister,this.offAll=t=>{let e=n.length;for(;e;)e-=1,n[e].id===t&&n.splice(e,1)},this.trigger=(t,e)=>{const i=(t=>{const e=[];for(let r=0,i=n.length;r<i;r+=1)n[r].name===t&&e.push(n[r]);return e})(t);for(let n=0,r=i.length;n<r;n+=1)i[n].func(e,t);let s=r.length;for(;s;)s-=1,r[s].name===t&&(r[s].func(e,t),r.splice(s,1))},this.emit=this.trigger,this.publish=this.trigger,this.propagate=(t,e)=>{this.trigger(e,t)},this.isRegistered=(t,e)=>{let r=n.length;for(;r;)if(r-=1,n[r].id===e&&n[r].name===t)return!0;return!1}};
