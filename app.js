import { FaceDetector, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs";
import * as SP from "./speech.js";
const $=s=>document.querySelector(s), body=document.body, video=$('#video'), status=$('#status');
const SLEEP_MS=30000, GREET_MS=4500, LOST_MS=1500, DEMO=new URLSearchParams(location.search).get('state');
let state='', stT=0, lastSeen=0, faceVisible=false, sleepAt=Date.now()+SLEEP_MS, pendingMsg='';
let target={x:0,y:0}, look={x:0,y:0}, sac={x:0,y:0}, sacT=0, blinkT=Date.now()+2000, blinks=[], fxT=0;
const LABEL={idle:'두리번두리번…',surprised:'앗! 누구지?',greeting:'인사 중!',happy:'함께 있어서 행복해요',yawning:'하아암… 졸려요',sleeping:'쿨쿨 자는 중…',waking:'으쌰~ 기지개!'};
function setState(s){ if(state===s)return; state=s; stT=Date.now(); body.className=body.className.replace(/\b(idle|surprised|greeting|happy|yawning|sleeping|waking)\b/g,'').trim()+' '+s; status.textContent=LABEL[s]; }
function showBubble(msg){ $('#bubble').textContent=msg; setState('greeting'); }
function greetLang(r){ const L=SP.LANGS[r.lang];
  if(!L){ status.textContent=`감지된 언어: ${r.lang||'?'} (지원 안 함) "${r.text}" [${r.dbg||""}]`; return; }
  sleepAt=Date.now()+SLEEP_MS; state=''; showBubble(L.text); status.textContent=`감지된 언어: ${L.label} — "${r.text}"  [${r.dbg}]`; }
function onFace(x,y){ const now=Date.now(); if(!faceVisible){ faceVisible=true;
    if(state==='sleeping'||state==='yawning'){ pendingMsg='앗, 깼어요! 안녕하세요!'; setState('waking'); } else { pendingMsg='안녕하세요!'; setState('surprised'); } }
  lastSeen=now; target={x:Math.max(-1,Math.min(1,-(x*2-1)*1.6)),y:Math.max(-1,Math.min(1,(y*2-1)*1.8))}; } // 카메라 원본은 좌우반전 → 사람이 자기 왼쪽으로 가면 캐릭터도 사람 쪽을 봄
const E=(id)=>{const g=$(id);return{g,open:g.querySelector('.open'),iris:g.querySelector('.iris'),pupil:g.querySelector('.pupil'),happy:g.querySelector('.happy'),closed:g.querySelector('.closed')};};
const eyes=[[E('#eyeL'),260],[E('#eyeR'),540]];
const ease=t=>t<0?0:t>1?1:t*t*(3-2*t);
function spawnFx(){ const f=document.createElement('span'); const heart=Math.random()<.5; f.textContent=heart?'♥':'✦';
  f.style.cssText=`left:${30+Math.random()*40}vw;top:${25+Math.random()*30}vh;color:${heart?'#e8452c':'#fff'};font-size:${4+Math.random()*4}vmin;--dx:${(Math.random()-.5)*8}vmin`;
  $('#fx').appendChild(f); setTimeout(()=>f.remove(),1700); }
let lastT=performance.now();
function tick(){ const now=Date.now(), pn=performance.now(), dt=Math.min(.05,(pn-lastT)/1000); lastT=pn; const t=pn/1000, st=(now-stT)/1000;
  // ── 상태 전환
  if(DEMO){ if(state!==DEMO){ if(DEMO==='greeting')$('#bubble').textContent='안녕하세요!'; setState(DEMO);} }
  else {
  if(faceVisible && now-lastSeen>LOST_MS){ faceVisible=false; sleepAt=now+SLEEP_MS; target={x:0,y:0}; }
  if(state==='surprised'&&st>0.7) showBubble(pendingMsg);
  else if(state==='waking'&&st>1.4) showBubble(pendingMsg);
  else if(state==='greeting'&&st>GREET_MS/1000) setState(faceVisible?'happy':'idle');
  else if(state==='yawning'&&st>2.4) setState('sleeping');
  else if(['idle','happy',''].includes(state)){ if(faceVisible) setState('happy'); else if(now>sleepAt) setState('yawning'); else setState('idle'); }
  }
  const S=state, asleep=S==='sleeping', joy=S==='happy'||S==='greeting';
  // ── 시선: 부드러운 추적 + 미세 단속운동(saccade)
  if(S==='idle' && Math.random()<dt*0.5) target={x:Math.random()*1.6-.8,y:Math.random()*1-.5};
  if(!faceVisible && S!=='idle'){ target.x*=1-dt*2; target.y*=1-dt*2; }
  if(now>sacT){ sacT=now+250+Math.random()*900; sac={x:(Math.random()-.5)*.08,y:(Math.random()-.5)*.06}; }
  const k=1-Math.pow(1-(faceVisible?0.18:0.06),dt*60); look.x+=(target.x-look.x)*k; look.y+=(target.y-look.y)*k;
  const gx=asleep?0:look.x+sac.x, gy=asleep?.3:look.y+sac.y;
  // ── 얼굴 그룹: 숨쉬기/스쿼시/사람 쪽으로 이동·기울기
  const breath=Math.sin(t*(asleep?1.3:2.2)); let sx=1+breath*.012, sy=1-breath*.018, oy=breath*4;
  if(S==='greeting'&&st<1){ const b=Math.sin(st*18)*Math.exp(-st*5)*.12; sx-=b; sy+=b; }
  if(S==='surprised'){ const j=Math.sin(Math.min(st/.35,1)*Math.PI); oy-=j*30; sy+=j*.06; sx-=j*.04; }
  if(S==='waking'){ const p=Math.sin(Math.min(st/1.2,1)*Math.PI); sy+=p*.14; sx-=p*.08; oy-=p*25; }
  if(asleep) oy+=25; if(S==='yawning') oy+=ease(st/2.4)*18;
  const rot=gx*6+(joy?Math.sin(t*3)*2.5:0)+(asleep?-5+Math.sin(t*1.3)*1.5:0)+(S==='yawning'?-ease(st/1.5)*5:0);
  $('#root').setAttribute('transform',`translate(${400+gx*70} ${250+gy*45+oy}) rotate(${rot}) scale(${sx} ${sy}) translate(-400 -250)`);
  // ── 눈 깜빡임 (가끔 두 번)
  if(now>blinkT){ blinks=[now]; if(Math.random()<.25) blinks.push(now+260); blinkT=now+1800+Math.random()*4200; }
  let open=1; for(const b of blinks){ const d=(now-b)/1000; if(d>=0&&d<.16) open=Math.min(open,Math.abs(d-.08)/.08); }
  let mode='open', eyeScale=1, pupilS=1;
  if(asleep) mode='closed'; else if(joy) mode=(S==='happy'&&Math.sin(t*.8)>.3)?'open':'happy';
  if(S==='greeting') mode=st<0.6?'open':'happy';
  if(S==='surprised'){ eyeScale=1.18; pupilS=.55; open=1; }
  if(S==='yawning'){ open=Math.max(.08,1-ease(st/1.2)*.85); if(st>1.8) mode='closed'; }
  if(S==='waking'){ open=st<.5?.15:(st<.7?1:(st<.85?.1:1)); }
  for(const [e,cx] of eyes){
    e.g.setAttribute('transform',`translate(${cx+gx*14} ${220+gy*10}) scale(${eyeScale})`);
    e.open.setAttribute('transform',`scale(1 ${mode==='open'?Math.max(.05,open):.05})`); e.open.style.opacity=mode==='open'?1:0;
    e.happy.style.opacity=mode==='happy'?1:0; e.closed.style.opacity=mode==='closed'?1:0;
    e.iris.setAttribute('transform',`translate(${gx*16} ${gy*16})`); e.pupil.setAttribute('transform',`translate(0 10) scale(${pupilS}) translate(0 -10)`); }
  // ── 입
  const m=$('#mouth'); let d,fill='none';
  if(S==='surprised'){ d='M400 345 a22 28 0 1 0 0.1 0Z'; fill='#1e120a'; }
  else if(S==='yawning'){ const r=ease(st/0.8)*(st<1.9?1:Math.max(0,1-(st-1.9)*2)); d=`M400 ${355-r*25} a${14+r*30} ${6+r*45} 0 1 0 0.1 0Z`; fill='#1e120a'; }
  else if(S==='greeting'){ const o=st<1.6?(Math.abs(Math.sin(st*11))*25+12):22; d=`M340 360 Q400 ${375+o*2.4} 460 360 Z`; fill='#c2302a'; }
  else if(S==='happy'){ d='M350 360 Q400 420 450 360 Z'; fill='#c2302a'; }
  else if(asleep){ d='M385 380 Q400 388 415 380'; }
  else if(S==='waking'){ d='M375 375 Q400 390 425 375'; }
  else d='M365 368 Q400 395 435 368';
  m.setAttribute('d',d); m.setAttribute('fill',fill);
  $('#blush').setAttribute('opacity',joy?.75:(asleep?.3:.45));
  $('#bang').style.opacity=S==='surprised'?1:0;
  if(joy&&now>fxT){ fxT=now+(S==='greeting'?350:900); spawnFx(); }
  requestAnimationFrame(tick); }
setState(DEMO||'idle'); requestAnimationFrame(tick);
$('#btnFs').onclick=()=>{ const d=document,el=d.documentElement; if(d.fullscreenElement||d.webkitFullscreenElement){(d.exitFullscreen||d.webkitExitFullscreen).call(d);return;} const f=el.requestFullscreen||el.webkitRequestFullscreen; if(f)f.call(el); else status.textContent='iPhone은 공유 → 홈 화면에 추가로 전체화면 사용'; };
$('#btnCam').onclick=()=>body.classList.toggle('showcam');
document.addEventListener('keydown',e=>{ if(e.key==='f')$('#btnFs').click(); if(e.key==='c')$('#btnCam').click(); });
window.startCam=async()=>{ try{
  video.srcObject=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:640},height:{ideal:480}}});
  status.textContent='얼굴 인식 모델 불러오는 중…';
  const fs=await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm");
  const det=await FaceDetector.createFromOptions(fs,{baseOptions:{modelAssetPath:"https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",delegate:"GPU"},runningMode:"VIDEO",minDetectionConfidence:0.5});
  status.textContent='준비 완료!'; let last=-1;
  setInterval(()=>{ if(video.readyState<2||video.currentTime===last)return; last=video.currentTime;
    const r=det.detectForVideo(video,performance.now()); if(r.detections.length){ const b=r.detections.sort((a,b)=>b.boundingBox.width-a.boundingBox.width)[0].boundingBox;
      onFace((b.originX+b.width/2)/video.videoWidth,(b.originY+b.height/2)/video.videoHeight);} },33);
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
