import { useState, useEffect } from "react";

const uid = () => Math.random().toString(36).slice(2, 9);
const COLORS = ["#e63946","#f4a261","#2a9d8f","#4361ee","#7209b7","#f72585","#06d6a0","#ffd166","#118ab2","#ef476f","#073b4c","#06aed5","#f77f00","#4cc9f0","#80b918","#e9c46a"];
const GC = ["#00c8ff","#f4a261","#4ddc8e","#f72585","#ffd166","#a78bfa","#fb923c","#34d399"];
const FORMATS = { bo1:{label:"1 set",maxSets:1,winsNeeded:1}, bo3:{label:"Do 2 wyg.",maxSets:3,winsNeeded:2}, bo5:{label:"Do 3 wyg.",maxSets:5,winsNeeded:3} };
const PRESETS = [{label:"Mini",set:15,tb:11},{label:"Młodzik",set:25,tb:15},{label:"Senior",set:25,tb:15}];
const LS_KEY = "vt3_data";

// ─── helpers ──────────────────────────────────────────────────────────────
function genRR(teamIds, fmt) {
  if (!teamIds || teamIds.length < 2) return [];
  const ids = [...teamIds];
  const list = ids.length % 2 !== 0 ? [...ids,"BYE"] : [...ids];
  const total = list.length, rounds = [];
  for (let r = 0; r < total-1; r++) {
    const round = { id:uid(), round:r+1, matches:[] };
    for (let i = 0; i < total/2; i++) {
      const h=list[i], a=list[total-1-i];
      if (h==="BYE"||a==="BYE") continue;
      round.matches.push({id:uid(),home:h,away:a,format:fmt,sets:[],played:false,homeWins:0,awayWins:0});
    }
    rounds.push(round);
    list.splice(1,0,list.pop());
  }
  return rounds;
}

function calcStandings(teamIds, rounds) {
  const s = {};
  teamIds.forEach(id => { s[id]={id,mp:0,pts:0,sw:0,sl:0,pw:0,pl:0}; });
  rounds.forEach(r => r.matches.forEach(m => {
    if (!m.played) return;
    const h=s[m.home],a=s[m.away]; if(!h||!a) return;
    h.mp++;a.mp++; h.sw+=m.homeWins;h.sl+=m.awayWins; a.sw+=m.awayWins;a.sl+=m.homeWins;
    m.sets.forEach(set=>{ h.pw+=set.home;h.pl+=set.away; a.pw+=set.away;a.pl+=set.home; });
    if(m.homeWins>m.awayWins){h.pts+=2;a.pts+=1;}else{a.pts+=2;h.pts+=1;}
  }));
  return Object.values(s).sort((a,b)=>{
    if(b.pts!==a.pts) return b.pts-a.pts;
    const ar=a.sl?a.sw/a.sl:a.sw, br=b.sl?b.sw/b.sl:b.sw;
    if(Math.abs(br-ar)>0.0001) return br-ar;
    return (b.pl?b.pw/b.pl:b.pw)-(a.pl?a.pw/a.pl:a.pw);
  });
}

function load() { try { return JSON.parse(localStorage.getItem(LS_KEY)||"{}"); } catch { return {}; } }
function persist(data) { try { localStorage.setItem(LS_KEY,JSON.stringify(data)); } catch {} }

// ─── small UI ─────────────────────────────────────────────────────────────
function Badge({color,short,size=32}) {
  return <div style={{width:size,height:size,borderRadius:7,background:color||"#555",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size<28?8:9,fontWeight:900,color:"#fff"}}>{short||"?"}</div>;
}
function Num({value,onChange,disabled}) {
  return <input type="number" min={0} max={99} value={value} disabled={disabled} onChange={e=>onChange(e.target.value)}
    style={{flex:1,padding:"10px 4px",background:disabled?"rgba(255,255,255,.02)":"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.1)",borderRadius:9,color:disabled?"#334":"#fff",fontFamily:"inherit",fontSize:18,fontWeight:800,textAlign:"center",outline:"none"}}/>;
}
function Sec({title,children,color}) {
  return <div style={{background:"rgba(255,255,255,.03)",border:`1px solid ${color?color+"33":"rgba(255,255,255,.07)"}`,borderRadius:14,padding:14,marginBottom:14}}>
    <div style={{fontSize:9,letterSpacing:3,color:color||"#4a7a96",marginBottom:12}}>{title}</div>{children}
  </div>;
}

// ─── Standings table ──────────────────────────────────────────────────────
function StTable({teamIds,rounds,teamMap,gc}) {
  const st=calcStandings(teamIds,rounds);
  return <div style={{overflowX:"auto",borderRadius:12,border:`1px solid ${gc}33`}}>
    <table style={{width:"100%",borderCollapse:"collapse",minWidth:480}}>
      <thead><tr style={{background:`${gc}12`,borderBottom:`1px solid ${gc}33`}}>
        {["#","Drużyna","M","PKT","Sety","R.S","Małe PKT","R.MP"].map(h=><th key={h} style={{padding:"8px 5px",fontSize:8,fontWeight:700,letterSpacing:1,color:gc,textAlign:h==="Drużyna"?"left":"center",whiteSpace:"nowrap"}}>{h}</th>)}
      </tr></thead>
      <tbody>{st.map((row,idx)=>{
        const t=teamMap[row.id]; if(!t) return null;
        const sR=row.sl?(row.sw/row.sl).toFixed(3):row.sw.toFixed(3);
        const pR=row.pl?(row.pw/row.pl).toFixed(3):row.pw.toFixed(3);
        return <tr key={row.id} style={{borderBottom:"1px solid rgba(255,255,255,.04)",background:idx===0?`${gc}10`:"transparent"}}>
          <td style={{padding:"10px 5px",textAlign:"center"}}><span style={{fontSize:15,fontWeight:900,color:idx===0?gc:"#3a5a7a"}}>{idx+1}</span></td>
          <td style={{padding:"10px 5px"}}><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:7,height:7,borderRadius:"50%",background:t.color,flexShrink:0}}/><span style={{fontSize:12,fontWeight:700}}>{t.name}</span></div></td>
          <td style={{padding:"10px 5px",textAlign:"center",fontSize:12,color:"#7a9bb5"}}>{row.mp}</td>
          <td style={{padding:"10px 5px",textAlign:"center"}}><span style={{fontSize:idx===0?17:14,fontWeight:900,color:idx===0?gc:"#fff"}}>{row.pts}</span></td>
          <td style={{padding:"10px 5px",textAlign:"center",fontSize:11,color:"#7a9bb5"}}>{row.sw}:{row.sl}</td>
          <td style={{padding:"10px 5px",textAlign:"center",fontSize:11,color:parseFloat(sR)>=1?"#4ddc8e":"#e05"}}>{sR}</td>
          <td style={{padding:"10px 5px",textAlign:"center",fontSize:11,color:"#7a9bb5"}}>{row.pw}:{row.pl}</td>
          <td style={{padding:"10px 5px",textAlign:"center",fontSize:11,color:parseFloat(pR)>=1?"#4ddc8e":"#e05"}}>{pR}</td>
        </tr>;
      })}</tbody>
    </table>
  </div>;
}

// ─── Score Modal ──────────────────────────────────────────────────────────
function ScoreModal({match,teamMap,setPoints,tiebreakPoints,onSave,onClose}) {
  const [fmt,setFmt]=useState(match.format||"bo3");
  const [sets,setSets]=useState(()=>{
    const f=FORMATS[match.format||"bo3"];
    const s=match.played?match.sets.map(x=>({...x})):Array.from({length:f.maxSets},()=>({home:"",away:""}));
    while(s.length<f.maxSets) s.push({home:"",away:""});
    return s;
  });
  const h=teamMap[match.home], a=teamMap[match.away];
  const fmtObj=FORMATS[fmt];
  function chFmt(k){ setFmt(k); setSets(Array.from({length:FORMATS[k].maxSets},()=>({home:"",away:""}))); }
  function chSet(i,side,val){ setSets(p=>{const n=p.map(s=>({...s}));n[i][side]=val===""?"":Math.max(0,parseInt(val)||0);return n;}); }
  function doSave(){
    const f=FORMATS[fmt]; let hw=0,aw=0; const filled=[];
    for(let i=0;i<sets.length;i++){
      const s=sets[i],hv=parseInt(s.home)||0,av=parseInt(s.away)||0;
      if(s.home===""&&s.away==="") continue;
      filled.push({home:hv,away:av});
      if(hv>av) hw++; else if(av>hv) aw++;
      if(hw>=f.winsNeeded||aw>=f.winsNeeded) break;
    }
    onSave({...match,format:fmt,sets:filled,homeWins:hw,awayWins:aw,played:filled.length>0});
  }
  function setLimit(i){ const isTb=(fmt==="bo5"&&i===4)||(fmt==="bo3"&&i===2); return isTb?tiebreakPoints:setPoints; }
  return <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",backdropFilter:"blur(8px)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:500}}>
    <div onClick={e=>e.stopPropagation()} style={{background:"#0a1828",borderTop:"2px solid rgba(0,200,255,.25)",borderRadius:"18px 18px 0 0",padding:"14px 16px 32px",width:"100%",maxWidth:500}}>
      <div style={{width:36,height:4,background:"rgba(255,255,255,.15)",borderRadius:2,margin:"0 auto 12px"}}/>
      <div style={{fontSize:9,letterSpacing:3,color:"#4a7a96",marginBottom:10,textAlign:"center"}}>WYNIK MECZU</div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",gap:7}}><Badge color={h?.color} short={h?.short}/><span style={{fontSize:13,fontWeight:800}}>{h?.name||(match.homeLabel||"?")}</span></div>
        <span style={{fontSize:11,color:"#334",fontWeight:700}}>VS</span>
        <div style={{display:"flex",alignItems:"center",gap:7}}><span style={{fontSize:13,fontWeight:800}}>{a?.name||(match.awayLabel||"?")}</span><Badge color={a?.color} short={a?.short}/></div>
      </div>
      <div style={{display:"flex",gap:6,marginBottom:12,justifyContent:"center"}}>
        {Object.entries(FORMATS).map(([k,f])=><button key={k} onClick={()=>chFmt(k)} style={{padding:"5px 10px",borderRadius:20,border:"1px solid",borderColor:fmt===k?"rgba(0,200,255,.5)":"rgba(255,255,255,.1)",background:fmt===k?"rgba(0,200,255,.12)":"transparent",color:fmt===k?"#00c8ff":"#4a7a96",fontFamily:"inherit",fontSize:10,fontWeight:700,cursor:"pointer"}}>{f.label}</button>)}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:14}}>
        {Array.from({length:fmtObj.maxSets}).map((_,i)=>{
          let hw=0,aw=0;
          for(let j=0;j<i;j++){const ps=sets[j];if(!ps)continue;const ph=parseInt(ps.home)||0,pa=parseInt(ps.away)||0;if(ph>pa)hw++;else if(pa>ph)aw++;}
          const disabled=hw>=fmtObj.winsNeeded||aw>=fmtObj.winsNeeded;
          const isTb=(fmt==="bo5"&&i===4)||(fmt==="bo3"&&i===2);
          const lim=setLimit(i); const s=sets[i]||{home:"",away:""};
          return <div key={i} style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:46,flexShrink:0}}>
              <div style={{fontSize:9,color:disabled?"#223":"#4a7a96",fontWeight:700}}>SET {i+1}</div>
              <div style={{fontSize:8,color:disabled?"#223":isTb?"#f4a261":"#334d66"}}>do {lim}{isTb?" 🏆":""}</div>
            </div>
            <Num value={s.home} onChange={v=>chSet(i,"home",v)} disabled={disabled}/>
            <span style={{color:"#334",fontWeight:900,fontSize:14}}>:</span>
            <Num value={s.away} onChange={v=>chSet(i,"away",v)} disabled={disabled}/>
          </div>;
        })}
      </div>
      <div style={{display:"flex",gap:10}}>
        <button onClick={onClose} style={{flex:1,padding:"12px",borderRadius:10,border:"1px solid rgba(255,255,255,.1)",background:"rgba(255,255,255,.04)",color:"#7a9bb5",fontFamily:"inherit",fontWeight:700,fontSize:11,letterSpacing:2,cursor:"pointer"}}>ANULUJ</button>
        <button onClick={doSave} style={{flex:2,padding:"12px",borderRadius:10,border:"none",background:"linear-gradient(90deg,#0077ff,#00c8ff)",color:"#fff",fontFamily:"inherit",fontWeight:900,fontSize:12,letterSpacing:2,cursor:"pointer",boxShadow:"0 4px 20px rgba(0,180,255,.3)"}}>ZAPISZ ✓</button>
      </div>
    </div>
  </div>;
}

