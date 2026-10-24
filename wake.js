// 잠자는 중 움직임으로 깨우기 판단 (순수 함수, 테스트 가능)
// 화면 밝기 전체 변화는 프레임 차이에서 평균을 빼서 무시하고, 움직인 면적이 일정 비율 이상으로 holdMs 동안 이어질 때만 깨웁니다.
export const WAKE={pixTh:22, areaMin:0.015, areaMax:0.5, holdMs:700, gapMs:350, cooldownMs:30000, noFaceMs:10000};
// 64x48 회색조 두 장 → {frac, x, y} (밝기 보정)
export function diffFrame(g,prev,W=64,pixTh=WAKE.pixTh){ let md=0; for(let i=0;i<g.length;i++) md+=g[i]-prev[i]; md/=g.length;
  let n=0,sx=0,sy=0; for(let i=0;i<g.length;i++) if(Math.abs(g[i]-prev[i]-md)>pixTh){ n++; sx+=i%W; sy+=(i/W|0); }
  const H=g.length/W; return {n,frac:n/g.length,x:n?(sx/n+.5)/W:.5,y:n?(sy/n+.5)/H:.5,md}; }
export function createWaker(o={}){ const c={...WAKE,...o}; let since=0,last=0,coolUntil=0;
  return { cfg:c, level:0,
    step(now,frac,asleep){ this.level=frac; const hit=frac>=c.areaMin&&frac<=c.areaMax;
      if(!asleep||now<coolUntil){ since=0; return false; }
      if(hit){ if(!since||now-last>c.gapMs) since=now; last=now; if(now-since>=c.holdMs){ since=0; coolUntil=now+c.cooldownMs; return true; } }
      else if(since&&now-last>c.gapMs) since=0;
      return false; },
    cooldown(now){ coolUntil=now+c.cooldownMs; } }; }
const T={ko:{m:'앗, 누구예요? 👀',d:'깼어요! 안녕하세요 😊',n:'으음… 누구 왔어요? 🌙',gone:'누가 지나갔나 봐요 🙂'},
  en:{m:'Oh! Good morning, who’s there? 👀',d:'I’m awake! Hello 😊',n:'Mmm… is someone there? 🌙',gone:'Someone just passed by 🙂'},
  zh:{m:'咦，早上好，是谁呀？👀',d:'我醒啦！你好 😊',n:'嗯…有人来了吗？🌙',gone:'好像有人路过了 🙂'},
  yue:{m:'咦，早晨，係邊個呀？👀',d:'我醒咗喇！你好 😊',n:'嗯…有人嚟咗咩？🌙',gone:'好似有人行過 🙂'},
  ja:{m:'あっ、おはよう！だれかな？👀',d:'起きたよ！こんにちは 😊',n:'むにゃ…だれかいるの？🌙',gone:'だれか通ったみたい 🙂'}};
export function wakeMsg(lang,hour){ const t=T[lang]||T.ko; return hour>=5&&hour<11?t.m:hour>=11&&hour<20?t.d:t.n; }
export const goneMsg=lang=>(T[lang]||T.ko).gone;
