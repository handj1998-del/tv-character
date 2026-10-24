import { FaceDetector, GestureRecognizer, FilesetResolver } from "./vendor/mediapipe/vision_bundle.mjs";
import * as SP from "./speech.js";
const $=s=>document.querySelector(s), body=document.body, video=$('#video'), status=$('#status');
const Q=new URLSearchParams(location.search), DEMO=Q.get('state');
const HR=Q.get('time')==='night'?23:Q.get('time')==='morning'?8:new Date().getHours();
const NIGHT=HR>=22||HR<6, MORNING=HR>=6&&HR<10;
const SLEEP_MS=NIGHT?15000:30000, GREET_MS=4500, LOST_MS=1500;
const EMO={sad:3,angry:2.5,shy:2.5,sleepy:3,excited:2.5,curious:2.5,wink:1.2,eyeroll:1.6,hearteyes:3,stareyes:2.5,dizzy:2.5,startled:1.5};
const ALL=['idle','surprised','greeting','happy','yawning','sleeping','waking',...Object.keys(EMO)];
let state='', stT=0, lastSeen=0, faceVisible=false, faceSince=0, sleepAt=Date.now()+SLEEP_MS, pendingMsg='', queued='';
let target={x:0,y:0}, look={x:0,y:0}, sac={x:0,y:0}, sacT=0, blinkT=Date.now()+2000, blinks=[], fxT=0;
let faces=[], faceIdx=0, faceSwT=0, shyCD=0, stareCD=0, randT=Date.now()+9000, waveMsgT=0;
const LABEL={idle:NIGHT?'밤이라 조금 졸려요…':MORNING?'좋은 아침이에요! ☀':'두리번두리번…',surprised:'앗! 누구지?',greeting:'인사 중!',happy:'함께 있어서 행복해요',yawning:'하아암… 졸려요',sleeping:'쿨쿨 자는 중…',waking:'으쌰~ 기지개!',
  sad:'시무룩…',angry:'흥!',shy:'부끄러워요…',sleepy:'졸려요…',excited:'신난다!',curious:'음? 뭐지?',wink:'찡긋 😉',eyeroll:'에휴~',hearteyes:'좋아요 ♥',stareyes:'반짝반짝 ✦',dizzy:'어질어질~',startled:'깜짝이야! 💦'};
function setState(s){ if(state===s)return; state=s; stT=Date.now(); body.classList.remove(...ALL); body.classList.add(s); status.textContent=LABEL[s]; }
function emote(s,next=''){ if(['sleeping','yawning','waking','surprised','greeting'].includes(state))return; queued=next; setState(s); }
function showBubble(msg){ $('#bubble').textContent=msg; setState('greeting'); }
function greetLang(r){ const L=SP.LANGS[r.lang];
  if(!L){ status.textContent=`감지된 언어: ${r.lang||'?'} (지원 안 함) "${r.text}" [${r.dbg||""}]`; return; }
  sleepAt=Date.now()+SLEEP_MS; state=''; showBubble(L.text); status.textContent=`감지된 언어: ${L.label} — "${r.text}"  [${r.dbg}]`; }
// list: [{x,y,w}] 정규화 좌표, 큰 얼굴 순
function onFaces(list){ const now=Date.now(); if(!list.length)return;
  if(!faceVisible){ faceVisible=true; faceSince=now;
    if(state==='sleeping'||state==='yawning'){ pendingMsg='앗, 깼어요! 안녕하세요!'; setState('waking'); }
    else if(list[0].w>.5){ pendingMsg='안녕하세요!'; setState('startled'); queued='greet'; }
    else { pendingMsg='안녕하세요!'; setState('surprised'); } }
  lastSeen=now; faces=list;
  if(list.length>1){ if(now>faceSwT){ faceIdx=(faceIdx+1)%list.length; faceSwT=now+2200+Math.random()*1500; } } else faceIdx=0;
  const f=list[Math.min(faceIdx,list.length-1)];
  target={x:Math.max(-1,Math.min(1,-(f.x*2-1)*1.6)),y:Math.max(-1,Math.min(1,(f.y*2-1)*1.8))};
  if(list[0].w>.42&&now>shyCD&&(state==='happy'||state==='idle')){ shyCD=now+8000; emote('shy'); }
  if(state==='happy'&&now-faceSince>8000&&now>stareCD){ stareCD=now+20000; emote('wink','hearteyes'); } }
