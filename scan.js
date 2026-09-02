import { storage } from 'hatchable';
export const access='member';
export const methods=['POST'];
export default async function(req,res){
 const file=Array.isArray(req.files)?req.files.find(f=>String(f.contentType||'').startsWith('image/')):null;
 const lang=req.body?.language==='en'?'en':'it';
 if(!file)return res.status(400).json({error:lang==='en'?'No image received.':'Nessuna immagine ricevuta.'});
 const key=process.env.GROQ_API_KEY;
 if(!key)return res.status(503).json({error:lang==='en'?'NEXA Scan is not configured yet.':'NEXA Scan non è ancora configurato.'});
 const max=20*1024*1024;
 if(file.buffer.length>max)return res.status(413).json({error:lang==='en'?'Image is too large. Maximum size is 20 MB.':'Immagine troppo grande. Il massimo è 20 MB.'});
 const mime=String(file.contentType||'image/jpeg');
 let fileUrl='';
 try{
  const safe=String(file.filename||'image').replace(/[^a-zA-Z0-9._-]/g,'_').slice(-120);
  fileUrl=await storage.put(`users/${req.member.id}/school/scan-${Date.now()}-${safe}`,file.buffer,mime);
 }catch(e){return res.status(500).json({error:lang==='en'?'The image could not be prepared for NEXA Scan.':'Non è stato possibile preparare l’immagine per NEXA Scan.'})}
 const prompt=lang==='en'?'You are NEXA Scan. Read this school image carefully. IMPORTANT: respond ONLY in English because the selected app language is English. Transcribe all visible text as accurately as possible. Preserve headings, equations, lists and line breaks. If something is unreadable, mark it as [unclear]. Return only the transcription.':'Sei NEXA Scan. Leggi attentamente questa immagine scolastica. IMPORTANTE: rispondi ESCLUSIVAMENTE in italiano perché la lingua selezionata nell’app è italiano. Non usare l’inglese. Trascrivi tutto il testo visibile nel modo più accurato possibile. Mantieni titoli, formule, elenchi e a capo. Se qualcosa non è leggibile, indica [non leggibile]. Restituisci solo la trascrizione.';
 try{
  const r=await fetch('https://api.groq.com/openai/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},body:JSON.stringify({model:'qwen/qwen3.6-27b',messages:[{role:'user',content:[{type:'text',text:prompt},{type:'image_url',image_url:{url:String(fileUrl)}}]}],temperature:0.1,max_completion_tokens:4096})});
  const j=await r.json(); if(!r.ok)throw new Error(j?.error?.message||`Groq HTTP ${r.status}`);
  const text=j?.choices?.[0]?.message?.content||''; if(!text)throw new Error('OCR empty');
  res.json({text,model:j.model||'qwen/qwen3.6-27b',fileUrl});
 }catch(e){res.status(502).json({error:lang==='en'?'NEXA Scan could not read the image.':'NEXA Scan non è riuscito a leggere l’immagine.',detail:String(e?.message||e)})}
}