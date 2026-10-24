// 마이크 음성 언어 감지 (Whisper, transformers.js, 브라우저 내 실행)
const TJS=new URL("./vendor/transformers/transformers.min.js",import.meta.url).href; // 자체 호스팅 (Whisper 가중치만 Hugging Face에서 받음)
export const MOBILE=/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)||(navigator.maxTouchPoints>1&&/Mac/.test(navigator.userAgent));
const MODEL=MOBILE?"onnx-community/whisper-tiny":"onnx-community/whisper-base"; // 다국어 (tiny로 바꾸면 더 빠름: onnx-community/whisper-tiny)
export const LANGS={
  ko:{label:'한국어',text:'안녕하세요!'},
  en:{label:'English',text:'Hello!'},
  zh:{label:'中文(简体)',text:'你好！'},
  yue:{label:'粵語(繁體)',text:'你好呀！'},
  ja:{label:'日本語',text:'こんにちは！'},
};
const CANTO=/[係嘅唔咁佢冇啲喺咩嘢哋囉噉喇咗]/;
let T,model,proc,tok,ctx,stream,node,src,on=false,busy=false;
export async function load(status){
  T=await import(TJS);
  T.env.backends.onnx.wasm.wasmPaths=new URL('./vendor/transformers/',import.meta.url).href;
  const gpu=!!navigator.gpu&&!!(await navigator.gpu.requestAdapter().catch(()=>null));
  status(`음성 모델 다운로드 중… (${gpu?'WebGPU':'WASM'})`);
  const cb=p=>{ if(p.status==='progress'&&p.file?.endsWith('.onnx')) status(`음성 모델 ${p.file.split('/').pop()} ${Math.round(p.progress)}%`); };
  proc=await T.AutoProcessor.from_pretrained(MODEL);
  tok=await T.AutoTokenizer.from_pretrained(MODEL);
  model=await T.WhisperForConditionalGeneration.from_pretrained(MODEL,{
    device:gpu?'webgpu':'wasm',
    dtype:{encoder_model:'fp32',decoder_model_merged:'q4'},progress_callback:cb});
}
const CAND=['ko','en','zh','ja'];
function scriptLang(t){ if(/[\uAC00-\uD7A3]/.test(t))return 'ko'; if(/[\u3040-\u30FF]/.test(t))return 'ja'; if(/[\u4E00-\u9FFF]/.test(t))return 'zh'; if(/[A-Za-z]{2}/.test(t))return 'en'; return null; }
async function detect(audio){
  const {input_features}=await proc(audio);
  // 1) 언어 식별: <|startoftranscript|> 다음 토큰의 로짓을 후보 언어 토큰끼리만 비교
  //   (transformers.js는 language 미지정 시 영어로 강제하므로 generate에 맡기면 안 됨)
  const t2i=tok.model.tokens_to_ids, sot=t2i.get('<|startoftranscript|>');
  const out=await model({input_features,decoder_input_ids:new T.Tensor('int64',BigInt64Array.from([BigInt(sot)]),[1,1])});
  const L=out.logits.data, V=out.logits.dims.at(-1), base=L.length-V;
  const lg=CAND.map(c=>L[base+t2i.get(`<|${c}|>`)]); const mx=Math.max(...lg);
  const e=lg.map(x=>Math.exp(x-mx)), sum=e.reduce((p,q)=>p+q);
  const probs=Object.fromEntries(CAND.map((c,i)=>[c,e[i]/sum]));
  let lang=CAND[lg.indexOf(mx)];
  // 2) 감지 언어로 전사
  const ids=await model.generate({inputs:input_features,language:lang,task:'transcribe',max_new_tokens:40});
  const text=tok.batch_decode(ids,{skip_special_tokens:true})[0].trim();
  // 3) 보정: 확신이 낮으면 전사 문자 종류로 판단
  const sl=scriptLang(text); if(probs[lang]<0.6&&sl&&sl!==lang) lang=sl;
  if(lang==='zh'&&CANTO.test(text)) lang='yue';
  const dbg=Object.entries(probs).sort((a,b)=>b[1]-a[1]).map(([c,p])=>`${c} ${Math.round(p*100)}%`).join(' · ');
  return {lang,text,dbg};
}
export async function start(onUtter,status){
  stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}});
  ctx=new (window.AudioContext||window.webkitAudioContext)({sampleRate:16000}); await ctx.resume();
  src=ctx.createMediaStreamSource(stream);
  node=ctx.createScriptProcessor(2048,1,1);
  let buf=[],speaking=false,loud=0,silence=0,noise=0.01;
  node.onaudioprocess=async e=>{
    const d=e.inputBuffer.getChannelData(0); let r=0; for(const v of d)r+=v*v; r=Math.sqrt(r/d.length);
    if(busy){buf=[];speaking=false;return;}
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
