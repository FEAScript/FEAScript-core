function e(e){return e&&e.__esModule&&Object.prototype.hasOwnProperty.call(e,"default")?e.default:e}
/**
* @license Apache-2.0
*
* Copyright (c) 2021 The Stdlib Authors.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/var t,n,o,i,r,s,a,l,c,u,d,f,m,h,p,g,y,b,v,E,C,w,D,M,F,$,A,x,k,N,O,P,S,V,I,T,X,R,j,Y,B,q,W,G,_,L,K,J,U,H,z,Z,Q,ee,te,ne,oe,ie,re,se,ae,le,ce,ue;function de(){if(i)return o;i=1;var e=function(){if(n)return t;n=1;var e="function"==typeof Object.defineProperty?Object.defineProperty:null;return t=e}
/**
* @license Apache-2.0
*
* Copyright (c) 2021 The Stdlib Authors.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/();return o=function(){try{return e({},"x",{}),!0}catch(e){return!1}}}
/**
* @license Apache-2.0
*
* Copyright (c) 2018 The Stdlib Authors.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/function fe(){if(s)return r;s=1;var e=Object.defineProperty;return r=e}
/**
* @license Apache-2.0
*
* Copyright (c) 2022 The Stdlib Authors.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/function me(){if(l)return a;return l=1,a=function(e){return"number"==typeof e}}
/**
* @license Apache-2.0
*
* Copyright (c) 2022 The Stdlib Authors.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/function he(){if(u)return c;function e(e){var t,n="";for(t=0;t<e;t++)n+="0";return n}return u=1,c=function(t,n,o){var i=!1,r=n-t.length;return r<0||(function(e){return"-"===e[0]}(t)&&(i=!0,t=t.substr(1)),t=o?t+e(r):e(r)+t,i&&(t="-"+t)),t}}
/**
* @license Apache-2.0
*
* Copyright (c) 2022 The Stdlib Authors.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/function pe(){if(E)return v;E=1;var e=function(){if(f)return d;f=1;var e=me(),t=he(),n=String.prototype.toLowerCase,o=String.prototype.toUpperCase;return d=function(i){var r,s,a;switch(i.specifier){case"b":r=2;break;case"o":r=8;break;case"x":case"X":r=16;break;default:r=10}if(s=i.arg,a=parseInt(s,10),!isFinite(a)){if(!e(s))throw new Error("invalid integer. Value: "+s);a=0}return a<0&&("u"===i.specifier||10!==r)&&(a=4294967295+a+1),a<0?(s=(-a).toString(r),i.precision&&(s=t(s,i.precision,i.padRight)),s="-"+s):(s=a.toString(r),a||i.precision?i.precision&&(s=t(s,i.precision,i.padRight)):s="",i.sign&&(s=i.sign+s)),16===r&&(i.alternate&&(s="0x"+s),s=i.specifier===o.call(i.specifier)?o.call(s):n.call(s)),8===r&&i.alternate&&"0"!==s.charAt(0)&&(s="0"+s),s}}
/**
* @license Apache-2.0
*
* Copyright (c) 2022 The Stdlib Authors.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/(),t=h?m:(h=1,m=function(e){return"string"==typeof e}),n=me(),o=function(){if(g)return p;g=1;var e=Math.abs,t=String.prototype.toLowerCase,n=String.prototype.toUpperCase,o=String.prototype.replace,i=/e\+(\d)$/,r=/e-(\d)$/,s=/^(\d+)$/,a=/^(\d+)e/,l=/\.0$/,c=/\.0*e/,u=/(\..*[^0])0*e/;return p=function(d,f){var m,h;switch(f.specifier){case"e":case"E":h=d.toExponential(f.precision);break;case"f":case"F":h=d.toFixed(f.precision);break;case"g":case"G":e(d)<1e-4?((m=f.precision)>0&&(m-=1),h=d.toExponential(m)):h=d.toPrecision(f.precision),f.alternate||(h=o.call(h,u,"$1e"),h=o.call(h,c,"e"),h=o.call(h,l,""));break;default:throw new Error("invalid double notation. Value: "+f.specifier)}return h=o.call(h,i,"e+0$1"),h=o.call(h,r,"e-0$1"),f.alternate&&(h=o.call(h,s,"$1."),h=o.call(h,a,"$1.e")),d>=0&&f.sign&&(h=f.sign+h),f.specifier===n.call(f.specifier)?n.call(h):t.call(h)}}
/**
* @license Apache-2.0
*
* Copyright (c) 2022 The Stdlib Authors.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/(),i=function(){if(b)return y;function e(e){var t,n="";for(t=0;t<e;t++)n+=" ";return n}return b=1,y=function(t,n,o){var i=n-t.length;return i<0?t:t=o?t+e(i):e(i)+t}}
/**
* @license Apache-2.0
*
* Copyright (c) 2022 The Stdlib Authors.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/(),r=he(),s=String.fromCharCode,a=Array.isArray;function l(e){return e!=e}function c(e){var t={};return t.specifier=e.specifier,t.precision=void 0===e.precision?1:e.precision,t.width=e.width,t.flags=e.flags||"",t.mapping=e.mapping,t}return v=function(u){var d,f,m,h,p,g,y,b,v,E;if(!a(u))throw new TypeError("invalid argument. First argument must be an array. Value: `"+u+"`.");for(g="",y=1,v=0;v<u.length;v++)if(m=u[v],t(m))g+=m;else{if(d=void 0!==m.precision,!(m=c(m)).specifier)throw new TypeError("invalid argument. Token is missing `specifier` property. Index: `"+v+"`. Value: `"+m+"`.");for(m.mapping&&(y=m.mapping),f=m.flags,E=0;E<f.length;E++)switch(h=f.charAt(E)){case" ":m.sign=" ";break;case"+":m.sign="+";break;case"-":m.padRight=!0,m.padZeros=!1;break;case"0":m.padZeros=f.indexOf("-")<0;break;case"#":m.alternate=!0;break;default:throw new Error("invalid flag: "+h)}if("*"===m.width){if(m.width=parseInt(arguments[y],10),y+=1,l(m.width))throw new TypeError("the argument for * width at position "+y+" is not a number. Value: `"+m.width+"`.");m.width<0&&(m.padRight=!0,m.width=-m.width)}if(d&&"*"===m.precision){if(m.precision=parseInt(arguments[y],10),y+=1,l(m.precision))throw new TypeError("the argument for * precision at position "+y+" is not a number. Value: `"+m.precision+"`.");m.precision<0&&(m.precision=1,d=!1)}switch(m.arg=arguments[y],m.specifier){case"b":case"o":case"x":case"X":case"d":case"i":case"u":d&&(m.padZeros=!1),m.arg=e(m);break;case"s":m.maxWidth=d?m.precision:-1,m.arg=String(m.arg);break;case"c":if(!l(m.arg)){if((p=parseInt(m.arg,10))<0||p>127)throw new Error("invalid character code. Value: "+m.arg);m.arg=l(p)?String(m.arg):s(p)}break;case"e":case"E":case"f":case"F":case"g":case"G":if(d||(m.precision=6),b=parseFloat(m.arg),!isFinite(b)){if(!n(m.arg))throw new Error("invalid floating-point number. Value: "+g);b=m.arg,m.padZeros=!1}m.arg=o(b,m);break;default:throw new Error("invalid specifier: "+m.specifier)}m.maxWidth>=0&&m.arg.length>m.maxWidth&&(m.arg=m.arg.substring(0,m.maxWidth)),m.padZeros?m.arg=r(m.arg,m.width||m.precision,m.padRight):m.width&&(m.arg=i(m.arg,m.width,m.padRight)),g+=m.arg||"",y+=1}return g},v}
/**
* @license Apache-2.0
*
* Copyright (c) 2022 The Stdlib Authors.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/function ge(){if($)return F;$=1;var e=function(){if(M)return D;M=1;var e=/%(?:([1-9]\d*)\$)?([0 +\-#]*)(\*|\d+)?(?:(\.)(\*|\d+)?)?[hlL]?([%A-Za-z])/g;function t(e){var t={mapping:e[1]?parseInt(e[1],10):void 0,flags:e[2],width:e[3],precision:e[5],specifier:e[6]};return"."===e[4]&&void 0===e[5]&&(t.precision="1"),t}return D=function(n){var o,i,r,s;for(i=[],s=0,r=e.exec(n);r;)(o=n.slice(s,e.lastIndex-r[0].length)).length&&i.push(o),"%"===r[6]?i.push("%"):i.push(t(r)),s=e.lastIndex,r=e.exec(n);return(o=n.slice(s)).length&&i.push(o),i}}
/**
* @license Apache-2.0
*
* Copyright (c) 2022 The Stdlib Authors.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/();return F=e}
/**
* @license Apache-2.0
*
* Copyright (c) 2022 The Stdlib Authors.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/function ye(){if(N)return k;N=1;var e=function(){if(w)return C;w=1;var e=pe();return C=e}
/**
* @license Apache-2.0
*
* Copyright (c) 2022 The Stdlib Authors.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/(),t=ge(),n=x?A:(x=1,A=function(e){return"string"==typeof e});return k=function o(i){var r,s;if(!n(i))throw new TypeError(o("invalid argument. First argument must be a string. Value: `%s`.",i));for(r=[t(i)],s=1;s<arguments.length;s++)r.push(arguments[s]);return e.apply(null,r)},k}
/**
* @license Apache-2.0
*
* Copyright (c) 2022 The Stdlib Authors.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/function be(){if(V)return S;V=1;var e=function(){if(P)return O;P=1;var e=ye();return O=e}
/**
* @license Apache-2.0
*
* Copyright (c) 2018 The Stdlib Authors.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/(),t=Object.prototype,n=t.toString,o=t.__defineGetter__,i=t.__defineSetter__,r=t.__lookupGetter__,s=t.__lookupSetter__;return S=function(a,l,c){var u,d,f,m;if("object"!=typeof a||null===a||"[object Array]"===n.call(a))throw new TypeError(e("invalid argument. First argument must be an object. Value: `%s`.",a));if("object"!=typeof c||null===c||"[object Array]"===n.call(c))throw new TypeError(e("invalid argument. Property descriptor must be an object. Value: `%s`.",c));if((d="value"in c)&&(r.call(a,l)||s.call(a,l)?(u=a.__proto__,a.__proto__=t,delete a[l],a[l]=c.value,a.__proto__=u):a[l]=c.value),f="get"in c,m="set"in c,d&&(f||m))throw new Error("invalid argument. Cannot specify one or more accessors and a value or writable attribute in the property descriptor.");return f&&o&&o.call(a,l,c.get),m&&i&&i.call(a,l,c.set),a}}
/**
* @license Apache-2.0
*
* Copyright (c) 2018 The Stdlib Authors.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/function ve(){if(R)return X;R=1;var e=function(){if(T)return I;T=1;var e,t=de(),n=fe(),o=be();return e=t()?n:o,I=e}
/**
* @license Apache-2.0
*
* Copyright (c) 2018 The Stdlib Authors.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/();return X=function(t,n,o){e(t,n,{configurable:!1,enumerable:!1,writable:!1,value:o})}}
/**
* @license Apache-2.0
*
* Copyright (c) 2018 The Stdlib Authors.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/function Ee(){if(Y)return j;Y=1;var e=ve();return j=e}
/**
* @license Apache-2.0
*
* Copyright (c) 2024 The Stdlib Authors.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/function Ce(){if(G)return W;G=1;var e=q?B:(q=1,B=function(e,t){return t>0?0:(1-e)*t});return W=e}
/**
* @license Apache-2.0
*
* Copyright (c) 2018 The Stdlib Authors.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/function we(){if(H)return U;H=1;var e=J?K:(J=1,K=function(e){return Math.abs(e)});return U=e}
/**
* @license Apache-2.0
*
* Copyright (c) 2018 The Stdlib Authors.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/function De(){if(ee)return Q;ee=1;var e=Z?z:(Z=1,z=function(e){return e*e});return Q=e}
/**
* @license Apache-2.0
*
* Copyright (c) 2018 The Stdlib Authors.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/function Me(){if(ie)return oe;ie=1;var e=function(){if(ne)return te;ne=1;var e=Math.sqrt;return te=e}
/**
* @license Apache-2.0
*
* Copyright (c) 2018 The Stdlib Authors.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/();return oe=e}
/**
* @license Apache-2.0
*
* Copyright (c) 2023 The Stdlib Authors.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/function Fe(){if(se)return re;se=1;var e=L?_:(L=1,_=17976931348623157e292),t=we(),n=De(),o=Me(),i=44989137945431964e145,r=11113793747425387e-178;return re=function(s,a,l,c){var u,d,f,m,h,p,g,y,b,v,E;if(s<=0)return 0;for(v=c,u=!0,d=0,f=0,m=0,h=0,y=1,E=0;E<s;E++)(b=t(a[v]))>1997919072202235e131?(f+=n(b*r),u=!1):b<14916681462400413e-170?u&&(h+=n(b*i)):m+=b*b,v+=l;return f>0?((m>0||m>e||m!=m)&&(f+=m*r*r),y=1/r,d=f):h>0?m>0||m>e||m!=m?(m=o(m),(h=o(h)/i)>m?(g=m,p=h):(g=h,p=m),y=1,d=p*p*(1+n(g/p))):(y=1/i,d=h):(y=1,d=m),o(d)*y}}
/**
* @license Apache-2.0
*
* Copyright (c) 2020 The Stdlib Authors.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/var $e,Ae,xe,ke,Ne,Oe,Pe=function(){if(ue)return ce;ue=1;var e=Ee(),t=function(){if(le)return ae;le=1;var e=Ce(),t=Fe();return ae=function(n,o,i){var r=e(n,i);return t(n,o,i,r)}}
/**
* @license Apache-2.0
*
* Copyright (c) 2020 The Stdlib Authors.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/();return e(t,"ndarray",Fe()),ce=t}(),Se=e(Pe);function Ve(){if(Ae)return $e;Ae=1;return $e=function(e,t,n,o,i,r,s){var a,l,c,u,d;if(a=0,e<=0)return a;if(l=o,c=s,1===n&&1===r){if((u=e%5)>0)for(d=0;d<u;d++)a+=t[l]*i[c],l+=1,c+=1;if(e<5)return a;for(d=u;d<e;d+=5)a+=t[l]*i[c]+t[l+1]*i[c+1]+t[l+2]*i[c+2]+t[l+3]*i[c+3]+t[l+4]*i[c+4],l+=5,c+=5;return a}for(d=0;d<e;d++)a+=t[l]*i[c],l+=n,c+=r;return a}}
/**
* @license Apache-2.0
*
* Copyright (c) 2019 The Stdlib Authors.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/var Ie,Te,Xe,Re,je,Ye,Be=function(){if(Oe)return Ne;Oe=1;var e=Ee(),t=function(){if(ke)return xe;ke=1;var e=Ce(),t=Ve();return xe=function(n,o,i,r,s){var a,l;return n<=0?0:(a=e(n,i),l=e(n,s),t(n,o,i,a,r,s,l))}}
/**
* @license Apache-2.0
*
* Copyright (c) 2019 The Stdlib Authors.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/();return e(t,"ndarray",Ve()),Ne=t}(),qe=e(Be);function We(){if(Te)return Ie;Te=1;return Ie=function(e,t,n,o,i,r,s){var a,l,c,u;if(e<=0)return i;if(a=o,l=s,1===n&&1===r){if((c=e%8)>0)for(u=0;u<c;u++)i[l]=t[a],a+=n,l+=r;if(e<8)return i;for(u=c;u<e;u+=8)i[l]=t[a],i[l+1]=t[a+1],i[l+2]=t[a+2],i[l+3]=t[a+3],i[l+4]=t[a+4],i[l+5]=t[a+5],i[l+6]=t[a+6],i[l+7]=t[a+7],a+=8,l+=8;return i}for(u=0;u<e;u++)i[l]=t[a],a+=n,l+=r;return i}}
/**
* @license Apache-2.0
*
* Copyright (c) 2023 The Stdlib Authors.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/var Ge,_e,Le,Ke,Je,Ue,He=function(){if(Ye)return je;Ye=1;var e=Ee(),t=function(){if(Re)return Xe;Re=1;var e=Ce(),t=We();return Xe=function(n,o,i,r,s){var a,l;return n<=0?r:(a=e(n,i),l=e(n,s),t(n,o,i,a,r,s,l))}}
/**
* @license Apache-2.0
*
* Copyright (c) 2018 The Stdlib Authors.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/();return e(t,"ndarray",We()),je=t}(),ze=e(He);function Ze(){if(_e)return Ge;_e=1;return Ge=function(e,t,n,o,i,r,s,a){var l,c,u,d;if(e<=0||0===t)return r;if(l=i,c=a,1===o&&1===s){if((u=e%4)>0)for(d=0;d<u;d++)r[c]+=t*n[l],l+=o,c+=s;if(e<4)return r;for(d=u;d<e;d+=4)r[c]+=t*n[l],r[c+1]+=t*n[l+1],r[c+2]+=t*n[l+2],r[c+3]+=t*n[l+3],l+=4,c+=4;return r}for(d=0;d<e;d++)r[c]+=t*n[l],l+=o,c+=s;return r}}
/**
* @license Apache-2.0
*
* Copyright (c) 2018 The Stdlib Authors.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/var Qe=function(){if(Ue)return Je;Ue=1;var e=Ee(),t=function(){if(Ke)return Le;Ke=1;var e=Ce(),t=Ze();return Le=function(n,o,i,r,s,a){var l,c;return n<=0||0===o?s:(l=e(n,r),c=e(n,a),t(n,o,i,r,l,s,a,c))}}
/**
* @license Apache-2.0
*
* Copyright (c) 2018 The Stdlib Authors.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/();return e(t,"ndarray",Ze()),Je=t}(),et=e(Qe);function tt(e){const t=e instanceof Float64Array?e:new Float64Array(e);return Se(t.length,t,1)}function nt(e,t){const n=e instanceof Float64Array?e:new Float64Array(e),o=t instanceof Float64Array?t:new Float64Array(t);return qe(n.length,n,1,o,1)}function ot(e,t,n){const o=t instanceof Float64Array?t:new Float64Array(t);et(o.length,e,o,1,n,1)}let it="basic";function rt(e){"none"!==e&&"basic"!==e&&"debug"!==e?(console.log("%c[WARN] Invalid log level: "+e+". Using basic instead. Allowed levels: none, basic, debug.","color: #FFC107; font-weight: bold;"),it="basic"):(it=e,at(`Log level set to: ${e}`))}function st(e){"debug"===it&&console.log("%c[DEBUG] "+e,"color: #2196F3; font-weight: bold;")}function at(e){"basic"!==it&&"debug"!==it||console.log("%c[INFO] "+e,"color: #4CAF50; font-weight: bold;")}function lt(e){console.log("%c[ERROR] "+e,"color: #F44336; font-weight: bold;")}function ct(e){console.log("%c[WARN] "+e,"color: #FF9800; font-weight: bold;")}
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */const ut=Symbol("Comlink.proxy"),dt=Symbol("Comlink.endpoint"),ft=Symbol("Comlink.releaseProxy"),mt=Symbol("Comlink.finalizer"),ht=Symbol("Comlink.thrown"),pt=e=>"object"==typeof e&&null!==e||"function"==typeof e,gt=new Map([["proxy",{canHandle:e=>pt(e)&&e[ut],serialize(e){const{port1:t,port2:n}=new MessageChannel;return yt(e,t),[n,[n]]},deserialize:e=>(e.start(),vt(e))}],["throw",{canHandle:e=>pt(e)&&ht in e,serialize({value:e}){let t;return t=e instanceof Error?{isError:!0,value:{message:e.message,name:e.name,stack:e.stack}}:{isError:!1,value:e},[t,[]]},deserialize(e){if(e.isError)throw Object.assign(new Error(e.value.message),e.value);throw e.value}}]]);function yt(e,t=globalThis,n=["*"]){t.addEventListener("message",(function o(i){if(!i||!i.data)return;if(!function(e,t){for(const n of e){if(t===n||"*"===n)return!0;if(n instanceof RegExp&&n.test(t))return!0}return!1}(n,i.origin))return void console.warn(`Invalid origin '${i.origin}' for comlink proxy`);const{id:r,type:s,path:a}=Object.assign({path:[]},i.data),l=(i.data.argumentList||[]).map(xt);let c;try{const t=a.slice(0,-1).reduce(((e,t)=>e[t]),e),n=a.reduce(((e,t)=>e[t]),e);switch(s){case"GET":c=n;break;case"SET":t[a.slice(-1)[0]]=xt(i.data.value),c=!0;break;case"APPLY":c=n.apply(t,l);break;case"CONSTRUCT":c=function(e){return Object.assign(e,{[ut]:!0})}(new n(...l));break;case"ENDPOINT":{const{port1:t,port2:n}=new MessageChannel;yt(e,n),c=function(e,t){return $t.set(e,t),e}(t,[t])}break;case"RELEASE":c=void 0;break;default:return}}catch(e){c={value:e,[ht]:0}}Promise.resolve(c).catch((e=>({value:e,[ht]:0}))).then((n=>{const[i,a]=At(n);t.postMessage(Object.assign(Object.assign({},i),{id:r}),a),"RELEASE"===s&&(t.removeEventListener("message",o),bt(t),mt in e&&"function"==typeof e[mt]&&e[mt]())})).catch((e=>{const[n,o]=At({value:new TypeError("Unserializable return value"),[ht]:0});t.postMessage(Object.assign(Object.assign({},n),{id:r}),o)}))})),t.start&&t.start()}function bt(e){(function(e){return"MessagePort"===e.constructor.name})(e)&&e.close()}function vt(e,t){const n=new Map;return e.addEventListener("message",(function(e){const{data:t}=e;if(!t||!t.id)return;const o=n.get(t.id);if(o)try{o(t)}finally{n.delete(t.id)}})),Mt(e,n,[],t)}function Et(e){if(e)throw new Error("Proxy has been released and is not useable")}function Ct(e){return kt(e,new Map,{type:"RELEASE"}).then((()=>{bt(e)}))}const wt=new WeakMap,Dt="FinalizationRegistry"in globalThis&&new FinalizationRegistry((e=>{const t=(wt.get(e)||0)-1;wt.set(e,t),0===t&&Ct(e)}));function Mt(e,t,n=[],o=function(){}){let i=!1;const r=new Proxy(o,{get(o,s){if(Et(i),s===ft)return()=>{!function(e){Dt&&Dt.unregister(e)}(r),Ct(e),t.clear(),i=!0};if("then"===s){if(0===n.length)return{then:()=>r};const o=kt(e,t,{type:"GET",path:n.map((e=>e.toString()))}).then(xt);return o.then.bind(o)}return Mt(e,t,[...n,s])},set(o,r,s){Et(i);const[a,l]=At(s);return kt(e,t,{type:"SET",path:[...n,r].map((e=>e.toString())),value:a},l).then(xt)},apply(o,r,s){Et(i);const a=n[n.length-1];if(a===dt)return kt(e,t,{type:"ENDPOINT"}).then(xt);if("bind"===a)return Mt(e,t,n.slice(0,-1));const[l,c]=Ft(s);return kt(e,t,{type:"APPLY",path:n.map((e=>e.toString())),argumentList:l},c).then(xt)},construct(o,r){Et(i);const[s,a]=Ft(r);return kt(e,t,{type:"CONSTRUCT",path:n.map((e=>e.toString())),argumentList:s},a).then(xt)}});return function(e,t){const n=(wt.get(t)||0)+1;wt.set(t,n),Dt&&Dt.register(e,t,e)}(r,e),r}function Ft(e){const t=e.map(At);return[t.map((e=>e[0])),(n=t.map((e=>e[1])),Array.prototype.concat.apply([],n))];var n}const $t=new WeakMap;function At(e){for(const[t,n]of gt)if(n.canHandle(e)){const[o,i]=n.serialize(e);return[{type:"HANDLER",name:t,value:o},i]}return[{type:"RAW",value:e},$t.get(e)||[]]}function xt(e){switch(e.type){case"HANDLER":return gt.get(e.name).deserialize(e.value);case"RAW":return e.value}}function kt(e,t,n,o){return new Promise((i=>{const r=new Array(4).fill(0).map((()=>Math.floor(Math.random()*Number.MAX_SAFE_INTEGER).toString(16))).join("-");t.set(r,i),e.start&&e.start(),e.postMessage(Object.assign({id:r},n),o)}))}function Nt(e,t,n,o={}){const{maxIterations:i=1e4,tolerance:r=1e-4}=o;let s=[],a=!0,l=0;if(at(`Solving system using ${e}...`),console.time("systemSolving"),"lusolve"===e){const e=math.sparse(t),o=math.slu(e,1,1);let i=math.lusolve(o,n);s=math.squeeze(i).valueOf()}else if("jacobi"===e){const e=function(e,t,n,o={}){const{maxIterations:i,tolerance:r}=o,s=e.length,a=e.map((e=>new Float64Array(e))),l=new Float64Array(t);let c=new Float64Array(n),u=new Float64Array(s);const d=new Float64Array(s);for(let e=0;e<i;e++){for(let e=0;e<s;e++){const t=nt(a[e],c);u[e]=(l[e]-t+a[e][e]*c[e])/a[e][e]}for(let e=0;e<s;e++)d[e]=u[e]-c[e];const t=tt(d);if(m=c,ze((f=u).length,f,1,m,1),t<r)return{solutionVector:c,iterations:e+1,converged:!0}}var f,m;return{solutionVector:c,iterations:i,converged:!1}}(t,n,new Array(n.length).fill(0),{maxIterations:i,tolerance:r});e.converged?st(`Jacobi method converged in ${e.iterations} iterations`):lt(`Jacobi method did not converge after ${e.iterations} iterations`),s=e.solutionVector,a=e.converged,l=e.iterations}else lt(`Unknown solver method: ${e}`);return console.timeEnd("systemSolving"),at("System solved successfully"),{solutionVector:s,converged:a,iterations:l}}async function Ot(e,t,n,o={}){const{maxIterations:i=1e4,tolerance:r=1e-4}=o;at(`Solving system using ${e}...`),console.time("systemSolving");const s=Array.isArray(t)?t:t?.toArray?.()??t,a=Array.isArray(n)?n:n?.toArray?.()??n;let l,c=null,u=null,d=[],f=!0;if("jacobi-gpu"===e){c=await async function(){const e=new URL("../workers/webgpuWorker.js",import.meta.url).href,t=new Blob([`import "${e}";`],{type:"application/javascript"}),n=new Worker(URL.createObjectURL(t),{type:"module"}),o=vt(n);return await o.initialize(),{computeEngine:o,worker:n}}(),u=c.computeEngine;const e=new Array(a.length).fill(0);let t;t=await u.webgpuJacobiSolver(s,a,e,{maxIterations:i,tolerance:r}),d=t.solutionVector,f=t.converged,l=t.iterations,f?st(`Jacobi method converged in ${l} iterations`):lt(`Jacobi method did not converge after ${l} iterations`)}else lt(`Unknown solver method: ${e}`);return console.timeEnd("systemSolving"),at(`System solved successfully (${e})`),c&&(await(u?.destroy?.().catch((()=>{}))),c.worker.terminate()),{solutionVector:d,converged:f,iterations:l}}class Pt{constructor({meshDimension:e,elementOrder:t}){this.meshDimension=e,this.elementOrder=t}getBasisFunctions(e,t=null){let n=[],o=[],i=[];if("1D"===this.meshDimension)"linear"===this.elementOrder?(n[0]=1-e,n[1]=e,o[0]=-1,o[1]=1):"quadratic"===this.elementOrder&&(n[0]=1-3*e+2*e**2,n[1]=4*e-4*e**2,n[2]=2*e**2-e,o[0]=4*e-3,o[1]=4-8*e,o[2]=4*e-1);else if("2D"===this.meshDimension){if(null===t)return void lt("Eta coordinate is required for 2D elements");if("linear"===this.elementOrder){function r(e){return 1-e}n[0]=r(e)*r(t),n[1]=r(e)*t,n[2]=e*r(t),n[3]=e*t,o[0]=-1*r(t),o[1]=-1*t,o[2]=1*r(t),o[3]=1*t,i[0]=-1*r(e),i[1]=1*r(e),i[2]=-1*e,i[3]=1*e}else if("quadratic"===this.elementOrder){function s(e){return 2*e**2-3*e+1}function a(e){return-4*e**2+4*e}function l(e){return 2*e**2-e}function c(e){return 4*e-3}function u(e){return-8*e+4}function d(e){return 4*e-1}n[0]=s(e)*s(t),n[1]=s(e)*a(t),n[2]=s(e)*l(t),n[3]=a(e)*s(t),n[4]=a(e)*a(t),n[5]=a(e)*l(t),n[6]=l(e)*s(t),n[7]=l(e)*a(t),n[8]=l(e)*l(t),o[0]=c(e)*s(t),o[1]=c(e)*a(t),o[2]=c(e)*l(t),o[3]=u(e)*s(t),o[4]=u(e)*a(t),o[5]=u(e)*l(t),o[6]=d(e)*s(t),o[7]=d(e)*a(t),o[8]=d(e)*l(t),i[0]=s(e)*c(t),i[1]=s(e)*u(t),i[2]=s(e)*d(t),i[3]=a(e)*c(t),i[4]=a(e)*u(t),i[5]=a(e)*d(t),i[6]=l(e)*c(t),i[7]=l(e)*u(t),i[8]=l(e)*d(t)}}return{basisFunction:n,basisFunctionDerivKsi:o,basisFunctionDerivEta:i}}}class St{constructor({numElementsX:e=null,maxX:t=null,numElementsY:n=null,maxY:o=null,meshDimension:i=null,elementOrder:r="linear",parsedMesh:s=null}){this.numElementsX=e,this.numElementsY=n,this.maxX=t,this.maxY=o,this.meshDimension=i,this.elementOrder=r,this.parsedMesh=s,this.boundaryElementsProcessed=!1,this.parsedMesh&&(at("Using pre-parsed mesh from gmshReader data for mesh generation."),this.parseMeshFromGmsh())}parseMeshFromGmsh(){if(this.parsedMesh.nodalNumbering||lt("No valid nodal numbering found in the parsed mesh."),Array.isArray(this.parsedMesh.nodalNumbering))return this.boundaryElementsProcessed=!0,this.parsedMesh.boundaryElementsProcessed=!0,this.parsedMesh;if("object"==typeof this.parsedMesh.nodalNumbering&&!Array.isArray(this.parsedMesh.nodalNumbering)){const e=this.parsedMesh.nodalNumbering.quadElements||[];if(this.parsedMesh.nodalNumbering.triangleElements,st("Initial parsed mesh nodal numbering from Gmsh format: "+JSON.stringify(this.parsedMesh.nodalNumbering)),this.parsedMesh.elementTypes[3]||this.parsedMesh.elementTypes[10]){const t=[];for(let n=0;n<e.length;n++){const o=e[n],i=new Array(o.length);4===o.length?(i[0]=o[0],i[1]=o[3],i[2]=o[1],i[3]=o[2]):9===o.length&&(i[0]=o[0],i[1]=o[7],i[2]=o[3],i[3]=o[4],i[4]=o[8],i[5]=o[6],i[6]=o[1],i[7]=o[5],i[8]=o[2]),t.push(i)}this.parsedMesh.nodalNumbering=t}else this.parsedMesh.elementTypes[2]&&lt("Element type is neither triangle nor quad; mapping for this type is not implemented yet.");if(st("Nodal numbering after mapping from Gmsh to FEAScript format: "+JSON.stringify(this.parsedMesh.nodalNumbering)),this.parsedMesh.physicalPropMap&&this.parsedMesh.boundaryElements){if(Array.isArray(this.parsedMesh.boundaryElements)&&this.parsedMesh.boundaryElements.length>0&&void 0===this.parsedMesh.boundaryElements[0]){const e=[];for(let t=1;t<this.parsedMesh.boundaryElements.length;t++)this.parsedMesh.boundaryElements[t]&&e.push(this.parsedMesh.boundaryElements[t]);this.parsedMesh.boundaryElements=e}if(this.parsedMesh.boundaryNodePairs&&!this.parsedMesh.boundaryElementsProcessed&&(this.parsedMesh.boundaryElements=[],this.parsedMesh.physicalPropMap.forEach((e=>{if(1===e.dimension){const t=this.parsedMesh.boundaryNodePairs[e.tag]||[];t.length>0&&(this.parsedMesh.boundaryElements[e.tag]||(this.parsedMesh.boundaryElements[e.tag]=[]),t.forEach((t=>{const n=t[0],o=t[1];st(`Processing boundary node pair: [${n}, ${o}] for boundary ${e.tag} (${e.name||"unnamed"})`);let i=!1;for(let t=0;t<this.parsedMesh.nodalNumbering.length;t++){const r=this.parsedMesh.nodalNumbering[t];if(4===r.length){if(r.includes(n)&&r.includes(o)){let s;const a=r.indexOf(n),l=r.indexOf(o);st(`  Found element ${t} containing boundary nodes. Element nodes: [${r.join(", ")}]`),st(`  Node ${n} is at index ${a}, Node ${o} is at index ${l} in the element`),0===a&&2===l||2===a&&0===l?(s=0,st(`  These nodes form the BOTTOM side (${s}) of element ${t}`)):0===a&&1===l||1===a&&0===l?(s=1,st(`  These nodes form the LEFT side (${s}) of element ${t}`)):1===a&&3===l||3===a&&1===l?(s=2,st(`  These nodes form the TOP side (${s}) of element ${t}`)):(2===a&&3===l||3===a&&2===l)&&(s=3,st(`  These nodes form the RIGHT side (${s}) of element ${t}`)),this.parsedMesh.boundaryElements[e.tag].push([t,s]),st(`  Added element-side pair [${t}, ${s}] to boundary tag ${e.tag}`),i=!0;break}}else if(9===r.length&&r.includes(n)&&r.includes(o)){let s;const a=r.indexOf(n),l=r.indexOf(o);st(`  Found element ${t} containing boundary nodes. Element nodes: [${r.join(", ")}]`),st(`  Node ${n} is at index ${a}, Node ${o} is at index ${l} in the element`),0===a&&6===l||6===a&&0===l||0===a&&3===l||3===a&&0===l||3===a&&6===l||6===a&&3===l?(s=0,st(`  These nodes form the BOTTOM side (${s}) of element ${t}`)):0===a&&2===l||2===a&&0===l||0===a&&1===l||1===a&&0===l||1===a&&2===l||2===a&&1===l?(s=1,st(`  These nodes form the LEFT side (${s}) of element ${t}`)):2===a&&8===l||8===a&&2===l||2===a&&5===l||5===a&&2===l||5===a&&8===l||8===a&&5===l?(s=2,st(`  These nodes form the TOP side (${s}) of element ${t}`)):(6===a&&8===l||8===a&&6===l||6===a&&7===l||7===a&&6===l||7===a&&8===l||8===a&&7===l)&&(s=3,st(`  These nodes form the RIGHT side (${s}) of element ${t}`)),this.parsedMesh.boundaryElements[e.tag].push([t,s]),st(`  Added element-side pair [${t}, ${s}] to boundary tag ${e.tag}`),i=!0;break}}i||lt(`Could not find element containing boundary nodes ${n} and ${o}. Boundary may be incomplete.`)})))}})),this.boundaryElementsProcessed=!0,this.parsedMesh.boundaryElements.length>0&&void 0===this.parsedMesh.boundaryElements[0])){const e=[];for(let t=1;t<this.parsedMesh.boundaryElements.length;t++)this.parsedMesh.boundaryElements[t]&&e.push(this.parsedMesh.boundaryElements[t]);this.parsedMesh.boundaryElements=e}}}return this.parsedMesh}}class Vt extends St{constructor({numElementsX:e=null,maxX:t=null,elementOrder:n="linear",parsedMesh:o=null}){super({numElementsX:e,maxX:t,numElementsY:1,maxY:0,meshDimension:"1D",elementOrder:n,parsedMesh:o}),null!==this.numElementsX&&null!==this.maxX||lt("numElementsX and maxX are required parameters when generating a 1D mesh from geometry")}generateMesh(){let e=[];let t,n;if("linear"===this.elementOrder){t=this.numElementsX+1,n=(this.maxX-0)/this.numElementsX,e[0]=0;for(let o=1;o<t;o++)e[o]=e[o-1]+n}else if("quadratic"===this.elementOrder){t=2*this.numElementsX+1,n=(this.maxX-0)/this.numElementsX,e[0]=0;for(let o=1;o<t;o++)e[o]=e[o-1]+n/2}const o=this.generateNodalNumbering1D(this.numElementsX,t,this.elementOrder),i=this.findBoundaryElements();return st("Generated node X coordinates: "+JSON.stringify(e)),{nodesXCoordinates:e,totalNodesX:t,nodalNumbering:o,boundaryElements:i}}generateNodalNumbering1D(e,t,n){let o=[];if("linear"===n)for(let t=0;t<e;t++){o[t]=[];for(let e=1;e<=2;e++)o[t][e-1]=t+e}else if("quadratic"===n){let t=0;for(let n=0;n<e;n++){o[n]=[];for(let e=1;e<=3;e++)o[n][e-1]=n+e+t;t+=1}}return o}findBoundaryElements(){const e=[];for(let t=0;t<2;t++)e.push([]);return e[0].push([0,0]),e[1].push([this.numElementsX-1,1]),st("Identified boundary elements by side: "+JSON.stringify(e)),this.boundaryElementsProcessed=!0,e}}class It extends St{constructor({numElementsX:e=null,maxX:t=null,numElementsY:n=null,maxY:o=null,elementOrder:i="linear",parsedMesh:r=null,angleLeft:s=90,angleRight:a=90}){super({numElementsX:e,maxX:t,numElementsY:n,maxY:o,meshDimension:"2D",elementOrder:i,parsedMesh:r}),this.angleLeft=s,this.angleRight=a,r||null!==this.numElementsX&&null!==this.maxX&&null!==this.numElementsY&&null!==this.maxY||lt("numElementsX, maxX, numElementsY, and maxY are required parameters when generating a 2D mesh from geometry")}generateMesh(){let e=[],t=[];let n,o,i,r;if("linear"===this.elementOrder){n=this.numElementsX+1,o=this.numElementsY+1,i=(this.maxX-0)/this.numElementsX,r=(this.maxY-0)/this.numElementsY,e[0]=0,t[0]=0;for(let n=1;n<o;n++)e[n]=e[0],t[n]=t[0]+n*r;for(let s=1;s<n;s++){const n=s*o;e[n]=e[0]+s*i,t[n]=t[0];for(let i=1;i<o;i++)e[n+i]=e[n],t[n+i]=t[n]+i*r}}else if("quadratic"===this.elementOrder){n=2*this.numElementsX+1,o=2*this.numElementsY+1,i=(this.maxX-0)/this.numElementsX,r=(this.maxY-0)/this.numElementsY,e[0]=0,t[0]=0;for(let n=1;n<o;n++)e[n]=e[0],t[n]=t[0]+n*r/2;for(let s=1;s<n;s++){const n=s*o;e[n]=e[0]+s*i/2,t[n]=t[0];for(let i=1;i<o;i++)e[n+i]=e[n],t[n+i]=t[n]+i*r/2}}if(90!==this.angleLeft||90!==this.angleRight){const i=Math.PI/180,r=Math.tan(this.angleLeft*i),s=Math.tan(this.angleRight*i),a=1e-12;for(let i=0;i<o;i++){const l=t[i],c=Math.abs(r)<a?0:l/r,u=Math.abs(s)<a?this.maxX:this.maxX-l/s;for(let t=0;t<n;t++){const r=1===n?0:t/(n-1);e[t*o+i]=c+(u-c)*r}}}const s=this.generateNodalNumbering2D(this.numElementsX,this.numElementsY,o,this.elementOrder),a=this.findBoundaryElements();return st("Generated node X coordinates: "+JSON.stringify(e)),st("Generated node Y coordinates: "+JSON.stringify(t)),{nodesXCoordinates:e,nodesYCoordinates:t,totalNodesX:n,totalNodesY:o,nodalNumbering:s,boundaryElements:a}}generateNodalNumbering2D(e,t,n,o){let i=0,r=[];if("linear"===o){let n=0,o=2;for(let i=0;i<e*t;i++)n+=1,r[i]=[],r[i][0]=i+o-1,r[i][1]=i+o,r[i][2]=i+o+t,r[i][3]=i+o+t+1,n===t&&(o+=1,n=0)}else if("quadratic"===o)for(let o=1;o<=e;o++)for(let e=1;e<=t;e++){r[i]=[];for(let t=1;t<=3;t++){let s=3*t-2;r[i][s-1]=n*(2*o+t-3)+2*e-1,r[i][s]=r[i][s-1]+1,r[i][s+1]=r[i][s-1]+2}i+=1}return r}findBoundaryElements(){const e=[];for(let t=0;t<4;t++)e.push([]);for(let t=0;t<this.numElementsX;t++)for(let n=0;n<this.numElementsY;n++){const o=t*this.numElementsY+n;0===n&&e[0].push([o,0]),0===t&&e[1].push([o,1]),n===this.numElementsY-1&&e[2].push([o,2]),t===this.numElementsX-1&&e[3].push([o,3])}return st("Identified boundary elements by side: "+JSON.stringify(e)),this.boundaryElementsProcessed=!0,e}}class Tt{constructor({meshDimension:e,elementOrder:t}){this.meshDimension=e,this.elementOrder=t}getGaussPointsAndWeights(){let e=[],t=[];return"linear"===this.elementOrder?(e[0]=.5,t[0]=1):"quadratic"===this.elementOrder&&(e[0]=(1-Math.sqrt(.6))/2,e[1]=.5,e[2]=(1+Math.sqrt(.6))/2,t[0]=5/18,t[1]=8/18,t[2]=5/18),{gaussPoints:e,gaussWeights:t}}}function Xt(e){const{meshDimension:t,numElementsX:n,numElementsY:o,maxX:i,maxY:r,elementOrder:s,parsedMesh:a,angleLeft:l,angleRight:c}=e;let u;"1D"===t?u=new Vt({numElementsX:n,maxX:i,elementOrder:s,parsedMesh:a}):"2D"===t?u=new It({numElementsX:n,maxX:i,numElementsY:o,maxY:r,elementOrder:s,parsedMesh:a,angleLeft:l,angleRight:c}):lt("Mesh dimension must be either '1D' or '2D'");const d=u.boundaryElementsProcessed?u.parsedMesh:u.generateMesh();let f=d.nodesXCoordinates,m=d.nodesYCoordinates,h=d.totalNodesX,p=d.totalNodesY,g=d.nodalNumbering,y=d.boundaryElements;let b,v;return null!=a?(b=g.length,v=f.length,st(`Using parsed mesh with ${b} elements and ${v} nodes`)):(b=n*("2D"===t?o:1),v=h*("2D"===t?p:1),st(`Using mesh generated from geometry with ${b} elements and ${v} nodes`)),{nodesXCoordinates:f,nodesYCoordinates:m,totalNodesX:h,totalNodesY:p,nop:g,boundaryElements:y,totalElements:b,totalNodes:v,meshDimension:t,elementOrder:s}}function Rt(e){const{totalNodes:t,nop:n,meshDimension:o,elementOrder:i}=e;let r=[],s=[];for(let e=0;e<t;e++){r[e]=0,s.push([]);for(let n=0;n<t;n++)s[e][n]=0}const a=new Pt({meshDimension:o,elementOrder:i});let l=new Tt({meshDimension:o,elementOrder:i}).getGaussPointsAndWeights();return{residualVector:r,jacobianMatrix:s,localToGlobalMap:[],basisFunctions:a,gaussPoints:l.gaussPoints,gaussWeights:l.gaussWeights,nodesPerElement:n[0].length}}function jt(e){const{basisFunction:t,basisFunctionDerivKsi:n,nodesXCoordinates:o,localToGlobalMap:i,nodesPerElement:r}=e;let s=0,a=0;for(let e=0;e<r;e++)s+=o[i[e]]*t[e],a+=o[i[e]]*n[e];let l=a,c=[];for(let e=0;e<r;e++)c[e]=n[e]/l;return{xCoordinates:s,detJacobian:l,basisFunctionDerivX:c}}function Yt(e){const{basisFunction:t,basisFunctionDerivKsi:n,basisFunctionDerivEta:o,nodesXCoordinates:i,nodesYCoordinates:r,localToGlobalMap:s,nodesPerElement:a}=e;let l=0,c=0,u=0,d=0,f=0,m=0;for(let e=0;e<a;e++)l+=i[s[e]]*t[e],c+=r[s[e]]*t[e],u+=i[s[e]]*n[e],d+=i[s[e]]*o[e],f+=r[s[e]]*n[e],m+=r[s[e]]*o[e];let h=u*m-d*f,p=[],g=[];for(let e=0;e<a;e++)p[e]=(m*n[e]-f*o[e])/h,g[e]=(u*o[e]-d*n[e])/h;return{xCoordinates:l,yCoordinates:c,detJacobian:h,basisFunctionDerivX:p,basisFunctionDerivY:g}}function Bt(e,t,n){const[o,i,r]=n,s=(i[1]-r[1])*(o[0]-r[0])+(r[0]-i[0])*(o[1]-r[1]),a=((i[1]-r[1])*(e-r[0])+(r[0]-i[0])*(t-r[1]))/s,l=((r[1]-o[1])*(e-r[0])+(o[0]-r[0])*(t-r[1]))/s;return{inside:a>=-1e-12&&l>=-1e-12&&1-a-l>=-1e-12,ksi:a,eta:l}}function qt(e,t,n){const[o,i]=function(e){const[t,n,o,i]=e;return[[t,n,i],[t,o,i]]}(n),r=Bt(e,t,o),s=Bt(e,t,i),a=r.inside||s.inside;let l=0,c=0;if(a){const[o,i,r,s]=n,a=(n,o)=>Math.abs((o[0]-n[0])*(n[1]-t)-(n[0]-e)*(o[1]-n[1]))/Math.sqrt((o[0]-n[0])**2+(o[1]-n[1])**2),u=a(o,i),d=a(r,s),f=a(o,r);l=u/(u+d),c=f/(f+a(i,s))}return{inside:a,ksi:l,eta:c}}function Wt(e){const{nop:t,nodesXCoordinates:n}=e,o=n.length,i=t[0].length,r=Array.from({length:o},(()=>[])),s=Array(o).fill(0);for(let e=0;e<t.length;e++)for(let n=0;n<i;n++){const o=t[e][n]-1;s[o]=s[o]+1,r[o].push(e)}return{nodeNeighbors:r,neighborCount:s}}function Gt(e){let t,n=[],o=[],i=0;const{nodesXCoordinates:r,nodesYCoordinates:s,nop:a,boundaryElements:l,meshDimension:c,elementOrder:u}=e;"1D"===c?("linear"===u||"quadratic"===u)&&(t={0:[0],1:[1]}):"2D"===c&&("linear"===u?t={0:[0,2],1:[0,1],2:[1,3],3:[2,3]}:"quadratic"===u&&(t={0:[0,3,6],1:[0,1,2],2:[2,5,8],3:[6,7,8]}));for(let e=0;e<l.length;e++)for(let c=0;c<l[e].length;c++){n[i]=l[e][c],i++;const[u,d]=l[e][c];let f=t[d],m=[],h=[];for(let e=0;e<f.length;e++){const t=a[u][f[e]]-1;m.push(r[t]),h.push(s[t])}for(let e=0;e<m.length-1;e++)o.push([[m[e],h[e]],[m[e+1],h[e+1]]])}return o}class _t{constructor(e,t,n,o,i){this.boundaryConditions=e,this.boundaryElements=t,this.nop=n,this.meshDimension=o,this.elementOrder=i}imposeConstantTempBoundaryConditions(e,t){"1D"===this.meshDimension?Object.keys(this.boundaryConditions).forEach((n=>{if("constantTemperature"===this.boundaryConditions[n][0]){const o=this.boundaryConditions[n][1];st(`Boundary ${n}: Applying constant temperature of ${o} K (Dirichlet condition)`),this.boundaryElements[n].forEach((([n,i])=>{if("linear"===this.elementOrder){({0:[0],1:[1]})[i].forEach((i=>{const r=this.nop[n][i]-1;st(`  - Applied constant temperature to node ${r+1} (element ${n+1}, local node ${i+1})`),e[r]=o;for(let n=0;n<e.length;n++)t[r][n]=0;t[r][r]=1}))}else if("quadratic"===this.elementOrder){({0:[0],1:[2]})[i].forEach((i=>{const r=this.nop[n][i]-1;st(`  - Applied constant temperature to node ${r+1} (element ${n+1}, local node ${i+1})`),e[r]=o;for(let n=0;n<e.length;n++)t[r][n]=0;t[r][r]=1}))}}))}})):"2D"===this.meshDimension&&Object.keys(this.boundaryConditions).forEach((n=>{if("constantTemperature"===this.boundaryConditions[n][0]){const o=this.boundaryConditions[n][1];st(`Boundary ${n}: Applying constant temperature of ${o} K (Dirichlet condition)`),this.boundaryElements[n].forEach((([n,i])=>{if("linear"===this.elementOrder){({0:[0,2],1:[0,1],2:[1,3],3:[2,3]})[i].forEach((i=>{const r=this.nop[n][i]-1;st(`  - Applied constant temperature to node ${r+1} (element ${n+1}, local node ${i+1})`),e[r]=o;for(let n=0;n<e.length;n++)t[r][n]=0;t[r][r]=1}))}else if("quadratic"===this.elementOrder){({0:[0,3,6],1:[0,1,2],2:[2,5,8],3:[6,7,8]})[i].forEach((i=>{const r=this.nop[n][i]-1;st(`  - Applied constant temperature to node ${r+1} (element ${n+1}, local node ${i+1})`),e[r]=o;for(let n=0;n<e.length;n++)t[r][n]=0;t[r][r]=1}))}}))}}))}imposeConstantTempBoundaryConditionsFront(e,t){"1D"===this.meshDimension?Object.keys(this.boundaryConditions).forEach((n=>{if("constantTemperature"===this.boundaryConditions[n][0]){const o=this.boundaryConditions[n][1];st(`Boundary ${n}: Applying constant temperature of ${o} K (Dirichlet condition)`),this.boundaryElements[n].forEach((([n,i])=>{if("linear"===this.elementOrder){({0:[0],1:[1]})[i].forEach((i=>{const r=this.nop[n][i]-1;st(`  - Applied constant temperature to node ${r+1} (element ${n+1}, local node ${i+1})`),e[r]=1,t[r]=o}))}else if("quadratic"===this.elementOrder){({0:[0],2:[2]})[i].forEach((i=>{const r=this.nop[n][i]-1;st(`  - Applied constant temperature to node ${r+1} (element ${n+1}, local node ${i+1})`),e[r]=1,t[r]=o}))}}))}})):"2D"===this.meshDimension&&Object.keys(this.boundaryConditions).forEach((n=>{if("constantTemperature"===this.boundaryConditions[n][0]){const o=this.boundaryConditions[n][1];st(`Boundary ${n}: Applying constant temperature of ${o} K (Dirichlet condition)`),this.boundaryElements[n].forEach((([n,i])=>{if("linear"===this.elementOrder){({0:[0,2],1:[0,1],2:[1,3],3:[2,3]})[i].forEach((i=>{const r=this.nop[n][i]-1;st(`  - Applied constant temperature to node ${r+1} (element ${n+1}, local node ${i+1})`),e[r]=1,t[r]=o}))}else if("quadratic"===this.elementOrder){({0:[0,3,6],1:[0,1,2],2:[2,5,8],3:[6,7,8]})[i].forEach((i=>{const r=this.nop[n][i]-1;st(`  - Applied constant temperature to node ${r+1} (element ${n+1}, local node ${i+1})`),e[r]=1,t[r]=o}))}}))}}))}imposeConvectionBoundaryConditions(e,t,n,o,i,r,s){let a=[],l=[];Object.keys(this.boundaryConditions).forEach((e=>{const t=this.boundaryConditions[e];"convection"===t[0]&&(a[e]=t[1],l[e]=t[2])})),"1D"===this.meshDimension?Object.keys(this.boundaryConditions).forEach((n=>{if("convection"===this.boundaryConditions[n][0]){const o=a[n],i=l[n];st(`Boundary ${n}: Applying convection with heat transfer coefficient h=${o} W/(m²·K) and external temperature T∞=${i} K`),this.boundaryElements[n].forEach((([n,r])=>{let s;"linear"===this.elementOrder?s=0===r?0:1:"quadratic"===this.elementOrder&&(s=0===r?0:2);const a=this.nop[n][s]-1;st(`  - Applied convection boundary condition to node ${a+1} (element ${n+1}, local node ${s+1})`),e[a]+=-o*i,t[a][a]+=o}))}})):"2D"===this.meshDimension&&Object.keys(this.boundaryConditions).forEach((c=>{if("convection"===this.boundaryConditions[c][0]){const u=a[c],d=l[c];st(`Boundary ${c}: Applying convection with heat transfer coefficient h=${u} W/(m²·K) and external temperature T∞=${d} K`),this.boundaryElements[c].forEach((([a,l])=>{if("linear"===this.elementOrder){let c,f,m,h,p;0===l?(c=n[0],f=0,m=0,h=3,p=2):1===l?(c=0,f=n[0],m=0,h=2,p=1):2===l?(c=n[0],f=1,m=1,h=4,p=2):3===l&&(c=1,f=n[0],m=2,h=4,p=1);let g=s.getBasisFunctions(c,f),y=g.basisFunction,b=g.basisFunctionDerivKsi,v=g.basisFunctionDerivEta,E=0,C=0,w=0,D=0;const M=this.nop[a].length;for(let e=0;e<M;e++){const t=this.nop[a][e]-1;0===l||2===l?(E+=i[t]*b[e],C+=r[t]*b[e]):1!==l&&3!==l||(w+=i[t]*v[e],D+=r[t]*v[e])}let F;F=0===l||2===l?Math.sqrt(E**2+C**2):Math.sqrt(w**2+D**2);for(let n=m;n<h;n+=p){let i=this.nop[a][n]-1;st(`  - Applied convection boundary condition to node ${i+1} (element ${a+1}, local node ${n+1})`),e[i]+=-o[0]*F*y[n]*u*d;for(let e=m;e<h;e+=p){let r=this.nop[a][e]-1;t[i][r]+=-o[0]*F*y[n]*y[e]*u}}}else if("quadratic"===this.elementOrder)for(let c=0;c<3;c++){let f,m,h,p,g;0===l?(f=n[c],m=0,h=0,p=7,g=3):1===l?(f=0,m=n[c],h=0,p=3,g=1):2===l?(f=n[c],m=1,h=2,p=9,g=3):3===l&&(f=1,m=n[c],h=6,p=9,g=1);let y=s.getBasisFunctions(f,m),b=y.basisFunction,v=y.basisFunctionDerivKsi,E=y.basisFunctionDerivEta,C=0,w=0,D=0,M=0;const F=this.nop[a].length;for(let e=0;e<F;e++){const t=this.nop[a][e]-1;0===l||2===l?(C+=i[t]*v[e],w+=r[t]*v[e]):1!==l&&3!==l||(D+=i[t]*E[e],M+=r[t]*E[e])}let $;$=0===l||2===l?Math.sqrt(C**2+w**2):Math.sqrt(D**2+M**2);for(let n=h;n<p;n+=g){let i=this.nop[a][n]-1;st(`  - Applied convection boundary condition to node ${i+1} (element ${a+1}, local node ${n+1})`),e[i]+=-o[c]*$*b[n]*u*d;for(let e=h;e<p;e+=g){let r=this.nop[a][e]-1;t[i][r]+=-o[c]*$*b[n]*b[e]*u}}}}))}}))}imposeConvectionBoundaryConditionsFront(e,t,n,o,i,r){let s=[],a=[];Object.keys(this.boundaryConditions).forEach((e=>{const t=this.boundaryConditions[e];"convection"===t[0]&&(s[e]=t[1],a[e]=t[2])}));const l=this.nop[e].length,c=Array(l).fill().map((()=>Array(l).fill(0))),u=Array(l).fill(0);for(const d in this.boundaryElements)if("convection"===this.boundaryConditions[d]?.[0]){const f=s[d],m=a[d];st(`Boundary ${d}: Applying convection with heat transfer coefficient h=${f} W/(m²·K) and external temperature T∞=${m} K`);const h=this.boundaryElements[d].find((([t,n])=>t===e));if(h){const s=h[1];if("1D"===this.meshDimension){let t;"linear"===this.elementOrder?t=0===s?0:1:"quadratic"===this.elementOrder&&(t=0===s?0:2),st(`  - Applied convection boundary condition to node ${t+1} (element ${e+1}, local node ${t+1})`),u[t]+=-f*m,c[t][t]+=f}else if("2D"===this.meshDimension)if("linear"===this.elementOrder){let a,d,h,p,g;0===s?(a=o[0],d=0,h=0,p=3,g=2):1===s?(a=0,d=o[0],h=0,p=2,g=1):2===s?(a=o[0],d=1,h=1,p=4,g=2):3===s&&(a=1,d=o[0],h=2,p=4,g=1);const y=r.getBasisFunctions(a,d),b=y.basisFunction,v=y.basisFunctionDerivKsi,E=y.basisFunctionDerivEta;let C,w=0,D=0,M=0,F=0;for(let o=0;o<l;o++){const i=this.nop[e][o]-1;0===s||2===s?(w+=t[i]*v[o],D+=n[i]*v[o]):1!==s&&3!==s||(M+=t[i]*E[o],F+=n[i]*E[o])}C=0===s||2===s?Math.sqrt(w**2+D**2):Math.sqrt(M**2+F**2);for(let e=h;e<p;e+=g){u[e]+=-i[0]*C*b[e]*f*m;for(let t=h;t<p;t+=g)c[e][t]+=-i[0]*C*b[e]*b[t]*f}}else if("quadratic"===this.elementOrder)for(let a=0;a<3;a++){let l,d,h,p,g;0===s?(l=o[a],d=0,h=0,p=7,g=3):1===s?(l=0,d=o[a],h=0,p=3,g=1):2===s?(l=o[a],d=1,h=2,p=9,g=3):3===s&&(l=1,d=o[a],h=6,p=9,g=1);let y=r.getBasisFunctions(l,d),b=y.basisFunction,v=y.basisFunctionDerivKsi,E=y.basisFunctionDerivEta,C=0,w=0,D=0,M=0;const F=this.nop[e].length;for(let o=0;o<F;o++){const i=this.nop[e][o]-1;0===s||2===s?(C+=t[i]*v[o],w+=n[i]*v[o]):1!==s&&3!==s||(D+=t[i]*E[o],M+=n[i]*E[o])}let $;$=0===s||2===s?Math.sqrt(C**2+w**2):Math.sqrt(D**2+M**2);for(let e=h;e<p;e+=g){u[e]+=-i[a]*$*b[e]*f*m;for(let t=h;t<p;t+=g)c[e][t]+=-i[a]*$*b[e]*b[t]*f}}}}return{localJacobianMatrix:c,localResidualVector:u}}}function Lt(e,t,n){at("Starting solid heat transfer matrix assembly...");const{nodesXCoordinates:o,nodesYCoordinates:i,nop:r,boundaryElements:s,totalElements:a,meshDimension:l,elementOrder:c}=e;let u=1,d=0;n&&(n.heatTransferCoefficient,u=n.thermalConductivity??1,d=n.heatSource??0);const f=Rt(e),{residualVector:m,jacobianMatrix:h,localToGlobalMap:p,basisFunctions:g,gaussPoints:y,gaussWeights:b,nodesPerElement:v}=f;for(let e=0;e<a;e++){for(let t=0;t<v;t++)p[t]=r[e][t]-1;for(let e=0;e<y.length;e++)if("1D"===l){const t=g.getBasisFunctions(y[e]),n=jt({basisFunction:t.basisFunction,basisFunctionDerivKsi:t.basisFunctionDerivKsi,nodesXCoordinates:o,localToGlobalMap:p,nodesPerElement:v}),{detJacobian:i,basisFunctionDerivX:r}=n;let s=0;for(let e=0;e<v;e++)s+=o[p[e]]*t.basisFunction[e];const a="function"==typeof u?u(s):u,l="function"==typeof d?d(s):d;for(let n=0;n<v;n++){let o=p[n];m[o]-=b[e]*i*l*t.basisFunction[n];for(let t=0;t<v;t++){let s=p[t];h[o][s]+=-b[e]*i*a*(r[n]*r[t])}}}else if("2D"===l)for(let t=0;t<y.length;t++){const n=g.getBasisFunctions(y[e],y[t]),r=Yt({basisFunction:n.basisFunction,basisFunctionDerivKsi:n.basisFunctionDerivKsi,basisFunctionDerivEta:n.basisFunctionDerivEta,nodesXCoordinates:o,nodesYCoordinates:i,localToGlobalMap:p,nodesPerElement:v}),{detJacobian:s,basisFunctionDerivX:a,basisFunctionDerivY:l}=r;let c=0,f=0;for(let e=0;e<v;e++)c+=o[p[e]]*n.basisFunction[e],f+=i[p[e]]*n.basisFunction[e];const E="function"==typeof u?u(c,f):u,C="function"==typeof d?d(c,f):d;for(let o=0;o<v;o++){let i=p[o];m[i]-=b[e]*b[t]*s*C*n.basisFunction[o];for(let n=0;n<v;n++){let r=p[n];h[i][r]+=-b[e]*b[t]*s*E*(a[o]*a[n]+l[o]*l[n])}}}}const E=new _t(t,s,r,l,c);return E.imposeConvectionBoundaryConditions(m,h,y,b,o,i,g),E.imposeConstantTempBoundaryConditions(m,h),at("Solid heat transfer matrix assembly completed"),{jacobianMatrix:h,residualVector:m}}function Kt({elementIndex:e,nop:t,meshData:n,basisFunctions:o,FEAData:i,coefficientFunctions:r}){const{gaussPoints:s,gaussWeights:a,nodesPerElement:l}=i,{nodesXCoordinates:c,nodesYCoordinates:u,meshDimension:d}=n;let f=1,m=0;r&&(f=r.thermalConductivity??1,m=r.heatSource??0);const h=Array(l).fill().map((()=>Array(l).fill(0))),p=Array(l).fill(0),g=Array(l),y=Array(l);for(let n=0;n<l;n++)g[n]=Math.abs(t[e][n]),y[n]=Math.abs(t[e][n])-1;if("1D"===d)for(let e=0;e<s.length;e++){const{basisFunction:t,basisFunctionDerivKsi:n}=o.getBasisFunctions(s[e]),{detJacobian:i,basisFunctionDerivX:r}=jt({basisFunction:t,basisFunctionDerivKsi:n,nodesXCoordinates:c,localToGlobalMap:y,nodesPerElement:l});let u=0;for(let e=0;e<l;e++)u+=c[y[e]]*t[e];const d="function"==typeof f?f(u):f,g="function"==typeof m?m(u):m;for(let n=0;n<l;n++){p[n]-=a[e]*i*g*t[n];for(let t=0;t<l;t++)h[n][t]-=a[e]*i*d*(r[n]*r[t])}}else if("2D"===d)for(let e=0;e<s.length;e++)for(let t=0;t<s.length;t++){const{basisFunction:n,basisFunctionDerivKsi:i,basisFunctionDerivEta:r}=o.getBasisFunctions(s[e],s[t]),d=g.map((e=>e-1)),{detJacobian:y,basisFunctionDerivX:b,basisFunctionDerivY:v}=Yt({basisFunction:n,basisFunctionDerivKsi:i,basisFunctionDerivEta:r,nodesXCoordinates:c,nodesYCoordinates:u,localToGlobalMap:d,nodesPerElement:l});let E=0,C=0;for(let e=0;e<l;e++)E+=c[d[e]]*n[e],C+=u[d[e]]*n[e];const w="function"==typeof f?f(E,C):f,D="function"==typeof m?m(E,C):m;for(let o=0;o<l;o++){p[o]-=a[e]*a[t]*y*D*n[o];for(let n=0;n<l;n++)h[o][n]-=a[e]*a[t]*y*w*(b[o]*b[n]+v[o]*v[n])}}return{localJacobianMatrix:h,localResidualVector:p,ngl:g}}class Jt{constructor(e,t,n,o,i){this.boundaryConditions=e,this.boundaryElements=t,this.nop=n,this.meshDimension=o,this.elementOrder=i}imposeDirichletBoundaryConditions(e,t){"1D"===this.meshDimension?Object.keys(this.boundaryConditions).forEach((n=>{if("constantValue"===this.boundaryConditions[n][0]){const o=this.boundaryConditions[n][1];st(`Boundary ${n}: Applying constant value of ${o} (Dirichlet condition)`),this.boundaryElements[n].forEach((([n,i])=>{if("linear"===this.elementOrder){({0:[0],1:[1]})[i].forEach((i=>{const r=this.nop[n][i]-1;st(`  - Applied constant value to node ${r+1} (element ${n+1}, local node ${i+1})`),e[r]=o;for(let n=0;n<e.length;n++)t[r][n]=0;t[r][r]=1}))}else if("quadratic"===this.elementOrder){({0:[0],1:[2]})[i].forEach((i=>{const r=this.nop[n][i]-1;st(`  - Applied constant value to node ${r+1} (element ${n+1}, local node ${i+1})`),e[r]=o;for(let n=0;n<e.length;n++)t[r][n]=0;t[r][r]=1}))}}))}})):"2D"===this.meshDimension&&Object.keys(this.boundaryConditions).forEach((n=>{if("constantValue"===this.boundaryConditions[n][0]){const o=this.boundaryConditions[n][1];st(`Boundary ${n}: Applying constant value of ${o} (Dirichlet condition)`),this.boundaryElements[n].forEach((([n,i])=>{if("linear"===this.elementOrder){({0:[0,2],1:[0,1],2:[1,3],3:[2,3]})[i].forEach((i=>{const r=this.nop[n][i]-1;st(`  - Applied constant value to node ${r+1} (element ${n+1}, local node ${i+1})`),e[r]=o;for(let n=0;n<e.length;n++)t[r][n]=0;t[r][r]=1}))}else if("quadratic"===this.elementOrder){({0:[0,3,6],1:[0,1,2],2:[2,5,8],3:[6,7,8]})[i].forEach((i=>{const r=this.nop[n][i]-1;st(`  - Applied constant value to node ${r+1} (element ${n+1}, local node ${i+1})`),e[r]=o;for(let n=0;n<e.length;n++)t[r][n]=0;t[r][r]=1}))}}))}}))}imposeConstantValueBoundaryConditionsFront(e,t){"1D"===this.meshDimension?Object.keys(this.boundaryConditions).forEach((n=>{if("constantValue"===this.boundaryConditions[n][0]){const o=this.boundaryConditions[n][1];st(`Boundary ${n}: Applying constant value of ${o} (Dirichlet condition)`),this.boundaryElements[n].forEach((([n,i])=>{if("linear"===this.elementOrder){({0:[0],1:[1]})[i].forEach((i=>{const r=this.nop[n][i]-1;st(`  - Applied constant value to node ${r+1} (element ${n+1}, local node ${i+1})`),e[r]=1,t[r]=o}))}else if("quadratic"===this.elementOrder){({0:[0],2:[2]})[i].forEach((i=>{const r=this.nop[n][i]-1;st(`  - Applied constant value to node ${r+1} (element ${n+1}, local node ${i+1})`),e[r]=1,t[r]=o}))}}))}})):"2D"===this.meshDimension&&Object.keys(this.boundaryConditions).forEach((n=>{if("constantValue"===this.boundaryConditions[n][0]){const o=this.boundaryConditions[n][1];st(`Boundary ${n}: Applying constant value of ${o} (Dirichlet condition)`),this.boundaryElements[n].forEach((([n,i])=>{if("linear"===this.elementOrder){({0:[0,2],1:[0,1],2:[1,3],3:[2,3]})[i].forEach((i=>{const r=this.nop[n][i]-1;st(`  - Applied constant value to node ${r+1} (element ${n+1}, local node ${i+1})`),e[r]=1,t[r]=o}))}else if("quadratic"===this.elementOrder){({0:[0,3,6],1:[0,1,2],2:[2,5,8],3:[6,7,8]})[i].forEach((i=>{const r=this.nop[n][i]-1;st(`  - Applied constant value to node ${r+1} (element ${n+1}, local node ${i+1})`),e[r]=1,t[r]=o}))}}))}}))}}function Ut(e,t,n,o){at("Starting front propagation matrix assembly...");let i=1-o+.01;st(`eikonalViscousTerm: ${i}`),st(`eikonalActivationFlag: ${o}`);const{nodesXCoordinates:r,nodesYCoordinates:s,nop:a,boundaryElements:l,totalElements:c,meshDimension:u,elementOrder:d}=e,f=Rt(e),{residualVector:m,jacobianMatrix:h,localToGlobalMap:p,basisFunctions:g,gaussPoints:y,gaussWeights:b,nodesPerElement:v}=f;for(let e=0;e<c;e++){for(let t=0;t<v;t++)p[t]=a[e][t]-1;for(let e=0;e<y.length;e++)if("1D"===u){errorLog("1D front propagation is not yet supported");let t=g.getBasisFunctions(y[e]);const o=jt({basisFunction:t.basisFunction,basisFunctionDerivKsi:t.basisFunctionDerivKsi,nodesXCoordinates:r,localToGlobalMap:p,nodesPerElement:v}),{detJacobian:i,basisFunctionDerivX:s}=o;t.basisFunction;let a=0;for(let e=0;e<v;e++)a+=n[p[e]]*s[e];for(let e=0;e<v;e++){p[e];for(let e=0;e<v;e++)p[e]}}else if("2D"===u)for(let t=0;t<y.length;t++){let a=g.getBasisFunctions(y[e],y[t]);const l=Yt({basisFunction:a.basisFunction,basisFunctionDerivKsi:a.basisFunctionDerivKsi,basisFunctionDerivEta:a.basisFunctionDerivEta,nodesXCoordinates:r,nodesYCoordinates:s,localToGlobalMap:p,nodesPerElement:v}),{detJacobian:c,basisFunctionDerivX:u,basisFunctionDerivY:d}=l,f=a.basisFunction;let E=0,C=0;for(let e=0;e<v;e++)E+=n[p[e]]*u[e],C+=n[p[e]]*d[e];for(let n=0;n<v;n++){let r=p[n];m[r]+=i*b[e]*b[t]*c*u[n]*E+i*b[e]*b[t]*c*d[n]*C,0!==o&&(m[r]+=o*(b[e]*b[t]*c*f[n]*Math.sqrt(E**2+C**2)-b[e]*b[t]*c*f[n]));for(let s=0;s<v;s++){let a=p[s];h[r][a]+=-i*b[e]*b[t]*c*(u[n]*u[s]+d[n]*d[s]),0!==o&&(h[r][a]+=o*(-c*E*f[n]*b[e]*b[t]/Math.sqrt(E**2+C**2+1e-8))*u[s]-o*(c*C*f[n]*b[e]*b[t]/Math.sqrt(E**2+C**2+1e-8))*d[s])}}}}return new Jt(t,l,a,u,d).imposeDirichletBoundaryConditions(m,h),at("Front propagation matrix assembly completed"),{jacobianMatrix:h,residualVector:m}}function Ht({elementIndex:e,nop:t,meshData:n,basisFunctions:o,FEAData:i,solutionVector:r,eikonalActivationFlag:s}){const{gaussPoints:a,gaussWeights:l,nodesPerElement:c}=i,{nodesXCoordinates:u,nodesYCoordinates:d,meshDimension:f}=n;let m=1-s+.01;const h=Array(c).fill().map((()=>Array(c).fill(0))),p=Array(c).fill(0),g=Array(c),y=Array(c);for(let n=0;n<c;n++)g[n]=Math.abs(t[e][n]),y[n]=Math.abs(t[e][n])-1;for(let e=0;e<a.length;e++)if("1D"===f){errorLog("1D front propagation is not yet supported");let t=o.getBasisFunctions(a[e]);const n=jt({basisFunction:t.basisFunction,basisFunctionDerivKsi:t.basisFunctionDerivKsi,nodesXCoordinates:u,localToGlobalMap:y,nodesPerElement:c}),{detJacobian:i,basisFunctionDerivX:s}=n;t.basisFunction;let l=0;for(let e=0;e<c;e++)l+=r[y[e]]*s[e];for(let e=0;e<c;e++){y[e];for(let e=0;e<c;e++)y[e]}}else if("2D"===f)for(let t=0;t<a.length;t++){const{basisFunction:n,basisFunctionDerivKsi:i,basisFunctionDerivEta:f}=o.getBasisFunctions(a[e],a[t]),{detJacobian:g,basisFunctionDerivX:b,basisFunctionDerivY:v}=Yt({basisFunction:n,basisFunctionDerivKsi:i,basisFunctionDerivEta:f,nodesXCoordinates:u,nodesYCoordinates:d,localToGlobalMap:y,nodesPerElement:c});let E=0,C=0;for(let e=0;e<c;e++)E+=r[y[e]]*b[e],C+=r[y[e]]*v[e];for(let o=0;o<c;o++){y[o],p[o]+=m*l[e]*l[t]*g*b[o]*E+m*l[e]*l[t]*g*v[o]*C,0!==s&&(p[o]+=s*(l[e]*l[t]*g*n[o]*Math.sqrt(E**2+C**2)-l[e]*l[t]*g*n[o]));for(let i=0;i<c;i++)h[o][i]-=m*l[e]*l[t]*g*(b[o]*b[i]+v[o]*v[i]),0!==s&&(h[o][i]+=s*(-g*E*n[o]*l[e]*l[t]/Math.sqrt(E**2+C**2+1e-8))*b[i]-s*(g*C*n[o]*l[e]*l[t]/Math.sqrt(E**2+C**2+1e-8))*v[i])}}return{localJacobianMatrix:h,localResidualVector:p,ngl:g}}const zt={},Zt={},Qt={currentElementIndex:0},en={};let tn;function nn(e,t,n,o={}){const i=Rt(t),r=t.nodesXCoordinates.length,s=t.totalElements;!function(e,t){zt.nodalNumbering=Array(t).fill().map((()=>Array(e).fill(0))),zt.nodeConstraintCode=Array(e).fill(0),zt.boundaryValues=Array(e).fill(0),zt.globalResidualVector=Array(e).fill(0),zt.solutionVector=Array(e).fill(0),zt.topologyData=Array(t).fill(0),zt.lateralData=Array(t).fill(0),Zt.writeFlag=0,Zt.totalNodes=e,Zt.transformationFlag=0,Zt.nodesPerElement=Array(t).fill(0),Zt.determinant=1;const n=Math.max(e,2e3);Zt.globalSolutionVector=Array(n).fill(0),Zt.frontDataIndex=0,Qt.localJacobianMatrix=Array(e).fill().map((()=>Array(e).fill(0))),Qt.currentElementIndex=0;const o=function(e,t){const n=Math.max(Math.ceil(Math.sqrt(t))*e,2*e);return n*t}(e,t);en.frontValues=Array(o).fill(0),en.columnHeaders=Array(n).fill(0),en.pivotRow=Array(n).fill(0),en.pivotData=Array(o).fill(0)}(i.nodesPerElement,s),at("Solving system using frontal..."),console.time("systemSolving"),tn=new Pt({meshDimension:t.meshDimension,elementOrder:t.elementOrder});for(let e=0;e<t.totalElements;e++)for(let n=0;n<i.nodesPerElement;n++)zt.nodalNumbering[e][n]=t.nop[e][n];for(let e=0;e<t.nodesXCoordinates.length;e++)zt.nodeConstraintCode[e]=0,zt.boundaryValues[e]=0;let a;e===Kt?(a=new _t(n,t.boundaryElements,t.nop,t.meshDimension,t.elementOrder),a.imposeConstantTempBoundaryConditionsFront(zt.nodeConstraintCode,zt.boundaryValues)):e===Ht&&(a=new Jt(n,t.boundaryElements,t.nop,t.meshDimension,t.elementOrder),a.imposeConstantValueBoundaryConditionsFront(zt.nodeConstraintCode,zt.boundaryValues));for(let e=0;e<t.nodesXCoordinates.length;e++)zt.globalResidualVector[e]=0;Zt.totalNodes=t.nodesXCoordinates.length,Zt.writeFlag=0,Zt.transformationFlag=1,Zt.determinant=1;for(let e=0;e<t.totalElements;e++)Zt.nodesPerElement[e]=i.nodesPerElement;Zt.currentSolutionVector=o.solutionVector,Zt.eikonalActivationFlag=o.eikonalActivationFlag,Zt.coefficientFunctions=o.coefficientFunctions,function(e,t,n,o){const i=e.totalElements,r=e.nodesXCoordinates.length,s=Math.max(r,Zt.globalSolutionVector.length);let a,l=Array(t.nodesPerElement).fill(0),c=Array(t.nodesPerElement).fill(0),u=Array(s).fill(0),d=Array(s).fill(0),f=Array(s).fill(0),m=Array(s).fill(0),h=Array(s).fill(0),p=Array(s).fill().map((()=>Array(s).fill(0))),g=Array(r).fill(0),y=Array(r).fill(0),b=Array(r).fill(0),v=1;Zt.writeFlag++;let E=1,C=1;Qt.currentElementIndex=0;for(let e=0;e<Zt.totalNodes;e++)g[e]=0,y[e]=0;if(0!==Zt.transformationFlag){for(let e=0;e<Zt.totalNodes;e++)b[e]=0;for(let e=0;e<i;e++){let t=i-e-1;for(let e=0;e<Zt.nodesPerElement[t];e++){let n=zt.nodalNumbering[t][e];0===b[n-1]&&(b[n-1]=1,zt.nodalNumbering[t][e]=-zt.nodalNumbering[t][e])}}}Zt.transformationFlag=0;let w=0,D=0;for(let e=0;e<s;e++)for(let t=0;t<s;t++)p[t][e]=0;for(;;){let r=!1,b=0,M=0;if(Qt.currentElementIndex<i&&(Qt.currentElementIndex++,r=on(e,t,n,o)),r){const e=Qt.currentElementIndex;b=Zt.nodesPerElement[e-1],M=Zt.nodesPerElement[e-1];for(let t=0;t<M;t++){let n,o,i=zt.nodalNumbering[e-1][t];if(0===w)w++,l[t]=w,en.columnHeaders[w-1]=i;else{for(n=0;n<w&&Math.abs(i)!==Math.abs(en.columnHeaders[n]);n++);n===w?(w++,l[t]=w,en.columnHeaders[w-1]=i):(l[t]=n+1,en.columnHeaders[n]=i)}if(0===D)D++,c[t]=D,u[D-1]=i;else{for(o=0;o<D&&Math.abs(i)!==Math.abs(u[o]);o++);o===D?(D++,c[t]=D,u[D-1]=i):(c[t]=o+1,u[o]=i)}}if(D>s||w>s)return void lt("Error: systemSize not large enough");for(let e=0;e<M;e++){let t=l[e];for(let n=0;n<b;n++){p[c[n]-1][t-1]+=Qt.localJacobianMatrix[n][e]}}}let F=0;for(let e=0;e<w;e++)en.columnHeaders[e]<0&&(f[F]=e+1,F++);let $=0,A=0;for(let e=0;e<D;e++){let t=u[e];if(t<0){d[A]=e+1,A++;let n=Math.abs(t);1===zt.nodeConstraintCode[n-1]&&(m[$]=e+1,$++,zt.nodeConstraintCode[n-1]=2,zt.globalResidualVector[n-1]=zt.boundaryValues[n-1])}}if($>0)for(let e=0;e<$;e++){let t=m[e]-1,n=Math.abs(u[t]);for(let e=0;e<w;e++){p[t][e]=0,Math.abs(en.columnHeaders[e])===n&&(p[t][e]=1)}}if(F>C||Qt.currentElementIndex<i){if(0===F)return void lt("Error: no more rows fully summed");let e=d[0],t=f[0],n=p[e-1][t-1];if(Math.abs(n)<1e-4){n=0;for(let o=0;o<F;o++){let i=f[o];for(let o=0;o<A;o++){let r=d[o],s=p[r-1][i-1];Math.abs(s)>Math.abs(n)&&(n=s,t=i,e=r)}}}let o=Math.abs(u[e-1]);a=Math.abs(en.columnHeaders[t-1]);let r=o+a+g[o-1]+y[a-1];Zt.determinant=Zt.determinant*n*(-1)**r/Math.abs(n);for(let e=0;e<Zt.totalNodes;e++)e>=o&&g[e]--,e>=a&&y[e]--;if(Math.abs(n)<1e-10&&lt(`Matrix singular or ill-conditioned, currentElementIndex=${Qt.currentElementIndex}, pivotGlobalRowIndex=${o}, pivotColumnGlobalIndex=${a}, pivotValue=${n}`),0===n)return;for(let t=0;t<w;t++)en.pivotRow[t]=p[e-1][t]/n;let s=zt.globalResidualVector[o-1]/n;if(zt.globalResidualVector[o-1]=s,h[e-1]=n,e>1)for(let n=0;n<e-1;n++){let e=Math.abs(u[n]),o=p[n][t-1];if(h[n]=o,t>1&&0!==o)for(let e=0;e<t-1;e++)p[n][e]-=o*en.pivotRow[e];if(t<w)for(let e=t;e<w;e++)p[n][e-1]=p[n][e]-o*en.pivotRow[e];zt.globalResidualVector[e-1]-=o*s}if(e<D)for(let n=e;n<D;n++){let e=Math.abs(u[n]),o=p[n][t-1];if(h[n]=o,t>1)for(let e=0;e<t-1;e++)p[n-1][e]=p[n][e]-o*en.pivotRow[e];if(t<w)for(let e=t;e<w;e++)p[n-1][e-1]=p[n][e]-o*en.pivotRow[e];zt.globalResidualVector[e-1]-=o*s}for(let e=0;e<D;e++)en.pivotData[E+e-1]=h[e];E+=D;for(let e=0;e<D;e++)en.pivotData[E+e-1]=u[e];E+=D,en.pivotData[E-1]=e,E++;for(let e=0;e<w;e++)en.frontValues[v-1+e]=en.pivotRow[e];v+=w;for(let e=0;e<w;e++)en.frontValues[v-1+e]=en.columnHeaders[e];v+=w,en.frontValues[v-1]=o,en.frontValues[v]=w,en.frontValues[v+1]=t,en.frontValues[v+2]=n,v+=4;for(let e=0;e<D;e++)p[e][w-1]=0;for(let e=0;e<w;e++)p[D-1][e]=0;if(w--,t<w+1)for(let e=t-1;e<w;e++)en.columnHeaders[e]=en.columnHeaders[e+1];if(D--,e<D+1)for(let t=e-1;t<D;t++)u[t]=u[t+1];if(D>1||Qt.currentElementIndex<i)continue;if(a=Math.abs(en.columnHeaders[0]),e=1,n=p[0][0],o=Math.abs(u[0]),t=1,r=o+a+g[o-1]+y[a-1],Zt.determinant=Zt.determinant*n*(-1)**r/Math.abs(n),en.pivotRow[0]=1,Math.abs(n)<1e-10&&lt(`Matrix singular or ill-conditioned, currentElementIndex=${Qt.currentElementIndex}, pivotGlobalRowIndex=${o}, pivotColumnGlobalIndex=${a}, pivotValue=${n}`),0===n)return;zt.globalResidualVector[o-1]=zt.globalResidualVector[o-1]/n,en.frontValues[v-1]=en.pivotRow[0],v++,en.frontValues[v-1]=en.columnHeaders[0],v++,en.frontValues[v-1]=o,en.frontValues[v]=w,en.frontValues[v+1]=t,en.frontValues[v+2]=n,v+=4,en.pivotData[E-1]=h[0],E++,en.pivotData[E-1]=u[0],E++,en.pivotData[E-1]=e,E++,Zt.frontDataIndex=v,1===Zt.writeFlag&&st(`total ecs transfer in matrix reduction=${v}`),rn(v);break}}}(t,i,a,e);for(let e=0;e<t.nodesXCoordinates.length;e++)zt.solutionVector[e]=Zt.globalSolutionVector[e];const{nodesXCoordinates:l,nodesYCoordinates:c}=t;for(let e=0;e<t.nodesXCoordinates.length;e++)"1D"===t.meshDimension?st(`${l[e].toExponential(5)}  ${zt.solutionVector[e].toExponential(5)}`):st(`${l[e].toExponential(5)}  ${c[e].toExponential(5)}  ${zt.solutionVector[e].toExponential(5)}`);console.timeEnd("systemSolving"),at("System solved successfully");const{nodesXCoordinates:u,nodesYCoordinates:d}=t;return{solutionVector:zt.solutionVector.slice(0,r),nodesCoordinates:{nodesXCoordinates:u,nodesYCoordinates:d}}}function on(e,t,n,o){const i=Qt.currentElementIndex-1;if(i<0||i>=e.totalElements)return lt(`Skipping out-of-range elementIndex=${i} (totalElements=${e.totalElements})`),!1;const{localJacobianMatrix:r,localResidualVector:s,ngl:a}=o({elementIndex:i,nop:zt.nodalNumbering,meshData:e,basisFunctions:tn,FEAData:t,solutionVector:Zt.currentSolutionVector,eikonalActivationFlag:Zt.eikonalActivationFlag,coefficientFunctions:Zt.coefficientFunctions});let l=Array(t.nodesPerElement).fill().map((()=>Array(t.nodesPerElement).fill(0))),c=Array(t.nodesPerElement).fill(0);if(o===Kt){let o=!1;for(const t in e.boundaryElements)if("convection"===n.boundaryConditions[t]?.[0]&&e.boundaryElements[t].some((([e,t])=>e===i))){o=!0;break}if(o){const{gaussPoints:o,gaussWeights:r}=t,s=n.imposeConvectionBoundaryConditionsFront(i,e.nodesXCoordinates,e.nodesYCoordinates,o,r,tn);l=s.localJacobianMatrix,c=s.localResidualVector}}for(let e=0;e<t.nodesPerElement;e++)for(let n=0;n<t.nodesPerElement;n++)Qt.localJacobianMatrix[e][n]=r[e][n]+l[e][n];for(let e=0;e<t.nodesPerElement;e++){const t=a[e]-1;zt.globalResidualVector[t]+=s[e]+c[e]}return!0}function rn(e){for(let e=0;e<Zt.totalNodes;e++)Zt.globalSolutionVector[e]=zt.boundaryValues[e];for(let t=1;t<=Zt.totalNodes;t++){e-=4;let n=en.frontValues[e-1],o=en.frontValues[e],i=en.frontValues[e+1];if(en.frontValues[e+2],1===t)e--,en.columnHeaders[0]=en.frontValues[e-1],e--,en.pivotRow[0]=en.frontValues[e-1];else{e-=o;for(let t=0;t<o;t++)en.columnHeaders[t]=en.frontValues[e-1+t];e-=o;for(let t=0;t<o;t++)en.pivotRow[t]=en.frontValues[e-1+t]}let r=Math.abs(en.columnHeaders[i-1]);if(zt.nodeConstraintCode[r-1]>0)continue;let s=0;en.pivotRow[i-1]=0;for(let e=0;e<o;e++)s-=en.pivotRow[e]*Zt.globalSolutionVector[Math.abs(en.columnHeaders[e])-1];Zt.globalSolutionVector[r-1]=s+zt.globalResidualVector[n-1],zt.nodeConstraintCode[r-1]=1}1===Zt.writeFlag&&st(`value of frontDataCounter after backsubstitution=${e}`)}function sn(e,t={}){let n=0,o=!1,i=0,r=[],s=[];const{maxIterations:a=100,tolerance:l=1e-4}=t,c=t.meshData.nodesXCoordinates.length;let u=new Float64Array(c),d=new Float64Array(c);for(t.initialSolution&&t.initialSolution.length===c&&(u=new Float64Array(t.initialSolution));i<a&&!o;){if(ot(1,d,u),"frontal"===t.solverMethod){d=nn(Ht,t.meshData,t.boundaryConditions,{solutionVector:u,eikonalActivationFlag:t.eikonalActivationFlag}).solutionVector}else{({jacobianMatrix:r,residualVector:s}=e(t.meshData,t.boundaryConditions,u,t.eikonalActivationFlag));d=Nt(t.solverMethod,r,s).solutionVector}if(n=tt(d),at(`Newton-Raphson iteration ${i+1}: Error norm = ${n.toExponential(4)}`),n<=l)o=!0;else if(n>100){lt(`Solution not converged. Error norm: ${n}`);break}i++}return{solutionVector:u,converged:o,iterations:i,jacobianMatrix:r,residualVector:s}}class an{constructor(e,t,n,o,i,r,s,a){this.boundaryConditions=e,this.boundaryElements=t,this.nop=n,this.meshDimension=o,this.elementOrder=i,this.totalNodesVelocity=r,this.totalNodesPressure=s,this.q2ToPressureMap=a}imposeDirichletBoundaryConditions(e,t){const n=e.length;let o=!1;if("2D"===this.meshDimension&&(Object.keys(this.boundaryConditions).forEach((i=>{const r=this.boundaryConditions[i][0];if("stressFree"===r)o=!0,st(`Boundary ${i}: Applying stress-free condition (natural BC)`);else if("constantVelocity"===r){const o=this.boundaryConditions[i][1],r=this.boundaryConditions[i][2];st(`Boundary ${i}: Applying constant velocity condition (u=${o}, v=${r})`),this.boundaryElements[i].forEach((([i,s])=>{if("quadratic"===this.elementOrder){({0:[0,3,6],1:[0,1,2],2:[2,5,8],3:[6,7,8]})[s].forEach((s=>{const a=this.nop[i][s]-1,l=a,c=this.totalNodesVelocity+a;st(`  - Applied velocity Dirichlet to node ${a+1} (element ${i+1}, local node ${s+1})`),e[l]=o;for(let e=0;e<n;e++)t[l][e]=0;t[l][l]=1,e[c]=r;for(let e=0;e<n;e++)t[c][e]=0;t[c][c]=1}))}else if("linear"===this.elementOrder){({0:[0,2],1:[0,1],2:[1,3],3:[2,3]})[s].forEach((s=>{const a=this.nop[i][s]-1,l=a,c=this.totalNodesVelocity+a;st(`  - Applied velocity Dirichlet to node ${a+1} (element ${i+1}, local node ${s+1})`),e[l]=o;for(let e=0;e<n;e++)t[l][e]=0;t[l][l]=1,e[c]=r;for(let e=0;e<n;e++)t[c][e]=0;t[c][c]=1}))}}))}})),!o)){const o=2*this.totalNodesVelocity;for(let e=0;e<n;e++)t[o][e]=0;t[o][o]=1,e[o]=0,st("Pinned pressure at first pressure node (p = 0) to remove null space")}}}class ln{constructor(){this.solverConfig=null,this.meshConfig={},this.boundaryConditions={},this.solverMethod="lusolve",this.coefficientFunctions=null,ct("FEAScript is provided “as is” without any warranty. The authors are not responsible for any damages or losses that may result from using the software. See the license for more details: https://github.com/FEAScript/FEAScript-core/blob/main/LICENSE"),at("FEAScriptModel instance created")}setModelConfig(e,t={}){this.solverConfig=e,void 0!==t?.coefficientFunctions&&(this.coefficientFunctions=t.coefficientFunctions,st("coefficientFunctions set")),void 0!==t?.maxIterations&&(this.maxIterations=t.maxIterations,st(`maxIterations set to ${this.maxIterations}`)),void 0!==t?.tolerance&&(this.tolerance=t.tolerance,st(`tolerance set to ${this.tolerance}`)),st(`solverConfig set to ${e}`)}setMeshConfig(e){this.meshConfig=e,st(`meshConfig set with dimensions: ${e.meshDimension}`)}addBoundaryCondition(e,t){const n={constantTemp:"constantTemperature"},o=t[0];if(Object.prototype.hasOwnProperty.call(n,o)){const e=n[o];ct(`Boundary condition type "${o}" is deprecated and will be removed in a future version. Use "${e}" instead.`),t=[e,...t.slice(1)]}this.boundaryConditions[e]=t,st(`boundaryConditions added for boundary: ${e}, type: ${t[0]}`)}setSolverMethod(e){this.solverMethod=e,st(`solverMethod set to: ${e}`)}solve(e={}){this.solverConfig&&this.meshConfig&&this.boundaryConditions||lt("solverConfig, meshConfig and boundaryConditions must be set before solving");let t=[],n=[],o=[],i=[];at("Preparing mesh...");const r=Xt(this.meshConfig);at("Mesh preparation completed");const s={nodesXCoordinates:r.nodesXCoordinates,nodesYCoordinates:r.nodesYCoordinates};if(at("Beginning solving process..."),console.time("totalSolvingTime"),at(`Using solver ${this.solverConfig}`),"heatConductionScript"===this.solverConfig)if("frontal"===this.solverMethod){o=nn(Kt,r,this.boundaryConditions,{coefficientFunctions:this.coefficientFunctions}).solutionVector}else{({jacobianMatrix:t,residualVector:n}=Lt(r,this.boundaryConditions,this.coefficientFunctions));o=Nt(this.solverMethod,t,n,{maxIterations:e.maxIterations??this.maxIterations,tolerance:e.tolerance??this.tolerance}).solutionVector}else if("frontPropagationScript"===this.solverConfig){let s=0;const a=5,l={meshData:r,boundaryConditions:this.boundaryConditions,eikonalActivationFlag:s,solverMethod:this.solverMethod,initialSolution:i,maxIterations:e.maxIterations??this.maxIterations,tolerance:e.tolerance??this.tolerance};for(;s<=1;){l.eikonalActivationFlag=s,o.length>0&&(l.initialSolution=[...o]);const e=sn(Ut,l);t=e.jacobianMatrix,n=e.residualVector,o=e.solutionVector,s+=1/a}}else if("generalFormPDEScript"===this.solverConfig)if("frontal"===this.solverMethod)lt("Frontal solver is not yet supported for generalFormPDEScript. Please use 'lusolve' or 'jacobi'.");else{({jacobianMatrix:t,residualVector:n}=function(e,t,n){at("Starting general form PDE matrix assembly...");const{nodesXCoordinates:o,nodesYCoordinates:i,nop:r,boundaryElements:s,totalElements:a,meshDimension:l,elementOrder:c}=e,{A:u,B:d,C:f,D:m}=n,h=Rt(e),{residualVector:p,jacobianMatrix:g,localToGlobalMap:y,basisFunctions:b,gaussPoints:v,gaussWeights:E,nodesPerElement:C}=h;if("1D"===l)for(let e=0;e<a;e++){for(let t=0;t<C;t++)y[t]=Math.abs(r[e][t])-1;for(let e=0;e<v.length;e++){const{basisFunction:t,basisFunctionDerivKsi:n}=b.getBasisFunctions(v[e]),{detJacobian:i,basisFunctionDerivX:r}=jt({basisFunction:t,basisFunctionDerivKsi:n,nodesXCoordinates:o,localToGlobalMap:y,nodesPerElement:C});let s=0;for(let e=0;e<C;e++)s+=o[y[e]]*t[e];const a=u(s),l=d(s),c=f(s),h=m(s);for(let n=0;n<C;n++){const o=y[n];p[o]-=E[e]*i*h*t[n];for(let s=0;s<C;s++){const u=y[s];g[o][u]+=E[e]*i*a*r[n]*r[s],g[o][u]-=E[e]*i*l*r[s]*t[n],g[o][u]-=E[e]*i*c*t[n]*t[s]}}}}else"2D"===l&&lt("2D general form PDE is not yet supported in assembleGeneralFormPDEMat.");return new Jt(t,s,r,l,c).imposeDirichletBoundaryConditions(p,g),at("General form PDE matrix assembly completed"),{jacobianMatrix:g,residualVector:p}}(r,this.boundaryConditions,this.coefficientFunctions));o=Nt(this.solverMethod,t,n,{maxIterations:e.maxIterations??this.maxIterations,tolerance:e.tolerance??this.tolerance}).solutionVector}else if("creepingFlowScript"===this.solverConfig){const i=function(e,t){at("Starting creeping flow matrix assembly...");const{nodesXCoordinates:n,nodesYCoordinates:o,nop:i,boundaryElements:r,totalElements:s,totalNodes:a,meshDimension:l,elementOrder:c}=e;"2D"!==l&&lt("Creeping flow solver requires a 2D mesh"),"quadratic"!==c&&lt("Creeping flow solver requires quadratic elements for Taylor-Hood (Q2-Q1) formulation");const u=a,d=[0,2,6,8],f=new Map,m=[];let h=0;for(let e=0;e<s;e++)for(let t=0;t<d.length;t++){const n=i[e][d[t]]-1;f.has(n)||(f.set(n,h),m.push(n),h++)}const p=h,g=2*u+p;st(`Creeping flow DOFs: ${u} velocity nodes (Q2), ${p} pressure nodes (Q1), ${g} total DOFs`);let y=[],b=[];for(let e=0;e<g;e++){y[e]=0,b.push([]);for(let t=0;t<g;t++)b[e][t]=0}const v=new Pt({meshDimension:"2D",elementOrder:"quadratic"}),E=new Pt({meshDimension:"2D",elementOrder:"linear"});let C=new Tt({meshDimension:"2D",elementOrder:"quadratic"}).getGaussPointsAndWeights(),w=C.gaussPoints,D=C.gaussWeights;for(let e=0;e<s;e++){let t=[];for(let n=0;n<9;n++)t[n]=i[e][n]-1;let r=[];for(let t=0;t<4;t++){const n=i[e][d[t]]-1;r[t]=f.get(n)}for(let e=0;e<w.length;e++)for(let i=0;i<w.length;i++){const s=v.getBasisFunctions(w[e],w[i]),a=E.getBasisFunctions(w[e],w[i]),l=Yt({basisFunction:s.basisFunction,basisFunctionDerivKsi:s.basisFunctionDerivKsi,basisFunctionDerivEta:s.basisFunctionDerivEta,nodesXCoordinates:n,nodesYCoordinates:o,localToGlobalMap:t,nodesPerElement:9}),{detJacobian:c,basisFunctionDerivX:d,basisFunctionDerivY:f}=l,m=D[e]*D[i]*c;for(let e=0;e<9;e++){let n=t[e],o=n,i=u+n;for(let n=0;n<9;n++){let r=t[n],s=r,a=u+r,l=1*-m*(d[e]*d[n]+f[e]*f[n]);b[o][s]+=l,b[i][a]+=l}for(let t=0;t<4;t++){let n=2*u+r[t],s=m*a.basisFunction[t]*d[e],l=m*a.basisFunction[t]*f[e];b[o][n]+=s,b[i][n]+=l,b[n][o]+=-s,b[n][i]+=-l}}}}return new an(t,r,i,l,c,u,p,f).imposeDirichletBoundaryConditions(y,b),at("Creeping flow matrix assembly completed"),{jacobianMatrix:b,residualVector:y,totalNodesVelocity:u,totalNodesPressure:p,pressureNodeIndices:m}}(r,this.boundaryConditions);t=i.jacobianMatrix,n=i.residualVector;o=Nt(this.solverMethod,t,n,{maxIterations:e.maxIterations??this.maxIterations,tolerance:e.tolerance??this.tolerance}).solutionVector,this._creepingFlowMetadata={totalNodesVelocity:i.totalNodesVelocity,totalNodesPressure:i.totalNodesPressure,pressureNodeIndices:i.pressureNodeIndices}}return console.timeEnd("totalSolvingTime"),at("Solving process completed"),{solutionVector:o,nodesCoordinates:s}}async solveAsync(e,t={}){this.solverConfig&&this.meshConfig&&this.boundaryConditions||lt("Solver config, mesh config, and boundary conditions must be set before solving.");let n=[],o=[],i=[];at("Preparing mesh...");const r=Xt(this.meshConfig);at("Mesh preparation completed");const s={nodesXCoordinates:r.nodesXCoordinates,nodesYCoordinates:r.nodesYCoordinates};if(at("Beginning solving process..."),console.time("totalSolvingTime"),at(`Using solver: ${this.solverConfig}`),"heatConductionScript"===this.solverConfig&&(({jacobianMatrix:n,residualVector:o}=Lt(r,this.boundaryConditions)),"jacobi-gpu"===this.solverMethod)){const{solutionVector:r}=await Ot("jacobi-gpu",n,o,{computeEngine:e,maxIterations:t.maxIterations??this.maxIterations,tolerance:t.tolerance??this.tolerance});i=r}return console.timeEnd("totalSolvingTime"),at("Solving process completed"),{solutionVector:i,nodesCoordinates:s}}}const cn=async e=>{let t={nodesXCoordinates:[],nodesYCoordinates:[],nodalNumbering:{quadElements:[],triangleElements:[]},boundaryElements:[],boundaryConditions:[],boundaryNodePairs:{},gmshV:0,ascii:!1,fltBytes:"8",totalNodesX:0,totalNodesY:0,physicalPropMap:[],elementTypes:{}};const n={curves:{}};let o=(await e.text()).split("\n").map((e=>e.trim())).filter((e=>""!==e)),i="",r=0,s=0,a=0,l=0,c={numNodes:0},u=[],d=0,f=0,m=0,h=0,p={numElements:0},g=0,y={},b=null,v=null,E=0,C=0,w=0;for(;r<o.length;){const e=o[r];if("$MeshFormat"===e){i="meshFormat",r++;continue}if("$EndMeshFormat"===e){i="",r++;continue}if("$PhysicalNames"===e){i="physicalNames",r++;continue}if("$EndPhysicalNames"===e){i="",r++;continue}if("$Entities"===e){i="entities",v="counts",r++;continue}if("$EndEntities"===e){i="",b=null,v=null,r++;continue}if("$Nodes"===e){i="nodes",r++;continue}if("$EndNodes"===e){i="",r++;continue}if("$Elements"===e){i="elements",r++;continue}if("$EndElements"===e){i="",r++;continue}const D=e.split(/\s+/);if("meshFormat"===i)t.gmshV=parseFloat(D[0]),t.ascii="0"===D[1],t.fltBytes=D[2];else if("physicalNames"===i){const e=parseInt(D[0],10),n=parseInt(D[1],10);let o=D.slice(2).join(" ").replace(/^"|"$/g,"");t.physicalPropMap.push({tag:n,dimension:e,name:o})}else if("entities"===i)if("counts"===v)b={points:parseInt(D[0],10),curves:parseInt(D[1],10),surfaces:parseInt(D[2],10),volumes:parseInt(D[3],10)},v="points";else if("points"===v)E++,E===b.points&&(v="curves");else if("curves"===v){const e=parseInt(D[0],10),t=parseInt(D[7],10),o=D.slice(8,8+t).map((e=>parseInt(e,10)));n.curves[e]=o,C++,C===b.curves&&(v="surfaces")}else"surfaces"===v&&(w++,w===b.surfaces&&(v="volumes"));else if("nodes"===i){if(0===s)s=parseInt(D[0],10),a=parseInt(D[1],10),t.nodesXCoordinates=new Array(a).fill(0),t.nodesYCoordinates=new Array(a).fill(0);else if(l<s&&0===c.numNodes)c={dim:parseInt(D[0],10),tag:parseInt(D[1],10),parametric:parseInt(D[2],10),numNodes:parseInt(D[3],10)},u=[],d=0,f=0;else if(d<c.numNodes){for(let e of D)if(u.push(parseInt(e,10)),d++,d===c.numNodes)break}else if(f<c.numNodes){const e=u[f]-1;t.nodesXCoordinates[e]=parseFloat(D[0]),t.nodesYCoordinates[e]=parseFloat(D[1]),t.totalNodesX++,t.totalNodesY++,f++,f===c.numNodes&&(l++,c={numNodes:0})}}else if("elements"===i)if(0===m)m=parseInt(D[0],10),parseInt(D[1],10);else if(h<m&&0===p.numElements)p={dim:parseInt(D[0],10),tag:parseInt(D[1],10),elementType:parseInt(D[2],10),numElements:parseInt(D[3],10)},t.elementTypes[p.elementType]=(t.elementTypes[p.elementType]||0)+p.numElements,g=0;else if(g<p.numElements){const e=D.slice(1).map((e=>parseInt(e,10)));let o=p.tag;if(1===p.dim){const e=n.curves[p.tag];e&&e.length>0&&(o=e[0])}1===p.elementType||8===p.elementType?(y[o]||(y[o]=[]),y[o].push(e),t.boundaryNodePairs[o]||(t.boundaryNodePairs[o]=[]),t.boundaryNodePairs[o].push(e)):2===p.elementType?t.nodalNumbering.triangleElements.push(e):3!==p.elementType&&10!==p.elementType||t.nodalNumbering.quadElements.push(e),g++,g===p.numElements&&(h++,p={numElements:0})}r++}return t.physicalPropMap.forEach((e=>{if(1===e.dimension){const n=y[e.tag]||[];n.length>0&&t.boundaryConditions.push({name:e.name,tag:e.tag,nodes:n})}})),st(`Parsed boundary node pairs by physical tag: ${JSON.stringify(t.boundaryNodePairs)}`),t};function un(e,t,n,o){console.time("plottingTime");const{nodesXCoordinates:i,nodesYCoordinates:r}=t.nodesCoordinates,s=t.solutionVector,a=e.solverConfig,l=e.meshConfig.meshDimension;if(Xt(e.meshConfig),"1D"===l&&"line"===n){let e;e=s.length>0&&Array.isArray(s[0])?s.map((e=>e[0])):s,Array.from(i);let t={x:i,y:e,mode:"lines",type:"scatter",line:{color:"rgb(219, 64, 82)",width:2},name:"Solution"},n=Math.min(window.innerWidth,700),r={title:`line plot - ${a}`,width:Math.min(n,600),height:300,xaxis:{title:"x"},yaxis:{title:"Solution"},margin:{l:50,r:50,t:50,b:50}};Plotly.newPlot(o,[t],r,{responsive:!0}),console.timeEnd("plottingTime")}else if("2D"===l&&"contour"===n){let e;e=Array.isArray(s[0])?s.map((e=>e[0])):s;let t=Math.min(window.innerWidth,700),l=Math.min(...i),c=Math.max(...i),u=Math.min(...r),d=(Math.max(...r)-u)/(c-l),f=Math.min(t,600),m={title:`${n} plot - ${a}`,width:f,height:f*d,xaxis:{title:"x"},yaxis:{title:"y",scaleanchor:"x",scaleratio:1},margin:{l:50,r:50,t:50,b:50},hovermode:"closest"},h={x:i,y:r,z:e,type:"contour",line:{smoothing:.85},contours:{coloring:"heatmap",showlabels:!1},colorbar:{title:"Solution"},name:"Solution Field"};Plotly.newPlot(o,[h],m,{responsive:!0}),console.timeEnd("plottingTime")}}function dn(e,t,n,o){console.time("plottingTime");const{nodesXCoordinates:i,nodesYCoordinates:r}=t.nodesCoordinates,s=e.meshConfig.meshDimension,a=Xt(e.meshConfig),l=new Pt({meshDimension:e.meshConfig.meshDimension,elementOrder:e.meshConfig.elementOrder});if("1D"===s&&"line"===n);else if("2D"===s&&"contour"===n){const s=[],c=[],u=Math.max(...i)-Math.min(...i),d=Math.max(...r)-Math.min(...r),f=50,m=Math.round(u*f),h=Math.round(d*f),p=u/(m-1),g=d/(h-1);let y=[];s[0]=Math.min(...i),c[0]=Math.min(...r);for(let e=1;e<h;e++)s[e]=s[0],c[e]=c[0]+e*g;for(let e=1;e<m;e++){const t=e*h;s[t]=s[0]+e*p,c[t]=c[0];for(let e=1;e<h;e++)s[t+e]=s[t],c[t+e]=c[t]+e*g}y=new Array(m*h).fill(null);const b=Gt(a),{nodeNeighbors:v,neighborCount:E}=Wt(a);let C=0;for(let n=0;n<m*h;n++){if(!hn(s[n],c[n],b))continue;let o=!1;for(let i=0;i<a.nop[C].length;i++){let r=a.nop[C][i]-1;for(let i=0;i<E[r];i++){let u=v[r][i];const d=fn(e,a,t,u,s[n],c[n],l);if(d.inside){C=u,y[n]=d.value,o=!0;break}}if(o)break}if(!o)for(let i=0;i<a.nop.length;i++){const r=fn(e,a,t,i,s[n],c[n],l);if(r.inside){C=i,y[n]=r.value,o=!0;break}}}let w=Math.min(window.innerWidth,700),D=d/u,M=Math.min(w,600),F=M*D,$={title:`${n} plot (interpolated) - ${e.solverConfig}`,width:M,height:F,xaxis:{title:"x"},yaxis:{title:"y",scaleanchor:"x",scaleratio:1},margin:{l:50,r:50,t:50,b:50},hovermode:"closest"},A={x:s,y:c,z:y,type:"contour",connectgaps:!1,hoverongaps:!1,line:{smoothing:.85},contours:{coloring:"heatmap",showlabels:!1},colorbar:{title:"Solution"},name:"Interpolated Solution Field"};Plotly.newPlot(o,[A],$,{responsive:!0}),console.timeEnd("plottingTime")}}function fn(e,t,n,o,i,r,s){const{nodesXCoordinates:a,nodesYCoordinates:l}=n.nodesCoordinates,c=t.nop[o].length;if(4===c){const c=qt(i,r,[[a[t.nop[o][0]-1],l[t.nop[o][0]-1]],[a[t.nop[o][1]-1],l[t.nop[o][1]-1]],[a[t.nop[o][2]-1],l[t.nop[o][2]-1]],[a[t.nop[o][3]-1],l[t.nop[o][3]-1]]]);if(c.inside)return{inside:!0,value:mn(e,t,n,o,c.ksi,c.eta,s)}}else if(9===c){const c=qt(i,r,[[a[t.nop[o][0]-1],l[t.nop[o][0]-1]],[a[t.nop[o][2]-1],l[t.nop[o][2]-1]],[a[t.nop[o][6]-1],l[t.nop[o][6]-1]],[a[t.nop[o][8]-1],l[t.nop[o][8]-1]]]);if(c.inside)return{inside:!0,value:mn(e,t,n,o,c.ksi,c.eta,s)}}return{inside:!1,value:null}}function mn(e,t,n,o,i,r,s){const a=n.solutionVector,l=t.nop[o].length;let c,u=s.getBasisFunctions(i,r).basisFunction;c=Array.isArray(a[0])?a.map((e=>e[0])):a;let d=0;for(let e=0;e<l;e++)d+=c[t.nop[o][e]-1]*u[e];return d}function hn(e,t,n){let o=!1;for(let i=0;i<n.length;i++){const[[r,s],[a,l]]=n[i];s>t!=l>t&&e<(a-r)*(t-s)/(l-s)+r&&(o=!o)}return o}let pn=null;async function gn(){if(pn)return pn;await import("@kitware/vtk.js/Rendering/Profiles/Geometry.js");const[{default:e},{default:t},{default:n},{default:o},{default:i},{default:r},{default:s},{default:a},{default:l},{default:c}]=await Promise.all([import("@kitware/vtk.js/Rendering/Core/Actor.js"),import("@kitware/vtk.js/Rendering/Core/ColorTransferFunction.js"),import("@kitware/vtk.js/Rendering/Core/ColorTransferFunction/ColorMaps.js"),import("@kitware/vtk.js/Common/Core/DataArray.js"),import("@kitware/vtk.js/Common/DataModel/ImageData.js"),import("@kitware/vtk.js/Filters/General/ImageMarchingSquares.js"),import("@kitware/vtk.js/Rendering/Misc/GenericRenderWindow.js"),import("@kitware/vtk.js/Rendering/Core/Mapper.js"),import("@kitware/vtk.js/Common/DataModel/PolyData.js"),import("@kitware/vtk.js/Rendering/Core/ScalarBarActor.js")]);return pn={vtkActor:e,vtkColorTransferFunction:t,vtkColorMaps:n,vtkDataArray:o,vtkImageData:i,vtkImageMarchingSquares:r,vtkGenericRenderWindow:s,vtkMapper:a,vtkPolyData:l,vtkScalarBarActor:c},pn}const yn=new Map;function bn(e={}){return{presetName:e.presetName??"Cool to Warm",reverse:e.reverse??!1,showScalarBar:e.showScalarBar??!0,scalarBarTitle:e.scalarBarTitle??"Solution"}}function vn(e={}){return{enabled:e.enabled??!0,numberOfContours:e.numberOfContours??12,color:e.color??[.15,.15,.15],lineWidth:e.lineWidth??1}}async function En(e,t,n,o,i={}){console.time("plottingTime");const r=e.meshConfig.meshDimension,s=Xt(e.meshConfig),a=await wn(e,t,s,{mode:"1D"===r&&"line"===n?"line":"surface"});await Fn(a,o,e.solverConfig,n,i),console.timeEnd("plottingTime")}async function Cn(e,t,n,o,i={}){if(console.time("plottingTime"),"2D"!==e.meshConfig.meshDimension||"contour"!==n){const r=Xt(e.meshConfig),s=await wn(e,t,r,{mode:"1D"===e.meshConfig.meshDimension&&"line"===n?"line":"surface"});return await Fn(s,o,e.solverConfig,n,i),void console.timeEnd("plottingTime")}const r=Xt(e.meshConfig),s=await async function(e,t,n){const o=await async function(e,t,n){const{nodesXCoordinates:o,nodesYCoordinates:i}=t.nodesCoordinates,r=new Pt({meshDimension:e.meshConfig.meshDimension,elementOrder:e.meshConfig.elementOrder});let s=o[0],a=o[0],l=i[0],c=i[0];for(let e=1;e<o.length;e++){const t=o[e],n=i[e];t<s&&(s=t),t>a&&(a=t),n<l&&(l=n),n>c&&(c=n)}const u=a-s,d=c-l,f=50,m=Math.max(2,Math.round(u*f)),h=Math.max(2,Math.round(d*f)),p=u/(m-1),g=d/(h-1),y=m*h,b=new Float32Array(y),v=new Float32Array(y),E=new Float32Array(y);E.fill(Number.NaN);const C=new Uint8Array(y),w=Gt(n),{nodeNeighbors:D,neighborCount:M}=Wt(n);let F=0;for(let o=0;o<m;o++)for(let i=0;i<h;i++){const a=o*h+i,c=s+o*p,u=l+i*g;if(b[a]=c,v[a]=u,!Vn(c,u,w))continue;let d=!1;for(let o=0;o<n.nop[F].length;o++){const i=n.nop[F][o]-1;for(let o=0;o<M[i];o++){const s=D[i][o],l=Pn(e,n,t,s,c,u,r);if(l.inside){F=s,E[a]=l.value,C[a]=1,d=!0;break}}if(d)break}if(!d)for(let o=0;o<n.nop.length;o++){const i=Pn(e,n,t,o,c,u,r);if(i.inside){F=o,E[a]=i.value,C[a]=1;break}}}return{visNodesX:m,visNodesY:h,minX:s,minY:l,deltaX:p,deltaY:g,lengthX:u,lengthY:d,visNodeXCoordinates:b,visNodeYCoordinates:v,visSolution:E,insideMask:C}}(e,t,n),{visNodesX:i,visNodesY:r,minX:s,minY:a,deltaX:l,deltaY:c,visNodeXCoordinates:u,visNodeYCoordinates:d,visSolution:f,insideMask:m}=o,h=An(u,d),p=function(e,t,n){const o=[];for(let i=0;i<e-1;i++)for(let e=0;e<t-1;e++){const r=i*t+e,s=(i+1)*t+e,a=(i+1)*t+(e+1),l=i*t+(e+1);n[r]&&n[s]&&n[a]&&n[l]&&o.push(4,r,s,a,l)}return Uint32Array.from(o)}(i,r,m),g=await $n(h,f,p,"surface");return{points:h,scalars:f,cells:p,polyData:g,mode:"surface",metadata:{meshDimension:"2D",numberOfPoints:h.length/3,numberOfCells:Nn(p),interpolationGrid:{nx:i,ny:r,origin:[s,a],spacing:[l,c],imageScalars:On(f,i,r)}}}}(e,t,r);await Fn(s,o,e.solverConfig,`${n}-interpolated`,i),console.timeEnd("plottingTime")}async function wn(e,t,n=null,o={}){const i=n??Xt(e.meshConfig),{nodesXCoordinates:r,nodesYCoordinates:s}=t.nodesCoordinates,a=xn(t.solutionVector,r.length),l=An(r,s),c=o.mode??"surface",u="line"===c?function(e){if(e<2)return new Uint32Array(0);const t=new Uint32Array(3*(e-1));let n=0;for(let o=0;o<e-1;o++)t[n++]=2,t[n++]=o,t[n++]=o+1;return t}(r.length):function(e){const t=[];for(let n=0;n<e.length;n++){const o=kn(e[n]);t.push(o.length,...o)}return Uint32Array.from(t)}(i.nop??[]);return{points:l,scalars:a,cells:u,polyData:await $n(l,a,u,c),mode:c,metadata:{solverConfig:e.solverConfig,meshDimension:e.meshConfig.meshDimension,numberOfPoints:l.length/3,numberOfCells:Nn(u)}}}async function Dn(e,t,n=null,o={}){return function(e){const{connectivity:t,offsets:n}=function(e){const t=[],n=[];let o=0,i=0;for(;o<e.length;){const r=e[o++];for(let n=0;n<r;n++)t.push(e[o++]);i+=r,n.push(i)}return{connectivity:t,offsets:n}}(e.cells),o=e.points.length/3,i="line"===e.mode,r=i?"Lines":"Polys";return['<?xml version="1.0"?>','<VTKFile type="PolyData" version="0.1" byte_order="LittleEndian">',"  <PolyData>",`    <Piece NumberOfPoints="${o}" NumberOfVerts="0" NumberOfLines="${i?n.length:0}" NumberOfStrips="0" NumberOfPolys="${i?0:n.length}">`,'      <PointData Scalars="solution">',`        <DataArray type="Float32" Name="solution" NumberOfComponents="1" format="ascii">${Array.from(e.scalars).join(" ")}</DataArray>`,"      </PointData>","      <Points>",`        <DataArray type="Float32" NumberOfComponents="3" format="ascii">${Array.from(e.points).join(" ")}</DataArray>`,"      </Points>",`      <${r}>`,`        <DataArray type="Int32" Name="connectivity" format="ascii">${t.join(" ")}</DataArray>`,`        <DataArray type="Int32" Name="offsets" format="ascii">${n.join(" ")}</DataArray>`,`      </${r}>`,"    </Piece>","  </PolyData>","</VTKFile>"].join("\n")}(await wn(e,t,n,o))}function Mn(e){const{nodesXCoordinates:t,nodesYCoordinates:n}=e.nodesCoordinates,o=xn(e.solutionVector,t.length),i=new Float32Array(3*t.length);for(let e=0;e<t.length;e++){const r=3*e;i[r]=Number(t[e])||0,i[r+1]=Number(n[e])||0,i[r+2]=o[e]}return{features:i,featuresShape:[t.length,3],labels:o,points:An(t,n)}}async function Fn(e,t,n,o,i={}){if("undefined"==typeof document)return void lt("vtk.js visualization requires a browser environment");const{vtkActor:r,vtkColorTransferFunction:s,vtkColorMaps:a,vtkGenericRenderWindow:l,vtkMapper:c,vtkScalarBarActor:u}=await gn(),d=document.getElementById(t);if(!d)return void lt(`Could not find plot container with id: ${t}`);yn.has(t)&&(yn.get(t).delete(),yn.delete(t)),d.innerHTML="",d.style.position="relative",d.style.width=d.style.width||"100%",d.style.height=d.style.height||"420px";const f=l.newInstance({background:[1,1,1]});f.setContainer(d),f.resize();const m=f.getRenderer(),h=f.getRenderWindow(),p=c.newInstance();p.setInputData(e.polyData),p.setScalarModeToUsePointData(),p.setColorModeToMapScalars(),p.setScalarVisibility(!0);const g=function(e){if(!e?.length)return[0,1];let t=Number.POSITIVE_INFINITY,n=Number.NEGATIVE_INFINITY;for(let o=0;o<e.length;o++){const i=e[o];Number.isFinite(i)&&(i<t&&(t=i),i>n&&(n=i))}return Number.isFinite(t)&&Number.isFinite(n)?t===n?[t-1,n+1]:[t,n]:[0,1]}(e.scalars);p.setScalarRange(g[0],g[1]);const y=i.colorScale??bn({}),b=s.newInstance(),v=function(e,t){if(!t||!e?.RGBPoints?.length)return e;const n=e.RGBPoints,o=n[0],i=n[n.length-4],r=[];for(let e=n.length-4;e>=0;e-=4)r.push(i-(n[e]-o),n[e+1],n[e+2],n[e+3]);return{...e,RGBPoints:r}}(a.getPresetByName(y.presetName)??a.getPresetByName("Cool to Warm"),y.reverse);b.applyColorMap(v),b.setMappingRange(g[0],g[1]),b.updateRange(),p.setLookupTable(b);const E=r.newInstance();if(E.setMapper(p),"line"===e.mode&&E.getProperty().setLineWidth(3),m.addActor(E),y.showScalarBar){const e=u.newInstance({drawNanAnnotation:!1,generateTicks:e=>{const t=e.getLastTickBounds();if(!t||t.length<2)return;const[n,o]=t,i=(o-n)/4,r=Array.from({length:5},((e,t)=>n+t*i));e.setTicks(r),e.setTickStrings(r.map((e=>{const t=Math.abs(e);return 0===t?"0":t>=.01&&t<1e4?parseFloat(e.toPrecision(4)).toString():e.toExponential(2)})))}});e.setTickTextStyle({fontColor:"black"}),e.setAxisTextStyle({fontColor:"black"}),e.setAxisLabel(y.scalarBarTitle),e.setScalarsToColors(b),m.addActor2D(e)}const C=vn(i.contourLines??{enabled:!1});C.enabled&&"line"!==e.mode&&await async function(e,t,n,o){const i=t.metadata?.interpolationGrid;if(!i)return;const{vtkActor:r,vtkDataArray:s,vtkImageData:a,vtkImageMarchingSquares:l,vtkMapper:c}=await gn(),u=a.newInstance();u.setDimensions(i.nx,i.ny,1),u.setOrigin(i.origin[0],i.origin[1],0),u.setSpacing(i.spacing[0],i.spacing[1],1);const d=s.newInstance({name:"solution",numberOfComponents:1,values:i.imageScalars});u.getPointData().setScalars(d);const f=l.newInstance({slicingMode:2,slice:0,mergePoints:!0});f.setInputData(u);const m=Math.max(2,o.numberOfContours),h=n[0],p=n[1],g=(p-h)/(m-1),y=[];for(let e=0;e<m;e++)y.push(h+e*g);f.setContourValues(y),f.update();const b=c.newInstance();b.setInputData(f.getOutputData()),b.setScalarVisibility(!1);const v=r.newInstance();v.setMapper(b),v.getProperty().setColor(...o.color),v.getProperty().setLineWidth(o.lineWidth),e.addActor(v)}(m,e,g,C),m.resetCamera(),h.render(),yn.set(t,f),d.title=`${o} plot - ${n}`}async function $n(e,t,n,o="surface"){const{vtkPolyData:i,vtkDataArray:r}=await gn(),s=i.newInstance();s.getPoints().setData(e,3),n.length>0&&("line"===o?s.getLines().setData(n):s.getPolys().setData(n));const a=r.newInstance({name:"solution",numberOfComponents:1,values:t});return s.getPointData().setScalars(a),s}function An(e,t){const n=new Float32Array(3*e.length);for(let o=0;o<e.length;o++){const i=3*o;n[i]=Number(e[o])||0,n[i+1]=Number(t?.[o])||0,n[i+2]=0}return n}function xn(e,t){const n=new Float32Array(t);for(let o=0;o<t;o++){const t=e?.[o];n[o]=Number(Array.isArray(t)?t[0]:t)||0}return n}function kn(e){const t=e.map((e=>e-1)),n=t.length;return 2===n||3===n?t:4===n?[t[0],t[2],t[3],t[1]]:6===n?[t[0],t[2],t[5]]:8===n?[t[0],t[4],t[6],t[2]]:9===n?[t[0],t[6],t[8],t[2]]:t.slice(0,Math.min(4,t.length))}function Nn(e){let t=0,n=0;for(;n<e.length;)n+=e[n]+1,t++;return t}function On(e,t,n){const o=new Float32Array(t*n);for(let i=0;i<n;i++)for(let r=0;r<t;r++)o[r+i*t]=e[r*n+i];return o}function Pn(e,t,n,o,i,r,s){const{nodesXCoordinates:a,nodesYCoordinates:l}=n.nodesCoordinates,c=t.nop[o].length;if(4===c){const c=qt(i,r,[[a[t.nop[o][0]-1],l[t.nop[o][0]-1]],[a[t.nop[o][1]-1],l[t.nop[o][1]-1]],[a[t.nop[o][2]-1],l[t.nop[o][2]-1]],[a[t.nop[o][3]-1],l[t.nop[o][3]-1]]]);if(c.inside)return{inside:!0,value:Sn(e,t,n,o,c.ksi,c.eta,s)}}else if(9===c){const c=qt(i,r,[[a[t.nop[o][0]-1],l[t.nop[o][0]-1]],[a[t.nop[o][2]-1],l[t.nop[o][2]-1]],[a[t.nop[o][6]-1],l[t.nop[o][6]-1]],[a[t.nop[o][8]-1],l[t.nop[o][8]-1]]]);if(c.inside)return{inside:!0,value:Sn(e,t,n,o,c.ksi,c.eta,s)}}return{inside:!1,value:null}}function Sn(e,t,n,o,i,r,s){const a=n.solutionVector,l=t.nop[o].length,c=s.getBasisFunctions(i,r).basisFunction,u=Array.isArray(a[0])?a.map((e=>e[0])):a;let d=0;for(let e=0;e<l;e++)d+=u[t.nop[o][e]-1]*c[e];return d}function Vn(e,t,n){let o=!1;for(let i=0;i<n.length;i++){const[[r,s],[a,l]]=n[i];s>t!=l>t&&e<(a-r)*(t-s)/(l-s)+r&&(o=!o)}return o}class In{constructor(){this.worker=null,this.feaWorker=null,this.isReady=!1,this._initWorker()}async _initWorker(){try{const e=import.meta.url,t=e.includes("/src/workers/")?"../../dist/feascript-worker.esm.js":"./feascript-worker.esm.js",n=`import "${new URL(t,e).href}";`,o=new Blob([n],{type:"application/javascript"});this.worker=new Worker(URL.createObjectURL(o),{type:"module"}),this.worker.onerror=e=>{console.error("FEAScriptWorker: Worker error:",e)};const i=vt(this.worker);this.feaWorker=await new i,this.isReady=!0}catch(e){throw console.error("Failed to initialize worker",e),e}}async _ensureReady(){return this.isReady?Promise.resolve():new Promise(((e,t)=>{let n=0;const o=()=>{n++,this.isReady?e():n>=50?t(new Error("Timeout waiting for worker to be ready")):setTimeout(o,1e3)};o()}))}async setModelConfig(e){return await this._ensureReady(),this.feaWorker.setModelConfig(e)}async setMeshConfig(e){return await this._ensureReady(),this.feaWorker.setMeshConfig(e)}async addBoundaryCondition(e,t){return await this._ensureReady(),this.feaWorker.addBoundaryCondition(e,t)}async setSolverMethod(e){return await this._ensureReady(),this.feaWorker.setSolverMethod(e)}async solve(){await this._ensureReady(),performance.now();const e=await this.feaWorker.solve();return performance.now(),e}async getModelInfo(){return await this._ensureReady(),this.feaWorker.getModelInfo()}async ping(){return await this._ensureReady(),this.feaWorker.ping()}terminate(){this.worker&&(this.worker.terminate(),this.worker=null,this.feaWorker=null,this.isReady=!1)}}const Tn="0.3.0 (RC)";export{ln as FEAScriptModel,In as FEAScriptWorker,bn as createColorScale,vn as createContourLineOptions,cn as importGmshMesh,rt as logSystem,dn as plotInterpolatedSolution,Cn as plotInterpolatedSolutionVtk,un as plotSolution,En as plotSolutionVtk,Tn as printVersion,Mn as transformSolverOutputToMLBuffers,Dn as transformSolverOutputToVTP,wn as transformSolverOutputToVtkData};
//# sourceMappingURL=feascript.esm.js.map
