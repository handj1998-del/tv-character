# Grok 대화 연결 (선택)

현재 사이트는 오프라인 규칙 기반 대화(`dialogue.js`)로 동작합니다. Grok을 켜려면:

1. https://console.x.ai 에서 API 키를 발급합니다.
2. Render에서 이 저장소의 `render.yaml`로 Blueprint를 만들거나, Web Service(Node, Root Dir `server`, Start `node server.js`)를 만들고
   환경변수 `XAI_API_KEY`(키), `XAI_MODEL`(선택), `ALLOWED_ORIGINS=https://tv-character.onrender.com` 을 설정합니다.
3. `https://<서비스>.onrender.com/health` 가 `{"ok":true,"key":true}` 인지 확인합니다.
4. 루트의 `config.js` 에서 `GROK_ENDPOINT='https://<서비스>.onrender.com/api/chat'` 으로 바꾸고 배포합니다.
   (배포 없이 시험: 사이트 주소 뒤에 `?grok=https://<서비스>.onrender.com/api/chat`)

실패하거나 6초 안에 응답이 없으면 자동으로 규칙 기반 대화로 돌아갑니다. 프록시는 IP당 분당 20회로 제한되고, 세션별 최근 대화 8개만 기억합니다(30분 후 삭제).
로컬 실행: `cd server && XAI_API_KEY=... node server.js` (포트 8787)

## POST /stt (클라우드 음성 인식, 선택)
본문: audio/wav (16kHz mono). 응답: `{text, lang, raw}` (lang: ko|en|zh|yue|ja).
기본 업스트림: xAI `POST https://api.x.ai/v1/stt` (multipart, model `grok-voice-transcribe-2.0`, $0.10/hr). 환경변수 STT_URL / STT_MODEL / STT_KEY 로 교체 가능.
