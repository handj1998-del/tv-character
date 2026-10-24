import { FaceDetector, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs";
import * as SP from "./speech.js";
const $=s=>document.querySelector(s), body=document.body, video=$('#video'), status=$('#status');
const SLEEP_MS=30000, GREET_MS=3500, LOST_MS=1500;
let state='idle', lastSeen=0, faceVisible=false, voice=true, greetUntil=0, sleepAt=Date.now()+SLEEP_MS;
let target={x:0,y:0}, look={x:0,y:0}, blinkT=0;
function setState(s){ if(state===s)return; state=s; body.classList.remove('idle','greeting','happy','sleeping'); body.classList.add(s); status.textContent={idle:'두리번두리번…',greeting:'인사 중!',happy:'함께 있어서 행복해요',sleeping:'쿨쿨 자는 중…'}[s]; }
function say(t,lang='ko-KR'){ if(!voice||!speechSynthesis)return; const u=new SpeechSynthesisUtterance(t); u.lang=lang; const v=speechSynthesis.getVoices().find(v=>v.lang.replace('_','-')===lang); if(v)u.voice=v; SP.setMute(2500+t.length*300); u.onend=()=>SP.setMute(600); u.pitch=1.5; speechSynthesis.cancel(); speechSynthesis.speak(u); }
function greetLang(r){ const L=SP.LANGS[r.lang];
  if(!L){ status.textContent=`감지된 언어: ${r.lang||'?'} (지원 안 함) "${r.text}"`; return; }
  $('#bubble').textContent=L.text; greetUntil=Date.now()+GREET_MS; sleepAt=Date.now()+SLEEP_MS; state='';
  setState('greeting'); status.textContent=`감지된 언어: ${L.label} — "${r.text}"`; say(L.text,L.tts); }
function greet(wasSleeping){ const msg=wasSleeping?'앗, 깼어요! 안녕하세요!':'안녕하세요!'; $('#bubble').textContent=msg; greetUntil=Date.now()+GREET_MS; setState('greeting'); say(msg); }
function onFace(x,y){ const now=Date.now(); if(!faceVisible){ faceVisible=true; greet(state==='sleeping'); } lastSeen=now; target={x:-(x*2-1),y:y*2-1}; } // mirrored
function tick(){ const now=Date.now();
  if(faceVisible && now-lastSeen>LOST_MS){ faceVisible=false; sleepAt=now+SLEEP_MS; }
  if(state==='greeting' && now>greetUntil) setState(faceVisible?'happy':'idle');
  if(state!=='greeting'){ if(faceVisible) setState('happy'); else if(now>sleepAt) setState('sleeping'); else setState('idle'); }
  if(state==='idle' && Math.random()<0.01) target={x:Math.random()*2-1,y:Math.random()*1.2-0.6};
  look.x+=(target.x-look.x)*0.08; look.y+=(target.y-look.y)*0.08;
  let sy=1; if(now>blinkT){ blinkT=now+2000+Math.random()*4000; } const d=blinkT-now; if(d<150) sy=Math.abs(d-75)/75;
  const t=now/1000, bob=state==='sleeping'?Math.sin(t)*6:Math.sin(t*2)*4;
  for(const [id,cx] of [['#eyeL',270],['#eyeR',530]]){ const g=$(id); g.setAttribute('transform',`translate(${cx+look.x*25},${270+look.y*20+bob}) scale(1,${sy})`); g.querySelector('.pupil').setAttribute('cx',look.x*30); g.querySelector('.pupil').setAttribute('cy',look.y*35); }
  $('#mouth').setAttribute('d', state==='sleeping'?'M380 440 Q400 445 420 440': (state==='happy'||state==='greeting')?'M330 420 Q400 500 470 420':'M360 430 Q400 450 440 430');
  requestAnimationFrame(tick); }
setState('idle'); body.classList.add('idle'); requestAnimationFrame(tick);
$('#btnFs').onclick=()=>{ const d=document,el=d.documentElement; if(d.fullscreenElement||d.webkitFullscreenElement){(d.exitFullscreen||d.webkitExitFullscreen).call(d);return;} const f=el.requestFullscreen||el.webkitRequestFullscreen; if(f)f.call(el); else status.textContent='iPhone은 공유 → 홈 화면에 추가로 전체화면 사용'; };
$('#btnCam').onclick=()=>body.classList.toggle('showcam');
$('#btnVoice').onclick=()=>{voice=!voice; $('#btnVoice').textContent=voice?'🔊 음성 켜짐':'🔇 음성 꺼짐';};
document.addEventListener('keydown',e=>{ if(e.key==='f')$('#btnFs').click(); if(e.key==='c')$('#btnCam').click(); });
window.startCam=async()=>{ try{
  video.srcObject=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:640},height:{ideal:480}}});
  status.textContent='얼굴 인식 모델 불러오는 중…';
  const fs=await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm");
  const det=await FaceDetector.createFromOptions(fs,{baseOptions:{modelAssetPath:"https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",delegate:"GPU"},runningMode:"VIDEO",minDetectionConfidence:0.5});
  status.textContent='준비 완료!'; let last=-1;
  setInterval(()=>{ if(video.readyState<2||video.currentTime===last)return; last=video.currentTime;
    const r=det.detectForVideo(video,performance.now()); if(r.detections.length){ const b=r.detections.sort((a,b)=>b.boundingBox.width-a.boundingBox.width)[0].boundingBox;
      onFace((b.originX+b.width/2)/video.videoWidth,(b.originY+b.height/2)/video.videoHeight);} },100);
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
speechSynthesis?.getVoices();

$('#tap').onclick=async()=>{ $('#tap').remove();
  try{ const u=new SpeechSynthesisUtterance(' '); u.volume=0; speechSynthesis.speak(u);}catch{}
  try{ await video.play(); }catch{}
  await window.startCam(); video.play().catch(()=>{}); };