function onWave(){ const now=Date.now(); if(now<waveMsgT)return; waveMsgT=now+5000; sleepAt=now+SLEEP_MS;
  if(state==='sleeping'||state==='yawning')return; $('#bubble').textContent='👋 안녕~!'; body.classList.add('wave'); setTimeout(()=>body.classList.remove('wave'),2500); state=''; setState('excited'); }
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
function tick(){ const now=Date.now(), pn=performance.now(), dt=Math.min(.05,(pn-lastT)/1000); lastT=pn; const t=pn/1000, st=(now-stT)/1000;
  if(DEMO){ if(state!==DEMO){ if(DEMO==='greeting')$('#bubble').textContent='안녕하세요!'; setState(DEMO);} }
  else {
  if(faceVisible && now-lastSeen>LOST_MS){ faceVisible=false; faces=[]; sleepAt=now+SLEEP_MS; target={x:0,y:0}; }
  if(state==='surprised'&&st>0.7) showBubble(pendingMsg);
  else if(state==='waking'&&st>1.4) showBubble(pendingMsg);
  else if(state==='greeting'&&st>GREET_MS/1000) setState(faceVisible?'happy':'idle');
  else if(state==='yawning'&&st>2.4) setState('sleeping');
  else if(EMO[state]&&st>EMO[state]){ const q=queued; queued=''; if(q==='greet') showBubble(pendingMsg); else if(q) setState(q); else setState(faceVisible?'happy':'idle'); }
  else if(['idle','happy',''].includes(state)){
    if(faceVisible) setState('happy'); else if(now>sleepAt) setState('yawning'); else setState('idle');
    if(now>randT){ randT=now+8000+Math.random()*9000;
      const pool=faceVisible?['wink','hearteyes','stareyes','shy','excited','curious']:NIGHT?['sleepy','sleepy','curious','eyeroll']:MORNING?['excited','curious','stareyes','wink']:['curious','eyeroll','sad','angry','dizzy','excited','sleepy'];
      emote(pool[Math.floor(Math.random()*pool.length)]); } }
  }
  const S=state, asleep=S==='sleeping', joy=S==='happy'||S==='greeting'||S==='excited'||S==='hearteyes'||S==='stareyes';
  // ── 시선
  if(S==='idle'&&Math.random()<dt*0.5) target={x:Math.random()*1.6-.8,y:Math.random()*1-.5};
  if(!faceVisible&&S!=='idle'){ target.x*=1-dt*2; target.y*=1-dt*2; }
  if(now>sacT){ sacT=now+250+Math.random()*900; sac={x:(Math.random()-.5)*.08,y:(Math.random()-.5)*.06}; }
  const k=1-Math.pow(1-(faceVisible?0.18:0.06),dt*60); look.x+=(target.x-look.x)*k; look.y+=(target.y-look.y)*k;
  let gx=asleep?0:look.x+sac.x, gy=asleep?.3:look.y+sac.y;
  if(S==='shy'){ gx=gx*.3+.7; gy=.7; } if(S==='sad') gy=.6;
  let ix=0, iy=0; if(S==='eyeroll'){ const a=Math.PI*(1+Math.min(st/1.2,1)); ix=Math.cos(a)*30; iy=-Math.abs(Math.sin(a))*40-(st<1.2?0:30); }
  if(S==='sleepy'||(S==='idle'&&NIGHT)) gy=Math.max(gy,.3);
  // ── 얼굴 그룹
  const breath=Math.sin(t*(asleep?1.3:2.2)); let sx=1+breath*.012, sy=1-breath*.018, oy=breath*4, ox=0;
  if(S==='greeting'&&st<1){ const b=Math.sin(st*18)*Math.exp(-st*5)*.12; sx-=b; sy+=b; }
  if(S==='surprised'||S==='startled'){ const j=Math.sin(Math.min(st/.35,1)*Math.PI); oy-=j*30; sy+=j*.06; sx-=j*.04; }
  if(S==='waking'){ const p=Math.sin(Math.min(st/1.2,1)*Math.PI); sy+=p*.14; sx-=p*.08; oy-=p*25; }
  if(S==='excited'){ const b=Math.abs(Math.sin(st*9)); oy-=b*28; sy+=b*.05; sx-=b*.03; }
  if(S==='angry') ox=Math.sin(t*40)*4*(st<1?1:.3);
  if(S==='sad') oy+=15; if(asleep) oy+=25; if(S==='yawning') oy+=ease(st/2.4)*18;
  let rot=gx*6+(joy?Math.sin(t*3)*2.5:0)+(asleep?-5+Math.sin(t*1.3)*1.5:0)+(S==='yawning'?-ease(st/1.5)*5:0);
  if(S==='curious') rot+=14*ease(st/.4); if(S==='dizzy') rot+=Math.sin(t*5)*8; if(S==='shy') rot-=6;
  $('#root').setAttribute('transform',`translate(${400+gx*70+ox} ${250+gy*45+oy}) rotate(${rot}) scale(${sx} ${sy}) translate(-400 -250)`);
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
  if(S==='shy') mode='happy'; if(S==='excited'){ eyeScale=1.1; pupilS=1.15; }
  if(S==='wink') modes=['open','happy']; if(S==='hearteyes') mode='heart'; if(S==='stareyes') mode='star'; if(S==='dizzy') mode='spiral';
  if(S==='curious') scales=[1.12,.9];
  eyes.forEach(([e,cx],i)=>{ const md=modes?modes[i]:mode, sc=scales?scales[i]:eyeScale*(md==='heart'?1+Math.abs(Math.sin(t*6))*.08:1);
    e.g.setAttribute('transform',`translate(${cx+gx*14} ${220+gy*10}) scale(${sc})`);
    e.open.setAttribute('transform',`scale(1 ${md==='open'?Math.max(.05,open):.05})`); e.open.style.opacity=md==='open'?1:0;
    e.happy.style.opacity=md==='happy'?1:0; e.closed.style.opacity=md==='closed'?1:0; e.heart.style.opacity=md==='heart'?1:0;
    e.star.style.opacity=md==='star'?1:0; e.spiral.style.opacity=md==='spiral'?1:0;
    if(md==='star') e.star.setAttribute('transform',`rotate(${Math.sin(t*4)*12}) scale(${1+Math.sin(t*8)*.06})`);
    if(md==='spiral') e.spiral.setAttribute('transform',`rotate(${t*400*(i?1:-1)})`);
    e.iris.setAttribute('transform',`translate(${gx*16+ix} ${gy*16+iy})`); e.pupil.setAttribute('transform',`translate(0 10) scale(${pupilS}) translate(0 -10)`); });
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
  else if(S==='excited'){ const o=Math.abs(Math.sin(st*9))*20+30; d=`M335 355 Q400 ${360+o*2.2} 465 355 Z`; fill='#c2302a'; }
  else if(MOUTH[S]){ d=MOUTH[S]; if(S==='curious'||S==='startled') fill='#1e120a'; }
  else if(asleep){ d='M385 380 Q400 388 415 380'; }
  else if(S==='waking'){ d='M375 375 Q400 390 425 375'; }
  else if(MORNING) d='M355 365 Q400 405 445 365'; else d='M365 368 Q400 395 435 368';
  m.setAttribute('d',d); m.setAttribute('fill',fill);
  $('#blush').setAttribute('opacity',S==='shy'?1:joy?.75:(asleep?.3:.45));
  $('#bang').style.opacity=S==='surprised'||S==='startled'?1:0;
  if(joy&&now>fxT){ fxT=now+(S==='greeting'||S==='excited'?350:900); spawnFx(S==='hearteyes'?'♥':S==='stareyes'?'✦':''); }
  requestAnimationFrame(tick); }
