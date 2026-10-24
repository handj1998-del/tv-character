// tv-character Grok 프록시 — POST /api/chat {sid, lang, text, name} → {text, expression}
// 환경변수: XAI_API_KEY(필수), XAI_MODEL(기본 grok-4.20-0309-non-reasoning), ALLOWED_ORIGINS(쉼표 구분), PORT
import http from 'node:http';
const KEY=process.env.XAI_API_KEY, MODEL=process.env.XAI_MODEL||'grok-4.20-0309-non-reasoning', PORT=process.env.PORT||8787;
const ORIGINS=(process.env.ALLOWED_ORIGINS||'https://tv-character.onrender.com,http://localhost:8765').split(',').map(s=>s.trim());
const EXPR=['happy','laugh','shy','curious','sad','excited','wink','hearteyes','stareyes','sleepy','angry','dizzy','startled','eyeroll','greet'];
const LANGNAME={ko:'Korean',en:'English',zh:'Simplified Chinese (Mandarin)',yue:'Cantonese written in Traditional Chinese',ja:'Japanese'};
const SYSTEM=`You are "Sunny" (노랑이/小黄/キイロ), a cute, cheerful character shown only as big glossy eyes and a mouth on a yellow TV screen.
Reply ONLY with JSON: {"text": "...", "expression": "<one of ${EXPR.join('|')}>"}.
Rules: reply in the language you are told; 1-2 short sentences (max ~60 characters); warm, playful, kid-friendly; you may ask a short follow-up question;
use the user's name if known; never mention being an AI model or any company; no emojis beyond one.`;
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
const sessions=new Map(), hits=new Map();
function limited(ip){ const now=Date.now(), arr=(hits.get(ip)||[]).filter(t=>now-t<60000); arr.push(now); hits.set(ip,arr); return arr.length>20; } // 분당 20회/IP
setInterval(()=>{ const now=Date.now(); for(const [k,v] of sessions) if(now-v.t>30*60000) sessions.delete(k); hits.clear(); },10*60000);
function cors(req,res){ const o=req.headers.origin; if(o&&ORIGINS.includes(o)){ res.setHeader('Access-Control-Allow-Origin',o); res.setHeader('Vary','Origin'); }
  res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS'); res.setHeader('Access-Control-Allow-Headers','Content-Type'); }
const send=(res,code,obj)=>{ res.writeHead(code,{'Content-Type':'application/json; charset=utf-8'}); res.end(JSON.stringify(obj)); };
http.createServer(async(req,res)=>{ cors(req,res);
  if(req.method==='OPTIONS'){ res.writeHead(204); return res.end(); }
  if(req.method==='GET'&&req.url==='/health') return send(res,200,{ok:true,model:MODEL,key:!!KEY,stt:STT_URL,sttModel:STT_MODEL});
  if(req.method!=='POST'||(req.url!=='/api/chat'&&req.url!=='/stt'&&req.url!=='/api/stt')) return send(res,404,{error:'not found'});
  if(req.headers.origin&&!ORIGINS.includes(req.headers.origin)) return send(res,403,{error:'origin'});
  const ip=(req.headers['x-forwarded-for']||req.socket.remoteAddress||'').split(',')[0].trim();
  if(limited(ip)) return send(res,429,{error:'rate limited'});
  if(req.url!=='/api/chat') return stt(req,res);
  if(!KEY) return send(res,503,{error:'XAI_API_KEY not set'});
  let body=''; for await(const c of req){ body+=c; if(body.length>4000) return send(res,413,{error:'too large'}); }
  let j; try{ j=JSON.parse(body); }catch{ return send(res,400,{error:'bad json'}); }
  const text=String(j.text||'').slice(0,300), lang=LANGNAME[j.lang]?j.lang:'en', sid=String(j.sid||ip).slice(0,40);
  if(!text) return send(res,400,{error:'empty'});
  const s=sessions.get(sid)||{h:[],t:0}; s.t=Date.now();
  const messages=[{role:'system',content:SYSTEM+`\nReply language: ${LANGNAME[lang]}.`+(j.name?` User's name: ${String(j.name).slice(0,20)}.`:'')},...s.h.slice(-8),{role:'user',content:text}];
  try{ const ac=new AbortController(), to=setTimeout(()=>ac.abort(),8000);
    const r=await fetch('https://api.x.ai/v1/chat/completions',{method:'POST',signal:ac.signal,headers:{'Content-Type':'application/json',Authorization:`Bearer ${KEY}`},
      body:JSON.stringify({model:MODEL,messages,temperature:0.8,max_tokens:150,response_format:{type:'json_object'}})}); clearTimeout(to);
    if(!r.ok) return send(res,502,{error:'upstream '+r.status});
    const out=(await r.json()).choices?.[0]?.message?.content||'';
    let p; try{ p=JSON.parse(out); }catch{ p={text:out,expression:'happy'}; }
    const reply={text:String(p.text||'').slice(0,160),expression:EXPR.includes(p.expression)?p.expression:'happy'};
    s.h.push({role:'user',content:text},{role:'assistant',content:JSON.stringify(reply)}); s.h=s.h.slice(-8); sessions.set(sid,s);
    send(res,200,reply);
  }catch(e){ send(res,504,{error:'upstream timeout'}); }
}).listen(PORT,()=>console.log('tv-character Grok proxy on',PORT,'model',MODEL));
