import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { getDatabase, ref, set, update, onValue, onDisconnect, remove, runTransaction } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js';

const $ = id => document.getElementById(id);
const normalImg = './normal.png', hoverImg = './hover.png', clickImg = './click.png';
const cartman = $('cartman'), image = $('cartman-img'), audio = $('click-audio');
const config = window.FIREBASE_CONFIG || {};
const onlineReady = config.apiKey && !config.apiKey.startsWith('YOUR_') && config.databaseURL && !config.databaseURL.includes('YOUR_');
let joined = false, score = 0, helpers = 0, uid = '', playerName = '', playerRef = null, clickTimer, helperTimer, localBoardTimer;
let db = null, auth = null, firebaseOnline = false, nameRef = null;

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
function localBoard() { renderBoard(uid ? { [uid]: { name: playerName, score, helpers, uid } } : {}); }
function syncPlayer() {
  if (!firebaseOnline || !playerRef) return;
  return update(playerRef, { name: playerName, score, helpers, uid, updatedAt: Date.now() });
}
function nameKey(name) { return Array.from(name.toLowerCase(), c => c.codePointAt(0).toString(16)).join('-'); }
async function joinGame() {
  playerName = $('nickname').value.trim().replace(/[<>]/g, '').slice(0,16);
  if (!playerName) { $('entry-message').textContent='닉네임을 입력해 주세요.'; return; }
  $('join').disabled = true;
  try {
    if (onlineReady) {
      if (!auth) { const app=initializeApp(config); auth=getAuth(app); db=getDatabase(app); }
      if (!auth.currentUser) await signInAnonymously(auth);
      uid=auth.currentUser.uid; playerRef=ref(db,`players/${uid}`); firebaseOnline=true;
      nameRef=ref(db,`names/${nameKey(playerName)}`);
      const reservation=await runTransaction(nameRef,current=>current===null||current===uid?uid:undefined,{applyLocally:false});
      if(!reservation.committed) { firebaseOnline=false; throw new Error('이미 사용 중인 닉네임입니다.'); }
      await onDisconnect(playerRef).remove();
      await onDisconnect(nameRef).remove();
      await set(playerRef,{name:playerName,score:0,helpers:0,uid,updatedAt:Date.now()});
      onValue(ref(db,'players'),snapshot=>renderBoard(snapshot.val() || {}),error=>{ $('connection').textContent='연결 오류'; console.error(error); });
      $('connection').textContent='실시간 온라인';
    } else {
      uid=`local-${Math.random().toString(36).slice(2)}`;
      $('connection').textContent='로컬 모드';
      $('entry-message').textContent='Firebase를 설정하지 않아 이 브라우저에서만 점수가 보입니다.';
      $('entry-message').style.color='#ffd166';
      localBoardTimer=setInterval(localBoard,500);
    }
    joined=true; $('player-name').textContent=playerName; $('entry').hidden=true; $('game').hidden=false; paintScore(0); paintHelpers(0);
    helperTimer=setInterval(()=>{ if(!joined||helpers<1)return; score+=helpers; paintScore(score); syncPlayer(); if(!firebaseOnline)localBoard(); },3000);
  } catch (error) {
    console.error(error); $('entry-message').textContent=error.message==='이미 사용 중인 닉네임입니다.'?error.message:'Firebase 연결 실패: Authentication, Database URL, 보안 규칙을 확인해 주세요.';
    $('entry-message').style.color='#ff7180'; $('join').disabled=false;
  }
}
function hit() {
  if(!joined)return;
  score += feverNow()?5:(Math.random()<0.12?3:1); paintScore(score); syncPlayer(); if(!firebaseOnline)localBoard();
  image.src=clickImg; clearTimeout(clickTimer); clickTimer=setTimeout(()=>image.src=cartman.matches(':hover')?hoverImg:normalImg,2000);
  try{audio.currentTime=0;audio.play().catch(()=>{});}catch{}
}
cartman.addEventListener('pointerdown',e=>{e.preventDefault();hit();});
cartman.addEventListener('pointerenter',()=>{if(joined&&image.src!==new URL(clickImg,location.href).href)image.src=hoverImg;});
cartman.addEventListener('pointerleave',()=>{if(joined&&image.src!==new URL(clickImg,location.href).href)image.src=normalImg;});
$('join').addEventListener('click',joinGame); $('nickname').addEventListener('keydown',e=>{if(e.key==='Enter')joinGame();});
$('hire').addEventListener('click',()=>{if(score<50)return;score-=50;helpers++;paintScore(score);paintHelpers(helpers);syncPlayer();if(!firebaseOnline)localBoard();});
setInterval(()=>{currentFever=feverNow();$('fever').hidden=!currentFever;},250);
window.addEventListener('pagehide',()=>{joined=false;clearInterval(helperTimer);clearInterval(localBoardTimer);if(firebaseOnline&&playerRef)remove(playerRef);if(firebaseOnline&&nameRef)remove(nameRef);});
