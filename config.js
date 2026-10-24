// Grok(xAI) 대화 연결 설정. 비워 두면 오프라인 규칙 기반 대화(dialogue.js)만 사용합니다.
// 예: export const GROK_ENDPOINT='https://tv-character-api.onrender.com/api/chat';
// 테스트용으로 URL에 ?grok=https://.../api/chat 을 붙여도 됩니다.
export const GROK_ENDPOINT='';
export const GROK_TIMEOUT_MS=6000;

// 클라우드 음성 인식(STT) 설정. 비워 두면 기기 내 Whisper만 사용합니다.
// 예: export const STT_ENDPOINT='https://tv-character-api.onrender.com/stt';  (테스트: URL에 ?stt=https://.../stt)
export const STT_ENDPOINT='';
export const STT_TIMEOUT_MS=6000;

// 카메라 장면 이해(선택, Grok 연결 시에만 동작). 새 사람 인사 때·최대 60초에 1번·'뭐 보여?' 질문 때 작은 사진(512px)을 보냅니다. 서버에 저장하지 않아요.
// 시험: URL에 ?scene=1
export const SCENE_ENABLED=false;
export const SCENE_MIN_GAP_MS=60000;

// 공공장소용 "살아있는 캐릭터" 설정 (밀리초/비율). 필요하면 숫자만 바꾸세요.
export const LIVE={
  SLEEP_AFTER_MS:180000,      // 아무도 없을 때 잠들기까지 (밤엔 절반)
  DROWSY_MS:40000,            // 잠들기 전 졸린 단계: 이때는 작은 움직임에도 바로 깸
  GREET_GAP_MS:9000,          // 인사 말풍선 전체 최소 간격
  REGREET_MS:120000,          // 같은 사람 다시 인사 안 하는 시간
  LINGER_MS:1500,             // 멈춰서 바라보면 인사 (이 시간 이상 머묾)
  APPROACH_RATIO:1.3,         // 얼굴 크기가 1.5초 안에 이만큼 커지면 다가오는 것으로 보고 인사
  PASSER_MOVE:0.25,           // 이보다 빨리 움직이면 지나가는 사람 (눈길+미소만)
  BG_RATIO:0.35,              // 가까운 사람이 있을 때 이 비율보다 작은(먼) 얼굴은 무시
  CLOSE_W:0.12,               // "가까운 사람" 기준 얼굴 폭(화면 대비)
  BYE_CHANCE:0.4,             // 인사했던 사람이 떠날 때 '또 와요!' 할 확률
  BUBBLE_GAP_MS:4000,         // 자동 말풍선 최소 간격(대화 응답 제외)
  BORED_MS:45000,             // 아무도 관심 없을 때 흥얼거림·하품 등 시작
};

// 요일별 캐릭터. 하나로 고정하려면 0(일)~6(토) 또는 이름(id: kongi,sunny,momo,pip,peach,pop,lala). 시험: ?char=3
export const CHAR_PIN=null;
// 카메라: 'back'(후면, 휴대폰/태블릿 기본) | 'front'. PC 웹캠은 방향 정보가 없어 그대로 사용. ?cam=front|back 로 덮어쓰기
export const CAMERA_FACING='back';
