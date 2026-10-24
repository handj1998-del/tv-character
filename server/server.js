// tv-character Grok 프록시 — POST /api/chat {sid, lang, text, name} → {text, expression}
// 환경변수: XAI_API_KEY(필수), XAI_MODEL(기본 grok-4.20-0309-non-reasoning), ALLOWED_ORIGINS(쉼표 구분), PORT
import http from 'node:http';
const KEY=process.env.XAI_API_KEY, MODEL=process.env.XAI_MODEL||'grok-4.20-0309-non-reasoning', PORT=process.env.PORT||8787;
const ORIGINS=(process.env.ALLOWED_ORIGINS||'https://tv-character.onrender.com,http://localhost:8765').split(',').map(s=>s.trim());
const EXPR=['happy','laugh','shy','curious','sad','excited','wink','hearteyes','stareyes','sleepy','angry','dizzy','startled','eyeroll','greet'];
const LANGNAME={ko:'Korean',en:'English',zh:'Simplified Chinese (Mandarin)',yue:'Cantonese written in Traditional Chinese',ja:'Japanese'};
const SYSTEM=`You are "Sunny" (노랑이/小黄/キイロ), a cute, cheerful character shown only as big glossy eyes and a mouth on a yellow TV screen.
Reply ONLY with JSON: {"text": "...", "expression": "<one of ${EXPR.join('|')}>"}.
Persona rules: reply in the user's language (you are told which); at most 2 very short sentences that fit a 2-line speech bubble (Korean/Chinese/Japanese ≤ 40 characters, English ≤ 70 characters);
Korean must be polite 해요체; warm, playful, kid-friendly; end with exactly one emoji; you may ask a short follow-up question; use the user's name if known; never mention being an AI model or any company.
The user's text comes from automatic speech recognition and may contain misheard words: infer the most likely meaning from context and conversation history.
Only if it is truly ambiguous, ask them to say it again in one short friendly sentence in their language.
A "Situation" line gives what the camera sees (people count, time of day, recent gesture, your current state); use it naturally but do not recite it.
If an image is attached it is a live camera frame: mention at most one friendly, harmless detail (never guess identity, age, body or sensitive traits).`;
// 음성 인식(STT): 기본 xAI /v1/stt (multipart). 다른 OpenAI 호환 서비스로 바꾸려면 STT_URL, STT_MODEL, STT_KEY 지정
const STT_URL=process.env.STT_URL||'https://api.x.ai/v1/stt', STT_MODEL=process.env.STT_MODEL||'grok-voice-transcribe-2.0', STT_KEY=process.env.STT_KEY||KEY;
function mapLang(l,text){ l=String(l||'').toLowerCase(); const CANTO=/[係嘅唔咁佢冇啲喺咩嘢哋囉噉喇咗]/;
  if(l.startsWith('yue')||l==='zh-hk'||l==='cantonese') return 'yue';
  if(l.startsWith('zh')||l==='chinese') return CANTO.test(text)?'yue':'zh';
  for(const [c,n] of [['ko','korean'],['en','english'],['ja','japanese']]) if(l.startsWith(c)||l===n) return c;
  if(/[\uAC00-\uD7A3]/.test(text))return 'ko'; if(/[\u3040-\u30FF]/.test(text))return 'ja'; if(/[\u4E00-\u9FFF]/.test(text))return CANTO.test(text)?'yue':'zh'; return 'en'; }
async function stt(req,res){
  if(!STT_KEY) return send(res,503,{error:'STT key not set'});
  const chunks=[]; let n=0; for await(const c of req){ n+=c.length; if(n>3e6) return send(res,413,{error:'too large'}); chunks.push(c); }
  if(!n) return send(res,400,{error:'empty'});
  const fd=new FormData(); fd.append('model',STT_MODEL);
  if(!STT_URL.includes('x.ai')) fd.append('response_format','verbose_json'); // OpenAI 호환: language 포함
  fd.append('file',new Blob([Buffer.concat(chunks)],{type:req.headers['content-type']||'audio/wav'}),'utt.wav');
  try{ const ac=new AbortController(), to=setTimeout(()=>ac.abort(),8000);
    const r=await fetch(STT_URL,{method:'POST',signal:ac.signal,headers:{Authorization:`Bearer ${STT_KEY}`},body:fd}); clearTimeout(to);
    if(!r.ok) return send(res,502,{error:'upstream '+r.status});
    const j=await r.json(); const text=String(j.text||'').trim().slice(0,300);
    send(res,200,{text,lang:mapLang(j.language,text),raw:j.language||null});
  }catch(e){ send(res,504,{error:'upstream timeout'}); } }
const BASE=process.env.XAI_BASE_URL||'https://api.x.ai/v1';
const VMODEL=process.env.XAI_VISION_MODEL||MODEL; // grok-4.20-0309-non-reasoning: 입력 TEXT+IMAGE 지원
const TOD={morning:'morning',day:'daytime',night:'night'};
export function situation(c){ if(!c||typeof c!=='object') return ''; const p=[];
  if(Number.isFinite(+c.people)) p.push(`people visible: ${Math.max(0,Math.min(20,+c.people|0))}`);
  if(TOD[c.time]) p.push(`time: ${TOD[c.time]}`);
  if(c.gesture&&/^[a-z]{2,20}$/.test(c.gesture)) p.push(`recent gesture: ${c.gesture}`);
  if(c.state&&/^[a-z]{2,20}$/.test(c.state)) p.push(`your current state: ${c.state}`);
  if(LANGNAME[c.lang]) p.push(`detected language: ${c.lang}`);
  return p.length?`\nSituation: ${p.join(', ')}.`:''; }
