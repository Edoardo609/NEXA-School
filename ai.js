import { storage } from 'hatchable';

export const access = 'member';
export const methods = ['POST'];

export default async function(req,res){
  const b=req.body||{}, prompt=String(b.prompt||'').trim(), lang=b.language==='en'?'en':'it';
  const name=String(b.displayName||'').trim(), memoryEnabled=!!b.memoryEnabled;
  const memory=Array.isArray(b.memory)?b.memory.slice(-20):[], history=Array.isArray(b.history)?b.history.slice(-12):[];
  const attachment=b.attachment||null, attachmentText=String(attachment?.text||b.attachmentText||'').slice(0,30000);
  if(!prompt&&!attachment)return res.status(400).json({error:lang==='en'?'Write a message or attach a file.':'Scrivi un messaggio o allega un file.'});
  const apiKey=process.env.GROQ_API_KEY;
  if(!apiKey)return res.status(500).json({error:'GROQ_API_KEY non configurata.'});
  const system=lang==='en'?`You are NEXA AI, a helpful school assistant. Answer clearly and naturally. IMPORTANT: respond ONLY in English, regardless of the language used in the uploaded document or previous messages. Use Markdown when useful, including headings, bullets, tables and clickable Markdown links. ${name?`The student's display name is ${name}.`:''} ${memoryEnabled&&memory.length?`Relevant saved memory: ${memory.join('; ')}`:''}`:`Sei NEXA AI, un assistente scolastico utile e preciso. IMPORTANTE: rispondi ESCLUSIVAMENTE in italiano, indipendentemente dalla lingua del documento caricato o dei messaggi precedenti. Non rispondere in inglese se la lingua selezionata è italiano. Usa Markdown quando utile, inclusi titoli, elenchi, tabelle e link Markdown cliccabili. ${name?`Il nome visualizzato dello studente è ${name}.`:''} ${memoryEnabled&&memory.length?`Memoria salvata rilevante: ${memory.join('; ')}`:''}`;
  const messages=[{role:'system',content:system}];
  for(const m of history)if((m?.role==='user'||m?.role==='assistant')&&m?.content)messages.push({role:m.role,content:String(m.content).slice(0,10000)});
  let user=prompt;
  if(attachmentText)user+=`\n\n[TESTO DEL DOCUMENTO ALLEGATO]\n${attachmentText}`;
  const imageInstruction=lang==='en'?"Answer in English only. If this is an image, describe and analyze it in English. Do not answer in another language.":"Rispondi esclusivamente in italiano. Se questo è un'immagine, descrivila e analizzala in italiano. Non rispondere in un'altra lingua.";
  user=`[LINGUA RISPOSTA: ${lang==='en'?'INGLESE':'ITALIANO'}] ${imageInstruction}\n\n${user}`;
  if(attachment?.url&&String(attachment.type||'').startsWith('image/'))messages.push({role:'user',content:[{type:'text',text:user||imageInstruction},{type:'image_url',image_url:{url:String(attachment.url)}}]});
  else messages.push({role:'user',content:user||`[Allegato: ${attachment?.name||'file'}]`});
  const models=['qwen/qwen3.6-27b'];
  let last='';
  for(const model of models){
    try{
      const r=await fetch('https://api.groq.com/openai/v1/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({model,messages,temperature:0.4,max_tokens:1200,reasoning_effort:'none'})});
      const j=await r.json();
      if(r.ok){const text=j?.choices?.[0]?.message?.content||'';if(text)return res.json({text,model:j?.model||model});}
      last=j?.error?.message||`Groq HTTP ${r.status}`;
    }catch(e){last=String(e?.message||e)}
  }
  return res.status(502).json({error:lang==='en'?'NEXA AI is unavailable right now.':'NEXA AI non è disponibile al momento.',detail:last});
}