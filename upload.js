import { storage } from 'hatchable';
export const access='member';
export const methods=['POST'];
export default async function(req,res){
 const file=Array.isArray(req.files)?req.files[0]:null;
 const lang=req.body?.language==='en'?'en':'it';
 if(!file)return res.status(400).json({error:lang==='en'?'No file received.':'Nessun file ricevuto.'});
 const max=12*1024*1024;
 if(!file.buffer||file.buffer.length>max)return res.status(413).json({error:lang==='en'?'File too large. Maximum size is 12 MB.':'File troppo grande. Il massimo è 12 MB.'});
 const safe=String(file.filename||'file').replace(/[^a-zA-Z0-9._-]/g,'_').slice(-120);
 const key=`users/${req.member.id}/school/${Date.now()}-${safe}`;
 try{
  const url=await storage.put(key,file.buffer,String(file.contentType||'application/octet-stream'));
  res.json({url,name:file.filename||safe,type:file.contentType||'application/octet-stream',size:file.buffer.length,key});
 }catch(e){res.status(502).json({error:lang==='en'?'The file could not be uploaded.':'Il file non è stato caricato.',detail:String(e?.message||e)})}
}