// 요일별 캐릭터 7종 (getDay: 0=일 … 6=토). 모두 같은 표정·동작을 쓰고 색·눈 모양·리듬·성격·인사만 달라요.
export const CHARS=[
 {id:'kongi',day:0,name:{ko:'콩이',en:'Kongi'},desc:'장난꾸러기 · 살구빛',bg:['#FFE0C2','#FFC99A','#FFB27A'],ink:'#3a1d10',iris:['#c9783a','#7a3b17','#3a1d10'],blush:'#ff7f6e',mouth:'#d9453a',
  eye:{sx:1,sy:1,gap:0},blink:1,breath:1.15,tilt:3,wink:.35,persona:'playful and mischievous little friend who loves peekaboo and silly jokes, always kind',
  greet:{ko:['까꿍! 반가워요 😆','헤헤, 나 찾았어요? 😄','같이 놀아요! 🎈'],en:['Peekaboo! Hi 😆','Hehe, you found me! 😄'],ja:['ばあ！こんにちは 😆'],zh:['躲猫猫！你好 😆'],yue:['睇下我！你好 😆']}},
 {id:'sunny',day:1,name:{ko:'노랑이',en:'Sunny'},desc:'밝고 명랑 · 노랑',bg:['#FFE36B','#FFD93B','#F5C518'],ink:'#1e120a',iris:['#8a5a2b','#4a2a14','#1e120a'],blush:'#ff7a6b',mouth:'#c2302a',
  eye:{sx:1,sy:1,gap:0},blink:1,breath:1,tilt:2,wink:.15,persona:'cheerful sunny friend who cheers everyone up on Monday',
  greet:{ko:['안녕하세요! 힘찬 월요일이에요 😊','반가워요! 오늘도 화이팅 💛'],en:['Hello! Happy Monday 😊'],ja:['こんにちは！月曜日もがんばろう 😊'],zh:['你好！周一加油 😊'],yue:['你好！星期一加油 😊']}},
 {id:'momo',day:2,name:{ko:'몽실이',en:'Momo'},desc:'포근하고 느긋 · 라벤더',bg:['#EEE4FF','#DCCBFA','#C9B4F2'],ink:'#2e1f47',iris:['#9b7fd1','#5a3f8c','#2e1f47'],blush:'#ff9bb8',mouth:'#c94f7c',
  eye:{sx:1.04,sy:.92,gap:0},blink:1.35,breath:.75,tilt:4,wink:.1,persona:'calm, cozy, gentle friend who speaks softly like a warm blanket and sometimes yawns cutely',
  greet:{ko:['안녕하세요~ 포근한 하루예요 ☁️','어서 와요, 천천히 쉬어 가요 🌙','반가워요~ 오늘도 몽실몽실 ☁️'],en:['Hi~ Have a cozy day ☁️'],ja:['こんにちは〜ふわふわな一日を ☁️'],zh:['你好~ 慢慢来哦 ☁️'],yue:['你好~ 慢慢嚟 ☁️']}},
 {id:'pip',day:3,name:{ko:'쫑긋이',en:'Pip'},desc:'호기심 가득 · 민트',bg:['#DDF7EA','#BFEBD6','#A3DEC2'],ink:'#123a33',iris:['#3fa38c','#1f6b5c','#123a33'],blush:'#ff8f84',mouth:'#d24b4b',
  eye:{sx:1.08,sy:1.08,gap:-6},blink:.9,breath:1.05,tilt:7,wink:.15,persona:'curious little explorer who asks friendly questions and finds everything wonderful',
  greet:{ko:['우와, 안녕하세요! 어디 가요? 👀','반가워요! 오늘 뭐 했어요? ✨','안녕하세요! 궁금한 게 많아요 🔍'],en:['Ooh, hi! Where are you going? 👀'],ja:['わあ、こんにちは！どこ行くの？👀'],zh:['哇，你好！去哪里呀？👀'],yue:['嘩，你好！去邊呀？👀']}},
 {id:'peach',day:4,name:{ko:'복숭이',en:'Peachy'},desc:'수줍고 다정 · 복숭아',bg:['#FFE6E0','#FFD1C7','#FFB9AC'],ink:'#40201c',iris:['#c46e5c','#7d3a2f','#40201c'],blush:'#ff6f86',mouth:'#d6456a',
  eye:{sx:.95,sy:.98,gap:8},blink:1.1,breath:.9,tilt:5,wink:.1,blushBoost:.25,persona:'shy, sweet and kind friend who blushes easily and speaks gently',
  greet:{ko:['아, 안녕하세요… 반가워요 ☺️','와 줘서 고마워요 💗','헤헤… 오늘 멋져요 ☺️'],en:['Oh, h-hi… nice to see you ☺️'],ja:['あ、こんにちは…うれしいな ☺️'],zh:['啊，你好…很高兴见到你 ☺️'],yue:['啊，你好…好開心見到你 ☺️']}},
 {id:'pop',day:5,name:{ko:'팡팡이',en:'Pop'},desc:'에너지 뿜뿜 · 하늘색',bg:['#DDF0FF','#BFE3FF','#9FD2FA'],ink:'#13284a',iris:['#4b8fd6','#22548f','#13284a'],blush:'#ff8aa0',mouth:'#d93f5a',
  eye:{sx:1.06,sy:1.04,gap:-4},blink:.8,breath:1.4,tilt:3,wink:.25,persona:'super energetic happy friend who loves Fridays, dancing and high fives',
  greet:{ko:['안녕하세요! 신나는 금요일이에요 🎉','반가워요! 하이파이브 해요 ✋','와아, 오늘 기분 최고예요! ⚡'],en:['Hi! Happy Friday 🎉'],ja:['やっほー！花金だね 🎉'],zh:['你好！周五快乐 🎉'],yue:['你好！星期五開心 🎉']}},
 {id:'lala',day:6,name:{ko:'라라',en:'Lala'},desc:'우아하고 상냥 · 크림 로즈',bg:['#FFF3E6','#F9E0D0','#F1CBB8'],ink:'#3b1f2a',iris:['#b07a5a','#6e3f3a','#3b1f2a'],blush:'#f592a8',mouth:'#c24a68',
  eye:{sx:.98,sy:1.06,gap:4},blink:1.2,breath:.85,tilt:3,wink:.15,persona:'graceful, warm and polite friend who loves flowers, music and relaxing weekends',
  greet:{ko:['안녕하세요, 즐거운 토요일이에요 🌸','어서 오세요, 만나서 기뻐요 🎵','좋은 주말 보내요 🌷'],en:['Hello, lovely Saturday 🌸'],ja:['こんにちは、すてきな土曜日を 🌸'],zh:['你好，周末愉快 🌸'],yue:['你好，週末愉快 🌸']}},
];
export function pickChar(q,pin,date=new Date()){ const v=q??pin; if(v!=null&&v!==''){ const n=+v; const c=Number.isInteger(n)&&n>=0&&n<7?CHARS.find(c=>c.day===n):CHARS.find(c=>c.id===String(v).toLowerCase()||c.name.ko===v||c.name.en.toLowerCase()===String(v).toLowerCase()); if(c) return c; }
  return CHARS.find(c=>c.day===date.getDay()); }
let last='';
export function charGreet(c,lang,rnd=Math.random){ const a=c.greet[lang]||c.greet.en, b=a.length>1?a.filter(x=>x!==last):a; return last=b[Math.floor(rnd()*b.length)%b.length]; }
