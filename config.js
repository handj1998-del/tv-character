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
