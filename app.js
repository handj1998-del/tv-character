import { FaceDetector, GestureRecognizer, PoseLandmarker, FilesetResolver } from "./vendor/mediapipe/vision_bundle.mjs";
import * as SP from "./speech.js";
import * as DLG from "./dialogue.js";
import * as GS from "./gestures.js";
import { GROK_ENDPOINT, GROK_TIMEOUT_MS } from "./config.js";
const $=s=>document.querySelector(s), body=document.body, video=$('#video'), status=$('#status');
const Q=new URLSearchParams(location.search), DEMO=Q.get('state');
const HR=Q.get('time')==='night'?23:Q.get('time')==='morning'?8:new Date().getHours();
const NIGHT=HR>=22||HR<6, MORNING=HR>=6&&HR<10;
const SLEEP_MS=NIGHT?15000:30000, GREET_MS=4500, LOST_MS=1500;
const EMO={sad:3,angry:2.5,shy:2.5,sleepy:3,excited:2.5,curious:2.5,wink:1.2,laugh:2.5,eyeroll:1.6,hearteyes:3,stareyes:2.5,dizzy:2.5,startled:1.5};
const ALL=['idle','surprised','greeting','happy','yawning','sleeping','waking',...Object.keys(EMO)];
let state='', stT=0, lastSeen=0, faceVisible=false, faceSince=0, sleepAt=Date.now()+SLEEP_MS, pendingMsg='', queued='';
let target={x:0,y:0}, look={x:0,y:0}, sac={x:0,y:0}, sacT=0, blinkT=Date.now()+2000, blinks=[], fxT=0;
let faces=[], faceIdx=0, faceSwT=0, shyCD=0, stareCD=0, randT=Date.now()+9000, waveMsgT=0;
const LABEL={idle:NIGHT?'밤이라 조금 졸려요…':MORNING?'좋은 아침이에요! ☀':'두리번두리번…',surprised:'앗! 누구지?',greeting:'인사 중!',happy:'함께 있어서 행복해요',yawning:'하아암… 졸려요',sleeping:'쿨쿨 자는 중…',waking:'으쌰~ 기지개!',
  sad:'시무룩…',angry:'흥!',shy:'부끄러워요…',sleepy:'졸려요…',excited:'신난다!',curious:'음? 뭐지?',wink:'찡긋 😉',eyeroll:'에휴~',hearteyes:'좋아요 ♥',stareyes:'반짝반짝 ✦',dizzy:'어질어질~',startled:'깜짝이야! 💦',laugh:'ㅎㅎㅎ 웃는 중'};
function setState(s){ if(state===s)return; state=s; stT=Date.now(); body.classList.remove(...ALL); body.classList.add(s); status.textContent=LABEL[s]; }
function emote(s,next=''){ if(['sleeping','yawning','waking','surprised','greeting'].includes(state))return; queued=next; setState(s); }
function showBubble(msg){ say(msg,'greet'); if(!askAt||Date.now()>askAt-12000) askAt=Date.now()+7000; }
let curLang='ko', lastTalk=0, askAt=0, talkTimer=0;
// 말풍선 정리: 이모지는 하나만 뒤에 분리, 중복 문장부호 정리, 2줄에 맞게 글자 크기 자동 축소
const EMO_RE=/(?:\p{Extended_Pictographic}|\p{Regional_Indicator})(?:\uFE0F|\p{Emoji_Modifier}|\u200D\p{Extended_Pictographic})*/gu;
const esc=t=>t.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
function tidy(t){ t=String(t||''); const em=t.match(EMO_RE)||[]; let tx=t.replace(EMO_RE,' ').replace(/\uFE0F/g,'')
  .replace(/([!?！？])\1+/g,'$1').replace(/[~～]{2,}/g,'~').replace(/\.{3,}|…+/g,'…').replace(/\s+([!?,.！？，。、~])/g,'$1').replace(/\s{2,}/g,' ').trim();
  return {tx,em:em[0]||''}; }
function setBubble(text,heard=''){ const {tx,em}=tidy(text), b=$('#btext'), bub=$('#bubble');
  b.innerHTML=`<span class="tx">${esc(tx)}</span>${em?`<span class="emo">${em}</span>`:''}`; $('#heard').textContent=heard?`🗣 ${heard}`:'';
  b.style.wordBreak=/[\uAC00-\uD7A3]/.test(tx)?'keep-all':'normal'; bub.style.fontSize=''; const base=parseFloat(getComputedStyle(bub).fontSize); let fs=base;
  for(let i=0;i<10&&b.scrollHeight>fs*1.3*2+2;i++){ fs*=.9; bub.style.fontSize=fs+'px'; } }
function say(text,expr,heard=''){ setBubble(text,heard); lastTalk=Date.now(); sleepAt=lastTalk+SLEEP_MS; askAt=lastTalk+20000;
  body.classList.add('talk'); clearTimeout(talkTimer); talkTimer=setTimeout(()=>body.classList.remove('talk'),Math.max(4000,text.length*180+2500));
  if(expr==='greet'){ state=''; setState('greeting'); } else if(EMO[expr]){ queued=''; state=''; setState(expr); } else { state=''; setState(faceVisible?'happy':'idle'); } }
