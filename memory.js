import { db } from 'hatchable';
export const access='member';
export const methods=['GET','POST','DELETE'];
export default async function(req,res){
 const user=String(req.member?.id||'');
 if(!user)return res.status(401).json({error:'Unauthorized'});
 try{
  if(req.method==='GET'){
   const q=await db.query('SELECT memories, enabled, updated_at FROM nexa_memory WHERE user_id=$1',[user]);
   const r=q.rows[0];
   return res.json({memories:Array.isArray(r?.memories)?r.memories:[],enabled:r?.enabled!==false,updatedAt:r?.updated_at||null});
  }
  if(req.method==='DELETE'){
   await db.query('DELETE FROM nexa_memory WHERE user_id=$1',[user]);
   return res.json({ok:true});
  }
  const memories=Array.isArray(req.body?.memories)?req.body.memories.map(x=>String(x).trim()).filter(Boolean).slice(-200):[];
  const enabled=req.body?.enabled!==false;
  const q=await db.query('INSERT INTO nexa_memory(user_id,memories,enabled,updated_at) VALUES($1,$2,$3,NOW()) ON CONFLICT(user_id) DO UPDATE SET memories=EXCLUDED.memories,enabled=EXCLUDED.enabled,updated_at=NOW() RETURNING updated_at',[user,JSON.stringify(memories),enabled]);
  return res.json({ok:true,memories,enabled,updatedAt:q.rows[0]?.updated_at||null});
 }catch(e){return res.status(500).json({error:'Memory save failed',detail:String(e?.message||e)})}
}