// ─── Match Card ───────────────────────────────────────────────────────────
function MatchCard({match,teamMap,onEdit,readOnly}) {
  const h=teamMap[match.home], a=teamMap[match.away];
  const hN=h?h.name:(match.homeLabel||"?"), aN=a?a.name:(match.awayLabel||"?");
  return <div style={{background:match.played?"rgba(0,77,153,.15)":"rgba(255,255,255,.03)",border:`1px solid ${match.played?"rgba(0,200,255,.2)":"rgba(255,255,255,.07)"}`,borderRadius:12,padding:"10px 12px",marginBottom:7}}>
    {!readOnly&&<div style={{display:"flex",gap:4,marginBottom:7,justifyContent:"center"}}>
      {Object.entries(FORMATS).map(([k,f])=><button key={k} onClick={()=>onEdit("fmt",k)} style={{padding:"2px 8px",borderRadius:20,border:"1px solid",borderColor:match.format===k?"rgba(0,200,255,.5)":"rgba(255,255,255,.07)",background:match.format===k?"rgba(0,200,255,.12)":"transparent",color:match.format===k?"#00c8ff":"#3a5a7a",fontFamily:"inherit",fontSize:9,fontWeight:700,cursor:"pointer"}}>{f.label}</button>)}
    </div>}
    <div style={{display:"flex",alignItems:"center",gap:6}}>
      <div style={{flex:1,display:"flex",alignItems:"center",gap:6,justifyContent:"flex-end"}}>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:14,fontWeight:800,color:match.played&&match.homeWins>match.awayWins?"#fff":"#7a9bb5"}}>{hN}</div>
          {!h&&match.homeLabel&&<div style={{fontSize:9,color:"#445"}}>{match.homeLabel}</div>}
        </div>
        <Badge color={h?.color} short={h?.short}/>
      </div>
      <div style={{minWidth:56,textAlign:"center",flexShrink:0}}>
        {match.played?<>
          <div style={{fontSize:24,fontWeight:900,lineHeight:1,letterSpacing:1}}>
            <span style={{color:match.homeWins>=match.awayWins?"#00e5ff":"#445"}}>{match.homeWins}</span>
            <span style={{color:"#223",margin:"0 3px"}}>:</span>
            <span style={{color:match.awayWins>=match.homeWins?"#00e5ff":"#445"}}>{match.awayWins}</span>
          </div>
          {match.sets.length>0&&<div style={{display:"flex",gap:2,justifyContent:"center",marginTop:2,flexWrap:"wrap"}}>{match.sets.map((s,i)=><span key={i} style={{fontSize:9,color:"#4a7a96",background:"rgba(255,255,255,.05)",padding:"1px 4px",borderRadius:3}}>{s.home}:{s.away}</span>)}</div>}
        </>:<div style={{fontSize:13,fontWeight:700,color:"rgba(255,255,255,.1)",letterSpacing:2}}>VS</div>}
      </div>
      <div style={{flex:1,display:"flex",alignItems:"center",gap:6}}>
        <Badge color={a?.color} short={a?.short}/>
        <div>
          <div style={{fontSize:14,fontWeight:800,color:match.played&&match.awayWins>match.homeWins?"#fff":"#7a9bb5"}}>{aN}</div>
          {!a&&match.awayLabel&&<div style={{fontSize:9,color:"#445"}}>{match.awayLabel}</div>}
        </div>
      </div>
    </div>
    {!readOnly&&<button onClick={()=>onEdit("open")} style={{width:"100%",marginTop:8,padding:"7px",borderRadius:8,border:"1px solid rgba(0,200,255,.2)",background:"rgba(0,200,255,.07)",color:"#00c8ff",fontFamily:"inherit",fontWeight:700,fontSize:11,letterSpacing:2,cursor:"pointer"}}>
      {match.played?"✏️ EDYTUJ":"⚡ WPISZ WYNIK"}
    </button>}
  </div>;
}