const GROK=new URLSearchParams(location.search).get('grok')||GROK_ENDPOINT;
const SID=Math.random().toString(36).slice(2);
const EXPR=['happy','laugh','shy','curious','sad','excited','wink','hearteyes','stareyes','sleepy','angry','dizzy','startled','eyeroll','greet'];
async function askGrok(text,lang){ if(!GROK) return null; const ac=new AbortController(), to=setTimeout(()=>ac.abort(),GROK_TIMEOUT_MS);
  try{ const r=await fetch(GROK,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sid:SID,lang,text,name:DLG.state.name||''}),signal:ac.signal});
    if(!r.ok) throw new Error('HTTP '+r.status); const j=await r.json(); if(!j.text) throw new Error('empty');
    return {text:String(j.text).slice(0,120),expr:EXPR.includes(j.expression)?j.expression:'happy',intent:'grok'}; }
  catch(e){ console.warn('Grok 실패 → 규칙 기반',e.message); return null; } finally{ clearTimeout(to); } }
async function greetLang(r){ const L=SP.LANGS[r.lang];
  if(!L){ status.textContent=`감지된 언어: ${r.lang||'?'} (지원 안 함) "${r.text}" [${r.dbg||""}]`; return; }
  curLang=r.lang; let res=null;
  if(r.text){ res=await askGrok(r.text,r.lang); if(res) DLG.state.awaiting=''; else res=DLG.respond(r.text,r.lang); }
  else res={text:L.text,expr:'greet',intent:'greet'};
  say(res.text,res.expr==='happy'&&!faceVisible?'excited':res.expr,r.text);
  status.textContent=`${L.label} · 의도: ${res.intent} — "${r.text}"  [${r.dbg}]`; }
// list: [{x,y,w}] 정규화 좌표, 큰 얼굴 순
function onFaces(list){ const now=Date.now(); if(!list.length)return;
  if(!faceVisible){ faceVisible=true; faceSince=now;
    if(state==='sleeping'||state==='yawning'){ pendingMsg='앗, 깼어요! 안녕하세요!'; setState('waking'); }
    else if(list[0].w>.5){ pendingMsg=SP.LANGS[curLang].text; setState('startled'); queued='greet'; }
    else { pendingMsg=SP.LANGS[curLang].text; setState('surprised'); } }
  lastSeen=now; trackFaces(list,now);
  if(list[0].w>.42&&now>shyCD&&(state==='happy'||state==='idle')){ shyCD=now+8000; emote('shy'); }
  if(state==='happy'&&now-faceSince>8000&&now>stareCD){ stareCD=now+20000; emote('wink','hearteyes'); } }
// ── 시선 추적: 얼굴 여러 명 둘러보기 + 움직임 추적
// 카메라 영상은 거울상이 아니므로 x를 뒤집음: 화면 앞 시청자 기준 왼쪽 사람 → 눈동자 화면 왼쪽
const toGaze=(x,y)=>({x:Math.max(-1,Math.min(1,-(x*2-1)*1.5)),y:Math.max(-1,Math.min(1,(y*2-1)*1.6))});
let tracks=[], nextId=1, curId=0, switchT=0, sacUntil=0, trackSrc='', motion=null, motionT=0;
function trackFaces(list,now){ const nt=[];
  for(const f of list){ let best=null,bd=.18; for(const t of tracks){ const d=Math.hypot(t.x-f.x,t.y-f.y); if(d<bd&&!nt.includes(t)){bd=d;best=t;} }
    if(best){ best.moved=Math.max(best.moved*.9,Math.hypot(best.x-f.x,best.y-f.y)*10); Object.assign(best,f); nt.push(best); }
    else nt.push({...f,id:nextId++,born:now,moved:1}); }
  tracks=nt; faces=nt; let cur=tracks.find(t=>t.id===curId);
  if(!cur||(tracks.length>1&&now>switchT)){
    let pick=tracks[0];
    if(tracks.length>1){ const others=tracks.filter(t=>t!==cur), nearest=tracks.reduce((a,b)=>b.w>a.w?b:a);
      if(cur!==nearest&&Math.random()<.3) pick=nearest;
      else { const w=others.map(t=>1+(now-t.born<3000?4:0)+Math.min(3,t.moved*3)); let r=Math.random()*w.reduce((a,b)=>a+b,0); pick=others.find((t,i)=>(r-=w[i])<0)||others[0]; } }
    if(cur&&pick!==cur) sacUntil=now+120;
    curId=pick.id; cur=pick; switchT=now+1500+Math.random()*2500; }
  faceIdx=tracks.indexOf(cur); trackSrc='face'; target=toGaze(cur.x,cur.y); }
