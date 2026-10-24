// 동작 인식: 손/몸 랜드마크 기하 판정 + 시간 디바운스 (DOM 없음 → node 테스트 가능)
const D=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const ext=(l,tip,pip)=>D(l[0],l[tip])>D(l[0],l[pip])*1.15;   // 손가락 펴짐
export function handShape(l,builtin=''){ if(!l||l.length<21) return '';
  const s=D(l[0],l[9])||1e-3, i=ext(l,8,6), m=ext(l,12,10), r=ext(l,16,14), p=ext(l,20,18), t4=D(l[4],l[8])/s;
  const thumbOut=D(l[4],l[5])>s*.55;
  if(t4<.32&&m&&r&&p) return 'ok';
  if(t4<.38&&!m&&!r&&!p) return 'fingerheart';
  if(builtin==='Thumb_Up'||(thumbOut&&!i&&!m&&!r&&!p&&l[4].y<l[5].y-s*.3)) return 'thumbsup';
  if(builtin==='Victory'||(i&&m&&!r&&!p)) return 'v';
  if(i&&m&&r&&p) return 'palm';
  if(builtin==='Pointing_Up'||(i&&!m&&!r&&!p)) return 'point';
  return ''; }
// 포즈(33점): 0코 11/12어깨 13/14팔꿈치 15/16손목
export function poseShape(p){ if(!p||p.length<17) return '';
  const n=p[0], sw=D(p[11],p[12])||1e-3, L=p[15], R=p[16], up=L.y<n.y-sw*.15&&R.y<n.y-sw*.15, wd=D(L,R);
  if(up&&wd<sw*.7&&Math.abs(p[13].x-p[14].x)>sw*1.05) return 'bigheart';
  if(up&&wd>sw*1.2) return 'armsup';
  if(D(L,n)<sw*.6&&D(R,n)<sw*.6) return 'cover';
  return ''; }
export const HOLD={fingerheart:500,ok:500,thumbsup:500,v:500,point:600,stop:1200,bigheart:500,armsup:500,cover:600};
export const COOL={wave:5000,fingerheart:5000,ok:5000,thumbsup:5000,v:5000,point:6000,stop:6000,bigheart:6000,armsup:6000,clap:5000,peekaboo:6000};
export function createDetector(){ let cur='',since=0,fired='',palmX=[],gap=[],coverSince=0; const last={}; let any=0;
  function fire(g,now){ if(now<(last[g]||0)||now<any) return ''; last[g]=now+COOL[g]; any=now+1500; return g; }
  return { step(now,{hands=[],builtins=[],pose=null}={}){
    const shapes=hands.map((l,k)=>handShape(l,builtins[k]||'')); const ps=poseShape(pose); let out='';
    // 박수: 두 손 손바닥 중심 거리의 붙음/떨어짐 반복
    if(hands.length===2){ const c=h=>({x:(h[0].x+h[9].x)/2,y:(h[0].y+h[9].y)/2}), d=D(c(hands[0]),c(hands[1])), s=D(hands[0][0],hands[0][9]);
      const st=d<s*1.3?'in':d>s*2.2?'out':''; if(st&&(!gap.length||gap[gap.length-1][1]!==st)) gap.push([now,st]); }
    gap=gap.filter(x=>now-x[0]<1600); if(gap.filter(x=>x[1]==='in').length>=2&&gap.length>=4){ gap=[]; out=fire('clap',now); }
    // 흔들기 / 멈춤(손바닥 고정)
    const pi=shapes.indexOf('palm'); if(pi>=0){ palmX.push([now,hands[pi][0].x]); } else palmX=[];
    palmX=palmX.filter(x=>now-x[0]<1300); const xs=palmX.map(x=>x[1]), rg=xs.length?Math.max(...xs)-Math.min(...xs):0;
    if(!out&&xs.length>=4&&rg>.07){ palmX=[]; out=fire('wave',now); }
    // 정적 동작: 포즈 우선
    let g=ps&&ps!=='cover'?ps:(shapes.find(x=>x&&x!=='palm')||'');
    if(!g&&pi>=0&&xs.length>=3&&rg<.03) g='stop';
    if(g!==cur){ cur=g; since=now; fired=''; }
    if(!out&&cur&&cur!==fired&&now-since>=HOLD[cur]){ fired=cur; out=fire(cur,now); }
    // 까꿍: 얼굴 가렸다(≥0.6s) 치우면
    if(ps==='cover'){ if(!coverSince) coverSince=now; } else { if(!out&&coverSince&&now-coverSince>600) out=fire('peekaboo',now); coverSince=0; }
    this.live=ps||shapes.filter(Boolean).join('+'); return out; }, live:'' }; }
// 반응: 표정 + 말풍선(언어별)
export const REACT={
  wave:['greet',{ko:'👋 안녕~! 반가워요!',en:'👋 Hi there!',zh:'👋 你好呀！',yue:'👋 哈囉！',ja:'👋 やっほー！'}],
  fingerheart:['hearteyes',{ko:'💖 하트 받았어요!',en:'💖 Aww, a heart!',zh:'💖 收到爱心啦！',yue:'💖 收到心心！',ja:'💖 ハートありがとう！'}],
  bigheart:['hearteyes',{ko:'💖💖 저도 사랑해요!!',en:'💖💖 I love you too!!',zh:'💖💖 我也爱你！！',yue:'💖💖 我都愛你！！',ja:'💖💖 わたしも大好き！！'}],
  thumbsup:['wink',{ko:'👍 최고예요!',en:'👍 You rock!',zh:'👍 你最棒！',yue:'👍 你好叻！',ja:'👍 さいこう！'}],
  v:['excited',{ko:'✌️ 브이~!',en:'✌️ Peace!',zh:'✌️ 耶~！',yue:'✌️ 耶~！',ja:'✌️ ピース！'}],
  clap:['laugh',{ko:'👏 짝짝짝! 신나요!',en:'👏 Yay, clap clap!',zh:'👏 啪啪啪！好开心！',yue:'👏 拍手！好開心！',ja:'👏 パチパチ！'}],
  point:['curious',{ko:'👉 저요? 저 불렀어요?',en:'👉 Me? You mean me?',zh:'👉 我吗？',yue:'👉 我呀？',ja:'👉 わたし？'}],
  ok:['happy',{ko:'👌 오케이~!',en:'👌 Okay!',zh:'👌 好的！',yue:'👌 OK！',ja:'👌 オッケー！'}],
  stop:['startled',{ko:'✋ 앗, 멈출게요!',en:'✋ Okay, stopping!',zh:'✋ 好，我停下！',yue:'✋ 好，停低！',ja:'✋ はい、ストップ！'}],
  armsup:['excited',{ko:'🙌 만세~!',en:'🙌 Hooray!',zh:'🙌 万岁！',yue:'🙌 萬歲！',ja:'🙌 ばんざーい！'}],
  peekaboo:['surprised',{ko:'🙈 까꿍! 깜짝이야!',en:'🙈 Peekaboo!',zh:'🙈 躲猫猫！',yue:'🙈 喳！',ja:'🙈 いないいないばあ！'}]};
