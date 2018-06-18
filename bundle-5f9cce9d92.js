window.requestIdleCallback||(window.requestIdleCallback=(e=>{const t=performance.now(),n=e.bind(null,{didTimeout:!1,timeRemaining:()=>Math.max(0,50-(performance.now()-t))});return window.setTimeout(n,1)}),window.cancelIdleCallback=(e=>window.clearTimeout(e))),navigator.sendBeacon||(navigator.sendBeacon=function(e,t){return new Promise((n,o)=>{const r=new XMLHttpRequest;r.open("POST",e,!0),r.onerror=o,r.onload=n,r.send(t)})});const arrowKeys=["Left","Right","Up","Down"];function arrowFromEvent(e){return e.key?e.key.startsWith("Arrow")?e.key:-1===arrowKeys.indexOf(e.key)?null:"Arrow"+e.key:null}function isKeyboardClick(e){return!(e instanceof MouseEvent)||(0===e.screenX&&0===e.detail||0===e.webkitForce)}let dummy;function copyText(e){dummy||((dummy=document.createElement("input")).style.position="fixed",dummy.style.opacity=0,document.body.appendChild(dummy)),dummy.value=e;try{dummy.hidden=!1,dummy.focus(),dummy.selectionStart=0,dummy.selectionEnd=dummy.value.length,document.execCommand("copy")}catch(e){return!1}finally{dummy.hidden=!0}return!0}const all=Array.from(buttons.querySelectorAll("button")),handler=e=>{const t=e.detail.trim(),n=Boolean(t);all.forEach(e=>e.disabled=!n)};typer.addEventListener("value",handler),handler({detail:typer.value}),function(e,t){let n;const o=e.textContent;let r=!1;function i(){r&&(document.activeElement===e&&t.focus(),r=!1)}t.addEventListener("keydown",t=>{r||"Enter"!==t.key||t.repeat||(e.click(),e.focus(),r=!0,t.preventDefault())}),document.body.addEventListener("keyup",e=>{"Enter"===e.key&&i()}),e.addEventListener("click",s=>{s.preventDefault(),r||s.repeat||((()=>{const r=t.dataset.copy.trim().replace(/\s+/," ");if(!copyText(r))return console.warn("could not copy",r),!0;console.info("copied",r),ga("send","event","text","copy"),e.textContent=e.dataset.copied,window.clearTimeout(n),n=window.setTimeout(t=>{e.textContent=o,i()},500)})(),isKeyboardClick(s)&&e.focus())})}(copy,typer);const canvas=document.createElement("canvas"),context=canvas.getContext("2d");context.font='1px "Segoe UI Emoji", "Segoe UI Symbol", monospace';const measureText=function(){let e={},t=0;return n=>{let o=e[n];return void 0===o&&(e[n]=o=context.measureText(n).width,++t>4e3&&(e={},t=0)),o}}(),fixedWidthEmoji=Boolean(/Mac|Android|iP(hone|od|ad)/.exec(navigator.platform)),isSingle=function(){const e=-1!==window.location.search.indexOf("debug"),t=measureText("\u{1f602}");if(fixedWidthEmoji)return e?(console.info("fixed emoji width is",t,"for \u{1f602}"),e=>{const n=measureText(e)===t;return n||console.debug("isSingle can't render",e,"width",measureText(e)),n}):e=>measureText(e)===t;const n=context.measureText("\u{ffffd}").width,o=context.measureText("a").width;return e&&console.info("invalid char has width",n,"ascii char has width",o),r=>{const i=measureText(r);return e&&console.debug("isSingle",r,"has width",i),i!==n&&i<2*n&&i>o||i===t}}(),isExpectedLength=function(){if(fixedWidthEmoji){const e=measureText("\u{1f602}");return t=>{const n=splitEmoji(jsdecode(t)),o=n.reduce((e,t)=>e+=isFlagPoint(t[0].point)?1:0,0),r=n.length-Math.ceil(o/2),i=measureText(t)/e;return Math.floor(i)===i&&i<=r}}return e=>{const t=splitEmoji(jsdecode(e)),n=t.length;for(let o=0;o<n;++o){const e=t[o];if(isFlagPoint(e[0].point))continue;const n=[];e.forEach(({point:e,suffix:t})=>{n.push(e),t&&n.push(t)});const r=String.fromCodePoint(...n);if(!isSingle(r))return!1}return!0}}(),basicDiversity=measureText("\u{1f468}\u{1f3fb}")===measureText("\u{1f468}");function isPointGender(e){return 9792===e||9794===e}function isPersonGender(e){return 128104===e||128105===e}function isFamilyMember(e){return 128118===e||128102===e||128103===e}function isVariationSelector(e){return e>=65024&&e<=65039||e>=917760&&e<=917999}function isDiversitySelector(e){return e>=127995&&e<=127999}function isFlagPoint(e){return e>=127462&&e<=127487}function unlikelyModifierBase(e){return e<9757||isPointGender(e)||isVariationSelector(e)||isDiversitySelector(e)||isFlagPoint(e)}function jsdecode(e){const t=e.length,n=[];for(let o=0;o<t;){const r=e.charCodeAt(o++)||0;if(r<55296||r>56319||o===t);else{const t=e.charCodeAt(o)||0;if(56320==(64512&t)){++o,n.push(65536+(1023&t)+((1023&r)<<10));continue}}n.push(r)}return n}const genderFlip=function(){const e=[129334,127877,0,128131,128378,0,128112,129333,0,128103,128102,129490,128117,128116,129491,128109,128108,0,128120,129332,0],t=new Map;for(let n=0;n<e.length;n+=3){const o={points:{f:e[n],m:e[n+1],n:e[n+2]}};for(let r=0;r<3;++r){const i=e[n+r];if(i){if(t.has(i))throw new Error("duplicate in gender list: "+i);t.set(i,o)}}}return e=>{const n=t.get(e)||null;return n&&void 0===n.single&&(n.single=isSingle(String.fromCodePoint(n.points.f))&&isSingle(String.fromCodePoint(n.points.m)),n.neutral=n.points.n&&isSingle(String.fromCodePoint(n.points.n))),n}}();function splitEmoji(e){if(!e.length)return[];let t=[{point:e[0],suffix:0}];const n=[t];for(let o=1;o<e.length;++o){const r=e[o];if(isFlagPoint(t[t.length-1].point));else{if(isDiversitySelector(r)||isVariationSelector(r)){t[t.length-1].suffix=r;continue}if(8205===r){const n=e[++o];n&&t.push({point:n,suffix:0});continue}}t=[{point:r,suffix:0}],n.push(t)}return n}function modify(e,t){const n={tone:!1,gender:{single:!1,double:!1,neutral:!1}};if(!e)return n;const o=splitEmoji(jsdecode(e)),r=t?[]:null;if(o.some((e,t)=>{const o=e[0].point;let i=0,s=!1;e.forEach(e=>{const t=e.point;if(isPointGender(t))n.gender.single=!0,n.gender.neutral=!0;else if(isPersonGender(t))n.gender.single=!0,++i>=2&&(n.gender.double=!0);else if(isFamilyMember(t)&&i)s=!0;else{const e=genderFlip(t);e&&(n.gender.single|=e.single,n.gender.neutral|=e.neutral)}});const a=i?isPersonGender(o)&&1===i&&!s:void 0;if(a&&(n.tone=basicDiversity),r&&(r[t]=a),(n.tone||!basicDiversity)&&n.gender.neutral)return!r&&n.gender.single&&n.gender.double;if(!1===a||unlikelyModifierBase(o))return;const c=String.fromCodePoint(o);basicDiversity&&!n.tone&&isSingle(c+"\u{1f3fb}")&&(n.tone=!0),!n.gender.neutral&&isSingle(c+"\u200d\u2640\ufe0f")&&(n.gender.neutral=!0,n.gender.single=!0)}),!t)return n;const i=function(){const e=t.gender||"";let n,o;return(t,r,i)=>{void 0===n||t!==n?(n=t,o=0):++o;const s=e?e[o%e.length]:"",a=r||0;if(isPersonGender(a))return s?"m"===s?128104:128105:a;if(!a||isPointGender(a))return s?"m"===s?9794:9792:0;if(i){const e=genderFlip(a);if(e){if(!s&&e.neutral)return e.points.n;if(s&&e.single)return"m"===s?e.points.m:e.points.f}}return--o,a}}(),s=o.map((e,n)=>{const o=[],s=r[n],a=e[0].point;if(void 0!==t.gender){const t=void 0===s;if(e.forEach(e=>e.point=i(o,e.point,t)),void 0===s&&1===e.length&&!isPointGender(a)){const t=i(o);t&&isSingle(String.fromCodePoint(a)+"\u200d\u2640\ufe0f")&&e.push({suffix:65039,point:t})}}return void 0!==t.tone&&e.forEach((e,n)=>{isDiversitySelector(e.suffix)?e.suffix=t.tone:0===n&&basicDiversity&&!1!==s&&(s||isSingle(String.fromCodePoint(a)+"\u{1f3fb}"))&&(e.suffix=t.tone)}),e.forEach(e=>{e.point&&(o.length&&o.push(8205),o.push(e.point),e.suffix&&o.push(e.suffix))}),o}).reduce((e,t)=>e.concat(t),[]);return n.out=String.fromCodePoint(...s),n}function letterAt(e,t){const n=e.charCodeAt(t);return 65039!==e.charCodeAt(t+1)&&(n<5e3&&n>32)}function match(e,t){let n=t,o=t;if(""===e.substr(t).trim()||!letterAt(e,t)){for(;o>0&&!(e.charCodeAt(o-1)>32);--o);o<n&&(n=o)}for(;n>0&&letterAt(e,n-1);--n);for(;o<e.length&&letterAt(e,o);++o);return n>o&&(n=o),{from:n,to:o}}function datasetSafeDelete(e,...t){const n=e.dataset;t.forEach(e=>{e in n&&delete n[e]})}const upgraded=new WeakMap;function cursorPosition(e){const t=upgraded.get(e);if(void 0!==t)return t()}function upgrade(e){if(upgraded.has(e))return!1;const t={from:e.selectionStart,to:e.selectionEnd},n=document.createElement("div");n.className="overflow-helper",e.parentNode.insertBefore(n,e);const o=document.createElement("div");o.className="underline",n.appendChild(o);let r=null;const i=document.createElement("div");i.className="autocomplete sizer",n.appendChild(i);const s=function(){const e=document.createElement("div");e.className="sizer",n.appendChild(e);const t=document.createElement("div");return t.className="nonce",n=>(e.textContent=n,e.appendChild(t),t.offsetLeft)}();upgraded.set(e,()=>{const t=~~((e.selectionStart+e.selectionEnd)/2);return s(e.value.substr(0,t))-e.scrollLeft}),"complete"!==document.readyState&&(o.classList.add("loading"),window.addEventListener("load",e=>{a(),o.classList.remove("loading")}));const a=()=>{if(t.from>=t.to)return o.hidden=!0,!1;const{from:n,to:r}=t,a=s(e.value.substr(0,n)),c=s(e.value.substr(n,r-n));c<0&&!document.getElementById("less")&&console.warn("invalid sizer width",c,"for text",sizer.textContent),o.hidden=c<=0,o.style.left=a+"px",o.style.width=c+"px",o.style.transform=`translateX(${-e.scrollLeft}px)`,i.style.transform=`translateX(${-e.scrollLeft+a+c}px)`},c=(n,r)=>(t.from=n,t.to=Math.max(n,r),n>=r?(datasetSafeDelete(e,"prefix","word","focus"),o.hidden=!0,!1):(e.dataset.focus=e.value.substr(n,r-n),a(),!0)),l=e.value.length,d={start:l,end:l,value:void 0};let u={};const f=(n,s)=>{n.has("select-all")?e.setSelectionRange(0,e.value.length):n.has("select-end")?e.setSelectionRange(e.value.length,e.value.length):n.has("focus")&&e.setSelectionRange(d.start,d.end);const a=(t=>{if(!1!==t&&e.selectionStart===d.start&&e.selectionEnd===d.end&&e.value===d.value)return!0;if([d.start,d.end]=[e.selectionStart,e.selectionEnd],d.value!==e.value&&(e.dispatchEvent(new CustomEvent("value",{detail:e.value})),d.value=e.value),d.start!==d.end)return datasetSafeDelete(e,"prefix","word"),c(d.start,d.end),o.classList.add("range"),e.classList.add("range"),!1;o.classList.remove("range"),e.classList.remove("range");const{from:n,to:r}=match(e.value,d.start);return!(n>=r&&t||(c(n,r)&&(e.dataset.focus=e.dataset.prefix=e.value.substr(n,r-n).toLowerCase(),datasetSafeDelete(e,"word")),1))})(s);if((()=>{const n=e.dataset.prefix||"";if(null===r||0===n.length||r.name.substr(0,n.length)!==n||0!==e.value.substr(t.to).trim().length)return i.textContent="",!1;const o=r.name.substr(n.length)+r.emoji;return i.textContent=o,!0})()||(r=null),e.selectionStart!==e.selectionEnd?e.dataset.copy=e.value.substr(e.selectionStart,e.selectionEnd-e.selectionStart):e.dataset.copy=null!==r?e.value.substr(0,t.from)+e.value.substr(t.to)+r.emoji:e.value,a)return;const l={text:e.dataset.focus?e.dataset.prefix||e.dataset.word||null:"",prefix:"prefix"in e.dataset,focus:e.dataset.focus,selection:e.selectionStart!==e.selectionEnd};l.text===u.text&&l.prefix===u.prefix&&l.focus===u.focus&&l.selection===u.selection||(u=l,e.dispatchEvent(new CustomEvent("query",{detail:l})))};let p,m=!1;function h(n=!1){if(e.selectionEnd<t.to)return!1;const o=e.dataset.prefix||"";if(0===o.length||!r||!r.name.startsWith(o))return!1;const i=e.value.substr(t.to),s=i.substr(0,e.selectionStart-t.to);if(0!==s.trim().length)return!1;if(n&&!s.length)return!1;if(0!==i.trim().length&&r.name!==o)return!1;ga("send","event","options","typing");const a={choice:r.emoji,word:r.name};return typer.dispatchEvent(new CustomEvent("emoji",{detail:a})),!0}!function(){let t,n=new Set;const o=e=>{t||(p=void 0,n.clear(),t=window.requestAnimationFrame(()=>{t=null,f(n,p)})),e&&n.add(e.type)};"change keydown keypress focus click mousedown select input select-all select-end".split(/\s+/).forEach(t=>e.addEventListener(t,o)),o(),e.addEventListener("suggest",e=>{r=e.detail,m&&h(),o()}),e.addEventListener("mousemove",e=>{e.which&&o()}),document.addEventListener("selectionchange",t=>{document.activeElement===e&&o()})}(),e.addEventListener("keydown",e=>{switch(m=!1,e.key){case"Escape":p=!1;break;case"ArrowDown":case"Down":case"ArrowUp":case"Up":return void e.preventDefault();case" ":const t=h();e.shiftKey&&e.preventDefault(),t||(m=!0)}}),e.addEventListener("keyup",e=>{229!==e.keyCode&&e.keyCode||h(!0)}),function(){let t;const n=()=>{t||(t=window.requestAnimationFrame(()=>{t=null,a()}))};window.addEventListener("resize",n),e.addEventListener("wheel",n,{passive:!0})}();const g=n=>{const o=e.scrollLeft,{from:r,to:i}=t,s=e.value.substr(r,i-r);let[a,l]=[typer.selectionStart,typer.selectionEnd];const u=typer.selectionDirection,f=n(s);if(null==f)return!1;const m=document.activeElement;typer.focus(),typer.selectionStart=r,typer.selectionEnd=i;const h=typer.value.substr(0,r)+f+typer.value.substr(i);document.execCommand("insertText",!1,f)&&typer.value===h||(typer.value=typer.value.substr(0,r)+f+typer.value.substr(i)),typer.dispatchEvent(new CustomEvent("change"));const g=e=>(e>=i?e=e-(i-r)+f.length:e>r&&(e=r+f.length),e);return[d.start,d.end]=[g(a),g(l)],typer.setSelectionRange(d.start,d.end,u),m&&m.focus(),p=!0,e.scrollLeft=o,c(r,r+f.length),!0};e.addEventListener("modifier",e=>{const t={[e.detail.type]:e.detail.code};g(e=>modify(e,t).out)}),e.addEventListener("emoji",t=>{const n=t.detail.choice;g(()=>n)&&(e.dataset.word=t.detail.word||"",datasetSafeDelete(e,"prefix"))})}function build(e,t=3,n=10){const o={},r={};return e.forEach(e=>{const i=e[0];r[i]=e.slice(1);const s=i.substr(0,t);for(let t=1;t<=s.length;++t){const e=s.substr(0,t);let r=o[e];r||(r=o[e]=[]),r.length<n&&r.push(i)}}),function(e,n){const i=(e=e.toLowerCase()).substr(t);let s=o[e.substr(0,t)]||[];return i&&(s=s.filter(e=>e.substr(t).startsWith(i))),n||(s=s.filter(t=>t===e)),(s=s.map(e=>[e,...r[e]])).length?s:[]}}function idle(){return new Promise(e=>window.requestIdleCallback(e))}function rAF(e){return void 0!==e?new Promise(t=>{window.setTimeout(()=>window.requestAnimationFrame(t),e)}):new Promise(e=>window.requestAnimationFrame(e))}function microtask(){return Promise.resolve()}function delay(e=0){return new Promise(t=>window.setTimeout(t,e))}upgrade(typer);const debouceMap=new Map;function debounce(e,t=0){let n=debouceMap.get(e);if(!n){n={c:e};const t=new Promise(e=>n.r=e);n.p=t.then(()=>(debouceMap.delete(e),n.c())),debouceMap.set(e,n)}return window.clearTimeout(n.t),n.t=window.setTimeout(n.r,Math.max(0,t)),n.p}function removeDuplicates(e){const t=new Set;return e.filter((e,n)=>{if(0!==n){if(t.has(e))return!1;t.add(e)}return!0})}function merge(e,t){const n={};e.forEach((e,t)=>n[e[0]]=t),t.forEach(t=>{const o=n[t[0]];if(void 0===o)return n[t[0]]=e.length,void e.push(t);const r=e[o],i=t.slice(1);e[o]=removeDuplicates(r.concat(i))})}const api="https://emojibuff.appspot.com/api",recentLimit=8,selectionDelay=5e3;function loaderFor(e,t=24,n=(()=>{})){let o;const r=window.localStorage[e];if(r){let n;try{n=JSON.parse(r)}catch(t){console.debug("couldn't parse localStorage",e,t),n=null}if(n&&n.results&&(o=Promise.resolve(n.results),n.created>=+new Date-36e5*t))return()=>o}const i=new Promise((t,n)=>{const o=new XMLHttpRequest;o.open("GET",`${api}/${e}`),o.onerror=n,o.responseType="json",o.onload=(()=>t(o.response)),o.send()}).then(e=>"string"==typeof e?JSON.parse(e):e).then(t=>(o=i,t.created=+new Date,window.localStorage[e]=JSON.stringify(t),t.results));return o?()=>o:(n(!0),i.then(()=>n(!1)),()=>i)}const getPrefixGen=function(){const e=loaderFor("popular",24,e=>{window.loader.hidden=!e});return()=>e().then(e=>build(e))}(),getTrendingEmoji=function(){const e=loaderFor("hot",1);return()=>e().then(e=>{let t=[];return e.forEach(e=>{t=t.concat(e.slice(1))}),t})}();function request(e,t,n=!1){if(!e){if(n&&""===e){const e=recent();return e.unshift("^recent"),getTrendingEmoji().then(t=>(t.unshift("^trending"),[e,t]))}return Promise.resolve([])}const o=getPrefixGen().then(n=>n(e,t));if(!n)return o;let r=`${api}/q?q=${window.encodeURIComponent(e)}`;t||(r+="&exact");const i=window.fetch(r).then(e=>e.json()).then(e=>e.results);return Promise.all([o,i]).then(e=>{const[t,n]=e;return merge(t,n),t})}const select=function(){let e={};const t=()=>{const t=JSON.stringify(e);return e={},navigator.sendBeacon(api+"/sel",t)};return function(n,o){if("^"===n[0])return;const r=recent(),i=r.indexOf(o);return-1!==i&&r.splice(i,1),r.unshift(o),r.splice(8),window.localStorage.recent=r.join(","),e[n]=o,debounce(t,5e3)}}();function submit(e,t){const n=new FormData;return n.append("name",e),n.append("emoji",t),window.fetch(api+"/name",{method:"POST",mode:"cors",body:n})}function recent(){return(window.localStorage.recent||"").split(",").filter(e=>e)}const allowedWorkTime=4,maximumTaskFrame=100;class Worker{constructor(e){this.fn_=e,this.queue_=[],this.waiting_=null,this.runner_().catch(e=>{throw console.info("worker runner failed",e),e})}async runner_(){for(await new Promise(e=>this.waiting_=e),this.waiting_=null,await idle();;){if(this.chunk_())return this.runner_();await rAF()}}chunk_(){const e=window.performance.now();let t=0;for(;this.queue_.length;){const n=this.queue_.shift();if(n.resolve(this.fn_(n.arg)),++t==maximumTaskFrame||window.performance.now()-e>allowedWorkTime)break}return!this.queue_.length}task(e){return new Promise(t=>{this.queue_.push({resolve:t,arg:e}),this.waiting_&&this.waiting_()})}}const prefix="-ok_",ls=window.localStorage,known=new Map;function runner(e){const t=prefix+e;if(ls[t])return!0;const n=isExpectedLength(e);return known.set(e,n),n&&(ls[t]="t"),n}const worker=new Worker(runner);async function valid(e){const t=known.get(e);return void 0!==t?t:worker.task(e)}async function findValidMatch(e,t){let n=!1;for(let o=0;o<e.length;++o){const r=e[o];for(let e=1;e<r.length;++e){const o=r[e];let i=known.get(o)||ls[prefix+o];if(void 0===i&&(n||(console.info("not sure about",o,"calling callback"),t(null),n=!0),i=await worker.task(o)),i)return t({name:r[0],emoji:o})}}n||t(null)}class ButtonManager{constructor(e){this.holder_=e,this.options_=new Map,this.buttons_=new Map,this.buttonTarget_=new WeakMap,this.buttonPool_=[],window.requestIdleCallback(()=>{for(let e=0;e<10;++e)this.buttonPool_.push(document.createElement("button"))});const t=document.createElement("div");this.holder_.appendChild(t),this.setModifier=(()=>{const e=ButtonManager.optionType_("modifier","gender"),n=ButtonManager.optionType_("modifier","tone");t.appendChild(e),t.appendChild(n);const o=(e,t=null)=>{const n=document.createElement("button");return n.textContent=e,n.dataset.value=t,n},r=[o("\u26ac",""),o("\u2640","f"),o("\u2640\u2642","fm"),o("\u2642","m"),o("\u2642\u2640","mf")],i=[o("\u2014","")];for(let t=127995;t<=127999;++t)i.push(o(String.fromCodePoint(t),t));const s=(e,t,n)=>{e?n.appendChild(t):t.remove()};return function(o){const a=t.contains(document.activeElement)?document.activeElement:null;r.forEach(t=>{const n=t.dataset.value.length,r=!n&&o.gender.neutral||1===n&&o.gender.single||2===n&&o.gender.double;s(r,t,e)}),i.forEach(e=>s(o.tone,e,n)),t.insertBefore(e,e.nextSibling),t.insertBefore(n,n.nextSibling),a&&a.focus()}})()}static optionType_(e,t){const n=document.createElement("div");return n.className="options "+e,n.dataset[e]=t,n.dataset.name=t,n}optionForName_(e){const t=this.options_.get(e);if(t)return t;const n=document.createElement("div");return n.className="options",n.setAttribute("data-option",e),"^"===e[0]&&(n.classList.add("special"),e=e.substr(1)),n.setAttribute("data-name",e),n}addEmojiTo_(e,t){let n=this.buttons_.get(t);if(n){const t=this.buttonTarget_.get(n);if(null===t)return n;if(void 0===t)return e.appendChild(n),n}else(n=0!==this.buttonPool_.length?this.buttonPool_.pop():document.createElement("button")).textContent=t,this.buttons_.set(t,n),valid(t).then(e=>{if(!e)return this.buttonTarget_.set(n,null);const t=this.buttonTarget_.get(n);t.parentNode.replaceChild(n,t),this.buttonTarget_.delete(n)});const o=document.createTextNode("");return this.buttonTarget_.set(n,o),e.appendChild(o),n}update(e){const t=new Map,n=new Map,o=this.holder_.contains(document.activeElement)?document.activeElement:null;e.forEach(e=>{const o=e[0],r=this.optionForName_(o);t.set(o,r),this.options_.delete(o),this.holder_.appendChild(r);for(let t=0;t<r.children.length;++t){const e=r.children[t],o=e.textContent;n.has(o)?(e.remove(),this.buttonPool_.push(e),--t):n.set(o,e)}for(let t,i=1;t=e[i];++i)n.has(t)||n.set(t,this.addEmojiTo_(r,t))}),this.options_.forEach(e=>{for(let t=0;t<e.children.length;++t)this.buttonPool_.push(e.children[t]);e.remove()}),this.options_=t,this.buttons_=n,o&&(document.body.contains(o)?o.focus():typer.focus())}}let spaceFrame=0;chooser.addEventListener("keyup",e=>{" "===e.key&&"button"===e.target.localName&&(spaceFrame=window.setTimeout(()=>spaceFrame=0,0))});let previousChooserLeft=void 0,duringNavigate=!1;function navigateChooserButtonVertical(e){const t={dist:1/0,button:null},n=document.activeElement.getBoundingClientRect(),o=void 0!==previousChooserLeft?previousChooserLeft:n.left;let r=void 0;for(let i=0;i<e.length;++i){const s=e[i],a=s.getBoundingClientRect();if(n.top===a.top)continue;if(void 0===r)r=a.top;else if(a.top!==r)break;const c=Math.abs(a.left-o);c<t.dist&&([t.dist,t.button]=[c,s])}if(!t.button)return!1;duringNavigate=!0;try{t.button.focus()}finally{duringNavigate=!1}return!0}chooser.addEventListener("focus",e=>{duringNavigate||(previousChooserLeft=document.activeElement.getBoundingClientRect().left)},!0),chooser.addEventListener("click",e=>{previousChooserLeft=void 0;const t=isKeyboardClick(e);let n=void 0;const o=e.target;if("button"!==o.localName);else if(o.parentNode.dataset.modifier){if(e.shiftKey)return;const t="value"in o.dataset?+o.dataset.value||o.dataset.value:null,r={type:o.parentNode.dataset.modifier,code:t};typer.dispatchEvent(new CustomEvent("modifier",{detail:r})),n="modifier"}else if(o.parentNode.dataset.option){if(e.shiftKey){copyText(o.textContent)&&ga("send","event","options","copy");const e=document.scrollingElement.scrollTop;return t?o.focus():typer.focus(),void(document.scrollingElement.scrollTop=e)}const r=0!==spaceFrame||e.metaKey||e.ctrlKey?o.parentNode.dataset.option:null,i={choice:o.textContent,word:r};typer.dispatchEvent(new CustomEvent("emoji",{detail:i})),select(o.parentNode.dataset.option,i.choice),n="emoji"}n&&(ga("send","event","options","click",n),t||typer.focus())}),typer.addEventListener("keydown",e=>{if("ArrowDown"===e.key||"Down"===e.key){const e=typer.getBoundingClientRect();previousChooserLeft=e.left+cursorPosition(typer),navigateChooserButtonVertical(chooser.querySelectorAll("button"))&&ga("send","event","options","keyboardnav")}else if("ArrowRight"===e.key||"Right"===e.key){const e=typer.value.length;if(typer.selectionEnd===e&&typer.selectionStart===e){const e=chooser.querySelector("button");e&&e.focus()}}}),chooser.addEventListener("keydown",e=>{const t=arrowFromEvent(e);if(!t)return;if(!chooser.contains(document.activeElement))return;const n=Array.from(chooser.querySelectorAll("button")),o=n.indexOf(document.activeElement);if(-1===o)return;let r,i;if("ArrowLeft"===t?r=-1:"ArrowRight"===t&&(r=1),r){const e=o+r;e>=0&&e<n.length?n[e].focus():e<0&&(typer.focus(),typer.dispatchEvent(new CustomEvent("select-end")))}else{if("ArrowUp"===t)(i=n.slice(0,o)).reverse();else{if("ArrowDown"!==t)return;i=n.slice(o)}if(navigateChooserButtonVertical(i)||"ArrowUp"===t&&typer.focus(),"ArrowDown"===t){const t=document.activeElement.getBoundingClientRect(),n=t.top+t.height;window.innerHeight-n>64&&e.preventDefault()}}}),function(){const e=new ButtonManager(chooser);let t={},n=performance.now(),o=[],r=0;function i(e){const t=++r;if(!e)return void typer.dispatchEvent(new CustomEvent("suggest",{detail:null}));let n=null;const i=o.slice().filter(t=>e.length>1&&t[0]===e?(n=t,!1):t[0].startsWith(e));n&&i.unshift(n);findValidMatch(i,e=>{t===r&&typer.dispatchEvent(new CustomEvent("suggest",{detail:e}))})}typer.addEventListener("query",r=>{const s=r.detail,a=performance.now(),c=modify(!r.detail.prefix&&r.detail.focus||"");e.setModifier(c),t.text!==s.text&&i(s.text);const l=t.text&&s.text&&0!==t.text.length&&t.text.startsWith(s.text.substr(0,t.text.length))||!1;let d=!1;t.text&&t.prefix===s.prefix?a-n>2e3&&(d=!0):d=!0,t=s,n=a;const u=async(n=0,r=!1)=>{if(n&&(await rAF(n),t!==s))return-1;const a=await request(s.text,s.prefix,r);return t!==s?-1:(o=a,i(s.text),e.update(a))};u(d?0:250,l).then(e=>{if(e<0)return-2;if(!s.text)return u(1500,!0);const t=Math.max(1e3,100*Math.pow(e,.75));return u(t,!0)}).catch(e=>{console.error("error doing request",e)})})}(),function(e,t){const n=t.querySelector("form"),o=n.querySelector("input"),r=n.querySelector("button");let i="",s=null;e.addEventListener("query",e=>{const n=e.detail,r=null===n.text&&void 0!==n.focus&&n.selection;if(i=n.focus,!r)return s||(o.value="",t.hidden=!0),!1;t.hidden=!1});const a=e=>{r.disabled=!o.value};"input change".split(/\s+/).forEach(e=>o.addEventListener(e,a)),n.addEventListener("submit",e=>{if(e.preventDefault(),s)return!1;n.classList.add("pending"),o.disabled=!0,r.disabled=!0;(s=submit(o.value,i).then(e=>{if(!e.ok)throw new Error(e.status);return r.classList.add("success"),!1}).catch(e=>(r.classList.add("failure"),console.warn("failed to submit emoji",e),!0)).then(e=>{n.classList.remove("pending"),o.disabled=!1,o.value="",o.dispatchEvent(new CustomEvent("change")),s=null,i||(t.hidden=!0)})).then(()=>delay(2e3)).then(()=>{r.className=""})})}(typer,advanced);const value=e=>{const t=e.detail.trim();document.body.classList.toggle("has-value",Boolean(t))};function isExtentNode(e){return e instanceof Element&&e.classList.contains("extent")}typer.addEventListener("value",value),value({detail:typer.value}),document.body.addEventListener("keydown",e=>{switch(e.key){case"Escape":if(document.activeElement!==typer){typer.focus();break}if(typer.selectionStart!==typer.selectionEnd){"backward"===typer.selectionDirection?typer.selectionStart=typer.selectionEnd:typer.selectionEnd=typer.selectionStart;break}const t=typer.value.length;typer.setSelectionRange(t,t)}}),document.addEventListener("selectionchange",e=>{const t=window.getSelection(),{anchorNode:n,focusNode:o}=t;n!==o&&isExtentNode(n)&&isExtentNode(o)&&(t.removeAllRanges(),typer.focus(),typer.dispatchEvent(new CustomEvent("select-all")))},!0),document.addEventListener("focusin",e=>{microtask().then(()=>{document.activeElement===document.body&&typer.focus()})});const resize=e=>{const t=window.innerHeight;document.body.style.minHeight=`${t}px`};window.addEventListener("resize",resize),window.addEventListener("load",resize),resize();let deferredPrompt=null;function cleanupPrompt(){document.body.classList.remove("has-install"),deferredPrompt=null}window.addEventListener("beforeinstallprompt",e=>(ga("send","event","install","available"),document.body.classList.add("has-install"),deferredPrompt=e,e.preventDefault(),!1)),window.addEventListener("appinstalled",e=>{ga("send","event","install","installed"),cleanupPrompt()});const installEl=document.getElementById("install");installEl.addEventListener("click",e=>{deferredPrompt&&(deferredPrompt.prompt(),deferredPrompt.userChoice&&deferredPrompt.userChoice.then(e=>{ga("send","event","install",e)}).catch(e=>{console.warn("beforeinstallprompt prompt",e)}).then(cleanupPrompt))});const adverts=document.getElementById("adverts");function refresh(){const e=adverts.querySelector(".active"),t=e&&e.nextElementSibling||adverts.firstElementChild;t?(e&&e.classList.remove("active"),t.classList.add("active"),enqueue()):console.warn("no adverts to choose from")}let timeout;function enqueue(){window.clearTimeout(timeout),timeout=window.setTimeout(()=>{window.requestAnimationFrame(refresh)},1e4)}if(enqueue(),navigator.serviceWorker){navigator.serviceWorker.register("./sw.js").catch(e=>{console.warn("failed to register SW",e)});const e=Boolean(navigator.serviceWorker.controller);navigator.serviceWorker.addEventListener("controllerchange",()=>{e&&(console.debug("got SW controllerchange, reload"),window.location.reload())})}let prevOnLine=!0;function notifyStatus(){"onLine"in navigator&&prevOnLine!==navigator.onLine&&(ga("send","event","network",navigator.onLine?"online":"offline"),prevOnLine=navigator.onLine)}notifyStatus(),window.addEventListener("online",()=>debounce(notifyStatus)),window.addEventListener("offline",()=>debounce(notifyStatus)),window.onerror=((e,t,n,o,r)=>{console.info("got err",String(e));try{ga("send","event","error",`${t},${n}:${o}`,String(e),{nonInteraction:!0})}catch(e){}});

//# sourceMappingURL=bundle-5f9cce9d92.js.map