const mc=document.createElement('canvas'); mc.width=64; mc.height=48; const mx=mc.getContext('2d',{willReadFrequently:true}); let prevF=null;
function motionStep(){ if(video.readyState<2)return; mx.drawImage(video,0,0,64,48); const d=mx.getImageData(0,0,64,48).data, g=new Float32Array(64*48);
  let lsum=0; for(let i=0;i<g.length;i++){ g[i]=d[i*4]*.3+d[i*4+1]*.59+d[i*4+2]*.11; lsum+=g[i]; } lumaAvg=lumaAvg*.8+lsum/g.length*.2;
  if(prevF){ let n=0,sx=0,sy=0; for(let i=0;i<g.length;i++) if(Math.abs(g[i]-prevF[i])>22){ n++; sx+=i%64; sy+=(i/64|0); }
    if(n>12&&n<g.length*.6){ const now=Date.now(); const m={x:(sx/n+.5)/64,y:(sy/n+.5)/48,n};
      motion=motion&&now-motionT<500?{x:motion.x*.5+m.x*.5,y:motion.y*.5+m.y*.5,n}:m; motionT=now;
      if(!faceVisible){ trackSrc='motion'; target=toGaze(motion.x,motion.y); sleepAt=Math.max(sleepAt,now+8000); } } }
  prevF=g; }
const DBG=Q.get('debug')==='1'; let dbg=null;
if(DBG){ dbg=document.createElement('canvas'); dbg.width=360; dbg.height=240; dbg.style.cssText='position:fixed;left:8px;top:8px;z-index:99;border:2px solid #000;background:#000;width:360px;height:240px'; document.body.appendChild(dbg); }
function drawDebug(){ if(!dbg)return; const c=dbg.getContext('2d'),W=360,H=240; c.save(); c.translate(W,0); c.scale(-1,1); if(video.readyState>=2) c.drawImage(video,0,0,W,H); c.restore();
  const X=x=>(1-x)*W; c.lineWidth=2; c.font='12px sans-serif';
  for(const t of tracks){ const on=t.id===curId&&trackSrc==='face'&&faceVisible; c.strokeStyle=on?'#0f0':'#fff'; const w=t.w*W, h=w*(4/3)*(W/H)*.75; c.strokeRect(X(t.x)-w/2,t.y*H-h/2,w,h); c.fillStyle=c.strokeStyle; c.fillText((on?'▶ ':'')+'#'+t.id,X(t.x)-w/2,t.y*H-h/2-3); }
  if(motion&&Date.now()-motionT<600){ c.fillStyle='#f0f'; c.beginPath(); c.arc(X(motion.x),motion.y*H,5,0,7); c.fill(); }
  c.strokeStyle='#ff0'; c.beginPath(); c.arc(W/2+look.x/1.5*W/2,H/2+look.y/1.6*H/2,7,0,7); c.stroke();
  c.fillStyle='#ff0'; c.strokeStyle='#0af'; for(const t of ftracks) c.strokeRect(X(t.x)-t.w*W/2,t.y*H-t.h*H/2,t.w*W,t.h*H); c.fillStyle='#fff'; c.fillText(`${VI.src||'-'} ${(VI.conf||0).toFixed(2)} | 검출 ${VI.detHz}/s | 화면 ${VI.fps|0}fps | 밝기 ${lumaAvg|0}${VI.boost>1?' 보정x'+VI.boost.toFixed(1):''} | 손 ${VI.hands??0}`,4,28); c.fillStyle='#0ff'; c.fillText(`손/몸: ${gestLive||'-'}  최근: ${gestLast||'-'}`,4,14); c.fillStyle='#ff0'; c.fillText(`${trackSrc||'idle'} gaze ${look.x.toFixed(2)},${look.y.toFixed(2)}`,4,H-6); }
let gestLive='', gestLast='';
function onGesture(g){ const now=Date.now(); gestLast=g+' '+new Date().toLocaleTimeString(); sleepAt=now+SLEEP_MS;
  if(state==='sleeping'||state==='yawning'){ setState('waking'); pendingMsg=GS.REACT.wave[1][curLang]; return; }
  const [ex,tx]=GS.REACT[g]; say(tx[curLang]||tx.ko, ex==='surprised'?'startled':ex);
  if(g==='bigheart'||g==='fingerheart'){ const n=g==='bigheart'?14:6; for(let i=0;i<n;i++) setTimeout(()=>spawnFx('♥'),i*120); }
  if(g==='v') spawnFx('✌'); if(g==='armsup'||g==='clap') for(let i=0;i<6;i++) setTimeout(()=>spawnFx(),i*100);
  if(g==='stop') blinks=[now,now+260]; if(g==='thumbsup') queued='happy'; }
function onWave(){ const now=Date.now(); if(now<waveMsgT)return; waveMsgT=now+5000; sleepAt=now+SLEEP_MS;
  if(state==='sleeping'||state==='yawning')return; setBubble('안녕하세요~! 👋'); body.classList.add('wave'); setTimeout(()=>body.classList.remove('wave'),2500); state=''; setState('excited'); }
