function t(){return new Promise(t=>window.requestIdleCallback(t))}function e(){let t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:void 0;return void 0!==t?new Promise(e=>{window.setTimeout(()=>window.requestAnimationFrame(e),t)}):new Promise(t=>window.requestAnimationFrame(t))}function n(){return Promise.resolve()}function o(){let t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:0;return new Promise(e=>window.setTimeout(e,t))}const r=new Map;function s(t){let e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:0,n=r.get(t);if(!n){n={c:t};const e=new Promise(t=>n.r=t);n.p=e.then(()=>(r.delete(t),n.c())),r.set(t,n)}return window.clearTimeout(n.t),n.t=window.setTimeout(n.r,Math.max(0,e)),n.p}function i(){for(var t=arguments.length,e=new Array(t),n=0;n<t;n++)e[n]=arguments[n];if(!e.length)return[];const o={},r=e.shift();return r.forEach((t,e)=>o[t[0]]=e),e.forEach(t=>{t.forEach(t=>{const e=o[t[0]];if(void 0===e)return o[t[0]]=r.length,void r.push(t);const n=r[e],s=t.slice(1);r[e]=function(t){const e=new Set;return t.filter((t,n)=>{if(0!==n){if(e.has(t))return!1;e.add(t)}return!0})}(n.concat(s))})}),r}const c={abcd:[128289],abc:[128292],ab:[127374],a:[127344,65039],atm:[127975],cool:[127378],free:[127379],id:[127380],i:[8505,65039],m:[9410,65039],ok:[127383],o:[127358,65039],p:[127359,65039],sos:[127384],up:[127385],vs:[127386],"!!":[8252,65039],"!?":[8265,65039],"!":[10071],"?":[10067],$:[128178],"£":[128183],"€":[128182],"¥":[128180],new:[127381],ng:[127382],zzz:[128164],1234:[128290],cl:[127377],b:[127345,65039],wc:[128702],100:[128175],10:[128287],"*":[42,65039,8419],"#":[35,65039,8419],"<":[9664,65039],">":[9654,65039],"^":[128316],"+":[10133],"-":[10134],x:[10062],"~":[12336,65039],".":[9210,65039]},l=Object.keys(c);l.sort((t,e)=>t.length!==e.length?e.length-t.length:t<e?-1:t>e?1:0);const u=(t,e)=>{let n=null;if(t[0]>="a"&&t[0]<="z"){n={length:1,points:[t.codePointAt(0)-97+127462,65039]}}else if(t[0]>="0"&&t[0]<="9"){n={length:1,points:[t.codePointAt(0)-48+48,65039,8419]}}if(e&&n)return n;for(const e of l)if(t.startsWith(e))return{length:e.length,points:c[e]};return n};function a(t){let e=arguments.length>1&&void 0!==arguments[1]&&arguments[1],n=t.toLowerCase();const o=[];for(;n.length;){const t=u(n,e);if(null===t)return null;o.push(...t.points),n=n.substr(t.length)}return String.fromCodePoint(...o)}const f="https://emojibuff.com/api";function h(t){let e,n=arguments.length>1&&void 0!==arguments[1]?arguments[1]:24,o=arguments.length>2&&void 0!==arguments[2]?arguments[2]:()=>{};const r=window.localStorage[t];if(r){let o;try{o=JSON.parse(r)}catch(e){console.debug("couldn't parse localStorage",t,e),o=null}if(o&&o.results&&(e=Promise.resolve(o.results),o.created>=+new Date-36e5*n))return()=>e}const s=new Promise((e,n)=>{const o=new XMLHttpRequest;o.open("GET",`${f}/${t}`),o.onerror=n,o.responseType="json",o.onload=(()=>e(o.response)),o.send()}).then(t=>"string"==typeof t?JSON.parse(t):t).then(n=>(e=s,n.created=+new Date,window.localStorage[t]=JSON.stringify(n),n.results));return e?()=>e:(o(!0),s.then(()=>o(!1)),()=>s)}const d=function(){const t=h("popular",24,t=>{window.loader.hidden=!t});return()=>t().then(t=>(function(t){let e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:3,n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:10;const o={},r={};return t.forEach(t=>{const s=t[0];r[s]=t.slice(1);const i=s.substr(0,e);for(let t=1;t<=i.length;++t){const e=i.substr(0,t);let r=o[e];r||(r=o[e]=[]),r.length<n&&r.push(s)}}),function(t,n){const s=(t=t.toLowerCase()).substr(e);let i=o[t.substr(0,e)]||[];return s&&(i=i.filter(t=>t.substr(e).startsWith(s))),n||(i=i.filter(e=>e===t)),(i=i.map(t=>[t,...r[t]])).length?i:[]}})(t))}(),w=function(){const t=h("hot",1);return()=>t().then(t=>{let e=[];return t.forEach(t=>{e=e.concat(t.slice(1))}),e})}();function g(t,e){let n=arguments.length>2&&void 0!==arguments[2]&&arguments[2];if(!t){if(n&&""===t){const t=v();return t.unshift("^recent"),w().then(e=>(e.unshift("^trending"),[t,e]))}return Promise.resolve([])}const o=[d().then(n=>n(t,e))];if(n){let n=`${f}/q?q=${window.encodeURIComponent(t)}`;e||(n+="&exact");const r=window.fetch(n).then(t=>t.json()).then(t=>t.results);o.push(r)}const r=a(t),s=a(t,!0);if(r||s){const t=["^type"];r&&t.push(r),s&&s!==r&&t.push(s),o.push([t])}return Promise.all(o).then(t=>i(...t))}const p=function(){let t={};const e=()=>{const e=JSON.stringify(t);return t={},navigator.sendBeacon(f+"/sel",e)};return function(n,o){if("^"===n[0])return;const r=v(),i=r.indexOf(o);return-1!==i&&r.splice(i,1),r.unshift(o),r.splice(16),window.localStorage.recent=r.join(","),t[n]=o,s(e,5e3)}}();function m(t,e){const n=new FormData;return n.append("name",t),n.append("emoji",e),window.fetch(f+"/name",{method:"POST",mode:"cors",body:n})}function v(){return(window.localStorage.recent||"").split(",").filter(t=>t)}export{t as a,e as b,p as c,g as d,n as e,m as f,o as g,s as h};

//# sourceMappingURL=9990871a.js.map