setState(DEMO||'idle'); requestAnimationFrame(tick);
$('#btnFs').onclick=()=>{ const d=document,el=d.documentElement; if(d.fullscreenElement||d.webkitFullscreenElement){(d.exitFullscreen||d.webkitExitFullscreen).call(d);return;} const f=el.requestFullscreen||el.webkitRequestFullscreen; if(f)f.call(el); else status.textContent='iPhone은 공유 → 홈 화면에 추가로 전체화면 사용'; };
$('#btnCam').onclick=()=>body.classList.toggle('showcam');
document.addEventListener('keydown',e=>{ if(e.key==='f')$('#btnFs').click(); if(e.key==='c')$('#btnCam').click(); });
window.startCam=async()=>{ try{
  video.srcObject=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:640},height:{ideal:480}}});
  status.textContent='얼굴 인식 모델 불러오는 중…';
  const fs=await FilesetResolver.forVisionTasks("./vendor/mediapipe/wasm");
  const det=await FaceDetector.createFromOptions(fs,{baseOptions:{modelAssetPath:"./vendor/models/blaze_face_short_range.tflite",delegate:"GPU"},runningMode:"VIDEO",minDetectionConfidence:0.5});
  status.textContent='준비 완료!'; let last=-1;
  setInterval(()=>{ if(video.readyState<2||video.currentTime===last)return; last=video.currentTime;
    const r=det.detectForVideo(video,performance.now()); const W=video.videoWidth,H=video.videoHeight;
    if(r.detections.length) onFaces(r.detections.map(d=>d.boundingBox).sort((a,b)=>b.width-a.width).slice(0,4).map(b=>({x:(b.originX+b.width/2)/W,y:(b.originY+b.height/2)/H,w:b.width/W}))); },33);
  // 손 흔들기 인식 (가볍게: 150ms 간격)
  try{ const gr=await GestureRecognizer.createFromOptions(fs,{baseOptions:{modelAssetPath:"./vendor/models/gesture_recognizer.task",delegate:"GPU"},runningMode:"VIDEO",numHands:1});
    const hist=[]; let palmSince=0;
    setInterval(()=>{ if(video.readyState<2||state==='sleeping')return; const now=performance.now(); const r=gr.recognizeForVideo(video,now);
      const g=r.gestures?.[0]?.[0], lm=r.landmarks?.[0];
      if(g&&g.categoryName==='Open_Palm'&&g.score>.6&&lm){ if(!palmSince)palmSince=now; hist.push([now,lm[0].x]); }
      else { palmSince=0; hist.length=0; }
      while(hist.length&&now-hist[0][0]>1300) hist.shift();
      const xs=hist.map(h=>h[1]); const range=xs.length?Math.max(...xs)-Math.min(...xs):0;
      if((xs.length>=4&&range>.07)||(palmSince&&now-palmSince>1200)){ hist.length=0; palmSince=0; onWave(); } },150);
  }catch(e){ console.warn('gesture off',e); }
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
if(DEMO) $('#tap').remove();