const E=(id)=>{const g=$(id),q=c=>g.querySelector(c);return{g,open:q('.open'),iris:q('.iris'),pupil:q('.pupil'),happy:q('.happy'),closed:q('.closed'),heart:q('.heart'),star:q('.star'),spiral:q('.spiral')};};
const eyes=[[E('#eyeL'),260],[E('#eyeR'),540]];
const ease=t=>t<0?0:t>1?1:t*t*(3-2*t);
function spawnFx(ch){ const f=document.createElement('span'); const heart=ch?ch==='♥':Math.random()<.5; f.textContent=ch||(heart?'♥':'✦');
  f.style.cssText=`left:${25+Math.random()*50}vw;top:${25+Math.random()*35}vh;color:${heart?'#e8452c':'#fff'};font-size:${4+Math.random()*4}vmin;--dx:${(Math.random()-.5)*8}vmin`;
  $('#fx').appendChild(f); setTimeout(()=>f.remove(),1700); }
const MOUTH={sad:'M360 395 Q400 360 440 395',angry:'M355 390 L378 375 L400 390 L422 375 L445 390',shy:'M370 375 Q385 365 400 375 Q415 385 430 375',
  sleepy:'M385 378 Q400 386 415 378',curious:'M400 362 a12 16 0 1 0 0.1 0Z',wink:'M350 360 Q400 405 450 360',eyeroll:'M370 380 L430 372',
  dizzy:'M350 375 Q365 360 380 375 Q395 390 410 375 Q425 360 440 375 Q455 390 465 378',startled:'M380 365 Q400 350 420 365 Q420 395 400 395 Q380 395 380 365Z'};
