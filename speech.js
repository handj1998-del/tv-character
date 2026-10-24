// 마이크 음성 언어 감지 (Whisper, transformers.js, 브라우저 내 실행)
const TJS="https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.1";
export const MOBILE=/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)||(navigator.maxTouchPoints>1&&/Mac/.test(navigator.userAgent));
const MODEL=MOBILE?"onnx-community/whisper-tiny":"onnx-community/whisper-base"; // 다국어 (tiny로 바꾸면 더 빠름: onnx-community/whisper-tiny)
export const LANGS={
  ko:{label:'한국어',text:'안녕하세요!',tts:'ko-KR'},
  en:{label:'English',text:'Hello!',tts:'en-US'},
  zh:{label:'中文(简体)',text:'你好！',tts:'zh-CN'},
  yue:{label:'粵語(繁體)',text:'你好呀！',tts:'zh-HK'},
  ja:{label:'日本語',text:'こんにちは！',tts:'ja-JP'},
};
const CANTO=/[係嘅唔咁佢冇啲喺咩嘢哋囉噉喇咗]/;
let model,proc,tok,ctx,stream,node,src,on=false,busy=false;
export let muteUntil=0;
export const setMute=ms=>muteUntil=Date.now()+ms;
export async function load(status){
  const T=await import(TJS);
  const gpu=!!navigator.gpu&&!!(await navigator.gpu.requestAdapter().catch(()=>null));
  status(`음성 모델 다운로드 중… (${gpu?'WebGPU':'WASM'})`);
  const cb=p=>{ if(p.status==='progress'&&p.file?.endsWith('.onnx')) status(`음성 모델 ${p.file.split('/').pop()} ${Math.round(p.progress)}%`); };
  proc=await T.AutoProcessor.from_pretrained(MODEL);
  tok=await T.AutoTokenizer.from_pretrained(MODEL);
  model=await T.WhisperForConditionalGeneration.from_pretrained(MODEL,{
    device:gpu?'webgpu':'wasm',
    dtype:gpu?{encoder_model:'fp32',decoder_model_merged:'q4'}:'q8',progress_callback:cb});
}
async function detect(audio){
  const {input_features}=await proc(audio);
  const out=await model.generate({inputs:input_features,max_new_tokens:32,task:'transcribe'});
  const s=tok.batch_decode(out,{skip_special_tokens:false})[0];
  const m=s.match(/<\|([a-z]{2,3})\|>/); let lang=m?.[1];
  const text=s.replace(/<\|[^|]*\|>/g,'').trim();
  if(lang==='zh'&&CANTO.test(text)) lang='yue';
  return {lang,text};
}
export async function start(onUtter,status){
  stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}});
  ctx=new (window.AudioContext||window.webkitAudioContext)({sampleRate:16000}); await ctx.resume();
  src=ctx.createMediaStreamSource(stream);
  node=ctx.createScriptProcessor(2048,1,1);
  let buf=[],speaking=false,loud=0,silence=0,noise=0.01;
  node.onaudioprocess=async e=>{
    const d=e.inputBuffer.getChannelData(0); let r=0; for(const v of d)r+=v*v; r=Math.sqrt(r/d.length);
    if(Date.now()<muteUntil||busy){buf=[];speaking=false;return;}
    if(!speaking){ noise=noise*0.98+r*0.02; buf=[d.slice()]; // 직전 프레임 보존
      if(r>Math.max(0.02,noise*3)){ if(++loud>=2){speaking=true;silence=0;} } else loud=0; return; }
    buf.push(d.slice());
    silence = r<Math.max(0.015,noise*2) ? silence+1 : 0;
    const dur=buf.length*2048/16000;
    if(silence>6||dur>8){ speaking=false;loud=0;
      if(dur<0.6){buf=[];return;}
      const a=new Float32Array(buf.length*2048); buf.forEach((b,i)=>a.set(b,i*2048)); buf=[];
      busy=true; status('🎤 듣는 중… 분석 중');
      try{ const res=await detect(a); onUtter(res); }catch(err){console.error(err);status('음성 인식 오류: '+err.message);}
      busy=false; }
  };
  src.connect(node); node.connect(ctx.destination); on=true;
}
export function stop(){ on=false; try{node.disconnect();src.disconnect();ctx.close();stream.getTracks().forEach(t=>t.stop());}catch{} }
export const isOn=()=>on;
