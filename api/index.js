import { neon } from '@neondatabase/serverless';
import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';

const TZ = 'America/Sao_Paulo';
const json=(res,status,data)=>res.status(status).setHeader('Cache-Control','no-store').json(data);
const sql=()=>neon(process.env.DATABASE_URL);
const sign=(s)=>createHmac('sha256',process.env.SESSION_SECRET).update(s).digest('hex');
const eq=(a,b)=>{const x=Buffer.from(String(a)),y=Buffer.from(String(b));return x.length===y.length&&timingSafeEqual(x,y)};
function authorized(req){const raw=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('tex_session='))?.slice(12);if(!raw)return false;const [exp,sig]=raw.split('.');return /^\d+$/.test(exp)&&Number(exp)>Date.now()&&eq(sign(exp),sig)}
const code=()=>{const a='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';return 'TEX-'+Array.from(randomBytes(9),x=>a[x%a.length]).join('')};
const amount=v=>{if(typeof v!=='number'||!Number.isFinite(v)||v<0||v>1000000||Math.round(v*100)!==v*100)return null;return v};
const dt=s=>new Date(s).toLocaleDateString('pt-BR',{timeZone:TZ});
export default async function handler(req,res){
 try{
  if(!process.env.DATABASE_URL||!process.env.ADMIN_PASSWORD||!process.env.SESSION_SECRET)return json(res,503,{error:'Configure DATABASE_URL, ADMIN_PASSWORD e SESSION_SECRET na Vercel.'});
  const action=String(req.query.action||'');
  if(action==='login'&&req.method==='POST'){
    if(!eq(req.body?.password||'',process.env.ADMIN_PASSWORD))return json(res,401,{error:'Senha incorreta'});
    const exp=String(Date.now()+12*60*60*1000);res.setHeader('Set-Cookie',`tex_session=${exp}.${sign(exp)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=43200`);return json(res,200,{ok:true});
  }
  if(action==='logout'&&req.method==='POST'){res.setHeader('Set-Cookie','tex_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0');return json(res,200,{ok:true})}
  if(action==='session'&&req.method==='GET')return json(res,200,{authenticated:authorized(req)});
  if(!authorized(req))return json(res,401,{error:'Sessão expirada. Entre novamente.'});
  const db=sql();
  if(action==='issue'&&req.method==='POST'){
    const a=amount(req.body?.amount),name=String(req.body?.customer||'').trim().slice(0,100),issuer=String(req.body?.issuer||'');
    if(a===null||!['Leo','Jefferson','Luiz'].includes(issuer))return json(res,400,{error:'Dados inválidos'});
    const rows=await db`INSERT INTO vale_chope_vouchers(code,customer_name,first_amount,issued_by) VALUES(${code()},${name||null},${a},${issuer}) RETURNING *`;
    return json(res,201,{voucher:rows[0]});
  }
  if(action==='lookup'&&req.method==='GET'){
    const c=String(req.query.code||'').trim().toUpperCase();if(!/^TEX-[A-Z2-9]{9}$/.test(c))return json(res,400,{error:'Código inválido'});
    const rows=await db`SELECT * FROM vale_chope_vouchers WHERE code=${c}`;return json(res,200,{voucher:rows[0]||null});
  }
  if(action==='redeem'&&req.method==='POST'){
    const c=String(req.body?.code||'').trim().toUpperCase(),a=amount(req.body?.amount),allowLate=req.body?.allowLate===true;
    if(!/^TEX-[A-Z2-9]{9}$/.test(c)||a===null)return json(res,400,{error:'Dados inválidos'});
    const rows=await db`UPDATE vale_chope_vouchers SET redeemed_at=now(),return_amount=${a},redeemed_late=(now()>expires_at) WHERE code=${c} AND redeemed_at IS NULL AND (now()<=expires_at OR ${allowLate}) RETURNING *`;
    if(rows.length)return json(res,200,{voucher:rows[0]});
    const found=await db`SELECT redeemed_at,expires_at FROM vale_chope_vouchers WHERE code=${c}`;
    return json(res,409,{error:!found.length?'Vale não encontrado':found[0].redeemed_at?'Vale já resgatado':'Vale vencido: autorização necessária'});
  }
  if(action==='reports'&&req.method==='GET'){
    const from=String(req.query.from||''),to=String(req.query.to||'');if(!/^\d{4}-\d{2}-\d{2}$/.test(from)||!/^\d{4}-\d{2}-\d{2}$/.test(to)||from>to)return json(res,400,{error:'Período inválido'});
    const rows=await db`SELECT * FROM vale_chope_vouchers WHERE (issued_at AT TIME ZONE 'America/Sao_Paulo')::date BETWEEN ${from}::date AND ${to}::date ORDER BY issued_at DESC LIMIT 10000`;
    const returns=await db`SELECT count(*)::int AS count,coalesce(sum(return_amount),0)::numeric AS total FROM vale_chope_vouchers WHERE (redeemed_at AT TIME ZONE 'America/Sao_Paulo')::date BETWEEN ${from}::date AND ${to}::date`;
    return json(res,200,{rows,returns:returns[0],truncated:rows.length===10000});
  }
  return json(res,404,{error:'Rota não encontrada'});
 }catch(e){console.error(e);return json(res,500,{error:'Erro interno. Confira se as tabelas foram criadas e se a conexão está correta.'})}
}