let lastT=performance.now();
function tick(){ const now=Date.now(), pn=performance.now(), dt=Math.min(.05,(pn-lastT)/1000); lastT=pn; const t=pn/1000, st=(now-stT)/1000; if(dt>0) VI.fps=VI.fps*.95+(1/Math.max(dt,.001))*.05;
  if(DEMO){ if(state!==DEMO){ if(DEMO==='greeting')setBubble('안녕하세요!'); setState(DEMO);} }
  else {
  if(faceVisible && now-lastSeen>LOST_MS){ faceVisible=false; faces=[]; tracks=[]; curId=0; sleepAt=now+SLEEP_MS; target={x:0,y:0}; }
  if(state==='surprised'&&st>0.7) showBubble(pendingMsg);
  else if(state==='waking'&&st>1.4) showBubble(pendingMsg);
  else if(state==='greeting'&&st>GREET_MS/1000) setState(faceVisible?'happy':'idle');
  else if(state==='yawning'&&st>2.4) setState('sleeping');
  else if(EMO[state]&&st>EMO[state]){ const q=queued; queued=''; if(q==='greet') showBubble(pendingMsg); else if(q) setState(q); else setState(faceVisible?'happy':'idle'); }
  else if(['idle','happy',''].includes(state)){
    if(faceVisible) setState('happy'); else if(now>sleepAt) setState('yawning'); else setState('idle');
    if(faceVisible&&askAt&&now>askAt&&!SP.busy?.()&&!['sleeping','yawning'].includes(state)){ askAt=now+25000; const q=DLG.ask(curLang); say(q.text,'curious'); }
    if(now>randT){ randT=now+8000+Math.random()*9000;
      const pool=faceVisible?['wink','hearteyes','stareyes','shy','excited','curious']:NIGHT?['sleepy','sleepy','curious','eyeroll']:MORNING?['excited','curious','stareyes','wink']:['curious','eyeroll','sad','angry','dizzy','excited','sleepy'];
      emote(pool[Math.floor(Math.random()*pool.length)]); } }
  }
  const S=state, asleep=S==='sleeping', joy=S==='happy'||S==='laugh'||S==='greeting'||S==='excited'||S==='hearteyes'||S==='stareyes';
  // ── 시선
  const tracking=faceVisible||(Date.now()-motionT<1500&&trackSrc==='motion'); if(!tracking&&trackSrc==='motion'){ trackSrc=''; }
  if(!tracking&&S==='idle'&&Math.random()<dt*0.5) target={x:Math.random()*1.6-.8,y:Math.random()*1-.5};
  if(!tracking&&S!=='idle'){ target.x*=1-dt*2; target.y*=1-dt*2; }
  if(now>sacT){ sacT=now+250+Math.random()*900; sac={x:(Math.random()-.5)*.05,y:(Math.random()-.5)*.04}; }
  const k=1-Math.pow(1-(now<sacUntil?0.55:tracking?0.2:0.06),dt*60); look.x+=(target.x-look.x)*k; look.y+=(target.y-look.y)*k;
  let gx=asleep?0:look.x+sac.x, gy=asleep?.3:look.y+sac.y;
  if(S==='shy'&&!tracking){ gx=gx*.3+.7; gy=.7; } else if(S==='shy') gy=Math.max(gy,.4); if(S==='sad') gy=.6;
  let ix=0, iy=0; if(S==='eyeroll'){ const a=Math.PI*(1+Math.min(st/1.2,1)); ix=Math.cos(a)*30; iy=-Math.abs(Math.sin(a))*40-(st<1.2?0:30); }
  if(S==='sleepy'||(S==='idle'&&NIGHT)) gy=Math.max(gy,.3);
  // ── 얼굴 그룹
  const breath=Math.sin(t*(asleep?1.3:2.2)); let sx=1+breath*.012, sy=1-breath*.018, oy=breath*4, ox=0;
  if(S==='greeting'&&st<1){ const b=Math.sin(st*18)*Math.exp(-st*5)*.12; sx-=b; sy+=b; }
  if(S==='surprised'||S==='startled'){ const j=Math.sin(Math.min(st/.35,1)*Math.PI); oy-=j*30; sy+=j*.06; sx-=j*.04; }
  if(S==='waking'){ const p=Math.sin(Math.min(st/1.2,1)*Math.PI); sy+=p*.14; sx-=p*.08; oy-=p*25; }
  if(S==='laugh'){ const b=Math.abs(Math.sin(st*14)); oy-=b*14; sy+=b*.04; sx-=b*.02; }
  if(S==='excited'){ const b=Math.abs(Math.sin(st*9)); oy-=b*28; sy+=b*.05; sx-=b*.03; }
  if(S==='angry') ox=Math.sin(t*40)*4*(st<1?1:.3);
  if(S==='sad') oy+=15; if(asleep) oy+=25; if(S==='yawning') oy+=ease(st/2.4)*18;
  let rot=gx*6+(joy?Math.sin(t*3)*2.5:0)+(asleep?-5+Math.sin(t*1.3)*1.5:0)+(S==='yawning'?-ease(st/1.5)*5:0);
  if(S==='curious') rot+=14*ease(st/.4); if(S==='dizzy') rot+=Math.sin(t*5)*8; if(S==='shy') rot-=6;
  $('#root').setAttribute('transform',`translate(${400+gx*45+ox} ${250+gy*30+oy}) rotate(${rot}) scale(${sx} ${sy}) translate(-400 -250)`);
  // ── 깜빡임
  if(now>blinkT){ blinks=[now]; if(Math.random()<.25) blinks.push(now+260); blinkT=now+1800+Math.random()*4200; }
  let open=1; for(const b of blinks){ const d=(now-b)/1000; if(d>=0&&d<.16) open=Math.min(open,Math.abs(d-.08)/.08); }
  let mode='open', eyeScale=1, pupilS=1, modes=null, scales=null;
  if(asleep) mode='closed'; else if(S==='happy') mode=Math.sin(t*.8)>.3?'open':'happy';
  if(S==='greeting') mode=st<0.6?'open':'happy';
  if(S==='surprised'||S==='startled'){ eyeScale=1.18; pupilS=.55; open=1; }
  if(S==='yawning'){ open=Math.max(.08,1-ease(st/1.2)*.85); if(st>1.8) mode='closed'; }
  if(S==='waking'){ open=st<.5?.15:(st<.7?1:(st<.85?.1:1)); }
  if(S==='sleepy'||(S==='idle'&&NIGHT)) open=Math.min(open,.45+Math.sin(t*.9)*.08);
  if(S==='sad') open=Math.min(open,.8); if(S==='angry') open=Math.min(open,.6);
  if(S==='shy'||S==='laugh') mode='happy'; if(S==='excited'){ eyeScale=1.1; pupilS=1.15; }
  if(S==='wink') modes=['open','happy']; if(S==='hearteyes') mode='heart'; if(S==='stareyes') mode='star'; if(S==='dizzy') mode='spiral';
  if(S==='curious') scales=[1.12,.9];
  eyes.forEach(([e,cx],i)=>{ const md=modes?modes[i]:mode, sc=scales?scales[i]:eyeScale*(md==='heart'?1+Math.abs(Math.sin(t*6))*.08:1);
    e.g.setAttribute('transform',`translate(${cx+gx*10} ${220+gy*8}) scale(${sc})`);
    e.open.setAttribute('transform',`scale(1 ${md==='open'?Math.max(.05,open):.05})`); e.open.style.opacity=md==='open'?1:0;
    e.happy.style.opacity=md==='happy'?1:0; e.closed.style.opacity=md==='closed'?1:0; e.heart.style.opacity=md==='heart'?1:0;
    e.star.style.opacity=md==='star'?1:0; e.spiral.style.opacity=md==='spiral'?1:0;
    if(md==='star') e.star.setAttribute('transform',`rotate(${Math.sin(t*4)*12}) scale(${1+Math.sin(t*8)*.06})`);
    if(md==='spiral') e.spiral.setAttribute('transform',`rotate(${t*400*(i?1:-1)})`);
    e.iris.setAttribute('transform',`translate(${gx*34+ix} ${gy*28+iy})`); e.pupil.setAttribute('transform',`translate(0 10) scale(${pupilS}) translate(0 -10)`); });
  // ── 눈썹/땀/눈물
  const bL=$('#browL'), bR=$('#browR');
  if(S==='angry'){ bL.setAttribute('d','M185 70 L320 115'); bR.setAttribute('d','M615 70 L480 115'); }
  else if(S==='sad'){ bL.setAttribute('d','M185 110 L320 75'); bR.setAttribute('d','M615 110 L480 75'); }
  else if(S==='curious'){ bL.setAttribute('d','M190 70 Q260 40 330 70'); bR.setAttribute('d','M470 95 L610 95'); }
  bL.style.opacity=bR.style.opacity=(S==='angry'||S==='sad'||S==='curious')?1:0;
  const sw=$('#sweat'); sw.style.opacity=S==='startled'||S==='eyeroll'?1:0; sw.setAttribute('transform',`translate(0 ${(st*30)%40})`);
  const te=$('#tear'); te.style.opacity=S==='sad'&&st>.6?1:0; te.setAttribute('transform',`translate(0 ${((st-.6)*60)%90})`);
  // ── 입
  const m=$('#mouth'); let d,fill='none';
  if(S==='surprised'){ d='M400 345 a22 28 0 1 0 0.1 0Z'; fill='#1e120a'; }
  else if(S==='yawning'){ const r=ease(st/0.8)*(st<1.9?1:Math.max(0,1-(st-1.9)*2)); d=`M400 ${355-r*25} a${14+r*30} ${6+r*45} 0 1 0 0.1 0Z`; fill='#1e120a'; }
  else if(S==='greeting'){ const o=st<1.6?(Math.abs(Math.sin(st*11))*25+12):22; d=`M340 360 Q400 ${375+o*2.4} 460 360 Z`; fill='#c2302a'; }
  else if(S==='happy'||S==='hearteyes'||S==='stareyes'){ d='M350 360 Q400 420 450 360 Z'; fill='#c2302a'; }
  else if(S==='laugh'){ const o=Math.abs(Math.sin(st*14))*30+40; d=`M330 350 Q400 ${355+o*2.3} 470 350 Z`; fill='#c2302a'; }
  else if(S==='excited'){ const o=Math.abs(Math.sin(st*9))*20+30; d=`M335 355 Q400 ${360+o*2.2} 465 355 Z`; fill='#c2302a'; }
  else if(MOUTH[S]){ d=MOUTH[S]; if(S==='curious'||S==='startled') fill='#1e120a'; }
  else if(asleep){ d='M385 380 Q400 388 415 380'; }
  else if(S==='waking'){ d='M375 375 Q400 390 425 375'; }
  else if(MORNING) d='M355 365 Q400 405 445 365'; else d='M365 368 Q400 395 435 368';
  m.setAttribute('d',d); m.setAttribute('fill',fill);
  $('#blush').setAttribute('opacity',S==='shy'?1:joy?.75:(asleep?.3:.45));
  $('#bang').style.opacity=S==='surprised'||S==='startled'?1:0;
  if(joy&&now>fxT){ fxT=now+(S==='greeting'||S==='excited'?350:900); spawnFx(S==='hearteyes'?'♥':S==='stareyes'?'✦':S==='laugh'?(curLang==='ko'?'ㅎ':curLang==='ja'?'笑':'ha'):''); }
  drawDebug(); window.__gaze={tx:target.x,ty:target.y,gx,gy,src:trackSrc,cur:curId,n:tracks.length,faceIdx};
  requestAnimationFrame(tick); }
