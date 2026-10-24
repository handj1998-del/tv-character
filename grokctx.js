// Grok에 보낼 상황 정보·대화 기록·장면 질문 감지 (순수 함수, 테스트 가능)
export function timeOfDay(h){ return h>=5&&h<11?'morning':h>=11&&h<19?'day':'night'; }
export function grokCtx({people=0,hour=12,gesture='',state='',lang=''}={}){ return {people:Math.max(0,people|0),time:timeOfDay(hour),gesture:gesture||'',state:state||'',lang:lang||''}; }
const SCENE_RE=/(뭐(가)?\s*보(여|이)|뭘\s*보|보이는\s*거|내\s*옷|이거\s*뭐|what\s+(do\s+)?you\s+see|what\s+can\s+you\s+see|what\s+am\s+i\s+(wearing|holding)|看到什么|看到甚麼|看到乜|見到乜|你看到|何が見え|何見て|見える\?|見えますか)/i;
export const wantsScene=t=>SCENE_RE.test(String(t||''));
export function pushHist(h,u,a,max=12){ h.push({role:'user',content:String(u).slice(0,300)},{role:'assistant',content:String(a).slice(0,300)}); while(h.length>max) h.shift(); return h; }
