import { db } from 'hatchable';
export const access='member';
export const methods=['GET','POST','DELETE'];
export default async function(req,res){
 const user=String(req.member?.id||'');
 if(!user)return res.status(401).json({error:'Unauthorized'});
 try{
  if(req.method==='GET'){
   const q=await db.query('SELECT state, updated_at FROM school_state WHERE user_id=$1',[user]);
   return res.json({state:q.rows[0]?.state||null,updatedAt:q.rows[0]?.updated_at||null});
  }
  if(req.method==='DELETE'){
   await db.query('DELETE FROM school_state WHERE user_id=$1',[user]);
   return res.json({ok:true});
  }
  const state=req.body?.state;
  if(!state||typeof state!=='object')return res.status(400).json({error:'Invalid state'});
  const clean={tasks:Array.isArray(state.tasks)?state.tasks.slice(0,500):[],grades:Array.isArray(state.grades)?state.grades.slice(0,500):[],subjects:Array.isArray(state.subjects)?state.subjects.slice(0,100):[],docs:Array.isArray(state.docs)?state.docs.slice(0,200):[],chat:Array.isArray(state.chat)?state.chat.slice(-100):[],sessions:Array.isArray(state.sessions)?state.sessions.slice(-100):[],memory:Array.isArray(state.memory)?state.memory.slice(0,200):[],memoryEnabled:state.memoryEnabled!==false,study:state.study&&typeof state.study==='object'?{goal:String(state.study.goal||'').slice(0,300),goalProgress:Math.max(0,Math.min(100,Number(state.study.goalProgress)||0)),minutes:Math.max(0,Math.floor(Number(state.study.minutes)||0)),sessions:Math.max(0,Math.floor(Number(state.study.sessions)||0)),timerMinutes:Math.max(1,Math.min(180,Math.floor(Number(state.study.timerMinutes)||25)))}:{goal:'',goalProgress:0,minutes:0,sessions:0,timerMinutes:25},profile:state.profile&&typeof state.profile==='object'?{name:String(state.profile.name||'').slice(0,120)}:{name:''}};
  const q=await db.query('INSERT INTO school_state(user_id,state,updated_at) VALUES($1,$2,NOW()) ON CONFLICT(user_id) DO UPDATE SET state=EXCLUDED.state,updated_at=NOW() RETURNING updated_at',[user,JSON.stringify(clean)]);
  res.json({ok:true,updatedAt:q.rows[0]?.updated_at||null});
 }catch(e){res.status(500).json({error:'Sync failed',detail:String(e?.message||e)})}
}