setState(DEMO||'idle'); requestAnimationFrame(tick);
$('#btnFs').onclick=()=>{ const d=document,el=d.documentElement; if(d.fullscreenElement||d.webkitFullscreenElement){(d.exitFullscreen||d.webkitExitFullscreen).call(d);return;} const f=el.requestFullscreen||el.webkitRequestFullscreen; if(f)f.call(el); else status.textContent='iPhone은 공유 → 홈 화면에 추가로 전체화면 사용'; };
$('#btnCam').onclick=()=>body.classList.toggle('showcam');
document.addEventListener('keydown',e=>{ if(e.key==='f')$('#btnFs').click(); if(e.key==='c')$('#btnCam').click(); });
// ── 카메라 인식 파이프라인: 전체 프레임 + 타일/관심영역 확대 얼굴 검출 → IoU 트래킹 → 포즈(사람) 대체 → 손동작
const MOB=/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
let lumaAvg=128, VI={src:'',conf:0,fps:60,detHz:0,boost:1,faces:0}; window.__det={calls:0,face:0,pose:0,none:0}; window.__VI=VI;
const cv=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
const bc=cv(1280,720), bx=bc.getContext('2d'), cc=cv(256,256), cx2=cc.getContext('2d'), hc=cv(384,384), hx=hc.getContext('2d');
const IOU=(a,b)=>{const x1=Math.max(a.x-a.w/2,b.x-b.w/2),x2=Math.min(a.x+a.w/2,b.x+b.w/2),y1=Math.max(a.y-a.h/2,b.y-b.h/2),y2=Math.min(a.y+a.h/2,b.y+b.h/2);const i=Math.max(0,x2-x1)*Math.max(0,y2-y1);return i/(a.w*a.h+b.w*b.h-i||1);};
let fineI=0, ftracks=[], ftId=1, roi=null, lastPose=null, lastPoseT=0, tileI=0;
function frameSource(){ const W=video.videoWidth,H=video.videoHeight; if(lumaAvg>=75){ VI.boost=1; return [video,W,H]; }
  const k=Math.min(3,95/Math.max(lumaAvg,12)); VI.boost=k; if(bc.width!==W){bc.width=W;bc.height=H;}
  bx.filter=`brightness(${k}) contrast(1.2)`; bx.drawImage(video,0,0,W,H); bx.filter='none'; return [bc,W,H]; }
