"use strict";var e={string:function(e){return"string"==typeof e},object:function(e){return"object"==typeof e&&null!==e&&!Array.isArray(e)},array:function(e){return Array.isArray(e)},bool:function(e){return"boolean"==typeof e},number:function(e){return"number"==typeof e},func:function(e){return"function"==typeof e},nul:function(e){return null===e},undef:function(e){return void 0===e||void 0===e}};function n(n,t,i,r){this.name=n,this.namespace=t,this.func=i,this.priority=e.number(r)?r:1}var t=function(){function t(t){var i=this;this.events=[],this.oneTime=[],this.reachedMaxListeners=function(e){return i.events.filter((function(n){return n.name===e})).length>=i.config.maxListeners},this.reachedMaxOnceListeners=function(e){return i.oneTime.filter((function(n){return n.name===e})).length>=i.config.maxListeners},this.getEventIndex=function(e,n){for(var t=i.events.length;t;)if(t-=1,i.events[t].name===e&&i.events[t].namespace===n)return t;return-1},this.getEvents=function(e){for(var n=[],t=0,r=i.events.length;t<r;t+=1){if(i.events[t].name.indexOf("*")>-1||i.events[t].name.indexOf("?")>-1)if(new RegExp(i.events[t].name.replace(/\*/g,".*")).test(e)){n.push(i.events[t]);continue}i.events[t].name===e&&n.push(i.events[t])}return n},this.register=function(t,r,s,o){if(t){var a,u="all",c=1;void 0!==o&&e.number(o)&&(c=o),e.func(r)?e.string(s)?(a=r,u=s):(e.number(s)&&(c=s),a=r,u="all"):(u=r,a=s);var f=i.getEventIndex(t,u),h=new n(t,u,a,c);-1===f?i.reachedMaxListeners(t)?console.warn("Max listeners reached for event ".concat(t)):i.events.push(h):i.events[f]=h,i.events.sort((function(e,n){return e.priority===n.priority?0:e.priority<n.priority?1:-1}))}},this.on=this.register,this.subscribe=this.register,this.once=function(e,t){if(e){var r=new n(e,"",t,1);i.reachedMaxOnceListeners(e)?console.warn("Max once listeners reached for event ".concat(e)):i.oneTime.push(r)}},this.onMany=function(e,n){n&&Object.keys(n).forEach((function(t){i.on(t,e,n[t])}))},this.unregister=function(e,n){if(e){var t=0;if("all"!==(n=n||"all"))-1!==(t=i.getEventIndex(e,n))&&i.events.splice(t,1);else{for(t=i.events.length;t;)t-=1,i.events[t].name===e&&"all"===i.events[t].namespace&&i.events.splice(t,1);for(t=i.oneTime.length;t;)t-=1,i.oneTime[t].name===e&&i.oneTime.splice(t,1)}}},this.off=this.unregister,this.unsubscribe=this.unregister,this.offAll=function(e){for(var n=i.events.length;n;)n-=1,i.events[n].namespace===e&&i.events.splice(n,1)},this.triggerOneTime=function(e,n){for(var t=i.oneTime.length;t;){if(t-=1,i.oneTime[t].name.indexOf("*")>-1||i.oneTime[t].name.indexOf("?")>-1)if(new RegExp(i.oneTime[t].name.replace(/\*/g,".*").replace(/\?/g,".")).test(e)){i.oneTime[t].func(n,e),i.oneTime.splice(t,1);continue}i.oneTime[t].name===e&&(i.oneTime[t].func(n,e),i.oneTime.splice(t,1))}},this.trigger=function(e,n){for(var t=i.getEvents(e),r=0,s=t.length;r<s;r+=1)t[r].func(n,e);i.triggerOneTime(e,n)},this.emit=this.trigger,this.publish=this.trigger,this.propagate=function(e,n){i.trigger(n,e)},this.isRegistered=function(e,n){n=n||"all";for(var t=i.events.length;t;)if(t-=1,i.events[t].namespace===n&&i.events[t].name===e)return!0;for(t=i.oneTime.length;t;)if(t-=1,i.oneTime[t].name===e)return!0;return!1},this.config=t||{maxListeners:50,maxOnceListeners:50}}return t.HIGH_PRIORITY=2,t.NORMAL_PRIORITY=1,t.LOW_PRIORITY=0,t}();module.exports=t;
