export const access='user';
export const methods=['POST'];

function pdfText(s){return String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^\x20-\x7E]/g,' ').replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');}

export default async function(req,res){
 const title=String(req.body?.title||'NEXA School').slice(0,100);
 const text=String(req.body?.text||'').replace(/\r/g,'').slice(0,12000);
 if(!text.trim())return res.status(400).json({error:'Testo PDF mancante.'});
 const lines=[];
 (title+'\n\n'+text).split('\n').forEach(line=>{let s=line||' ';while(s.length>88){lines.push(s.slice(0,88));s=s.slice(88);}lines.push(s);});
 const perPage=38;
 const chunks=[];for(let i=0;i<lines.length;i+=perPage)chunks.push(lines.slice(i,i+perPage));
 const objects=[];const add=o=>{objects.push(o);return objects.length;};
 add('<< /Type /Catalog /Pages 2 0 R >>');
 add('PLACEHOLDER_PAGES');
 const fontId=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
 const pageIds=[];const contentIds=[];
 for(const chunk of chunks){
  const commands=['BT','/F1 12 Tf','50 750 Td'];
  chunk.forEach((line,i)=>{if(i)commands.push('0 -19 Td');commands.push('('+pdfText(line)+') Tj');});
  commands.push('ET');
  const stream=commands.join('\n');
  const cid=add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);contentIds.push(cid);
  const pid=add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${cid} 0 R >>`);pageIds.push(pid);
 }
 objects[1]=`<< /Type /Pages /Kids [${pageIds.map(x=>x+' 0 R').join(' ')}] /Count ${pageIds.length} >>`;
 let pdf='%PDF-1.4\n';const offsets=[0];
 objects.forEach((obj,i)=>{offsets[i+1]=pdf.length;pdf+=`${i+1} 0 obj\n${obj}\nendobj\n`;});
 const xref=pdf.length;pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;for(let i=1;i<offsets.length;i++)pdf+=String(offsets[i]).padStart(10,'0')+' 00000 n \n';pdf+=`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
 res.setHeader('Content-Type','application/pdf');res.setHeader('Content-Disposition','attachment; filename="NEXA-School.pdf"');res.setHeader('Content-Length',String(new TextEncoder().encode(pdf).length));res.send(pdf);
}