function cropTo(ctx,c,srcEl,W,H,x,y,s){ x=Math.max(0,Math.min(W-s,x)); y=Math.max(0,Math.min(H-s,y)); s=Math.min(s,W,H); ctx.drawImage(srcEl,x,y,s,s,0,0,c.width,c.height); return [x,y,s]; }
function faceDetect(fd,srcEl,W,H){ const out=[]; const add=(r,ox,oy,sc,cw)=>{ for(const d of r.detections){ const b=d.boundingBox,f=sc/cw;
    out.push({x:(ox+(b.originX+b.width/2)*f)/W,y:(oy+(b.originY+b.height/2)*f)/H,w:b.width*f/W,h:b.height*f/H,conf:d.categories?.[0]?.score||.5}); } };
  add(fd.detect(srcEl),0,0,W,W);   // 전체(좌표는 원본 px)
  const crops=[]; const T=Math.round(H/2), cols=[0,(W-T)/3,2*(W-T)/3,W-T], rows=[0,H-T];
  if(roi){ const s=Math.max(H*.22,Math.min(H,roi.w*W*4)); crops.push([roi.x*W-s/2,roi.y*H-s/2,s]); }
  for(let k=0;k<(MOB?1:2);k++){ const t=tileI++%8; crops.push([cols[t%4],rows[t>>2],T]); }
  if(!ftracks.length&&!roi){ const F=Math.round(H/4), nx=Math.ceil((W-F)/(F*.75))+1, ny=Math.ceil((H-F)/(F*.75))+1, t=fineI++%(nx*ny);   // 아무도 없을 때 작은 타일로 먼 얼굴 탐색
    crops.push([(t%nx)*(W-F)/(nx-1),Math.floor(t/nx)*(H-F)/(ny-1),F]); }
  for(const [x,y,s] of crops){ const [X,Y,S]=cropTo(cx2,cc,srcEl,W,H,x,y,s); add(fd.detect(cc),X,Y,S,cc.width); }
  out.sort((a,b)=>b.conf-a.conf); const keep=[]; for(const d of out) if(!keep.some(k=>IOU(k,d)>.3)) keep.push(d); return keep; }
function updateTracks(dets,now){ for(const d of dets){ let best=null,bi=.15; for(const t of ftracks){ const v=IOU(t,d); if(v>bi){bi=v;best=t;} }
    if(best){ for(const k of ['x','y','w','h']) best[k]+=(d[k]-best[k])*.55; best.conf=d.conf; best.seen=now; best.hits++; }
    else ftracks.push({...d,id:ftId++,seen:now,hits:1,born:now}); }
  ftracks=ftracks.filter(t=>now-t.seen<1000); return ftracks.filter(t=>t.hits>=2||t.conf>.6); }
