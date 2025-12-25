import React, { useState, useEffect, useRef } from 'react';
import { DAIMYO_INFO } from './data/daimyos';
import { COSTS } from './data/constants';
import { getFormattedDate, getRiceMarketPrice } from './utils/helpers';
import { 
  INITIAL_RESOURCES, 
  INITIAL_ALLIANCES, 
  INITIAL_CEASEFIRES, 
  INITIAL_RELATIONS, 
  INITIAL_PROVINCES 
} from './utils/initializers';

// 分割したコンポーネントをインポート
import { StartScreen, ResourceBar, ControlPanel } from './components/UIComponents';
import { GameMap, ProvincePopup } from './components/MapComponents';
import { 
  IncomingRequestModal, LogHistoryModal, MarketModal, TitlesModal, 
  DonateModal, TradeModal, NegotiationScene, DaimyoListModal, 
  TroopSelector, BattleScene, GameOverScreen 
} from './components/Modals';

// --- Main App Component ---

const App = () => {
  // 1. State Definitions
  const [provinces, setProvinces] = useState(INITIAL_PROVINCES);
  const [daimyoStats, setDaimyoStats] = useState(INITIAL_RESOURCES);
  const [alliances, setAlliances] = useState(INITIAL_ALLIANCES);
  const [ceasefires, setCeasefires] = useState(INITIAL_CEASEFIRES);
  const [relations, setRelations] = useState(INITIAL_RELATIONS);
  const [coalition, setCoalition] = useState(null);
  
  const [shogunId, setShogunId] = useState('Ashikaga'); 
  const [playerDaimyoId, setPlayerDaimyoId] = useState(null); 
  const [turn, setTurn] = useState(1);
  const [gameState, setGameState] = useState('playing'); 

  // UI State
  const [selectedProvinceId, setSelectedProvinceId] = useState(null);
  const [attackSourceId, setAttackSourceId] = useState(null);
  const [transportSourceId, setTransportSourceId] = useState(null);
  const [viewingRelationId, setViewingRelationId] = useState(null);
  const [mapTransform, setMapTransform] = useState({ x: 0, y: 0, scale: 0.6 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });

  // Modal State
  const [modalState, setModalState] = useState({ type: null, data: null }); 
  const [logs, setLogs] = useState([]);
  const [lastLog, setLastLog] = useState('大名を選択して天下統一を目指せ。');

  // Turn Logic State
  const [turnOrder, setTurnOrder] = useState([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(-1);
  const [isPlayerTurn, setIsPlayerTurn] = useState(false);
  const provincesRef = useRef(provinces);

  // 2. Effects
  useEffect(() => { provincesRef.current = provinces; }, [provinces]);

  useEffect(() => {
    if (!playerDaimyoId) return;
    const playerCount = provinces.filter(p => p.ownerId === playerDaimyoId).length;
    if (playerCount === provinces.length) setGameState('won');
    else if (playerCount === 0) setGameState('lost');
  }, [provinces, playerDaimyoId]);

  useEffect(() => { if (playerDaimyoId && turnOrder.length === 0) startNewSeason(); }, [playerDaimyoId]);
  
  useEffect(() => {
      if (turn > 1) { showLog(`${getFormattedDate(turn)}になりました。`); startNewSeason(); }
  }, [turn]);

  useEffect(() => {
      if (turnOrder.length === 0 || currentTurnIndex === -1) return;
      if (currentTurnIndex >= turnOrder.length) { setTurn(t => t + 1); return; }
      const currentDaimyo = turnOrder[currentTurnIndex];
      if (!provinces.some(p => p.ownerId === currentDaimyo)) { advanceTurn(); return; }
      
      if (currentDaimyo === playerDaimyoId) {
          setIsPlayerTurn(true); showLog(`我が軍の手番です。`);
      } else {
          setIsPlayerTurn(false); setTimeout(() => processAiTurn(currentDaimyo), 800);
      }
  }, [currentTurnIndex, turnOrder]);

  // 3. Helper Logic
  const showLog = (text) => { setLastLog(text); setLogs(prev => [...prev, `${getFormattedDate(turn)}: ${text}`]); };
  
  const updateResource = (id, g, r, f=0, d=0) => {
      setDaimyoStats(prev => ({...prev, [id]: { ...prev[id], gold: Math.max(0,(prev[id].gold||0)+g), rice: Math.max(0,(prev[id].rice||0)+r), fame: Math.max(0,(prev[id].fame||0)+f) }}));
  };
  const updateRelation = (target, diff) => setRelations(prev => ({...prev, [playerDaimyoId]: {...(prev[playerDaimyoId]||{}), [target]: Math.min(100, Math.max(0, (prev[playerDaimyoId]?.[target]||50)+diff))}}));
  const consumeAction = (pid) => setProvinces(prev => prev.map(p => p.id === pid ? { ...p, actionsLeft: Math.max(0, p.actionsLeft - 1) } : p));

  const startNewSeason = () => {
      const isAutumn = (turn - 1) % 4 === 2;
      setCeasefires(prev => {
          const next = { ...prev };
          Object.keys(next).forEach(k => Object.keys(next[k]).forEach(t => { if(next[k][t]>0) next[k][t]--; }));
          return next;
      });
      if (coalition) {
          if (coalition.duration <= 1) { setCoalition(null); showLog("包囲網が解散しました。"); }
          else setCoalition(prev => ({...prev, duration: prev.duration - 1}));
      }
      setProvinces(curr => curr.map(p => ({...p, actionsLeft: 3})));
      Object.keys(DAIMYO_INFO).forEach(id => {
          const owned = provincesRef.current.filter(p => p.ownerId === id);
          if (owned.length) {
              const commerceIncome = owned.reduce((s,p)=>s+p.commerce,0);
              const agIncome = isAutumn ? owned.reduce((s,p)=>s+p.agriculture,0)*2 : 0;
              updateResource(id, commerceIncome, agIncome);
          }
      });
      setTimeout(determineTurnOrder, 500);
  };

  const determineTurnOrder = () => {
      const active = Object.keys(DAIMYO_INFO).filter(id => id !== 'Minor' && provincesRef.current.some(p => p.ownerId === id));
      active.sort((a,b) => (daimyoStats[b]?.fame||0) - (daimyoStats[a]?.fame||0));
      setTurnOrder(active); setCurrentTurnIndex(0);
  };

  const advanceTurn = () => { setSelectedProvinceId(null); setAttackSourceId(null); setTransportSourceId(null); setCurrentTurnIndex(prev => prev + 1); };

  const processAiTurn = (aiId) => {
      setProvinces(curr => {
          const next = curr.map(p => ({...p}));
          let { gold, rice, fame } = daimyoStats[aiId] || { gold:0, rice:0, fame: 0 };
          const originalGold = gold;
          const originalRice = rice;
          const originalFame = fame;
          
          const strategy = DAIMYO_INFO[aiId]?.strategy || 'balanced';
          const params = {
              aggressive: { attackChance: 0.8, attackThreshold: 300, recruitThreshold: 400, saveRice: false },
              balanced:   { attackChance: 0.5, attackThreshold: 500, recruitThreshold: 500, saveRice: false },
              defensive:  { attackChance: 0.2, attackThreshold: 800, recruitThreshold: 700, saveRice: true }
          };
          const prm = params[strategy];

          const marketPrice = getRiceMarketPrice(turn);
          if (gold > 1000 && rice < 300) {
              const buyAmount = 200;
              const cost = Math.floor(buyAmount * marketPrice * 1.2);
              if (gold > cost) { gold -= cost; rice += buyAmount; }
          } else if (rice > 1500 && gold < 300 && !prm.saveRice) {
              const sellAmount = 300;
              const gain = Math.floor(sellAmount * marketPrice * 0.8);
              rice -= sellAmount; gold += gain;
          }

          const myProvinces = next.filter(p => p.ownerId === aiId);
          myProvinces.forEach(p => {
              while (p.actionsLeft > 0) {
                  const neighbors = p.neighbors.map(nid => next.find(x => x.id === nid)).filter(n => n);
                  const enemies = neighbors.filter(n => n.ownerId !== aiId && !alliances[aiId]?.includes(n.ownerId));
                  const weakEnemy = enemies.find(e => e.troops < p.troops * (strategy === 'aggressive' ? 0.9 : 0.6)); 
                  const isFrontline = enemies.length > 0;

                  if (weakEnemy && rice >= COSTS.attack.rice && p.troops > prm.attackThreshold && Math.random() < prm.attackChance) {
                      rice -= COSTS.attack.rice;
                      p.actionsLeft--;
                      let atk = Math.floor(p.troops * 0.6); p.troops -= atk;
                      let def = weakEnemy.troops;
                      for(let r=0; r<10; r++) {
                          if(atk<=0 || def<=0) break;
                          atk -= Math.floor(def * 0.1); def -= Math.floor(atk * 0.15); 
                      }
                      if (def <= 0) {
                          weakEnemy.ownerId = aiId;
                          weakEnemy.troops = Math.max(1, atk);
                          weakEnemy.actionsLeft = 0;
                          showLog(`${DAIMYO_INFO[aiId].name}が${weakEnemy.name}を制圧！`);
                          continue; 
                      } else {
                          weakEnemy.troops = def;
                          p.troops += Math.floor(atk * 0.5); 
                      }
                  }
                  else if (isFrontline && p.troops < prm.recruitThreshold && gold >= COSTS.recruit.gold && rice >= COSTS.recruit.rice) {
                      gold -= COSTS.recruit.gold; rice -= COSTS.recruit.rice;
                      p.troops += COSTS.recruit.troops; p.actionsLeft--;
                  }
                  else if (isFrontline && p.defense < (strategy === 'defensive' ? 80 : 40) && gold >= COSTS.fortify.gold) {
                      gold -= COSTS.fortify.gold; p.defense += COSTS.fortify.boost; p.actionsLeft--;
                  }
                  else if (gold >= COSTS.develop.gold) {
                      if (Math.random() > 0.5) {
                          gold -= COSTS.develop.gold; p.commerce += COSTS.develop.boost;
                      } else if (gold >= COSTS.cultivate.gold && rice >= COSTS.cultivate.rice) {
                          gold -= COSTS.cultivate.gold; rice -= COSTS.cultivate.rice; p.agriculture += COSTS.cultivate.boost;
                      }
                      p.actionsLeft--;
                  }
                  else if (gold > 3000) {
                      const donateAmount = 500; gold -= donateAmount; fame += Math.floor(donateAmount / 100); p.actionsLeft--;
                  }
                  else {
                      p.actionsLeft = 0;
                  }
              }
          });
          setTimeout(() => updateResource(aiId, gold - originalGold, rice - originalRice, fame - originalFame), 0);
          return next;
      });
      setTimeout(advanceTurn, 800);
  };

  const handleWheel = (e) => {
    const scaleAmount = -e.deltaY * 0.001;
    const newScale = Math.min(Math.max(0.2, mapTransform.scale + scaleAmount), 3);
    const ratio = newScale / mapTransform.scale;
    const newX = e.clientX - (e.clientX - mapTransform.x) * ratio;
    const newY = e.clientY - (e.clientY - mapTransform.y) * ratio;
    setMapTransform({ x: newX, y: newY, scale: newScale });
  };

  const handleDomesticAction = (type, pid) => {
      const p = provinces.find(x => x.id === pid);
      const isImmediate = ['develop', 'cultivate', 'pacify', 'fortify'].includes(type);
      
      if (isImmediate) {
          if (p.actionsLeft <= 0) return showLog("行動力不足");
          const cost = COSTS[type];
          const stats = daimyoStats[playerDaimyoId];
          if (stats.gold < cost.gold || stats.rice < cost.rice) return showLog("資源不足");

          updateResource(playerDaimyoId, -cost.gold, -cost.rice);
          consumeAction(pid);

          if (type === 'develop') { setProvinces(prev => prev.map(pr => pr.id === pid ? {...pr, commerce: pr.commerce + cost.boost} : pr)); showLog("商業開発完了"); }
          if (type === 'cultivate') { setProvinces(prev => prev.map(pr => pr.id === pid ? {...pr, agriculture: pr.agriculture + cost.boost} : pr)); showLog("開墾完了"); }
          if (type === 'pacify') { setProvinces(prev => prev.map(pr => pr.id === pid ? {...pr, loyalty: Math.min(100, pr.loyalty + cost.boost)} : pr)); showLog("施しを行いました"); }
          if (type === 'fortify') { setProvinces(prev => prev.map(pr => pr.id === pid ? {...pr, defense: pr.defense + cost.boost} : pr)); showLog("普請完了"); }
      } else {
          if (type === 'market') setModalState({ type: 'market', data: { pid } });
          if (type === 'trade') setModalState({ type: 'trade', data: { pid } });
          if (type === 'donate') setModalState({ type: 'donate', data: { pid } });
          if (type === 'titles') setModalState({ type: 'titles', data: { pid } });
      }
  };

  const handleMilitaryAction = (type, pid) => {
      const p = provinces.find(x => x.id === pid);
      if (p.actionsLeft <= 0) return showLog("行動力不足");
      
      if (type === 'train') {
          if (daimyoStats[playerDaimyoId].gold < COSTS.train.gold) return showLog("金不足");
          updateResource(playerDaimyoId, -COSTS.train.gold, 0);
          setProvinces(prev => prev.map(pr => pr.id === pid ? {...pr, training: Math.min(100, pr.training + COSTS.train.boost)} : pr));
          consumeAction(pid); showLog("訓練完了");
      }
      if (type === 'recruit') {
           const c = COSTS.recruit;
           if (daimyoStats[playerDaimyoId].gold < c.gold || daimyoStats[playerDaimyoId].rice < c.rice) return showLog("資源不足");
           updateResource(playerDaimyoId, -c.gold, -c.rice);
           setProvinces(prev => prev.map(pr => pr.id === pid ? {...pr, troops: pr.troops + c.troops, loyalty: pr.loyalty - 5} : pr));
           consumeAction(pid); showLog("徴兵完了");
      }
      if (type === 'attack') { setAttackSourceId(pid); setTransportSourceId(null); setSelectedProvinceId(null); showLog("攻撃目標を選択してください"); }
      if (type === 'transport') { setTransportSourceId(pid); setAttackSourceId(null); setSelectedProvinceId(null); showLog("輸送先を選択してください"); }
  };

  const handleTroopAction = (amount) => {
      const { type, sourceId, targetId } = modalState.data;
      setModalState({ type: null });
      const src = provinces.find(p => p.id === sourceId);
      const tgt = provinces.find(p => p.id === targetId);

      if (type === 'transport') {
          updateResource(playerDaimyoId, -COSTS.move.gold, -COSTS.move.rice);
          setProvinces(prev => prev.map(p => {
              if (p.id === sourceId) return {...p, troops: p.troops - amount, actionsLeft: Math.max(0, p.actionsLeft-1)};
              if (p.id === targetId) return {...p, troops: p.troops + amount};
              return p;
          }));
          showLog("輸送完了");
      } else if (type === 'attack') {
          updateResource(playerDaimyoId, -COSTS.attack.gold, -COSTS.attack.rice);
          setProvinces(prev => prev.map(p => p.id === sourceId ? {...p, troops: p.troops - amount, actionsLeft: Math.max(0, p.actionsLeft-1)} : p));
          setModalState({ type: 'battle', data: { attacker: src, defender: tgt, attackerAmount: amount } });
      }
      setAttackSourceId(null); setTransportSourceId(null);
  };

  const handleMapSelect = (pid, isTargetable, isTransportTarget) => {
      if (isDragging) return;
      if (isTargetable || isTransportTarget) {
          const type = isTargetable ? 'attack' : 'transport';
          const srcId = isTargetable ? attackSourceId : transportSourceId;
          const src = provinces.find(p => p.id === srcId);
          setModalState({ type: 'troop', data: { type, sourceId: srcId, targetId: pid, maxTroops: src.troops } });
      } else {
          if (!attackSourceId && !transportSourceId) setSelectedProvinceId(pid === selectedProvinceId ? null : pid);
      }
  };

  const handleDiplomacy = (type, targetDaimyoId) => {
      const p = provinces.find(x => x.id === selectedProvinceId);
      if (p && p.actionsLeft <= 0) return showLog("行動力不足"); 

      if (type === 'alliance') {
         const cost = 500;
         if (daimyoStats[playerDaimyoId].gold < cost) return showLog("金不足");
         updateResource(playerDaimyoId, -cost, 0);
         setAlliances(prev => ({...prev, [playerDaimyoId]: [...(prev[playerDaimyoId]||[]), targetDaimyoId], [targetDaimyoId]: [...(prev[targetDaimyoId]||[]), playerDaimyoId]}));
         showLog("同盟締結"); consumeAction(selectedProvinceId);
      }
      if (type === 'negotiate') {
          setModalState({ type: 'negotiate', data: { targetId: targetDaimyoId, provinceId: selectedProvinceId } });
      }
  };

  // 5. Render
  if (!playerDaimyoId) return <StartScreen onSelectDaimyo={setPlayerDaimyoId} />;

  return (
    <div className="relative w-full h-screen overflow-hidden font-sans select-none text-stone-100 flex flex-col items-center justify-center bg-[#0f172a]">
        <div className="absolute inset-0 z-0 bg-sky-900" style={{ backgroundImage: `radial-gradient(circle at 100% 50%, transparent 20%, rgba(255,255,255,0.03) 21%, transparent 22%), radial-gradient(circle at 0% 50%, transparent 20%, rgba(255,255,255,0.03) 21%, transparent 22%), radial-gradient(circle at 50% 50%, transparent 50%, rgba(0,0,0,0.2) 100%)`, backgroundSize: '100px 100px' }}><div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px)' }}></div></div>

        <ResourceBar stats={daimyoStats[playerDaimyoId]} turn={turn} isPlayerTurn={isPlayerTurn} shogunId={shogunId} playerId={playerDaimyoId} coalition={coalition} />

        <div className="relative z-0 w-full h-full overflow-hidden cursor-move" 
             onMouseDown={(e) => { setDragStartPos({x:e.clientX, y:e.clientY}); setIsDragging(false); }}
             onMouseMove={(e) => { if(e.buttons===1 && (Math.abs(e.clientX-dragStartPos.x)>5 || Math.abs(e.clientY-dragStartPos.y)>5)) { setIsDragging(true); setMapTransform(p => ({...p, x:p.x+e.movementX, y:p.y+e.movementY})); } }}
             onWheel={handleWheel}>
            <div style={{ transform: `translate(${mapTransform.x}px, ${mapTransform.y}px) scale(${mapTransform.scale})` }} className="absolute origin-top-left transition-transform duration-75">
                <GameMap 
                    provinces={provinces} viewingRelationId={viewingRelationId} playerDaimyoId={playerDaimyoId}
                    alliances={alliances} ceasefires={ceasefires} coalition={coalition}
                    selectedProvinceId={selectedProvinceId} attackSourceId={attackSourceId} transportSourceId={transportSourceId}
                    onSelectProvince={handleMapSelect}
                />
            </div>
        </div>

        <ProvincePopup 
            selectedProvince={selectedProvinceId ? provinces.find(p => p.id === selectedProvinceId) : null}
            daimyoStats={daimyoStats} playerDaimyoId={playerDaimyoId} isPlayerTurn={isPlayerTurn} viewingRelationId={viewingRelationId}
            shogunId={shogunId} alliances={alliances} ceasefires={ceasefires} coalition={coalition}
            onClose={() => setSelectedProvinceId(null)}
            onAction={(type, pid) => {
                if (['develop','cultivate','pacify','fortify','market','trade','donate','titles'].includes(type)) handleDomesticAction(type, pid);
                else if (['attack','transport','recruit','train'].includes(type)) handleMilitaryAction(type, pid);
                else handleDiplomacy(type, provinces.find(p=>p.id===pid).ownerId);
            }}
        />

        <ControlPanel 
            lastLog={lastLog} onHistoryClick={() => setModalState({type:'history'})} 
            onEndTurn={() => { setIsPlayerTurn(false); advanceTurn(); }} 
            onCancelSelection={() => { setAttackSourceId(null); setTransportSourceId(null); }}
            isPlayerTurn={isPlayerTurn} hasSelection={attackSourceId || transportSourceId}
            onViewBack={() => setViewingRelationId(null)} viewingRelationId={viewingRelationId}
            onDaimyoList={() => setModalState({type: 'list'})}
        />

        {modalState.type === 'history' && <LogHistoryModal logs={logs} onClose={() => setModalState({type: null})} />}
        {modalState.type === 'list' && <DaimyoListModal provinces={provinces} daimyoStats={daimyoStats} alliances={alliances} ceasefires={ceasefires} relations={relations} playerDaimyoId={playerDaimyoId} coalition={coalition} onClose={() => setModalState({type: null})} onViewOnMap={(id) => { setViewingRelationId(id); setModalState({type:null}); }} />}
        {modalState.type === 'battle' && <BattleScene battleData={modalState.data} onFinish={(res) => {
             const { attacker, defender, attackerAmount } = modalState.data;
             const { attackerRemaining, defenderRemaining } = res;
             const atkLost = attackerAmount - attackerRemaining;
             const atkRecovered = Math.floor(atkLost * 0.3);
             const atkReturning = attackerRemaining + atkRecovered;
             const defLost = defender.troops - defenderRemaining;
             const defRecovered = Math.floor(defLost * 0.3);
             const defFinal = defenderRemaining + defRecovered;

             setProvinces(prev => prev.map(p => {
                 if (p.id === defender.id) {
                     if (defenderRemaining <= 0) return { ...p, ownerId: attacker.ownerId, troops: attackerRemaining, actionsLeft: 0, loyalty: 30, defense: Math.max(0, p.defense - 20) };
                     else return { ...p, troops: defFinal };
                 }
                 if (p.id === attacker.id) {
                     if (defenderRemaining <= 0) return { ...p, troops: p.troops + atkRecovered, actionsLeft: 0 };
                     else return { ...p, troops: p.troops + atkReturning, actionsLeft: 0 };
                 }
                 return p;
             }));
             
             if (defenderRemaining <= 0) showLog(`${DAIMYO_INFO[attacker.ownerId].name}軍が${defender.name}を制圧！`);
             else if (attackerRemaining <= 0) showLog(`${DAIMYO_INFO[attacker.ownerId].name}軍、${defender.name}攻略に失敗。`);
             else showLog(`${DAIMYO_INFO[attacker.ownerId].name}軍、${defender.name}を攻めきれず撤退（引き分け）。`);
             setModalState({ type: null }); 
        }} />}
        {modalState.type === 'troop' && <TroopSelector maxTroops={modalState.data.maxTroops} type={modalState.data.type} onConfirm={handleTroopAction} onCancel={() => setModalState({type: null})} />}
        {modalState.type === 'negotiate' && <NegotiationScene targetDaimyoId={modalState.data.targetId} targetDaimyo={DAIMYO_INFO[modalState.data.targetId]} isAllied={alliances[playerDaimyoId]?.includes(modalState.data.targetId)} onConfirm={(t) => {
            const p = provinces.find(x => x.id === modalState.data.provinceId);
            if (p.actionsLeft <= 0) { showLog("行動力不足"); return; }
            consumeAction(modalState.data.provinceId); 
            
            if(t==='gift') { updateResource(playerDaimyoId, -COSTS.gift.gold, 0); updateRelation(modalState.data.targetId, 10); showLog("贈答を行いました"); }
            if(t==='ceasefire') { updateResource(playerDaimyoId, -300, 0); setCeasefires(prev => ({...prev, [playerDaimyoId]: {...prev[playerDaimyoId], [modalState.data.targetId]: 5}})); showLog("停戦成立"); }
            if(t==='threaten') { showLog("脅迫しました..."); updateRelation(modalState.data.targetId, -20); }
            if(t==='surrender') { showLog("勧告しました..."); }
            if(t==='request_aid') { showLog("援助を要請しました"); }
            if(t==='break_alliance') { showLog("同盟を破棄しました"); setAlliances(prev => ({...prev, [playerDaimyoId]: prev[playerDaimyoId].filter(id => id !== modalState.data.targetId), [modalState.data.targetId]: prev[modalState.data.targetId].filter(id => id !== playerDaimyoId)})); }
            setModalState({type:null});
        }} onCancel={() => setModalState({type: null})} />}
        {modalState.type === 'market' && <MarketModal currentGold={daimyoStats[playerDaimyoId].gold} currentRice={daimyoStats[playerDaimyoId].rice} price={getRiceMarketPrice(turn)} onClose={() => setModalState({type:null})} onTrade={(m, a, c) => {
            updateResource(playerDaimyoId, m==='buy'?-c:c, m==='buy'?a:-a); setModalState({type:null}); showLog("取引完了");
        }} />}
        {modalState.type === 'titles' && <TitlesModal daimyoStats={daimyoStats} provinces={provinces} daimyoId={playerDaimyoId} onClose={() => setModalState({type:null})} onApply={(t) => {
            const p = provinces.find(x => x.id === modalState.data.pid);
            if (p.actionsLeft <= 0) { showLog("行動力不足"); return; }
            consumeAction(modalState.data.pid); 
            updateResource(playerDaimyoId, -COSTS.title_app.gold, 0, t.fameBonus);
            setDaimyoStats(prev => ({...prev, [playerDaimyoId]: {...prev[playerDaimyoId], titles: [...prev[playerDaimyoId].titles, t.name]}}));
            setModalState({type:null}); showLog("役職就任");
        }} onApplyRank={(r) => {
            const p = provinces.find(x => x.id === modalState.data.pid);
            if (p.actionsLeft <= 0) { showLog("行動力不足"); return; }
            consumeAction(modalState.data.pid); 
            updateResource(playerDaimyoId, -COSTS.rank_app.gold, 0, r.fameBonus);
            setDaimyoStats(prev => ({...prev, [playerDaimyoId]: {...prev[playerDaimyoId], rank: r.name}}));
            setModalState({type:null}); showLog("官位叙任");
        }} />}
        {modalState.type === 'donate' && <DonateModal currentGold={daimyoStats[playerDaimyoId].gold} shogunName={DAIMYO_INFO[shogunId]?.name} isShogun={playerDaimyoId===shogunId} onCancel={() => setModalState({type:null})} onConfirm={(tgt, amt, fame) => {
            const p = provinces.find(x => x.id === modalState.data.pid);
            if (p.actionsLeft <= 0) { showLog("行動力不足"); return; }
            consumeAction(modalState.data.pid); 
            updateResource(playerDaimyoId, -amt, 0, fame); setModalState({type:null}); showLog("献金完了");
        }} />}
        {modalState.type === 'trade' && <TradeModal onCancel={() => setModalState({type:null})} onConfirm={(t) => {
            const p = provinces.find(x => x.id === modalState.data.pid);
            if (p.actionsLeft <= 0) { showLog("行動力不足"); return; }
            consumeAction(modalState.data.pid); 
            updateResource(playerDaimyoId, -COSTS.trade.gold, 0); setModalState({type:null}); showLog("貿易完了");
        }} />}

        {gameState !== 'playing' && <GameOverScreen gameState={gameState} onRestart={() => window.location.reload()} />}

        <style>{`.cmd-btn { @apply flex items-center justify-center gap-1 py-2 px-1 rounded border shadow-sm transition-all active:translate-y-0.5 text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed; } .animate-fade-in { animation: fadeIn 0.3s ease-out; } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </div>
  );
};

export default App;