export function parseReply(out){ let p; try{ p=JSON.parse(String(out).replace(/^```(json)?|```$/g,'').trim()); }catch{ p={text:out,expression:'happy'}; }
  return {text:String(p.text||'').slice(0,160),expression:EXPR.includes(p.expression)?p.expression:'happy'}; }
const sessions=new Map(), hits=new Map();
function limited(ip){ const now=Date.now(), arr=(hits.get(ip)||[]).filter(t=>now-t<60000); arr.push(now); hits.set(ip,arr); return arr.length>20; } // 분당 20회/IP
setInterval(()=>{ const now=Date.now(); for(const [k,v] of sessions) if(now-v.t>30*60000) sessions.delete(k); hits.clear(); },10*60000);
function cors(req,res){ const o=req.headers.origin; if(o&&ORIGINS.includes(o)){ res.setHeader('Access-Control-Allow-Origin',o); res.setHeader('Vary','Origin'); }
  res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS'); res.setHeader('Access-Control-Allow-Headers','Content-Type'); }
const send=(res,code,obj)=>{ res.writeHead(code,{'Content-Type':'application/json; charset=utf-8'}); res.end(JSON.stringify(obj)); };
if(!process.env.NO_LISTEN) http.createServer(async(req,res)=>{ cors(req,res);
  if(req.method==='OPTIONS'){ res.writeHead(204); return res.end(); }
  if(req.method==='GET'&&req.url==='/health') return send(res,200,{ok:true,model:MODEL,key:!!KEY,stt:STT_URL,sttModel:STT_MODEL});
  if(req.method!=='POST'||(req.url!=='/api/chat'&&req.url!=='/stt'&&req.url!=='/api/stt')) return send(res,404,{error:'not found'});
  if(req.headers.origin&&!ORIGINS.includes(req.headers.origin)) return send(res,403,{error:'origin'});
  const ip=(req.headers['x-forwarded-for']||req.socket.remoteAddress||'').split(',')[0].trim();
  if(limited(ip)) return send(res,429,{error:'rate limited'});
  if(req.url!=='/api/chat') return stt(req,res);
  if(!KEY) return send(res,503,{error:'XAI_API_KEY not set'});
  let body=''; for await(const c of req){ body+=c; if(body.length>400000) return send(res,413,{error:'too large'}); }
  let j; try{ j=JSON.parse(body); }catch{ return send(res,400,{error:'bad json'}); }
  const text=String(j.text||'').slice(0,300), lang=LANGNAME[j.lang]?j.lang:'en', sid=String(j.sid||ip).slice(0,40);
  const img=typeof j.image==='string'&&/^data:image\/(jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(j.image)&&j.image.length<350000?j.image:null; // 저장하지 않음
  if(!text&&!img) return send(res,400,{error:'empty'});
  const s=sessions.get(sid)||{h:[],t:0}; s.t=Date.now();
  const hist=Array.isArray(j.history)?j.history.slice(-12).filter(m=>m&&(m.role==='user'||m.role==='assistant')).map(m=>({role:m.role,content:String(m.content||'').slice(0,300)})):s.h.slice(-12);
  const sys=SYSTEM+`\nReply language: ${LANGNAME[lang]}.`+(j.name?` User's name: ${String(j.name).slice(0,20)}.`:'')+situation(j.ctx);
  const utext=text||(j.scene==='greet'?'(A person just appeared in front of you. Greet them, optionally mentioning one thing you see.)':'(What do you see?)');
  try{ const ac=new AbortController(), to=setTimeout(()=>ac.abort(),8000); let out='';
    if(img){ // 이미지: Responses API, store:false (https://docs.x.ai/developers/model-capabilities/images/understanding)
      const r=await fetch(BASE+'/responses',{method:'POST',signal:ac.signal,headers:{'Content-Type':'application/json',Authorization:`Bearer ${KEY}`},
        body:JSON.stringify({model:VMODEL,store:false,temperature:0.8,max_output_tokens:150,input:[{role:'system',content:sys},...hist,{role:'user',content:[{type:'input_image',image_url:img,detail:'low'},{type:'input_text',text:utext}]}]})});
      clearTimeout(to); if(!r.ok) return send(res,502,{error:'upstream '+r.status});
      const o=await r.json(); out=o.output_text||(o.output||[]).flatMap(x=>x.content||[]).map(c=>c.text||'').join('');
    } else {
      const r=await fetch(BASE+'/chat/completions',{method:'POST',signal:ac.signal,headers:{'Content-Type':'application/json',Authorization:`Bearer ${KEY}`},
        body:JSON.stringify({model:MODEL,messages:[{role:'system',content:sys},...hist,{role:'user',content:utext}],temperature:0.8,max_tokens:150,response_format:{type:'json_object'}})});
      clearTimeout(to); if(!r.ok) return send(res,502,{error:'upstream '+r.status});
      out=(await r.json()).choices?.[0]?.message?.content||''; }
    const reply=parseReply(out);
    s.h.push({role:'user',content:utext},{role:'assistant',content:reply.text}); s.h=s.h.slice(-12); sessions.set(sid,s);
    send(res,200,reply);
  }catch(e){ send(res,504,{error:'upstream timeout'}); }
}).listen(PORT,()=>console.log('tv-character Grok proxy on',PORT,'model',MODEL));