window.startCam=async()=>{ try{
  video.srcObject=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:MOB?960:1280},height:{ideal:MOB?540:720},frameRate:{ideal:30}}});
  setInterval(motionStep,66);
  status.textContent='얼굴 인식 모델 불러오는 중…';
  const fs=await FilesetResolver.forVisionTasks("./vendor/mediapipe/wasm");
  const fd=await FaceDetector.createFromOptions(fs,{baseOptions:{modelAssetPath:"./vendor/models/blaze_face_short_range.tflite",delegate:"GPU"},runningMode:"IMAGE",minDetectionConfidence:.35,minSuppressionThreshold:.3});
  status.textContent='준비 완료!';
  let gr=null, pl=null; const det=GS.createDetector(); const poseOK=Q.get('pose')!=='0';
  (async()=>{ try{ gr=await GestureRecognizer.createFromOptions(fs,{baseOptions:{modelAssetPath:"./vendor/models/gesture_recognizer.task",delegate:"GPU"},runningMode:"VIDEO",numHands:2,minHandDetectionConfidence:.35,minHandPresenceConfidence:.35,minTrackingConfidence:.35}); }catch(e){ console.warn('gesture off',e); }
    if(poseOK) try{ pl=await PoseLandmarker.createFromOptions(fs,{baseOptions:{modelAssetPath:"./vendor/models/pose_landmarker_lite.task",delegate:"GPU"},runningMode:"VIDEO",numPoses:2,minPoseDetectionConfidence:.35,minPosePresenceConfidence:.35}); }catch(e){ console.warn('pose off',e); VI.poseErr=String(e); } VI.models=(gr?'hand ':'')+(pl?'pose':''); })();
  let n=0, cost=30, lastVT=-1, ts=0, hzN=0, hzT=performance.now();
  const loop=()=>{ const t0=performance.now();
    if(video.readyState>=2&&video.currentTime!==lastVT){ lastVT=video.currentTime; n++; hzN++; const now=Date.now(); ts=Math.max(ts+1,t0);
      const [src,W,H]=frameSource(); window.__det.calls++;
      const tr=updateTracks(faceDetect(fd,src,W,H),now);
      // 포즈: 데스크톱 2회에 1번, 휴대폰은 얼굴 없을 때 4회에 1번
      if(pl&&(MOB?(!tr.length&&n%4===0):n%2===0)){ const r=pl.detectForVideo(src,ts); lastPose=r.landmarks?.[0]||null; if(lastPose) lastPoseT=now; }
      const P=now-lastPoseT<600?lastPose:null;
      if(tr.length){ VI.src='face'; VI.conf=Math.max(...tr.map(t=>t.conf)); window.__det.face++; roi=tr[0];
        onFaces(tr.sort((a,b)=>b.w-a.w).slice(0,4).map(t=>({x:t.x,y:t.y,w:t.w}))); }
      else if(P){ const v=i=>(P[i].visibility??1)>.5, sw=Math.hypot(P[11].x-P[12].x,P[11].y-P[12].y);
        const pt=v(0)?P[0]:(v(11)&&v(12))?{x:(P[11].x+P[12].x)/2,y:(P[11].y+P[12].y)/2-sw*.6}:null;
        if(pt){ VI.src='pose'; VI.conf=P[0].visibility??0; window.__det.pose++; roi={x:pt.x,y:pt.y,w:Math.max(.02,sw*.45)}; onFaces([{x:pt.x,y:pt.y,w:sw*.45}]); } else { VI.src=''; window.__det.none++; } }
      else { VI.src=Date.now()-motionT<800?'motion':''; window.__det.none++; roi=VI.src==='motion'?{x:motion.x,y:motion.y,w:.05}:null; }
      VI.faces=tr.length;
      // 손동작: 데스크톱 2회에 1번, 휴대폰 3회에 1번. 멀리 있으면 사람 주변을 확대해서 인식
      if(gr&&state!=='sleeping'&&n%(MOB?3:2)===1){ let img=src, far=roi&&roi.w<.07&&(VI.src==='face'||VI.src==='pose');
        if(far){ const s=Math.min(H,Math.max(H*.35,roi.w*W*9)); cropTo(hx,hc,src,W,H,roi.x*W-s/2,roi.y*H-s*.35,s); img=hc; }
        const r=gr.recognizeForVideo(img,ts+.5); VI.hands=(r.landmarks||[]).length+(far?' (확대)':'');
        const g=det.step(now,{hands:r.landmarks||[],builtins:(r.gestures||[]).map(x=>x?.[0]?.categoryName||''),pose:P}); gestLive=det.live; if(g) onGesture(g); } }
    const c=performance.now()-t0; cost=cost*.9+c*.1; VI.cost=cost|0;
    if(performance.now()-hzT>1000){ VI.detHz=hzN; hzN=0; hzT=performance.now(); }
    // 적응형: 화면 fps가 떨어지면 검출 간격을 늘림
    const base=MOB?110:50, slow=VI.fps<30?2.2:VI.fps<45?1.5:1; setTimeout(loop,Math.max(base,cost*1.6)*slow); };
  loop();
 }catch(e){ console.error(e); status.textContent='카메라/모델 오류: '+e.message+' (localhost 또는 https 필요)'; } };

let micLoading=false;
async function toggleMic(){ const b=$('#btnMic'); const st=t=>status.textContent=t;
  if(SP.isOn()){ SP.stop(); b.textContent='🎤 마이크 꺼짐'; st('마이크 꺼짐'); return; }
  if(micLoading)return; micLoading=true;
  try{ await SP.load(st); await SP.start(greetLang,st); b.textContent='🎤 마이크 켜짐'; st('🎤 말해 보세요 (한/영/中/粵/日)'); }
  catch(e){ console.error(e); st('음성 모델/마이크 오류: '+e.message+' — 얼굴 인식은 계속 동작합니다'); }
  micLoading=false; }
$('#btnMic').onclick=toggleMic;
document.addEventListener('keydown',e=>{ if(e.key==='m'||e.key==='M')toggleMic(); });

$('#tap').onclick=async()=>{ $('#tap').remove();
  try{ await video.play(); }catch{}
  await window.startCam(); video.play().catch(()=>{}); };
if(DEMO||Q.get('say')||Q.get('gesture')) $('#tap').remove();
// 데모: ?say=문장&lang=ko|en|zh|yue|ja → 대화 엔진 테스트
if(Q.get('say')) setTimeout(()=>greetLang({lang:Q.get('lang')||'ko',text:Q.get('say'),dbg:'demo'}),300);
// ?autocam=1 → 탭 없이 카메라 시작(키오스크/테스트), ?debug=1 → 미리보기+시선 표시
if(Q.get('autocam')==='1'){ $('#tap')?.remove(); window.startCam().then(()=>video.play().catch(()=>{})); }
if(DBG) window.__onFaces=onFaces;

if(Q.get('gesture')) setTimeout(()=>{ $('#tap')?.remove(); onGesture(Q.get('gesture')); },400);
// 전체화면이면 메뉴 숨김, 두 번 탭하면 전체화면 종료
(()=>{const d=document;const upd=()=>d.body.classList.toggle('fs',!!(d.fullscreenElement||d.webkitFullscreenElement));
d.addEventListener('fullscreenchange',upd);d.addEventListener('webkitfullscreenchange',upd);
d.addEventListener('dblclick',()=>{if(d.fullscreenElement||d.webkitFullscreenElement)(d.exitFullscreen||d.webkitExitFullscreen).call(d);});})();
