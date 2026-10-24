// 오프라인 규칙 기반 대화 엔진 — 의도(intent)별 키워드/정규식과 답변을 여기서 편집하세요.
// 언어 코드: ko, en, zh(简体), yue(粵語/繁體), ja.  답변 안의 {name} {time} {date} 는 자동 치환됩니다.
const R=(s)=>new RegExp(s,'i');
export const INTENTS=[
 // [의도, 표정, {언어: 정규식}]
 ['laugh','laugh',{ko:R('ㅋㅋ|ㅎㅎ|하하|히히|크크|푸하|웃기'),en:R('\\b(ha){2,}|\\bhehe|\\blol\\b|lmao|funny'),zh:R('哈哈|呵呵|嘻嘻|好笑'),yue:R('哈哈|好好笑|笑死'),ja:R('笑|ははは|ふふ|wwww?|面白い|おもしろ')}],
 ['bye','wink',{ko:R('잘\\s?가|안녕히|바이|또\\s?봐|다음에\\s?봐'),en:R('\\b(bye|goodbye|see you|see ya|later)\\b'),zh:R('再见|拜拜|回头见'),yue:R('拜拜|再見|遲啲見'),ja:R('さようなら|またね|バイバイ|じゃあね')}],
 ['greetNight','sleepy',{ko:R('잘\\s?자|굿\\s?나잇|좋은\\s?밤'),en:R('good ?night|sleep well'),zh:R('晚安'),yue:R('早唞|晚安'),ja:R('おやすみ')}],
 ['greetMorning','excited',{ko:R('좋은\\s?아침|굿모닝|잘\\s?잤'),en:R('good morning|\\bmorning\\b'),zh:R('早上好|早安|早'),yue:R('早晨|早安'),ja:R('おはよう')}],
 ['thanks','shy',{ko:R('고마|감사|땡큐'),en:R('thank|thanks|thx|appreciate'),zh:R('谢谢|感谢|多谢'),yue:R('唔該|多謝|謝謝'),ja:R('ありがとう|感謝|サンキュー')}],
 ['sorry','sad',{ko:R('미안|죄송|잘못했'),en:R("sorry|my bad|apolog"),zh:R('对不起|抱歉|不好意思'),yue:R('對唔住|唔好意思|sorry'),ja:R('ごめん|すみません|申し訳')}],
 ['askName','happy',{ko:R('이름이?\\s?(뭐|모|무엇)|누구(야|니|세요)|너\\s?누구'),en:R("your name|who are you"),zh:R('你叫什么|名字|你是谁'),yue:R('你叫咩|咩名|你係邊個'),ja:R('名前|誰')}],
 ['askAge','curious',{ko:R('몇\\s?살|나이'),en:R('how old|your age'),zh:R('几岁|多大|年龄'),yue:R('幾多歲|幾歲'),ja:R('何歳|年齢|いくつ')}],
 ['time','curious',{ko:R('몇\\s?시|시간'),en:R('what time|the time'),zh:R('几点|时间'),yue:R('幾點|時間'),ja:R('何時|時間')}],
 ['date','curious',{ko:R('며칠|몇\\s?월|날짜|무슨\\s?요일|오늘이?\\s?며'),en:R("what day|\\bdate\\b"),zh:R('几号|日期|星期几|礼拜几'),yue:R('幾號|日期|星期幾|禮拜幾'),ja:R('何日|日付|何曜日')}],
 ['weather','curious',{ko:R('날씨|비\\s?와|더워|추워'),en:R('weather|raining|hot today|cold today'),zh:R('天气|下雨|好热|好冷'),yue:R('天氣|落雨|好熱|好凍'),ja:R('天気|雨|暑い|寒い')}],
 ['joke','laugh',{ko:R('농담|웃긴\\s?얘기|웃겨\\s?줘|재밌는\\s?얘기'),en:R('joke|make me laugh|something funny'),zh:R('笑话|讲个笑|逗我'),yue:R('笑話|講個笑|氹我'),ja:R('冗談|ジョーク|笑わせて|面白い話')}],
 ['loveYou','hearteyes',{ko:R('사랑해|좋아해|보고\\s?싶'),en:R('love you|like you|miss you'),zh:R('爱你|喜欢你|想你'),yue:R('愛你|鍾意你|掛住你'),ja:R('好き|愛してる|大好き|会いたい')}],
 ['compliment','shy',{ko:R('귀여|귀엽|예뻐|이뻐|멋져|최고|똑똑|잘했'),en:R('cute|pretty|beautiful|awesome|smart|good job|amazing|cool'),zh:R('可爱|漂亮|好棒|厉害|聪明|真棒'),yue:R('可愛|靚|好叻|勁|好正'),ja:R('かわいい|可愛い|すごい|賢い|かっこいい|えらい')}],
 ['sad','sad',{ko:R('슬퍼|우울|힘들|피곤|지쳤|속상|외로'),en:R("\\bsad\\b|tired|exhausted|lonely|depress|not good|bad day|upset"),zh:R('难过|伤心|累|孤单|不开心|郁闷'),yue:R('唔開心|好攰|攰|傷心|寂寞'),ja:R('悲しい|疲れ|寂しい|つらい|辛い|落ち込')}],
 ['food','excited',{ko:R('밥|먹었|배고|맛있|음식|점심|저녁|아침\\s?먹'),en:R('\\b(eat|ate|food|hungry|lunch|dinner|breakfast|delicious)\\b'),zh:R('吃|饿|饭|好吃|午餐|晚餐'),yue:R('食|肚餓|飯|好味'),ja:R('食べ|ご飯|お腹|美味し|おいし|ランチ')}],
 ['hobby','curious',{ko:R('취미|좋아하는\\s?거|뭐\\s?좋아|게임|노래|음악|영화'),en:R('hobby|hobbies|what do you like|music|movie|game|song'),zh:R('爱好|喜欢什么|音乐|电影|游戏|唱歌'),yue:R('興趣|鍾意咩|音樂|電影|打機|唱歌'),ja:R('趣味|何が好き|音楽|映画|ゲーム|歌')}],
 ['howAreYou','happy',{ko:R('잘\\s?지내|잘\\s?지냈|어떻게\\s?지내|기분\\s?어때|괜찮아\\?|뭐\\s?해'),en:R("how are you|how's it going|how do you feel|what'?s up|how are things"),zh:R('你好吗|怎么样|在干嘛|心情'),yue:R('你好嗎|點呀|做緊咩|幾好嗎'),ja:R('元気|調子|何してる')}],
 ['greet','greet',{ko:R('안녕|반가|하이|헬로'),en:R('\\b(hello|hi|hey|yo)\\b'),zh:R('你好|嗨|您好'),yue:R('你好|哈囉|喂'),ja:R('こんにちは|こんばんは|やあ|はじめまして')}],
 ['yes','happy',{ko:R('^(응|어|네|예|그래|맞아|좋아|당연)'),en:R('^(yes|yeah|yep|sure|ok|okay|of course)\\b'),zh:R('^(是|对|好|嗯|可以|当然)'),yue:R('^(係|啱|好|得|當然)'),ja:R('^(はい|うん|ええ|そう|いいよ)')}],
 ['no','curious',{ko:R('^(아니|아뇨|싫어|별로|안\\s?)'),en:R('^(no|nope|nah|not really)\\b'),zh:R('^(不|没有|没|不是)'),yue:R('^(唔|冇|唔係)'),ja:R('^(いいえ|いや|ううん|別に)')}],
];
// 답변: 언어별 여러 개 (무작위, 직전 답변 반복 피함)
export const REPLIES={
 greet:{ko:['안녕하세요{name}! 반가워요 😊','어서 와요{name}~ 오늘도 반가워요!','하이하이{name}! 보고 싶었어요~'],en:['Hi{name}! So happy to see you 😊','Hello{name}~ you came back!','Hey hey{name}! I missed you'],zh:['你好{name}！很高兴见到你 😊','嗨{name}~ 你来啦！'],yue:['你好呀{name}！好開心見到你 😊','哈囉{name}~ 你嚟咗喇！'],ja:['こんにちは{name}！会えて嬉しい 😊','やあ{name}〜 来てくれたんだね！']},
 greetMorning:{ko:['좋은 아침이에요{name}! ☀ 잘 잤어요?','굿모닝! 오늘도 힘내요!'],en:['Good morning{name}! ☀ Did you sleep well?','Morning! Let\'s have a great day!'],zh:['早上好{name}！☀ 睡得好吗？','早安！今天也加油！'],yue:['早晨{name}！☀ 瞓得好唔好？','早晨！今日都要加油！'],ja:['おはよう{name}！☀ よく眠れた？','おはよう！今日もがんばろう！']},
 greetNight:{ko:['잘 자요{name}~ 좋은 꿈 꿔요 🌙','굿나잇! 내일 또 만나요'],en:['Good night{name}~ sweet dreams 🌙','Night night! See you tomorrow'],zh:['晚安{name}~ 做个好梦 🌙','晚安！明天见'],yue:['早唞{name}~ 發個好夢 🌙','早唞！聽日見'],ja:['おやすみ{name}〜 いい夢見てね 🌙','おやすみ！また明日ね']},
 bye:{ko:['잘 가요{name}! 또 와요 👋','벌써 가요? 다음에 꼭 봐요!'],en:['Bye{name}! Come back soon 👋','Leaving already? See you next time!'],zh:['拜拜{name}！早点回来哦 👋','这么快就走啦？下次见！'],yue:['拜拜{name}！早啲返嚟呀 👋','咁快走喇？下次見！'],ja:['バイバイ{name}！また来てね 👋','もう行っちゃうの？またね！']},
 thanks:{ko:['헤헤, 천만에요~','별말씀을요! 부끄러워요 ☺'],en:['Hehe, you\'re welcome~','Aww, anytime! ☺'],zh:['嘿嘿，不客气~','不用谢啦 ☺'],yue:['嘿嘿，唔使客氣~','唔使謝啦 ☺'],ja:['えへへ、どういたしまして〜','いえいえ！照れるな ☺']},
 sorry:{ko:['괜찮아요! 신경 쓰지 마요','에이~ 전혀 괜찮아요 😊'],en:['It\'s okay! Don\'t worry','No problem at all 😊'],zh:['没关系！别在意','完全没关系 😊'],yue:['冇問題！唔使介意','冇事冇事 😊'],ja:['大丈夫だよ！気にしないで','全然平気だよ 😊']},
 howAreYou:{ko:['저는 아주 좋아요! 당신은요?','덕분에 기분 최고예요! 오늘 어땠어요?'],en:['I\'m great! How about you?','Seeing you makes me happy! How was your day?'],zh:['我很好！你呢？','看到你我就很开心！今天过得怎么样？'],yue:['我好好呀！你呢？','見到你就好開心！今日點呀？'],ja:['元気だよ！あなたは？','会えて最高の気分！今日はどうだった？']},
 askName:{ko:['저는 노랑이에요! 당신 이름은 뭐예요?','노랑이라고 불러줘요 💛 당신은요?'],en:['I\'m Sunny! What\'s your name?','Call me Sunny 💛 And you?'],zh:['我叫小黄！你叫什么名字？','叫我小黄吧 💛 你呢？'],yue:['我叫小黃！你叫咩名呀？','叫我小黃啦 💛 你呢？'],ja:['わたしはキイロだよ！あなたの名前は？','キイロって呼んでね 💛 あなたは？']},
 askAge:{ko:['비밀이에요~ 🤫 아직 아기 로봇이에요!','태어난 지 얼마 안 됐어요 헤헤'],en:['That\'s a secret~ 🤫 I\'m a baby robot!','I was born very recently, hehe'],zh:['这是秘密~ 🤫 我还是个小宝宝机器人！','我才刚出生不久，嘿嘿'],yue:['秘密嚟㗎~ 🤫 我仲係BB機械人！','我啱啱出世唔耐，嘿嘿'],ja:['ひみつだよ〜 🤫 まだ赤ちゃんロボット！','生まれたばかりなんだ、えへへ']},
 time:{ko:['지금은 {time}이에요 ⏰'],en:['It\'s {time} now ⏰'],zh:['现在是{time} ⏰'],yue:['而家係{time} ⏰'],ja:['今は{time}だよ ⏰']},
 date:{ko:['오늘은 {date}이에요 📅'],en:['Today is {date} 📅'],zh:['今天是{date} 📅'],yue:['今日係{date} 📅'],ja:['今日は{date}だよ 📅']},
 weather:{ko:['창밖이 안 보여요… 따뜻하게 입어요!','날씨는 몰라도 제 기분은 맑음이에요 ☀'],en:['I can\'t see outside… but dress warmly!','Not sure about the weather, but my mood is sunny ☀'],zh:['我看不到外面…记得穿暖和点！','天气不知道，但我的心情是晴天 ☀'],yue:['我睇唔到出面…記得着多件衫！','天氣唔知，但我心情係晴天 ☀'],ja:['外が見えないの…あったかくしてね！','天気はわからないけど、気分は晴れ ☀']},
 joke:{ko:['바나나가 웃으면? 바나나킥! ㅋㅋㅋ','제일 가난한 왕은? 최저임금! ㅎㅎ','소가 웃으면? 우하하! 🐮'],en:['Why do robots take vacations? To recharge! Haha','A sleeping dinosaur? A dino-snore! 🦖','Why are eggs bad at jokes? They crack up! 🥚'],zh:['为什么机器人去度假？因为要充电！哈哈','小明爸爸有三个儿子，老三叫什么？小明！哈哈'],yue:['點解機械人要放假？因為要叉電！哈哈','邊隻動物最鍾意問問題？羊！咩～咩～ 哈哈'],ja:['ロボットが休暇に行く理由は？充電するため！あはは','布団が…ふっとんだ！ 😆']},
 laugh:{ko:['ㅎㅎㅎ 저도 웃겨요!','ㅋㅋㅋㅋ 너무 재밌어요!','헤헤헤~ 😆'],en:['Hahaha! That\'s funny!','Hehehe~ 😆','Haha, you make me laugh!'],zh:['哈哈哈！太好笑了！','嘻嘻嘻~ 😆'],yue:['哈哈哈！好好笑呀！','嘻嘻~ 笑死我 😆'],ja:['あははは！おもしろい！','えへへへ〜 😆']},
 loveYou:{ko:['저도 정말 좋아해요{name}! 💛','꺄~ 부끄러워요! 저도요 💛'],en:['I like you too{name}! 💛','Eek~ I\'m blushing! Me too ♥'],zh:['我也喜欢你{name}！💛','哎呀~ 好害羞！我也是 ♥'],yue:['我都鍾意你{name}！💛','哎呀~ 好怕醜！我都係 ♥'],ja:['わたしも大好き{name}！💛','きゃ〜 照れる！わたしも ♥']},
 compliment:{ko:['헤헤 고마워요… 부끄러워요 ☺','정말요? 기분 최고예요!'],en:['Hehe thank you… I\'m blushing ☺','Really? That made my day!'],zh:['嘿嘿谢谢…好害羞 ☺','真的吗？我太开心了！'],yue:['嘿嘿多謝…好怕醜 ☺','真係？好開心呀！'],ja:['えへへ、ありがとう…照れる ☺','ほんと？うれしい！']},
 sad:{ko:['괜찮아요, 제가 옆에 있어요 💛','오늘 정말 수고 많았어요. 푹 쉬어요','토닥토닥… 힘내요!'],en:['It\'s okay, I\'m right here 💛','You worked hard today. Get some rest','*pat pat* You\'ve got this!'],zh:['没关系，我在你身边 💛','今天辛苦了，好好休息','抱抱…加油！'],yue:['唔緊要，我喺度陪你 💛','今日辛苦晒，好好休息','攬攬…加油！'],ja:['大丈夫、そばにいるよ 💛','今日もお疲れさま。ゆっくり休んでね','よしよし…がんばって！']},
 food:{ko:['우와, 맛있겠어요! 저는 전기만 먹어요 ⚡','밥은 꼭 챙겨 먹어요! 뭐 먹었어요?'],en:['Yum! I only eat electricity ⚡','Make sure you eat well! What did you have?'],zh:['哇好好吃的样子！我只吃电 ⚡','要好好吃饭哦！你吃了什么？'],yue:['嘩好好味嘅樣！我淨係食電 ⚡','要食飽啲呀！你食咗咩？'],ja:['おいしそう！わたしは電気しか食べないの ⚡','ちゃんと食べてね！何食べた？']},
 hobby:{ko:['사람 구경이랑 낮잠이 취미예요! 당신은요?','노래 듣는 걸 좋아해요! 당신은요? 🎵'],en:['I love people-watching and naps! You?','I like music 🎵 What do you like?'],zh:['我喜欢看人和睡午觉！你呢？','我喜欢音乐 🎵 你喜欢什么？'],yue:['我鍾意睇人同瞓晏覺！你呢？','我鍾意音樂 🎵 你鍾意咩？'],ja:['人を眺めるのとお昼寝が好き！あなたは？','音楽が好き 🎵 何が好き？']},
 yes:{ko:['좋아요! 😊','그렇군요! 헤헤'],en:['Yay! 😊','I see! Hehe'],zh:['太好了！😊','原来如此！嘿嘿'],yue:['好嘢！😊','原來係咁！嘿嘿'],ja:['やった！😊','そうなんだ！えへへ']},
 no:{ko:['아, 그렇군요~','음, 알겠어요!'],en:['Oh, I see~','Hmm, okay!'],zh:['哦，这样啊~','嗯，好的！'],yue:['哦，係咁呀~','嗯，明白！'],ja:['そっか〜','うん、わかった！']},
 unknown:{ko:['음? 잘 모르겠어요… 다시 말해줄래요?','헤헤, 그게 뭐예요? 🤔','우와, 신기한 말이네요!'],en:['Hmm? I didn\'t get that… say it again?','Hehe, what\'s that? 🤔','Ooh, interesting!'],zh:['嗯？我没听懂…再说一次？','嘿嘿，那是什么？🤔'],yue:['嗯？我聽唔明…再講多次？','嘿嘿，嗰個係咩？🤔'],ja:['ん？よくわからなかった…もう一回？','えへへ、それなあに？🤔']},
 // 대답에 대한 반응
 gotName:{ko:['{name}! 멋진 이름이에요. 기억할게요 💛'],en:['{name}! What a nice name. I\'ll remember it 💛'],zh:['{name}！好名字，我会记住的 💛'],yue:['{name}！好好聽嘅名，我會記住 💛'],ja:['{name}！すてきな名前。覚えておくね 💛']},
 dayGood:{ko:['와 다행이에요! 저도 기뻐요 😊'],en:['Yay, I\'m glad! 😊'],zh:['太好了，我也很开心 😊'],yue:['好嘢，我都好開心 😊'],ja:['よかった！わたしもうれしい 😊']},
};
// 먼저 건네는 질문
export const QUESTIONS=[
 ['day',{ko:'오늘 하루 어땠어요?',en:'How was your day?',zh:'今天过得怎么样？',yue:'今日過成點呀？',ja:'今日はどうだった？'}],
 ['food',{ko:'밥은 먹었어요?',en:'Did you eat?',zh:'你吃饭了吗？',yue:'食咗飯未呀？',ja:'ご飯食べた？'}],
 ['name',{ko:'이름이 뭐예요?',en:'What\'s your name?',zh:'你叫什么名字？',yue:'你叫咩名呀？',ja:'お名前は？'}],
 ['hobby',{ko:'요즘 뭐 하면서 놀아요?',en:'What do you do for fun?',zh:'你平时喜欢做什么？',yue:'你平時鍾意做咩？',ja:'最近なにして遊んでる？'}],
 ['mood',{ko:'지금 기분 어때요?',en:'How are you feeling?',zh:'你现在心情怎么样？',yue:'你而家心情點？',ja:'いまの気分はどう？'}],
];
const NAME_RE={ko:/(?:내\s?이름은|저는|나는|제\s?이름은)?\s*([가-힣]{1,4}?)(?:이에요|예요|입니다|이야|야|이라고\s?해|라고\s?해|$)/,en:/(?:my name is|i am|i'm|call me|it's)\s+([a-z][a-z'-]{1,15})/i,zh:/(?:我叫|我是|叫我)\s*([\u4e00-\u9fff]{1,4}|[a-z]+)/i,yue:/(?:我叫|我係|叫我)\s*([\u4e00-\u9fff]{1,4}|[a-z]+)/i,ja:/(?:私は|わたしは|僕は|ぼくは|名前は)?\s*([\u3040-\u30ff\u4e00-\u9fff]{1,6}?)(?:です|だよ|といいます|と申します|$)/};
const POS={ko:/좋|괜찮|행복|재밌|최고/,en:/good|great|fine|happy|awesome|nice/i,zh:/好|开心|不错/,yue:/好|開心|唔錯/,ja:/いい|良い|楽しい|元気|最高/};
const ctx={name:'',awaiting:'',last:{}};
const pick=(arr,key)=>{ let i,c=0; do{ i=Math.floor(Math.random()*arr.length); }while(arr.length>1&&i===ctx.last[key]&&++c<9); ctx.last[key]=i; return arr[i]; };
function fill(s,lang){ const d=new Date(), loc={ko:'ko-KR',en:'en-US',zh:'zh-CN',yue:'zh-HK',ja:'ja-JP'}[lang]||'en-US';
  const nm=ctx.name?(lang==='en'?', '+ctx.name:lang==='ko'?' '+ctx.name+'님':lang==='ja'?' '+ctx.name+'さん':'，'+ctx.name):'';
  return s.replace('{time}',d.toLocaleTimeString(loc,{hour:'numeric',minute:'2-digit'})).replace('{date}',d.toLocaleDateString(loc,{month:'long',day:'numeric',weekday:'long'})).replace(/\{name\}/g,s.startsWith('{name}')?ctx.name:nm); }
const L=l=>REPLIES.greet[l]?l:'en';
export function intentOf(text,lang){ lang=L(lang); const t=text.trim(); for(const [id,expr,re] of INTENTS){ if(re[lang]?.test(t)) return {id,expr}; } return {id:'unknown',expr:'curious'}; }
// 반환: {text, expr, intent}
export function respond(text,lang){ lang=L(lang); const t=text.trim(); const aw=ctx.awaiting; ctx.awaiting='';
  if(aw==='name'){ const m=t.match(NAME_RE[lang]); if(m&&m[1]&&m[1].length>0){ ctx.name=m[1].replace(/^./,c=>c.toUpperCase()); return {text:fill(pick(REPLIES.gotName[lang],'gn'),lang),expr:'hearteyes',intent:'gotName'}; } }
  let {id,expr}=intentOf(t,lang);
  if(['day','mood'].includes(aw)&&(id==='unknown'||id==='yes')&&POS[lang].test(t)){ id='dayGood'; expr='happy'; }
  if(aw==='food'&&(id==='unknown'||id==='yes')){ id='food'; expr='excited'; }
  const r=fill(pick(REPLIES[id][lang],id),lang);
  if(id==='askName'||id==='howAreYou') ctx.awaiting=id==='askName'?'name':'day';
  if(id==='hobby'||id==='food') ctx.awaiting='';
  return {text:r,expr,intent:id}; }
export function ask(lang){ lang=L(lang); const pool=QUESTIONS.filter(q=>!(q[0]==='name'&&ctx.name)); const q=pick(pool,'q'); ctx.awaiting=q[0]; return {text:q[1][lang],expr:'curious',intent:'ask:'+q[0]}; }
export function setName(n){ ctx.name=n; } export const state=ctx;