// ─── Phase View (groups + standings + schedule + results) ─────────────────
function PhaseView({phase, phaseIdx, teamMap, setPoints, tiebreakPoints, onUpdateMatch, readOnly, tournamentTeamMap}) {
  const [tab,setTab]=useState("schedule");
  const [ag,setAg]=useState(phase.groups[0]?.id||null);
  const [modal,setModal]=useState(null);
  const allTM = {...teamMap, ...tournamentTeamMap};
  const allM=phase.groups.flatMap(g=>(phase.groupData[g.id]?.rounds||[]).flatMap(r=>r.matches));
  const played=allM.filter(m=>m.played).length;
  const phaseDone=allM.length>0&&allM.every(m=>m.played);
  const gc_phase=GC[(phaseIdx)%GC.length];

  function updateMatch(matchId,updated){
    onUpdateMatch&&onUpdateMatch(phaseIdx,matchId,updated);
  }
  function updateFmt(matchId,fmt){
    const allMs=phase.groups.flatMap(g=>(phase.groupData[g.id]?.rounds||[]).flatMap(r=>r.matches));
    const m=allMs.find(x=>x.id===matchId);
    if(m) updateMatch(matchId,{...m,format:fmt,sets:[],homeWins:0,awayWins:0,played:false});
  }

  const curG=phase.groups.find(x=>x.id===ag)||phase.groups[0];
  const curRounds=ag?(phase.groupData[ag]?.rounds||[]):[];

  return <div>
    {/* phase header */}
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,padding:"10px 14px",background:`${gc_phase}0d`,border:`1px solid ${gc_phase}33`,borderRadius:12}}>
      <div style={{width:32,height:32,borderRadius:8,background:`linear-gradient(135deg,${gc_phase},${gc_phase}aa)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,flexShrink:0}}>{phaseIdx+1}</div>
      <div style={{flex:1}}>
        <div style={{fontSize:14,fontWeight:900,color:gc_phase,letterSpacing:1}}>{phase.name}</div>
        <div style={{fontSize:10,color:"#4a7a96"}}>{phase.groups.length} grup · {played}/{allM.length} meczów{phaseDone?" · ✓ zakończona":""}</div>
      </div>
      {phaseDone&&<div style={{fontSize:18}}>✅</div>}
    </div>

    {/* sub-tabs */}
    <div style={{display:"flex",gap:2,marginBottom:12,background:"rgba(255,255,255,.03)",borderRadius:10,padding:3}}>
      {[["schedule","TERMINARZ"],["standings","TABELA"],["results","WYNIKI"]].map(([k,l])=><button key={k} onClick={()=>setTab(k)} style={{flex:1,padding:"7px 4px",borderRadius:8,border:"none",background:tab===k?"rgba(0,200,255,.15)":"transparent",color:tab===k?"#00c8ff":"#4a7a96",fontFamily:"inherit",fontWeight:700,fontSize:10,letterSpacing:2,cursor:"pointer"}}>{l}</button>)}
    </div>

    {/* group selector */}
    {phase.groups.length>1&&<div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:6,marginBottom:10}}>
      {tab==="results"&&<button onClick={()=>setAg(null)} style={{padding:"5px 12px",borderRadius:20,border:`1px solid ${!ag?"rgba(0,200,255,.5)":"rgba(255,255,255,.1)"}`,background:!ag?"rgba(0,200,255,.12)":"rgba(255,255,255,.03)",color:!ag?"#00c8ff":"#4a7a96",fontFamily:"inherit",fontWeight:700,fontSize:10,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>Wszystkie</button>}
      {phase.groups.map((g,gi)=>{
        const gc=GC[(phaseIdx*4+gi)%GC.length];
        const gp=(phase.groupData[g.id]?.rounds||[]).flatMap(r=>r.matches).filter(m=>m.played).length;
        const gt=(phase.groupData[g.id]?.rounds||[]).flatMap(r=>r.matches).length;
        return <button key={g.id} onClick={()=>setAg(g.id)} style={{padding:"5px 12px",borderRadius:20,border:`1px solid ${ag===g.id?gc:"rgba(255,255,255,.1)"}`,background:ag===g.id?`${gc}18`:"rgba(255,255,255,.03)",color:ag===g.id?gc:"#4a7a96",fontFamily:"inherit",fontWeight:700,fontSize:10,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>{g.name} <span style={{opacity:.6,fontSize:9}}>{gp}/{gt}</span></button>;
      })}
    </div>}

    {tab==="schedule"&&curRounds.map(round=><div key={round.id} style={{marginBottom:16}}>
      <div style={{fontSize:9,fontWeight:700,letterSpacing:4,color:"#4a7a96",marginBottom:7}}>— KOLEJKA {round.round}</div>
      {round.matches.map(m=><MatchCard key={m.id} match={m} teamMap={allTM} readOnly={readOnly}
        onEdit={readOnly?null:(action,val)=>{
          if(action==="fmt") updateFmt(m.id,val);
          else if(action==="open") setModal(m);
        }}/>)}
    </div>)}

    {tab==="standings"&&(()=>{
      if(!curG) return null;
      const gi=phase.groups.indexOf(curG);
      const gc=GC[(phaseIdx*4+gi)%GC.length];
      return <StTable teamIds={curG.teamIds} rounds={phase.groupData[curG.id]?.rounds||[]} teamMap={allTM} gc={gc}/>;
    })()}

    {tab==="results"&&(()=>{
      const gs=ag?phase.groups.filter(g=>g.id===ag):phase.groups;
      return gs.map(g=>{
        const gi=phase.groups.indexOf(g);
        const gc=GC[(phaseIdx*4+gi)%GC.length];
        return (phase.groupData[g.id]?.rounds||[]).map(round=>{
          const p=round.matches.filter(m=>m.played);
          if(!p.length) return null;
          return <div key={round.id} style={{marginBottom:14}}>
            {phase.groups.length>1&&<div style={{fontSize:9,color:gc,letterSpacing:3,marginBottom:4,fontWeight:700}}>{g.name}</div>}
            <div style={{fontSize:9,letterSpacing:4,color:"#4a7a96",marginBottom:7}}>— KOLEJKA {round.round}</div>
            {p.map(m=><MatchCard key={m.id} match={m} teamMap={allTM} readOnly/>)}
          </div>;
        });
      });
    })()}

    {!readOnly&&modal&&<ScoreModal match={modal} teamMap={allTM} setPoints={setPoints} tiebreakPoints={tiebreakPoints}
      onSave={updated=>{updateMatch(updated.id,updated);setModal(null);}}
      onClose={()=>setModal(null)}/>}
  </div>;
}

// ─── Next Phase Builder ───────────────────────────────────────────────────
function NextPhaseBuilder({prevPhases, tournamentTeamMap, onBuild, defaultFmt}) {
  const [name,setName]=useState(`Faza ${prevPhases.length+1}`);
  const [fmt,setFmt]=useState(defaultFmt||"bo3");
  const [newGroups,setNewGroups]=useState([{id:uid(),name:"Grupa A",teamIds:[]}]);
  const [autoStep,setAutoStep]=useState("config"); // config | preview
  const [advPerGroup,setAdvPerGroup]=useState(2);
  const [numNewGroups,setNumNewGroups]=useState(2);
  const [groupNames,setGroupNames]=useState(["Grupa mistrzowska","Grupa pocieszenia"]);

  // Gather standings from last group phase only (most relevant)
  const lastGroupPhase=[...prevPhases].reverse().find(p=>p.type==="group");
  const allGroupStandings=[];
  if(lastGroupPhase){
    lastGroupPhase.groups.forEach((g)=>{
      const rounds=lastGroupPhase.groupData[g.id]?.rounds||[];
      const st=calcStandings(g.teamIds,rounds);
      st.forEach((row,rank)=>{
        allGroupStandings.push({teamId:row.id,label:`${rank+1}. ${g.name}`,rank,groupName:g.name,pts:row.pts});
      });
    });
  }
  // also include from earlier phases if needed
  prevPhases.forEach((phase,pi)=>{
    if(phase===lastGroupPhase) return;
    if(phase.type!=="group") return;
    phase.groups.forEach((g)=>{
      const rounds=phase.groupData[g.id]?.rounds||[];
      const st=calcStandings(g.teamIds,rounds);
      st.forEach((row,rank)=>{
        allGroupStandings.push({teamId:row.id,label:`${rank+1}. ${g.name} (F${prevPhases.indexOf(phase)+1})`,rank,groupName:g.name,pts:row.pts});
      });
    });
  });

  function autoSuggest(){
    // Group by rank: rank 0..advPerGroup-1 → new group 0, rank advPerGroup..2*advPerGroup-1 → new group 1, etc.
    const srcGroups=lastGroupPhase?lastGroupPhase.groups:[];
    const suggested=Array.from({length:numNewGroups},(_,ni)=>({
      id:uid(),
      name:groupNames[ni]||`Grupa ${String.fromCharCode(65+ni)}`,
      teamIds:[]
    }));
    srcGroups.forEach(g=>{
      const rounds=lastGroupPhase.groupData[g.id]?.rounds||[];
      const st=calcStandings(g.teamIds,rounds);
      st.forEach((row,rank)=>{
        const groupIdx=Math.floor(rank/advPerGroup);
        if(groupIdx<numNewGroups) suggested[groupIdx].teamIds.push(row.id);
      });
    });
    setNewGroups(suggested);
    setAutoStep("preview");
  }

  const assignedTeams=new Set(newGroups.flatMap(g=>g.teamIds));
  function toggleTeam(gid,tid){
    setNewGroups(gs=>gs.map(g=>{
      if(g.id!==gid) return g;
      return g.teamIds.includes(tid)?{...g,teamIds:g.teamIds.filter(x=>x!==tid)}:{...g,teamIds:[...g.teamIds,tid]};
    }));
  }
  function moveTeam(fromGid,toGid,tid){
    setNewGroups(gs=>gs.map(g=>{
      if(g.id===fromGid) return {...g,teamIds:g.teamIds.filter(x=>x!==tid)};
      if(g.id===toGid) return {...g,teamIds:[...g.teamIds,tid]};
      return g;
    }));
  }

  const canBuild=newGroups.every(g=>g.teamIds.length>=2)&&newGroups.some(g=>g.teamIds.length>=2);

  return <div style={{background:"rgba(0,200,255,.04)",border:"1px solid rgba(0,200,255,.2)",borderRadius:14,padding:16,marginBottom:16}}>
    <div style={{fontSize:11,fontWeight:800,color:"#00c8ff",marginBottom:14,letterSpacing:2}}>➕ NOWA FAZA GRUPOWA</div>

    {/* name + format */}
    <div style={{marginBottom:12}}>
      <div style={{fontSize:9,color:"#4a7a96",letterSpacing:2,marginBottom:6}}>NAZWA FAZY</div>
      <input value={name} onChange={e=>setName(e.target.value)} style={{width:"100%",padding:"9px 12px",borderRadius:10,border:"1px solid rgba(255,255,255,.1)",background:"rgba(255,255,255,.05)",color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:700,outline:"none"}}/>
    </div>
    <div style={{marginBottom:14}}>
      <div style={{fontSize:9,color:"#4a7a96",letterSpacing:2,marginBottom:6}}>FORMAT MECZÓW</div>
      <div style={{display:"flex",gap:8}}>
        {Object.entries(FORMATS).map(([k,f])=><button key={k} onClick={()=>setFmt(k)} style={{flex:1,padding:"8px 4px",borderRadius:10,border:"1px solid",borderColor:fmt===k?"rgba(0,200,255,.4)":"rgba(255,255,255,.08)",background:fmt===k?"rgba(0,200,255,.12)":"transparent",color:fmt===k?"#00c8ff":"#6a8fa8",fontFamily:"inherit",fontWeight:700,fontSize:11,cursor:"pointer"}}>{f.label}</button>)}
      </div>
    </div>

    {autoStep==="config"&&<>
      {/* auto config */}
      <div style={{background:"rgba(0,200,255,.06)",border:"1px solid rgba(0,200,255,.15)",borderRadius:12,padding:12,marginBottom:12}}>
        <div style={{fontSize:10,fontWeight:800,color:"#00c8ff",marginBottom:10}}>⚡ AUTOSUGESTIA</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
          <div>
            <div style={{fontSize:9,color:"#4a7a96",letterSpacing:1,marginBottom:6}}>AWANS Z GRUPY (ile miejsc)</div>
            <div style={{display:"flex",gap:6}}>
              {[1,2,3,4].map(n=><button key={n} onClick={()=>setAdvPerGroup(n)} style={{flex:1,padding:"8px 2px",borderRadius:8,border:"1px solid",borderColor:advPerGroup===n?"rgba(0,200,255,.5)":"rgba(255,255,255,.08)",background:advPerGroup===n?"rgba(0,200,255,.12)":"transparent",color:advPerGroup===n?"#00c8ff":"#6a8fa8",fontFamily:"inherit",fontWeight:800,fontSize:15,cursor:"pointer"}}>{n}</button>)}
            </div>
          </div>
          <div>
            <div style={{fontSize:9,color:"#4a7a96",letterSpacing:1,marginBottom:6}}>LICZBA NOWYCH GRUP</div>
            <div style={{display:"flex",gap:6}}>
              {[1,2,3,4].map(n=><button key={n} onClick={()=>{setNumNewGroups(n);setGroupNames(prev=>{const next=[...prev];while(next.length<n)next.push(`Grupa ${String.fromCharCode(65+next.length)}`);return next;});}} style={{flex:1,padding:"8px 2px",borderRadius:8,border:"1px solid",borderColor:numNewGroups===n?"rgba(0,200,255,.5)":"rgba(255,255,255,.08)",background:numNewGroups===n?"rgba(0,200,255,.12)":"transparent",color:numNewGroups===n?"#00c8ff":"#6a8fa8",fontFamily:"inherit",fontWeight:800,fontSize:15,cursor:"pointer"}}>{n}</button>)}
            </div>
          </div>
        </div>
        {/* group name inputs */}
        <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:10}}>
          {Array.from({length:numNewGroups}).map((_,i)=>{
            const gc=GC[i%GC.length];
            return <div key={i} style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:gc,flexShrink:0}}/>
              <input value={groupNames[i]||""} onChange={e=>{const n=[...groupNames];n[i]=e.target.value;setGroupNames(n);}}
                placeholder={`Nazwa grupy ${i+1}...`}
                style={{flex:1,padding:"7px 10px",borderRadius:8,border:`1px solid ${gc}44`,background:`${gc}0a`,color:"#fff",fontFamily:"inherit",fontSize:12,fontWeight:700,outline:"none"}}/>
            </div>;
          })}
        </div>
        {/* preview hint */}
        {lastGroupPhase&&<div style={{fontSize:10,color:"#4a7a96",marginBottom:8}}>
          Miejsca 1–{advPerGroup} z każdej grupy → <span style={{color:GC[0]}}>{groupNames[0]||"Gr.1"}</span>
          {numNewGroups>1&&<>, miejsca {advPerGroup+1}–{advPerGroup*2} → <span style={{color:GC[1]}}>{groupNames[1]||"Gr.2"}</span></>}
          {numNewGroups>2&&<>, itd.</>}
        </div>}
        <button onClick={autoSuggest} style={{width:"100%",padding:"10px",borderRadius:10,border:"none",background:"linear-gradient(90deg,#0077ff,#00c8ff)",color:"#fff",fontFamily:"inherit",fontWeight:900,fontSize:12,letterSpacing:2,cursor:"pointer"}}>
          GENERUJ AUTOSUGESTIĘ →
        </button>
      </div>
      <div style={{textAlign:"center",fontSize:10,color:"#334d66",marginBottom:10}}>— lub przypisz ręcznie poniżej —</div>
      {/* manual groups */}
      {newGroups.map((g,gi)=>{
        const gc=GC[gi%GC.length];
        return <div key={g.id} style={{marginBottom:10,background:"rgba(255,255,255,.03)",border:`1px solid ${gc}33`,borderRadius:12,padding:10}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:gc}}/>
            <input value={g.name} onChange={e=>setNewGroups(gs=>gs.map(x=>x.id===g.id?{...x,name:e.target.value}:x))} style={{flex:1,background:"transparent",border:"none",color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:800,outline:"none"}}/>
            <span style={{fontSize:9,color:gc}}>{g.teamIds.length} drużyn</span>
            {newGroups.length>1&&<button onClick={()=>setNewGroups(gs=>gs.filter(x=>x.id!==g.id))} style={{width:20,height:20,borderRadius:5,border:"1px solid rgba(255,60,60,.2)",background:"rgba(255,60,60,.07)",color:"#e05",fontSize:12,cursor:"pointer",lineHeight:1}}>×</button>}
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
            {allGroupStandings.map(slot=>{
              const inThis=g.teamIds.includes(slot.teamId);
              const inOther=!inThis&&assignedTeams.has(slot.teamId);
              const t=tournamentTeamMap[slot.teamId];
              return <button key={slot.teamId+g.id} onClick={()=>!inOther&&toggleTeam(g.id,slot.teamId)} disabled={inOther}
                style={{padding:"4px 8px",borderRadius:20,border:"1px solid",borderColor:inThis?gc:"rgba(255,255,255,.08)",background:inThis?`${gc}22`:"transparent",color:inThis?gc:inOther?"#223":"#7a9bb5",fontFamily:"inherit",fontSize:10,fontWeight:700,cursor:inOther?"default":"pointer",textDecoration:inOther?"line-through":"none"}}>
                <span style={{fontSize:8,opacity:.7,marginRight:3}}>{slot.label}</span>{t?.name||slot.teamId}
              </button>;
            })}
          </div>
        </div>;
      })}
      <button onClick={()=>{const i=newGroups.length;setNewGroups(g=>[...g,{id:uid(),name:`Grupa ${String.fromCharCode(65+i)}`,teamIds:[]}]);}} style={{width:"100%",padding:"8px",borderRadius:10,border:"1px dashed rgba(255,255,255,.12)",background:"transparent",color:"#4a7a96",fontFamily:"inherit",fontWeight:700,fontSize:11,letterSpacing:2,cursor:"pointer",marginBottom:12}}>+ DODAJ GRUPĘ</button>
    </>}

    {autoStep==="preview"&&<>
      <div style={{background:"rgba(77,220,142,.06)",border:"1px solid rgba(77,220,142,.2)",borderRadius:10,padding:"8px 12px",marginBottom:12,fontSize:10,color:"#4ddc8e"}}>
        ✓ Autosugestia gotowa — możesz przeciągnąć drużyny między grupami klikając × i dodając do innej grupy
      </div>
      {newGroups.map((g,gi)=>{
        const gc=GC[gi%GC.length];
        const otherGroups=newGroups.filter(x=>x.id!==g.id);
        return <div key={g.id} style={{marginBottom:10,background:`${gc}0a`,border:`1px solid ${gc}44`,borderRadius:12,padding:12}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <div style={{width:10,height:10,borderRadius:"50%",background:gc,flexShrink:0}}/>
            <input value={g.name} onChange={e=>setNewGroups(gs=>gs.map(x=>x.id===g.id?{...x,name:e.target.value}:x))} style={{flex:1,background:"transparent",border:"none",color:gc,fontFamily:"inherit",fontSize:14,fontWeight:900,outline:"none"}}/>
            <span style={{fontSize:10,color:gc,fontWeight:700}}>{g.teamIds.length} drużyn</span>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            {g.teamIds.map(tid=>{
              const t=tournamentTeamMap[tid];
              const slot=allGroupStandings.find(s=>s.teamId===tid);
              return <div key={tid} style={{display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,.05)",borderRadius:8,padding:"6px 10px"}}>
                <div style={{width:7,height:7,borderRadius:"50%",background:t?.color||"#555",flexShrink:0}}/>
                <div style={{flex:1}}>
                  <span style={{fontSize:13,fontWeight:700}}>{t?.name||tid}</span>
                  {slot&&<span style={{fontSize:9,color:"#4a7a96",marginLeft:6}}>{slot.label}</span>}
                </div>
                {/* move to other group */}
                {otherGroups.length>0&&<div style={{display:"flex",gap:4}}>
                  {otherGroups.map(og=>{
                    const ogc=GC[newGroups.indexOf(og)%GC.length];
                    return <button key={og.id} onClick={()=>moveTeam(g.id,og.id,tid)}
                      title={`Przenieś do ${og.name}`}
                      style={{padding:"3px 7px",borderRadius:6,border:`1px solid ${ogc}55`,background:`${ogc}15`,color:ogc,fontFamily:"inherit",fontSize:9,fontWeight:700,cursor:"pointer"}}>
                      →{og.name.slice(0,4)}
                    </button>;
                  })}
                </div>}
                <button onClick={()=>setNewGroups(gs=>gs.map(x=>x.id===g.id?{...x,teamIds:x.teamIds.filter(y=>y!==tid)}:x))} style={{width:20,height:20,borderRadius:5,border:"1px solid rgba(255,60,60,.2)",background:"rgba(255,60,60,.07)",color:"#e05",fontSize:11,cursor:"pointer",lineHeight:1,flexShrink:0}}>×</button>
              </div>;
            })}
            {/* add unassigned */}
            {allGroupStandings.filter(s=>!assignedTeams.has(s.teamId)).map(slot=>{
              const t=tournamentTeamMap[slot.teamId];
              return <button key={slot.teamId} onClick={()=>toggleTeam(g.id,slot.teamId)}
                style={{padding:"5px 10px",borderRadius:8,border:`1px dashed ${gc}44`,background:"transparent",color:"#4a7a96",fontFamily:"inherit",fontSize:10,fontWeight:700,cursor:"pointer",textAlign:"left"}}>
                + {t?.name} <span style={{fontSize:8,opacity:.6}}>({slot.label})</span>
              </button>;
            })}
          </div>
          {g.teamIds.length>0&&g.teamIds.length<2&&<div style={{fontSize:9,color:"#e05",marginTop:6}}>⚠ Min. 2 drużyny</div>}
        </div>;
      })}
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        <button onClick={()=>setAutoStep("config")} style={{flex:1,padding:"9px",borderRadius:9,border:"1px solid rgba(255,255,255,.1)",background:"transparent",color:"#7a9bb5",fontFamily:"inherit",fontWeight:700,fontSize:11,cursor:"pointer"}}>← ZMIEŃ USTAWIENIA</button>
        <button onClick={()=>{const i=newGroups.length;setNewGroups(g=>[...g,{id:uid(),name:`Grupa ${String.fromCharCode(65+i)}`,teamIds:[]}]);}} style={{flex:1,padding:"9px",borderRadius:9,border:"1px dashed rgba(255,255,255,.12)",background:"transparent",color:"#4a7a96",fontFamily:"inherit",fontWeight:700,fontSize:11,cursor:"pointer"}}>+ GRUPA</button>
      </div>
    </>}

    <button disabled={!canBuild} onClick={()=>canBuild&&onBuild({name,fmt,groups:newGroups})}
      style={{width:"100%",padding:"12px",borderRadius:10,border:"none",background:canBuild?"linear-gradient(90deg,#0077ff,#00c8ff)":"#1a2a3a",color:canBuild?"#fff":"#3a5a7a",fontFamily:"inherit",fontWeight:900,fontSize:12,letterSpacing:2,cursor:canBuild?"pointer":"not-allowed"}}>
      UTWÓRZ FAZĘ →
    </button>
  </div>;
}

// ─── Crossover Builder ────────────────────────────────────────────────────
function CrossoverBuilder({prevPhases, tournamentTeamMap, onBuild, defaultFmt}) {
  const [name,setName]=useState("Mecze o miejsca");
  const [fmt,setFmt]=useState(defaultFmt||"bo3");
  const [matches,setMatches]=useState([{id:uid(),home:null,away:null,homeLabel:"",awayLabel:"",placesFor:null}]);
  const [autoStep,setAutoStep]=useState("config");
  const [startPlace,setStartPlace]=useState(1);

  const lastGroupPhase=[...prevPhases].reverse().find(p=>p.type==="group");
  const allStandings=[];
  prevPhases.forEach((phase,pi)=>{
    if(phase.type!=="group") return;
    phase.groups.forEach((g)=>{
      const st=calcStandings(g.teamIds,phase.groupData[g.id]?.rounds||[]);
      st.forEach((row,rank)=>{
        allStandings.push({teamId:row.id,label:`${rank+1}. ${g.name} (F${pi+1})`,rank,groupName:g.name,phaseIdx:pi});
      });
    });
  });

  function autoSuggest(){
    if(!lastGroupPhase||lastGroupPhase.groups.length<2) return;
    const groups=lastGroupPhase.groups;
    const standings=groups.map(g=>({g,st:calcStandings(g.teamIds,lastGroupPhase.groupData[g.id]?.rounds||[])}));
    const n=groups.length;
    const paired=new Set();
    const suggested=[];
    let placeCounter=startPlace;
    const maxRank=Math.max(...standings.map(s=>s.st.length));
    for(let rank=0;rank<maxRank;rank++){
      for(let i=0;i<n;i++){
        const j=(i+Math.floor(n/2))%n;
        const key=[Math.min(i*100+rank,j*100+rank),Math.max(i*100+rank,j*100+rank)].join("-");
        if(paired.has(key)) continue;
        paired.add(key);
        const h=standings[i]?.st[rank];
        const a=standings[j]?.st[rank];
        if(h&&a&&h.id!==a.id){
          suggested.push({id:uid(),home:h.id,away:a.id,homeLabel:`${rank+1}. ${groups[i].name}`,awayLabel:`${rank+1}. ${groups[j].name}`,placesFor:placeCounter});
          placeCounter+=2;
        }
      }
    }
    setMatches(suggested.length>0?suggested:[{id:uid(),home:null,away:null,homeLabel:"",awayLabel:"",placesFor:null}]);
    setAutoStep("preview");
  }

  const usedTeams=new Set(matches.flatMap(m=>[m.home,m.away].filter(Boolean)));
  function setSlot(matchId,side,teamId){
    const slot=allStandings.find(s=>s.teamId===teamId);
    setMatches(ms=>ms.map(m=>m.id===matchId?{...m,[side]:teamId,[side+"Label"]:slot?.label||""}:m));
  }
  function addMatch(){setMatches(ms=>[...ms,{id:uid(),home:null,away:null,homeLabel:"",awayLabel:"",placesFor:null}]);}
  function removeMatch(id){setMatches(ms=>ms.filter(m=>m.id!==id));}
  const canBuild=matches.every(m=>m.home&&m.away)&&matches.length>0;

  return <div style={{background:"rgba(255,165,0,.04)",border:"1px solid rgba(255,165,0,.2)",borderRadius:14,padding:16,marginBottom:16}}>
    <div style={{fontSize:11,fontWeight:800,color:"#f4a261",marginBottom:14,letterSpacing:2}}>⚡ MECZE O MIEJSCA</div>
    <div style={{marginBottom:12}}>
      <div style={{fontSize:9,color:"#4a7a96",letterSpacing:2,marginBottom:6}}>NAZWA (np. "Mecze o miejsca 1-4")</div>
      <input value={name} onChange={e=>setName(e.target.value)} style={{width:"100%",padding:"9px 12px",borderRadius:10,border:"1px solid rgba(255,255,255,.1)",background:"rgba(255,255,255,.05)",color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:700,outline:"none"}}/>
    </div>
    <div style={{marginBottom:14}}>
      <div style={{fontSize:9,color:"#4a7a96",letterSpacing:2,marginBottom:6}}>FORMAT</div>
      <div style={{display:"flex",gap:8}}>
        {Object.entries(FORMATS).map(([k,f])=><button key={k} onClick={()=>setFmt(k)} style={{flex:1,padding:"8px 4px",borderRadius:10,border:"1px solid",borderColor:fmt===k?"rgba(255,165,0,.5)":"rgba(255,255,255,.08)",background:fmt===k?"rgba(255,165,0,.1)":"transparent",color:fmt===k?"#f4a261":"#6a8fa8",fontFamily:"inherit",fontWeight:700,fontSize:11,cursor:"pointer"}}>{f.label}</button>)}
      </div>
    </div>
    {lastGroupPhase&&lastGroupPhase.groups.length>=2&&<div style={{background:"rgba(244,162,97,.06)",border:"1px solid rgba(244,162,97,.2)",borderRadius:12,padding:12,marginBottom:12}}>
      <div style={{fontSize:10,fontWeight:800,color:"#f4a261",marginBottom:8}}>⚡ AUTOSUGESTIA KRZYŻÓWEK</div>
      <div style={{fontSize:9,color:"#4a7a96",marginBottom:8}}>Automatycznie: 1. {lastGroupPhase.groups[0]?.name} vs 1. {lastGroupPhase.groups[1]?.name} itd.</div>
      <div style={{marginBottom:10}}>
        <div style={{fontSize:9,color:"#4a7a96",letterSpacing:1,marginBottom:6}}>WALCZĄ O MIEJSCA STARTUJĄC OD:</div>
        <div style={{display:"flex",gap:6}}>
          {[1,5,9,13,17].map(n=><button key={n} onClick={()=>setStartPlace(n)} style={{flex:1,padding:"7px 2px",borderRadius:8,border:"1px solid",borderColor:startPlace===n?"rgba(244,162,97,.6)":"rgba(255,255,255,.08)",background:startPlace===n?"rgba(244,162,97,.15)":"transparent",color:startPlace===n?"#f4a261":"#6a8fa8",fontFamily:"inherit",fontSize:11,fontWeight:800,cursor:"pointer"}}>{n}.</button>)}
        </div>
      </div>
      <button onClick={autoSuggest} style={{width:"100%",padding:"9px",borderRadius:9,border:"none",background:"linear-gradient(90deg,#f77f00,#f4a261)",color:"#fff",fontFamily:"inherit",fontWeight:900,fontSize:11,letterSpacing:2,cursor:"pointer"}}>GENERUJ KRZYŻÓWKI →</button>
    </div>}
    {autoStep==="preview"&&<div style={{background:"rgba(77,220,142,.06)",border:"1px solid rgba(77,220,142,.2)",borderRadius:8,padding:"7px 10px",marginBottom:10,fontSize:10,color:"#4ddc8e"}}>✓ Sugestia gotowa — możesz edytować pary poniżej</div>}
    <div style={{fontSize:9,color:"#4a7a96",letterSpacing:2,marginBottom:8}}>PARY MECZÓW</div>
    {matches.map((m,i)=><div key={m.id} style={{marginBottom:8,background:"rgba(255,255,255,.03)",borderRadius:10,padding:"8px 10px"}}>
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
        <div style={{fontSize:10,color:"#f4a261",fontWeight:700,width:26,flexShrink:0}}>#{i+1}</div>
        {m.placesFor&&<span style={{fontSize:9,background:"rgba(244,162,97,.1)",border:"1px solid rgba(244,162,97,.2)",borderRadius:10,padding:"1px 7px",color:"#f4a261"}}>o {m.placesFor}. miejsce</span>}
        <div style={{flex:1}}/>
        <button onClick={()=>removeMatch(m.id)} style={{width:20,height:20,borderRadius:5,border:"1px solid rgba(255,60,60,.2)",background:"rgba(255,60,60,.07)",color:"#e05",fontSize:11,cursor:"pointer",lineHeight:1}}>×</button>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        <select value={m.home||""} onChange={e=>setSlot(m.id,"home",e.target.value||null)}
          style={{flex:1,padding:"7px 6px",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,color:m.home?"#fff":"#445",fontFamily:"inherit",fontSize:10,outline:"none"}}>
          <option value="">-- gospodarz --</option>
          {allStandings.map(s=><option key={s.teamId} value={s.teamId} disabled={!!(usedTeams.has(s.teamId)&&m.home!==s.teamId)}>{s.label} · {tournamentTeamMap[s.teamId]?.name}</option>)}
        </select>
        <span style={{color:"#334",fontWeight:900,fontSize:11,flexShrink:0}}>VS</span>
        <select value={m.away||""} onChange={e=>setSlot(m.id,"away",e.target.value||null)}
          style={{flex:1,padding:"7px 6px",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,color:m.away?"#fff":"#445",fontFamily:"inherit",fontSize:10,outline:"none"}}>
          <option value="">-- gość --</option>
          {allStandings.map(s=><option key={s.teamId} value={s.teamId} disabled={!!(usedTeams.has(s.teamId)&&m.away!==s.teamId)}>{s.label} · {tournamentTeamMap[s.teamId]?.name}</option>)}
        </select>
      </div>
      {m.home&&m.away&&<div style={{fontSize:9,color:"#4a7a96",marginTop:4,textAlign:"center"}}>{tournamentTeamMap[m.home]?.name} vs {tournamentTeamMap[m.away]?.name}</div>}
    </div>)}
    <button onClick={addMatch} style={{width:"100%",padding:"8px",borderRadius:10,border:"1px dashed rgba(255,165,0,.2)",background:"transparent",color:"#f4a261",fontFamily:"inherit",fontWeight:700,fontSize:11,cursor:"pointer",marginBottom:12}}>+ DODAJ PARĘ</button>
    <button disabled={!canBuild} onClick={()=>canBuild&&onBuild({name,fmt,matches})}
      style={{width:"100%",padding:"12px",borderRadius:10,border:"none",background:canBuild?"linear-gradient(90deg,#f77f00,#f4a261)":"#1a2a3a",color:canBuild?"#fff":"#3a5a7a",fontFamily:"inherit",fontWeight:900,fontSize:12,letterSpacing:2,cursor:canBuild?"pointer":"not-allowed"}}>
      UTWÓRZ MECZE →
    </button>
  </div>;
}

// ─── Final Classification helpers ─────────────────────────────────────────
function buildFinalClassification(phases, teamMap) {
  const placed=new Map();
  // 1. from crossover phases
  phases.forEach(phase=>{
    if(phase.type!=="crossover") return;
    const sorted=[...phase.matches].sort((a,b)=>(a.placesFor||99)-(b.placesFor||99));
    sorted.forEach(m=>{
      if(!m.played) return;
      const winner=m.homeWins>m.awayWins?m.home:m.away;
      const loser=m.homeWins>m.awayWins?m.away:m.home;
      const place=m.placesFor||1;
      if(!placed.has(winner)) placed.set(winner,place);
      if(!placed.has(loser)) placed.set(loser,place+1);
    });
  });
  // 2. from group phases (last first)
  const usedPlaces=new Set(placed.values());
  let nextPlace=placed.size>0?Math.max(...placed.values())+1:1;
  [...phases].reverse().forEach(phase=>{
    if(phase.type!=="group") return;
    phase.groups.forEach(g=>{
      const st=calcStandings(g.teamIds,phase.groupData[g.id]?.rounds||[]);
      st.forEach(row=>{
        if(!placed.has(row.id)){
          while(usedPlaces.has(nextPlace)) nextPlace++;
          placed.set(row.id,nextPlace);
          usedPlaces.add(nextPlace);
          nextPlace++;
        }
      });
    });
  });
  const result=[];
  placed.forEach((place,teamId)=>{result.push({place,teamId,team:teamMap[teamId]});});
  return result.sort((a,b)=>a.place-b.place);
}

function FinalClassification({phases,teamMap}) {
  const cl=buildFinalClassification(phases,teamMap);
  const medals=["🥇","🥈","🥉"];
  if(cl.length===0) return <div style={{textAlign:"center",padding:"40px 20px",color:"#334"}}>
    <div style={{fontSize:32,marginBottom:8}}>🏆</div>
    <div style={{fontSize:12,letterSpacing:2}}>BRAK DANYCH</div>
    <div style={{fontSize:10,color:"#223",marginTop:6}}>Zakończ mecze aby zobaczyć klasyfikację</div>
  </div>;
  return <div>
    <div style={{textAlign:"center",marginBottom:20}}>
      <div style={{fontSize:32,marginBottom:4}}>🏆</div>
      <div style={{fontSize:18,fontWeight:900,letterSpacing:3,background:"linear-gradient(90deg,#ffd166,#fff)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>KLASYFIKACJA KOŃCOWA</div>
    </div>
    {cl.length>=2&&<div style={{display:"flex",alignItems:"flex-end",justifyContent:"center",gap:8,marginBottom:20}}>
      {[cl[1],cl[0],cl[2]].filter(Boolean).map((row,i)=>{
        const podiumPos=[2,1,3][i];
        const heights=[80,100,70];
        const colors=["#c0c0c0","#ffd700","#cd7f32"];
        return <div key={row.teamId} style={{textAlign:"center",flex:1,maxWidth:110}}>
          <div style={{fontSize:i===1?22:16,marginBottom:4}}>{medals[podiumPos-1]}</div>
          <div style={{width:7,height:7,borderRadius:"50%",background:row.team?.color||"#555",margin:"0 auto 4px"}}/>
          <div style={{fontSize:i===1?12:10,fontWeight:800,color:"#fff",marginBottom:6,lineHeight:1.2}}>{row.team?.name||row.teamId}</div>
          <div style={{height:heights[i],background:`linear-gradient(180deg,${colors[i]}33,${colors[i]}11)`,border:`1px solid ${colors[i]}66`,borderRadius:"8px 8px 0 0",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{fontSize:i===1?26:20,fontWeight:900,color:colors[i]}}>{podiumPos}</span>
          </div>
        </div>;
      })}
    </div>}
    <div style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.07)",borderRadius:14,overflow:"hidden"}}>
      {cl.map((row,idx)=>{
        const isTop3=row.place<=3;
        const bgColors=["rgba(255,215,0,.08)","rgba(192,192,192,.06)","rgba(205,127,50,.06)"];
        return <div key={row.teamId} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",borderBottom:idx<cl.length-1?"1px solid rgba(255,255,255,.05)":"none",background:isTop3?bgColors[row.place-1]:"transparent"}}>
          <div style={{width:36,textAlign:"center",flexShrink:0}}>
            {row.place<=3?<span style={{fontSize:20}}>{medals[row.place-1]}</span>:<span style={{fontSize:16,fontWeight:900,color:"#3a5a7a"}}>{row.place}</span>}
          </div>
          <div style={{width:32,height:32,borderRadius:8,background:row.team?.color||"#333",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:900,color:"#fff",flexShrink:0}}>{row.team?.short||"?"}</div>
          <div style={{flex:1,fontSize:14,fontWeight:700,color:isTop3?"#fff":"#9ab"}}>{row.team?.name||row.teamId}</div>
          {row.place===1&&<span style={{fontSize:9,background:"rgba(255,215,0,.15)",border:"1px solid rgba(255,215,0,.3)",borderRadius:10,padding:"2px 8px",color:"#ffd166",fontWeight:700}}>MISTRZ 🏆</span>}
        </div>;
      })}
    </div>
  </div>;
}

// ─── Crossover Phase View ─────────────────────────────────────────────────
function CrossoverView({phase, phaseIdx, teamMap, setPoints, tiebreakPoints, onUpdateMatch, readOnly}) {
  const [modal,setModal]=useState(null);
  const gc="#f4a261";
  const played=phase.matches.filter(m=>m.played).length;

  return <div>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,padding:"10px 14px",background:"rgba(244,162,97,.06)",border:"1px solid rgba(244,162,97,.25)",borderRadius:12}}>
      <div style={{width:32,height:32,borderRadius:8,background:"linear-gradient(135deg,#f77f00,#f4a261)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,flexShrink:0}}>⚡</div>
      <div style={{flex:1}}>
        <div style={{fontSize:14,fontWeight:900,color:gc,letterSpacing:1}}>{phase.name}</div>
        <div style={{fontSize:10,color:"#4a7a96"}}>{played}/{phase.matches.length} meczów</div>
      </div>
      {played===phase.matches.length&&phase.matches.length>0&&<div style={{fontSize:18}}>✅</div>}
    </div>
    {phase.matches.map(m=><MatchCard key={m.id} match={m} teamMap={teamMap} readOnly={readOnly}
      onEdit={readOnly?null:(action,val)=>{
        if(action==="fmt") onUpdateMatch&&onUpdateMatch(phaseIdx,{...m,format:val,sets:[],homeWins:0,awayWins:0,played:false});
        else if(action==="open") setModal(m);
      }}/>)}
    {!readOnly&&modal&&<ScoreModal match={modal} teamMap={teamMap} setPoints={setPoints} tiebreakPoints={tiebreakPoints}
      onSave={updated=>{onUpdateMatch(phaseIdx,updated);setModal(null);}}
      onClose={()=>setModal(null)}/>}
  </div>;
}

// ─── VIEWER ───────────────────────────────────────────────────────────────
function Viewer({t}) {
  const [activePhase,setActivePhase]=useState(0);
  const teamMap=Object.fromEntries(t.teamsPool.map(x=>[x.id,x]));
  const allGroupM=t.phases.filter(p=>p.type==="group").flatMap(p=>p.groups.flatMap(g=>(p.groupData[g.id]?.rounds||[]).flatMap(r=>r.matches)));
  const allCrossM=t.phases.filter(p=>p.type==="crossover").flatMap(p=>p.matches);
  const totalM=[...allGroupM,...allCrossM];
  const played=totalM.filter(m=>m.played).length;

  const css=`@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;700;800;900&display=swap');*{box-sizing:border-box;margin:0;padding:0;}body{background:#060d14;}input,select{outline:none;}::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-thumb{background:#1a3050;border-radius:2px;}`;

  return <div style={{minHeight:"100vh",background:"#060d14",fontFamily:"'Barlow Condensed',sans-serif",color:"#fff",paddingBottom:60}}>
    <style>{css}</style>
    <div style={{background:"#0a1520",borderBottom:"2px solid rgba(0,200,255,.2)",padding:"10px 14px"}}>
      <div style={{maxWidth:600,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:18}}>🏐</span>
          <div>
            <div style={{fontSize:17,fontWeight:900,letterSpacing:2,background:"linear-gradient(90deg,#fff,#00c8ff)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{t.name}</div>
            <div style={{fontSize:8,color:"#4a7a96",letterSpacing:2}}>PODGLĄD LIVE · {t.phases.length} FAZ</div>
          </div>
        </div>
        <span style={{background:"rgba(0,200,255,.08)",border:"1px solid rgba(0,200,255,.18)",borderRadius:20,padding:"3px 10px",fontSize:10,color:"#00c8ff",fontWeight:700}}>● LIVE {played}/{totalM.length}</span>
      </div>
    </div>
    <div style={{maxWidth:600,margin:"10px auto 0",padding:"0 12px"}}>
      <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:6}}>
        {t.phases.map((p,i)=>{
          const gc=p.type==="crossover"?"#f4a261":GC[i%GC.length];
          return <button key={p.id} onClick={()=>{setActivePhase(i);}} style={{padding:"6px 12px",borderRadius:20,border:`1px solid ${activePhase===i?gc:"rgba(255,255,255,.1)"}`,background:activePhase===i?`${gc}18`:"rgba(255,255,255,.03)",color:activePhase===i?gc:"#4a7a96",fontFamily:"inherit",fontWeight:700,fontSize:10,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>{p.name}</button>;
        })}
        <button onClick={()=>setActivePhase(-1)} style={{padding:"6px 12px",borderRadius:20,border:`1px solid ${activePhase===-1?"#ffd166":"rgba(255,255,255,.1)"}`,background:activePhase===-1?"rgba(255,215,0,.12)":"rgba(255,255,255,.03)",color:activePhase===-1?"#ffd166":"#4a7a96",fontFamily:"inherit",fontWeight:700,fontSize:10,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>🏆 KLASYFIKACJA</button>
      </div>
    </div>
    <div style={{maxWidth:600,margin:"12px auto",padding:"0 12px"}}>
      {activePhase===-1
        ?<FinalClassification phases={t.phases} teamMap={teamMap}/>
        :t.phases[activePhase]&&(t.phases[activePhase].type==="group"
          ?<PhaseView phase={t.phases[activePhase]} phaseIdx={activePhase} teamMap={teamMap} tournamentTeamMap={teamMap} setPoints={t.setPoints} tiebreakPoints={t.tiebreakPoints} readOnly/>
          :<CrossoverView phase={t.phases[activePhase]} phaseIdx={activePhase} teamMap={teamMap} setPoints={t.setPoints} tiebreakPoints={t.tiebreakPoints} readOnly/>
        )
      }
    </div>
  </div>;
}

// ════════════════════════════════════════════════════════
// MAIN APP
// ════════════════════════════════════════════════════════
export default function App() {
  const [screen,setScreen]=useState("home");
  const [tournaments,setTournaments]=useState({});
  const [tid,setTid]=useState(null);
  const [viewTid,setViewTid]=useState(null);
  const [shareModal,setShareModal]=useState(false);
  const [copied,setCopied]=useState(false);
  const [addingPhase,setAddingPhase]=useState(null); // null | "group" | "crossover"
  const [activePhase,setActivePhase]=useState(0);
  const [showClassification,setShowClassification]=useState(false);

  // setup state
  const [tName,setTName]=useState("Turniej 2025");
  const [sp,setSp]=useState(25); const [tb,setTb]=useState(15);
  const [cs,setCs]=useState("25"); const [ct,setCt]=useState("15");
  const [defFmt,setDefFmt]=useState("bo3");
  const [pool,setPool]=useState([
    {id:uid(),name:"Drużyna A",short:"DRA",color:COLORS[0]},
    {id:uid(),name:"Drużyna B",short:"DRB",color:COLORS[1]},
    {id:uid(),name:"Drużyna C",short:"DRC",color:COLORS[2]},
    {id:uid(),name:"Drużyna D",short:"DRD",color:COLORS[3]},
  ]);
  const [newName,setNewName]=useState("");
  const [initGroups,setInitGroups]=useState([{id:uid(),name:"Grupa A",teamIds:[]}]);

  useEffect(()=>{
    const saved=load(); setTournaments(saved);
    const hash=window.location.hash.slice(1);
    if(hash&&saved[hash]){setViewTid(hash);setScreen("view");}
  },[]);

  useEffect(()=>{
    if(screen!=="view"||!viewTid) return;
    const iv=setInterval(()=>{const s=load();if(s[viewTid])setTournaments(p=>({...p,[viewTid]:s[viewTid]}));},4000);
    return ()=>clearInterval(iv);
  },[screen,viewTid]);

  const tournament=tid?tournaments[tid]:null;
  const teamMap=tournament?Object.fromEntries(tournament.teamsPool.map(t=>[t.id,t])):{};

  function saveTournaments(data){setTournaments(data);persist(data);}
  function updateT(updater){
    setTournaments(prev=>{const next={...prev,[tid]:updater(prev[tid])};persist(next);return next;});
  }

  // setup helpers
  function addTeam(){
    if(!newName.trim()||pool.length>=32) return;
    const name=newName.trim();
    setPool(p=>[...p,{id:uid(),name,short:name.slice(0,3).toUpperCase(),color:COLORS[p.length%COLORS.length]}]);
    setNewName("");
  }
  function toggleInGroup(gid,teamId){
    setInitGroups(gs=>gs.map(g=>{
      if(g.id!==gid) return g;
      return g.teamIds.includes(teamId)?{...g,teamIds:g.teamIds.filter(x=>x!==teamId)}:{...g,teamIds:[...g.teamIds,teamId]};
    }));
  }
  const canStart=initGroups.every(g=>g.teamIds.length>=2)&&initGroups.some(g=>g.teamIds.length>=2);

  function startTournament(){
    const setP=parseInt(cs)>0?parseInt(cs):sp;
    const tbP=parseInt(ct)>0?parseInt(ct):tb;
    const id=uid();
    const gd={};
    initGroups.forEach(g=>{gd[g.id]={rounds:genRR(g.teamIds,defFmt)};});
    const phase0={id:uid(),type:"group",name:"Faza grupowa",groups:initGroups,groupData:gd};
    const t={id,name:tName,setPoints:setP,tiebreakPoints:tbP,defaultFormat:defFmt,teamsPool:pool,phases:[phase0],createdAt:Date.now()};
    const next={...tournaments,[id]:t};
    saveTournaments(next); setTid(id); setActivePhase(0); setScreen("manage");
  }

  // phase update
  function updateGroupMatch(phaseIdx,matchId,updated){
    updateT(t=>{
      const newPhases=t.phases.map((p,pi)=>{
        if(pi!==phaseIdx||p.type!=="group") return p;
        const newGD={};
        Object.keys(p.groupData).forEach(gid=>{
          newGD[gid]={...p.groupData[gid],rounds:p.groupData[gid].rounds.map(r=>({...r,matches:r.matches.map(m=>m.id===matchId?updated:m)}))};
        });
        return {...p,groupData:newGD};
      });
      return {...t,phases:newPhases};
    });
  }
  function updateCrossoverMatch(phaseIdx,updated){
    updateT(t=>{
      const newPhases=t.phases.map((p,pi)=>{
        if(pi!==phaseIdx||p.type!=="crossover") return p;
        return {...p,matches:p.matches.map(m=>m.id===updated.id?updated:m)};
      });
      return {...t,phases:newPhases};
    });
  }

  function buildNextPhase({name,fmt,groups}){
    const gd={};
    groups.forEach(g=>{gd[g.id]={rounds:genRR(g.teamIds,fmt)};});
    const newPhase={id:uid(),type:"group",name,groups,groupData:gd};
    updateT(t=>({...t,phases:[...t.phases,newPhase]}));
    setActivePhase((tournament?.phases?.length)||0);
    setAddingPhase(null);
  }
  function buildCrossover({name,fmt,matches}){
    const ms=matches.map(m=>({...m,format:fmt,sets:[],played:false,homeWins:0,awayWins:0,
      homeLabel:m.homeLabel||"", awayLabel:m.awayLabel||""}));
    const newPhase={id:uid(),type:"crossover",name,matches:ms};
    updateT(t=>({...t,phases:[...t.phases,newPhase]}));
    setActivePhase((tournament?.phases?.length)||0);
    setAddingPhase(null);
  }

  const shareUrl=tid?`${window.location.origin}${window.location.pathname}#${tid}`:"";
  function copyLink(){navigator.clipboard.writeText(shareUrl).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);});}

  const css=`@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&display=swap');*{box-sizing:border-box;margin:0;padding:0;}body{background:#060d14;}input,select{outline:none;}input[type=number]::-webkit-inner-spin-button{opacity:1;}::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-thumb{background:#1a3050;border-radius:2px;}`;

  // ── VIEW ──
  if(screen==="view"&&viewTid){
    const t=tournaments[viewTid];
    if(!t) return <div style={{minHeight:"100vh",background:"#060d14",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Barlow Condensed',sans-serif",color:"#4a7a96",fontSize:14,letterSpacing:2}}><style>{css}</style>TURNIEJ NIE ZNALEZIONY</div>;
    return <Viewer t={t}/>;
  }

  // ── HOME ──
  if(screen==="home"){
    const list=Object.values(tournaments).sort((a,b)=>b.createdAt-a.createdAt);
    return <div style={{minHeight:"100vh",background:"#060d14",fontFamily:"'Barlow Condensed',sans-serif",color:"#fff",padding:16,paddingBottom:40}}>
      <style>{css}</style>
      <div style={{maxWidth:480,margin:"0 auto"}}>
        <div style={{textAlign:"center",padding:"32px 0 24px"}}>
          <div style={{fontSize:40,marginBottom:8}}>🏐</div>
          <div style={{fontSize:26,fontWeight:900,letterSpacing:3,background:"linear-gradient(90deg,#fff,#00c8ff)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>VOLLEYBALL</div>
          <div style={{fontSize:9,color:"#4a7a96",letterSpacing:4}}>MENEDŻER TURNIEJÓW</div>
        </div>
        <button onClick={()=>setScreen("setup")} style={{width:"100%",padding:"15px",borderRadius:12,border:"none",background:"linear-gradient(90deg,#0077ff,#00c8ff)",color:"#fff",fontFamily:"inherit",fontWeight:900,fontSize:14,letterSpacing:3,cursor:"pointer",boxShadow:"0 4px 24px rgba(0,180,255,.3)",marginBottom:20}}>+ NOWY TURNIEJ</button>
        {list.length>0&&<div>
          <div style={{fontSize:9,letterSpacing:3,color:"#4a7a96",marginBottom:10}}>ZAPISANE TURNIEJE</div>
          {list.map(t=>{
            const phases=t.phases||[];
            const allM=phases.flatMap(p=>p.type==="group"?p.groups.flatMap(g=>(p.groupData[g.id]?.rounds||[]).flatMap(r=>r.matches)):p.matches||[]);
            const played=allM.filter(m=>m.played).length;
            return <div key={t.id} style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
              <div style={{flex:1}}>
                <div style={{fontSize:15,fontWeight:800}}>{t.name}</div>
                <div style={{fontSize:10,color:"#4a7a96",marginTop:2}}>{phases.length} faz · {played}/{allM.length} meczów</div>
              </div>
              <button onClick={()=>{setTid(t.id);setActivePhase(0);setScreen("manage");}} style={{padding:"7px 14px",borderRadius:8,border:"1px solid rgba(0,200,255,.3)",background:"rgba(0,200,255,.1)",color:"#00c8ff",fontFamily:"inherit",fontWeight:700,fontSize:11,cursor:"pointer"}}>OTWÓRZ</button>
              <button onClick={()=>{const n={...tournaments};delete n[t.id];saveTournaments(n);}} style={{width:28,height:28,borderRadius:7,border:"1px solid rgba(255,60,60,.2)",background:"rgba(255,60,60,.07)",color:"#e05",fontSize:14,cursor:"pointer",lineHeight:1}}>×</button>
            </div>;
          })}
        </div>}
      </div>
    </div>;
  }

  // ── SETUP ──
  if(screen==="setup") return <div style={{minHeight:"100vh",background:"#060d14",fontFamily:"'Barlow Condensed',sans-serif",color:"#fff",padding:16,paddingBottom:40}}>
    <style>{css}</style>
    <div style={{maxWidth:500,margin:"0 auto"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"16px 0 20px"}}>
        <button onClick={()=>setScreen("home")} style={{padding:"6px 12px",borderRadius:8,border:"1px solid rgba(255,255,255,.1)",background:"transparent",color:"#4a7a96",fontFamily:"inherit",fontSize:11,fontWeight:700,cursor:"pointer"}}>← WRÓĆ</button>
        <div style={{fontSize:16,fontWeight:900,letterSpacing:2}}>NOWY TURNIEJ</div>
      </div>
      <Sec title="NAZWA"><input value={tName} onChange={e=>setTName(e.target.value)} style={{width:"100%",padding:"10px 14px",borderRadius:10,border:"1px solid rgba(255,255,255,.1)",background:"rgba(255,255,255,.05)",color:"#fff",fontFamily:"inherit",fontSize:15,fontWeight:700}}/></Sec>
      <Sec title="LIMITY PUNKTÓW">
        <div style={{display:"flex",gap:8,marginBottom:12}}>
          {PRESETS.map(p=><button key={p.label} onClick={()=>{setSp(p.set);setTb(p.tb);setCs(String(p.set));setCt(String(p.tb));}} style={{flex:1,padding:"8px 4px",borderRadius:10,border:"1px solid",borderColor:sp===p.set&&tb===p.tb?"rgba(0,200,255,.5)":"rgba(255,255,255,.08)",background:sp===p.set&&tb===p.tb?"rgba(0,200,255,.12)":"transparent",color:sp===p.set&&tb===p.tb?"#00c8ff":"#7a9bb5",fontFamily:"inherit",fontWeight:700,fontSize:11,cursor:"pointer"}}><div>{p.label}</div><div style={{fontSize:8,opacity:.7}}>do {p.set}/TB {p.tb}</div></button>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[["Sety do:",cs,setCs,setSp],["Tie-break do:",ct,setCt,setTb]].map(([lbl,val,setVal,setPts])=><div key={lbl}>
            <div style={{fontSize:9,color:"#4a7a96",letterSpacing:2,marginBottom:6}}>{lbl}</div>
            <div style={{display:"flex",gap:4,marginBottom:6}}>{[11,15,21,25].map(v=><button key={v} onClick={()=>{setVal(String(v));setPts(v);}} style={{flex:1,padding:"6px 2px",borderRadius:7,border:"1px solid",borderColor:parseInt(val)===v?"rgba(0,200,255,.4)":"rgba(255,255,255,.07)",background:parseInt(val)===v?"rgba(0,200,255,.1)":"transparent",color:parseInt(val)===v?"#00c8ff":"#4a7a96",fontFamily:"inherit",fontSize:12,fontWeight:800,cursor:"pointer"}}>{v}</button>)}</div>
            <input placeholder="własny..." value={val} onChange={e=>{setVal(e.target.value);if(parseInt(e.target.value)>0)setPts(parseInt(e.target.value));}} style={{width:"100%",padding:"7px 10px",background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,color:"#fff",fontFamily:"inherit",fontSize:13}}/>
          </div>)}
        </div>
        <div style={{marginTop:10,padding:"7px 12px",background:"rgba(0,200,255,.06)",borderRadius:8,fontSize:11,color:"#4a9cc7",textAlign:"center"}}>Sety do <b style={{color:"#00c8ff"}}>{sp}</b> · Tie-break do <b style={{color:"#00c8ff"}}>{tb}</b></div>
      </Sec>
      <Sec title="FORMAT FAZY GRUPOWEJ">
        <div style={{display:"flex",gap:8}}>{Object.entries(FORMATS).map(([k,f])=><button key={k} onClick={()=>setDefFmt(k)} style={{flex:1,padding:"10px 4px",borderRadius:10,border:"1px solid",borderColor:defFmt===k?"rgba(0,200,255,.4)":"rgba(255,255,255,.08)",background:defFmt===k?"rgba(0,200,255,.12)":"transparent",color:defFmt===k?"#00c8ff":"#6a8fa8",fontFamily:"inherit",fontWeight:700,fontSize:11,cursor:"pointer"}}>{f.label}</button>)}</div>
      </Sec>
      <Sec title={`DRUŻYNY (${pool.length})`}>
        <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:10,maxHeight:180,overflowY:"auto"}}>
          {pool.map(t=>{
            const inG=initGroups.find(g=>g.teamIds.includes(t.id));
            return <div key={t.id} style={{display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.06)",borderRadius:9,padding:"7px 10px"}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:t.color,flexShrink:0}}/>
              <div style={{flex:1,fontSize:13,fontWeight:700}}>{t.name}</div>
              {inG&&<span style={{fontSize:9,color:GC[initGroups.indexOf(inG)%GC.length],padding:"2px 6px",borderRadius:10,background:"rgba(0,0,0,.3)"}}>{inG.name}</span>}
              <button onClick={()=>{setPool(p=>p.filter(x=>x.id!==t.id));setInitGroups(gs=>gs.map(g=>({...g,teamIds:g.teamIds.filter(id=>id!==t.id)})));}} style={{width:24,height:24,borderRadius:6,border:"1px solid rgba(255,60,60,.2)",background:"rgba(255,60,60,.07)",color:"#e05",fontSize:14,cursor:"pointer",lineHeight:1}}>×</button>
            </div>;
          })}
        </div>
        <div style={{display:"flex",gap:8}}>
          <input value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addTeam()} placeholder="Nazwa drużyny..." style={{flex:1,padding:"9px 12px",borderRadius:10,border:"1px solid rgba(255,255,255,.1)",background:"rgba(255,255,255,.05)",color:"#fff",fontFamily:"inherit",fontSize:14}}/>
          <button onClick={addTeam} style={{padding:"9px 16px",borderRadius:10,border:"1px solid rgba(0,200,255,.3)",background:"rgba(0,200,255,.1)",color:"#00c8ff",fontFamily:"inherit",fontWeight:700,fontSize:13,cursor:"pointer"}}>+</button>
        </div>
      </Sec>
      <Sec title="GRUPY FAZY 1">
        {initGroups.map((g,gi)=>{
          const gc=GC[gi%GC.length];
          return <div key={g.id} style={{marginBottom:12,background:"rgba(255,255,255,.03)",border:`1px solid ${gc}33`,borderRadius:12,padding:12}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:gc}}/>
              <input value={g.name} onChange={e=>setInitGroups(gs=>gs.map(x=>x.id===g.id?{...x,name:e.target.value}:x))} style={{flex:1,background:"transparent",border:"none",color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:800,outline:"none"}}/>
              <span style={{fontSize:10,color:gc}}>{g.teamIds.length} drużyn</span>
              {initGroups.length>1&&<button onClick={()=>setInitGroups(gs=>gs.filter(x=>x.id!==g.id))} style={{width:22,height:22,borderRadius:5,border:"1px solid rgba(255,60,60,.2)",background:"rgba(255,60,60,.07)",color:"#e05",fontSize:13,cursor:"pointer",lineHeight:1}}>×</button>}
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {pool.map(t=>{
                const inThis=g.teamIds.includes(t.id);
                const inOther=!inThis&&initGroups.some(og=>og.id!==g.id&&og.teamIds.includes(t.id));
                return <button key={t.id} onClick={()=>!inOther&&toggleInGroup(g.id,t.id)} disabled={inOther} style={{padding:"5px 10px",borderRadius:20,border:"1px solid",borderColor:inThis?gc:"rgba(255,255,255,.08)",background:inThis?`${gc}22`:"transparent",color:inThis?gc:inOther?"#223":"#7a9bb5",fontFamily:"inherit",fontSize:11,fontWeight:700,cursor:inOther?"default":"pointer",textDecoration:inOther?"line-through":"none"}}>{t.name}</button>;
              })}
            </div>
            {g.teamIds.length<2&&<div style={{marginTop:8,fontSize:10,color:"#e05"}}>⚠ Min. 2 drużyny</div>}
          </div>;
        })}
        <button onClick={()=>{const i=initGroups.length;setInitGroups(g=>[...g,{id:uid(),name:`Grupa ${String.fromCharCode(65+i)}`,teamIds:[]}]);}} style={{width:"100%",padding:"10px",borderRadius:10,border:"1px dashed rgba(255,255,255,.15)",background:"transparent",color:"#4a7a96",fontFamily:"inherit",fontWeight:700,fontSize:12,letterSpacing:2,cursor:"pointer"}}>+ DODAJ GRUPĘ</button>
      </Sec>
      <button disabled={!canStart} onClick={startTournament} style={{width:"100%",padding:"14px",borderRadius:12,border:"none",background:canStart?"linear-gradient(90deg,#0077ff,#00c8ff)":"#1a2a3a",color:canStart?"#fff":"#3a5a7a",fontFamily:"inherit",fontWeight:900,fontSize:14,letterSpacing:3,cursor:canStart?"pointer":"not-allowed",boxShadow:canStart?"0 4px 24px rgba(0,180,255,.3)":"none"}}>GENERUJ TURNIEJ →</button>
    </div>
  </div>;

  // ── MANAGE ──
  if(screen==="manage"&&tournament){
    const phases=tournament.phases||[];
    const allM=phases.flatMap(p=>p.type==="group"?p.groups.flatMap(g=>(p.groupData[g.id]?.rounds||[]).flatMap(r=>r.matches)):p.matches||[]);
    const played=allM.filter(m=>m.played).length;

    return <div style={{minHeight:"100vh",background:"#060d14",fontFamily:"'Barlow Condensed',sans-serif",color:"#fff",paddingBottom:80}}>
      <style>{css}</style>
      {/* header */}
      <div style={{background:"#0a1520",borderBottom:"2px solid rgba(0,200,255,.2)",padding:"10px 14px",position:"sticky",top:0,zIndex:100}}>
        <div style={{maxWidth:600,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <button onClick={()=>setScreen("home")} style={{padding:"4px 8px",borderRadius:6,border:"1px solid rgba(255,255,255,.1)",background:"transparent",color:"#4a7a96",fontFamily:"inherit",fontSize:10,cursor:"pointer"}}>←</button>
              <div>
                <div style={{fontSize:15,fontWeight:900,letterSpacing:2,background:"linear-gradient(90deg,#fff,#00c8ff)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{tournament.name}</div>
                <div style={{fontSize:8,color:"#4a7a96"}}>do {tournament.setPoints} · TB {tournament.tiebreakPoints} · {phases.length} faz · {played}/{allM.length} meczów</div>
              </div>
            </div>
            <button onClick={()=>setShareModal(true)} style={{padding:"6px 10px",borderRadius:8,border:"1px solid rgba(0,200,255,.3)",background:"rgba(0,200,255,.1)",color:"#00c8ff",fontFamily:"inherit",fontWeight:700,fontSize:10,cursor:"pointer"}}>📡 LIVE</button>
          </div>
          {/* phase tabs */}
          <div style={{display:"flex",gap:5,overflowX:"auto",paddingBottom:2}}>
            {phases.map((p,i)=>{
              const gc=p.type==="crossover"?"#f4a261":GC[i%GC.length];
              const pM=p.type==="group"?p.groups.flatMap(g=>(p.groupData[g.id]?.rounds||[]).flatMap(r=>r.matches)):p.matches||[];
              const pp=pM.filter(m=>m.played).length;
              return <button key={p.id} onClick={()=>setActivePhase(i)} style={{padding:"5px 10px",borderRadius:20,border:`1px solid ${activePhase===i?gc:"rgba(255,255,255,.1)"}`,background:activePhase===i?`${gc}18`:"rgba(255,255,255,.03)",color:activePhase===i?gc:"#4a7a96",fontFamily:"inherit",fontWeight:700,fontSize:10,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>
                {p.name} <span style={{opacity:.6,fontSize:9}}>{pp}/{pM.length}</span>
              </button>;
            })}
          </div>
        </div>
      </div>

      <div style={{maxWidth:600,margin:"14px auto",padding:"0 12px"}}>
        {/* current phase */}
        {phases[activePhase]&&(phases[activePhase].type==="group"
          ?<PhaseView phase={phases[activePhase]} phaseIdx={activePhase} teamMap={teamMap} tournamentTeamMap={teamMap}
              setPoints={tournament.setPoints} tiebreakPoints={tournament.tiebreakPoints}
              onUpdateMatch={updateGroupMatch}/>
          :<CrossoverView phase={phases[activePhase]} phaseIdx={activePhase} teamMap={teamMap}
              setPoints={tournament.setPoints} tiebreakPoints={tournament.tiebreakPoints}
              onUpdateMatch={(pi,updated)=>updateCrossoverMatch(pi,updated)}/>
        )}

        {/* add next phase */}
        {addingPhase===null&&<div style={{marginTop:16}}>
          <div style={{fontSize:9,color:"#4a7a96",letterSpacing:3,marginBottom:10,textAlign:"center"}}>DODAJ NASTĘPNĄ FAZĘ</div>
          <div style={{display:"flex",gap:10,marginBottom:10}}>
            <button onClick={()=>setAddingPhase("group")} style={{flex:1,padding:"12px",borderRadius:12,border:"1px solid rgba(0,200,255,.25)",background:"rgba(0,200,255,.06)",color:"#00c8ff",fontFamily:"inherit",fontWeight:800,fontSize:12,letterSpacing:1,cursor:"pointer"}}>
              <div style={{fontSize:18,marginBottom:4}}>🏐</div>
              FAZA GRUPOWA
              <div style={{fontSize:9,opacity:.7,marginTop:2}}>round-robin w grupach</div>
            </button>
            <button onClick={()=>setAddingPhase("crossover")} style={{flex:1,padding:"12px",borderRadius:12,border:"1px solid rgba(244,162,97,.25)",background:"rgba(244,162,97,.06)",color:"#f4a261",fontFamily:"inherit",fontWeight:800,fontSize:12,letterSpacing:1,cursor:"pointer"}}>
              <div style={{fontSize:18,marginBottom:4}}>⚡</div>
              MECZE O MIEJSCA
              <div style={{fontSize:9,opacity:.7,marginTop:2}}>krzyżowe pary</div>
            </button>
          </div>
          {/* Finish tournament + classification */}
          <button onClick={()=>setShowClassification(true)} style={{width:"100%",padding:"13px",borderRadius:12,border:"1px solid rgba(255,215,0,.3)",background:"rgba(255,215,0,.07)",color:"#ffd166",fontFamily:"inherit",fontWeight:900,fontSize:13,letterSpacing:2,cursor:"pointer"}}>
            🏆 KLASYFIKACJA KOŃCOWA / ZAKOŃCZ TURNIEJ
          </button>
        </div>}

        {addingPhase==="group"&&<div style={{marginTop:16}}>
          <button onClick={()=>setAddingPhase(null)} style={{padding:"5px 12px",borderRadius:8,border:"1px solid rgba(255,255,255,.1)",background:"transparent",color:"#4a7a96",fontFamily:"inherit",fontSize:11,fontWeight:700,cursor:"pointer",marginBottom:12}}>← ANULUJ</button>
          <NextPhaseBuilder prevPhases={phases} tournamentTeamMap={teamMap} defaultFmt={tournament.defaultFormat} onBuild={buildNextPhase}/>
        </div>}

        {addingPhase==="crossover"&&<div style={{marginTop:16}}>
          <button onClick={()=>setAddingPhase(null)} style={{padding:"5px 12px",borderRadius:8,border:"1px solid rgba(255,255,255,.1)",background:"transparent",color:"#4a7a96",fontFamily:"inherit",fontSize:11,fontWeight:700,cursor:"pointer",marginBottom:12}}>← ANULUJ</button>
          <CrossoverBuilder prevPhases={phases} tournamentTeamMap={teamMap} defaultFmt={tournament.defaultFormat} onBuild={buildCrossover}/>
        </div>}
      </div>

      {/* classification modal */}
      {showClassification&&<div onClick={()=>setShowClassification(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",backdropFilter:"blur(8px)",display:"flex",alignItems:"flex-start",justifyContent:"center",zIndex:400,padding:"16px",overflowY:"auto"}}>
        <div onClick={e=>e.stopPropagation()} style={{background:"#0a1828",border:"1px solid rgba(255,215,0,.25)",borderRadius:20,padding:20,width:"100%",maxWidth:480,marginTop:16,marginBottom:40}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
            <div style={{fontSize:11,fontWeight:800,color:"#ffd166",letterSpacing:2}}>🏆 KLASYFIKACJA KOŃCOWA</div>
            <button onClick={()=>setShowClassification(false)} style={{width:28,height:28,borderRadius:7,border:"1px solid rgba(255,255,255,.1)",background:"transparent",color:"#7a9bb5",fontSize:16,cursor:"pointer",lineHeight:1}}>×</button>
          </div>
          <FinalClassification phases={tournament.phases||[]} teamMap={teamMap}/>
          <button onClick={()=>setShowClassification(false)} style={{width:"100%",marginTop:16,padding:"11px",borderRadius:10,border:"1px solid rgba(255,255,255,.1)",background:"transparent",color:"#4a7a96",fontFamily:"inherit",fontWeight:700,fontSize:11,letterSpacing:2,cursor:"pointer"}}>ZAMKNIJ</button>
        </div>
      </div>}

      {/* share modal */}
      {shareModal&&<div onClick={()=>setShareModal(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,padding:16}}>
        <div onClick={e=>e.stopPropagation()} style={{background:"#0a1828",border:"1px solid rgba(0,200,255,.3)",borderRadius:20,padding:24,width:"100%",maxWidth:400}}>
          <div style={{textAlign:"center",marginBottom:20}}><div style={{fontSize:32,marginBottom:8}}>📡</div><div style={{fontSize:16,fontWeight:900,letterSpacing:2}}>LINK DLA KIBICÓW</div><div style={{fontSize:11,color:"#4a7a96",marginTop:4}}>Odświeżanie co 4 sekundy</div></div>
          <div style={{background:"rgba(0,200,255,.06)",border:"1px solid rgba(0,200,255,.2)",borderRadius:10,padding:"12px 14px",marginBottom:14,wordBreak:"break-all",fontSize:11,color:"#7a9bb5",lineHeight:1.5}}>{shareUrl}</div>
          <button onClick={copyLink} style={{width:"100%",padding:"13px",borderRadius:11,border:"none",background:copied?"linear-gradient(90deg,#00aa44,#00dd66)":"linear-gradient(90deg,#0077ff,#00c8ff)",color:"#fff",fontFamily:"inherit",fontWeight:900,fontSize:13,letterSpacing:2,cursor:"pointer",marginBottom:10}}>{copied?"✓ SKOPIOWANO!":"KOPIUJ LINK"}</button>
          <button onClick={()=>setShareModal(false)} style={{width:"100%",padding:"10px",borderRadius:10,border:"1px solid rgba(255,255,255,.1)",background:"transparent",color:"#4a7a96",fontFamily:"inherit",fontWeight:700,fontSize:11,cursor:"pointer"}}>ZAMKNIJ</button>
        </div>
      </div>}
    </div>;
  }

  return null;
}