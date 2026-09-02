(function(){
  function renderSearchResults(){
    const q=(window.searchQuery||'').trim().toLowerCase();
    const found=[];
    if(q){
      (Array.isArray(data.subjects)?data.subjects:[]).filter(x=>String(x).toLowerCase().includes(q)).forEach((x,i)=>found.push({icon:'📚',text:String(x),action:"page('subjects')"}));
      (Array.isArray(data.tasks)?data.tasks:[]).filter(x=>String(x.title||'').toLowerCase().includes(q)||String(x.subject||'').toLowerCase().includes(q)).forEach(x=>found.push({icon:'✅',text:String(x.title||'')+' · '+String(x.subject||''),action:"page('tasks')"}));
      (Array.isArray(data.docs)?data.docs:[]).filter(x=>String(x.name||'').toLowerCase().includes(q)||String(x.text||'').toLowerCase().includes(q)).forEach((x,i)=>found.push({icon:'📄',text:String(x.name||''),action:x.url?"window.open('"+String(x.url).replace(/'/g,"\\'")+"','_blank')":"page('docs')"}));
      (Array.isArray(data.grades)?data.grades:[]).filter(x=>String(x.subject||'').toLowerCase().includes(q)||String(x.note||'').toLowerCase().includes(q)||String(x.grade??'').toLowerCase().includes(q)).forEach(x=>found.push({icon:'📊',text:String(x.subject||'')+' · '+String(x.grade??''),action:"page('grades')"}));
    }
    const box=document.querySelector('#searchResults,.search-results');
    if(box) box.innerHTML=found.length?found.map(x=>'<button type="button" class="row search-result-button" onclick="'+x.action+'"><span>'+x.icon+' '+esc(x.text)+'</span><span class="small">›</span></button>').join(''):(q?'<div class="empty">'+tr('noResults')+'</div>':'<div class="empty">'+tr('search')+'</div>');
  }
  window.searchPage=function(){
    content.innerHTML='<div class="card"><h2>'+tr('searchTitle')+'</h2><div class="searchbox"><input id="globalSearch" type="search" value="'+esc(window.searchQuery||'')+'" placeholder="'+tr('search')+'" autocomplete="off" autocapitalize="none" spellcheck="false"></div><div class="list search-results" style="margin-top:14px"></div></div>';
    const input=document.getElementById('globalSearch');
    if(!input)return;
    input.addEventListener('input',function(){window.searchQuery=this.value;renderSearchResults()});
    input.addEventListener('keydown',function(e){e.stopPropagation()});
    input.addEventListener('keyup',function(e){e.stopPropagation()});
    input.addEventListener('click',function(e){e.stopPropagation()});
    renderSearchResults();
    requestAnimationFrame(function(){input.focus();const n=input.value.length;try{input.setSelectionRange(n,n)}catch{}});
  };
  const originalSaveProfile=window.saveProfile;
  window.saveProfile=function(){
    data.profile.name=document.getElementById('displayName')?.value.trim()||'';
    save();
    greet();
    showNexaToast(lang==='en'?'Saved successfully ✓':'Salvato con successo ✓');
    account();
  };
  const originalSaveDoc=window.saveDoc;
  window.saveDoc=async function(){
    const before=scanFile;
    await originalSaveDoc();
    if(before&&!scanFile) showNexaToast(lang==='en'?'Saved successfully ✓':'Salvato con successo ✓');
  };
const originalStudy=window.study;
  window.study=function(){originalStudy();setTimeout(()=>{const el=document.getElementById('studyTimer');if(!el||document.getElementById('studyTimerSettings'))return;const b=document.createElement('button');b.id='studyTimerSettings';b.className='secondary';b.type='button';b.textContent='⚙️ '+(window.lang==='en'?'Customize timer':'Personalizza timer');b.onclick=()=>setStudyTimerDuration();el.parentElement?.insertBefore(b,el.nextSibling)},0)};
  window.setStudyTimerDuration=function(){data.study=data.study||{};const current=Math.max(1,Number(data.study.timerMinutes)||25);const v=prompt(lang==='en'?'Timer duration in minutes (1-180):':'Durata del timer in minuti (1-180):',String(current));if(v===null)return;const n=Math.floor(Number(v));if(!Number.isFinite(n)||n<1||n>180){showNexaToast(lang==='en'?'Enter a value from 1 to 180.':'Inserisci un valore da 1 a 180.');return}data.study.timerMinutes=n;save();study();showNexaToast(lang==='en'?'Timer set to '+n+' minutes ✓':'Timer impostato a '+n+' minuti ✓')};
  const baseStart=window.startStudyTimer;
  window.startStudyTimer=function(){if(window.nexaStudyTimer)return;data.study=data.study||{};const minutes=Math.max(1,Math.min(180,Number(data.study.timerMinutes)||25));window.nexaStudyDuration=minutes;let left=minutes*60;const el=document.getElementById('studyTimer');if(el)el.textContent=String(minutes).padStart(2,'0')+':00';try{const AC=window.AudioContext||window.webkitAudioContext;if(AC){window.nexaAudio=window.nexaAudio||new AC();if(window.nexaAudio.state==='suspended')window.nexaAudio.resume()}}catch{}window.nexaStudyTimer=setInterval(()=>{left--;if(el)el.textContent=Math.floor(left/60).toString().padStart(2,'0')+':'+(left%60).toString().padStart(2,'0');if(left<=0)window.stopStudyTimer(true)},1000)};
  const baseStop=window.stopStudyTimer;
  window.stopStudyTimer=function(completed=false){if(window.nexaStudyTimer){clearInterval(window.nexaStudyTimer);window.nexaStudyTimer=null}if(completed){data.study=data.study||{};const minutes=Math.max(1,Number(window.nexaStudyDuration)||Number(data.study.timerMinutes)||25);data.study.minutes=(Number(data.study.minutes)||0)+minutes;data.study.sessions=(Number(data.study.sessions)||0)+1;const XP_REWARD=20;data.study.xp=Math.max(0,(Number(data.study.xp)||0)+XP_REWARD);try{const ctx=window.nexaAudio;if(ctx){const now=ctx.currentTime;[0,0.22,0.44].forEach((d)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=880;o.connect(g);g.connect(ctx.destination);g.gain.setValueAtTime(0.0001,now+d);g.gain.exponentialRampToValueAtTime(0.22,now+d+0.02);g.gain.exponentialRampToValueAtTime(0.0001,now+d+0.2);o.start(now+d);o.stop(now+d+0.22)})}}catch{}if(typeof Notification!=='undefined'&&Notification.permission==='granted')try{new Notification(lang==='en'?'NEXA School':'NEXA School',{body:lang==='en'?'Timer finished! +20 XP 🎉':'Timer terminato! +20 XP 🎉'})}catch{}save();showNexaToast(lang==='en'?'Study session completed! +20 XP 🎉':'Sessione completata! +20 XP 🎉');study()}};
})();