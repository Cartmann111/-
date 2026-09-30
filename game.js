import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { getDatabase, ref, get, set, update, onValue, onDisconnect, remove, runTransaction } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js';

const $ = id => document.getElementById(id);
const normalImg = './normal.png', hoverImg = './hover.png', clickImg = './click.png';
const cartman = $('cartman'), image = $('cartman-img'), audio = $('click-audio');
const config = window.FIREBASE_CONFIG || {};
const onlineReady = Boolean(config.apiKey && !config.apiKey.startsWith('YOUR_') && config.databaseURL && !config.databaseURL.includes('YOUR_'));
let joined = false, score = 0, helpers = 0, uid = '', playerName = '', playerRef = null, clickTimer, helperTimer;
let db = null, auth = null, nameRef = null;

if (!onlineReady) {
  $('join').disabled = true;
  $('entry-message').textContent = '온라인 설정이 필요합니다. Firebase 설정을 입력하면 매일 접속해 플레이할 수 있습니다.';
}
function feverNow() { return Date.now() % 30000 < 7000; }
function paintScore(value) { score = value; $('score').textContent = Number(value).toLocaleString(); $('hire').disabled = score < 50; }
function paintHelpers(count) {
  helpers = count; $('helper-count').textContent = count;
  const list = $('helper-visuals'); list.replaceChildren();
  for (let i = 0; i < Math.min(count, 60); i++) { const img = document.createElement('img'); img.src = './helper.jpg'; img.alt = '도우미'; list.append(img); }
  if (count > 60) { const more = document.createElement('small'); more.textContent = `+${count - 60}`; list.append(more); }
}
function renderBoard(players) {
  const list = $('ranking'); list.replaceChildren();
  const rows = Object.values(players || {}).filter(p => p && typeof p.name === 'string' && Number.isFinite(p.score)).sort((a,b) => b.score - a.score).slice(0,20);
  $('rank-empty').hidden = rows.length > 0;
  for (const [i,p] of rows.entries()) {
    const li=document.createElement('li'), rank=document.createElement('span'), name=document.createElement('span'), points=document.createElement('span');
    rank.className='rank'; rank.textContent=String(i+1).padStart(2,'0');
    name.textContent=p.name+(p.uid===uid?' (나)':''); points.className='points'; points.textContent=`${Math.floor(p.score).toLocaleString()}점`;
    li.append(rank,name,points); list.append(li);
  }
  const me = uid && players?.[uid]; if (me) { paintScore(me.score || 0); paintHelpers(me.helpers || 0); }
}
function syncPlayer() {
  if (!playerRef) return;
  return update(playerRef, { name: playerName, nameKey: nameKey(playerName), score, helpers, uid, updatedAt: Date.now() });
}
function nameKey(name) { return Array.from(name.toLowerCase(), c => c.codePointAt(0).toString(16)).join('-'); }

async function joinGame() {
  playerName = $('nickname').value.trim().replace(/[<>]/g, '').slice(0,16);
  if (!playerName) { $('entry-message').textContent='닉네임을 입력해 주세요.'; return; }
  if (!onlineReady) { $('entry-message').textContent='Firebase 설정이 필요합니다. firebase-config.js를 입력한 뒤 페이지를 새로고침해 주세요.'; return; }
  $('join').disabled = true;
  try {
    if (!auth) { const app=initializeApp(config); auth=getAuth(app); db=getDatabase(app); }
    if (!auth.currentUser) await signInAnonymously(auth);
    uid=auth.currentUser.uid; playerRef=ref(db,`players/${uid}`);
    const snapshot=await get(playerRef), previous=snapshot.val() || {};
    score=Number.isFinite(previous.score)?previous.score:0; helpers=Number.isFinite(previous.helpers)?previous.helpers:0;
    const key=nameKey(playerName); nameRef=ref(db,`names/${key}`);
    const reservation=await runTransaction(nameRef,current=>current===null||current===uid?uid:undefined,{applyLocally:false});
    if(!reservation.committed) throw new Error('이미 사용 중인 닉네임입니다.');
    await onDisconnect(nameRef).remove();
    if(previous.nameKey && previous.nameKey!==key) await remove(ref(db,`names/${previous.nameKey}`));
    await set(playerRef,{name:playerName,nameKey:key,score,helpers,uid,updatedAt:Date.now()});
    onValue(ref(db,'players'),data=>renderBoard(data.val() || {}),error=>{ $('connection').textContent='연결 오류'; console.error(error); });
    $('connection').textContent='실시간 온라인';
    joined=true; $('player-name').textContent=playerName; $('entry').hidden=true; $('game').hidden=false; paintScore(score); paintHelpers(helpers);
    helperTimer=setInterval(()=>{ if(!joined||helpers<1)return; score+=helpers; paintScore(score); syncPlayer(); },3000);
  } catch (error) {
    console.error(error); $('entry-message').textContent=error.message==='이미 사용 중인 닉네임입니다.'?error.message:'온라인 연결 실패: Firebase Authentication, 데이터베이스 URL, 보안 규칙을 확인해 주세요.';
    $('entry-message').style.color='#ff7180'; $('join').disabled=false;
  }
}
function hit() {
  if(!joined)return;
  score += feverNow()?5:(Math.random()<0.12?3:1); paintScore(score); syncPlayer();
  image.src=clickImg; clearTimeout(clickTimer); clickTimer=setTimeout(()=>image.src=cartman.matches(':hover')?hoverImg:normalImg,1000);
  try{audio.currentTime=0;audio.play().catch(()=>{});}catch{}
}
cartman.addEventListener('pointerdown',e=>{e.preventDefault();hit();});
cartman.addEventListener('pointerenter',()=>{if(joined&&image.src!==new URL(clickImg,location.href).href)image.src=hoverImg;});
cartman.addEventListener('pointerleave',()=>{if(joined&&image.src!==new URL(clickImg,location.href).href)image.src=normalImg;});
$('join').addEventListener('click',joinGame); $('nickname').addEventListener('keydown',e=>{if(e.key==='Enter'&&!$('join').disabled)joinGame();});
$('hire').addEventListener('click',()=>{if(!joined||score<50)return;score-=50;helpers++;paintScore(score);paintHelpers(helpers);syncPlayer();});
setInterval(()=>{$('fever').hidden=!feverNow();},250);
window.addEventListener('pagehide',()=>{joined=false;clearInterval(helperTimer);if(nameRef)remove(nameRef);});
