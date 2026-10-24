// 군중 처리: 지나가는 사람 vs 머무는 사람, 인사 빈도 제한, 주목 대상, 떠날 때 반응 (순수, 테스트 가능)
export const DEF={GREET_GAP_MS:9000,REGREET_MS:120000,LINGER_MS:1500,APPROACH_RATIO:1.3,PASSER_MOVE:0.25,BG_RATIO:0.35,CLOSE_W:0.12,BYE_CHANCE:0.4};
export function filterBackground(tr,c=DEF){ const mx=Math.max(0,...tr.map(t=>t.w)); return mx>=c.CLOSE_W?tr.filter(t=>t.w>=mx*c.BG_RATIO):tr; }
export function attention(tr){ let b=null,bs=-1; for(const t of tr){ const s=t.w*2+(1-Math.abs(t.x-.5))*.15+(t.frontal??.5)*.2; if(s>bs){bs=s;b=t;} } return b; }
export function createCrowd(o={},rnd=Math.random){ const c={...DEF,...o}; const P=new Map(); let lastGreet=-1e12; const greeted=[];
  const seenBefore=(t,now)=>greeted.some(g=>now-g.t<c.REGREET_MS&&(g.id===t.id||(Math.abs(g.x-t.x)<.12&&Math.abs(Math.log(g.w/t.w))<.4&&now-g.t<8000)));
  return { cfg:c,
    update(now,tracks){ const ev={greet:null,glance:[],left:null}; const tr=filterBackground(tracks,c), ids=new Set(tr.map(t=>t.id));
      for(const t of tr){ let p=P.get(t.id); if(!p){ p={born:now,x:t.x,w0:t.w,hist:[[now,t.w,t.x]],greeted:false,glanced:false}; P.set(t.id,p); }
        p.hist.push([now,t.w,t.x]); while(p.hist.length&&now-p.hist[0][0]>1500) p.hist.shift();
        const h0=p.hist[0], dts=Math.max(.2,(now-h0[0])/1000), speed=Math.abs(t.x-h0[2])/dts, grow=t.w/h0[1];
        p.speed=speed; p.last=now; p.w=t.w; p.x=t.x;
        const linger=now-p.born>=c.LINGER_MS&&speed<c.PASSER_MOVE, approach=now-h0[0]>500&&grow>=c.APPROACH_RATIO;
        if(!p.glanced){ p.glanced=true; ev.glance.push(t); }
        if(!p.greeted&&(linger||approach)&&!seenBefore(t,now)&&now-lastGreet>=c.GREET_GAP_MS&&!ev.greet){ p.greeted=true; lastGreet=now; greeted.push({id:t.id,x:t.x,w:t.w,t:now}); ev.greet=t; }
        else if(!p.greeted&&(linger||approach)&&seenBefore(t,now)) p.greeted=true; }
      for(const [id,p] of P) if(!ids.has(id)&&now-p.last>1200){ P.delete(id); if(p.greeted&&now-p.born>4000&&!ev.left&&rnd()<c.BYE_CHANCE) ev.left={id,x:p.x}; }
      while(greeted.length&&now-greeted[0].t>c.REGREET_MS) greeted.shift();
      return ev; } }; }
// 인사 문구: 언어·시간대별, 직전과 겹치지 않게
const G={ko:{m:['좋은 아침이에요! ☀️','안녕하세요, 상쾌한 아침이에요! 😊','아침부터 반가워요! 🌼'],d:['안녕하세요! 😊','반가워요! 👋','어서 오세요! 😄','와, 안녕하세요! ✨','만나서 반가워요! 💛'],e:['좋은 저녁이에요! 🌙','오늘 하루 수고했어요! 😊','저녁에 만나서 반가워요! ✨']},
 en:{m:['Good morning! ☀️','Morning! Nice to see you 😊'],d:['Hello! 😊','Hi there! 👋','Hey, welcome! 😄','Nice to see you! ✨'],e:['Good evening! 🌙','Hi! Hope your day went well 😊']},
 zh:{m:['早上好！☀️','早安，见到你真开心！😊'],d:['你好！😊','嗨，欢迎！👋','很高兴见到你！✨'],e:['晚上好！🌙','今天辛苦啦！😊']},
 yue:{m:['早晨！☀️','早晨呀，好開心見到你！😊'],d:['你好！😊','哈囉，歡迎！👋','好開心見到你！✨'],e:['晚安呀！🌙','今日辛苦晒！😊']},
 ja:{m:['おはよう！☀️','おはようございます！😊'],d:['こんにちは！😊','やあ、いらっしゃい！👋','会えてうれしい！✨'],e:['こんばんは！🌙','今日もおつかれさま！😊']}};
const BYE={ko:['또 와요! 👋','잘 가요~ 👋','다음에 또 봐요! 💛'],en:['Come again! 👋','Bye-bye! 👋'],zh:['再来玩哦！👋','拜拜！👋'],yue:['得閒再嚟呀！👋','拜拜！👋'],ja:['また来てね！👋','バイバイ！👋']};
let lastG='', lastB='';
const pick=(arr,prev,rnd)=>{ const a=arr.length>1?arr.filter(x=>x!==prev):arr; return a[Math.floor(rnd()*a.length)%a.length]; };
export const tod=h=>h>=5&&h<11?'m':h>=11&&h<18?'d':'e';
export function greetPhrase(lang,hour,rnd=Math.random){ const g=G[lang]||G.ko, pool=rnd()<.5?g[tod(hour)]:g.d.concat(g[tod(hour)]); return lastG=pick(pool,lastG,rnd); }
export function byePhrase(lang,rnd=Math.random){ return lastB=pick(BYE[lang]||BYE.ko,lastB,rnd); }
