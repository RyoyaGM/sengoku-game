import React, { useState, useEffect, useRef } from 'react';
import { DAIMYO_INFO } from './data/daimyos';
import { COSTS } from './data/constants';
import { HISTORICAL_EVENTS } from './data/events';
import { getFormattedDate, getRiceMarketPrice } from './utils/helpers';
import { 
  INITIAL_RESOURCES, 
  INITIAL_ALLIANCES, 
  INITIAL_CEASEFIRES, 
  INITIAL_RELATIONS, 
  INITIAL_PROVINCES 
} from './utils/initializers';

import japanMapImg from './assets/japan_map.jpg'; 

// 分割したコンポーネントをインポート
import { StartScreen, ResourceBar, ControlPanel } from './components/UIComponents';
import { GameMap, ProvincePopup } from './components/MapComponents';
import { 
  IncomingRequestModal, LogHistoryModal, MarketModal, TitlesModal, 
  DonateModal, TradeModal, NegotiationScene, DaimyoListModal, 
  TroopSelector, BattleScene, GameOverScreen, HistoricalEventModal 
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

  // 編集モード用のState
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggingProvinceId, setDraggingProvinceId] = useState(null);

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
      if (turn > 1) { 
          showLog(`${getFormattedDate(turn)}になりました。`); 
          
          const occurredEvent = HISTORICAL_EVENTS.find(e => e.trigger(turn, provincesRef.current, daimyoStats));
          if (occurredEvent) {
              setModalState({ type: 'historical_event', data: occurredEvent });
          } else {
              startNewSeason();
          }
      }
  }, [turn]);

  useEffect(() => {
      if (turnOrder.length === 0 || currentTurnIndex === -1) return;
      if (currentTurnIndex >= turnOrder.length) { setTurn(t => t + 1); return; }
      const currentDaimyo = turnOrder[currentTurnIndex];
      if (!provinces.some(p => p.ownerId === currentDaimyo)) { advanceTurn(); return; }
      
      if (currentDaimyo === playerDaimyoId) {
          setIsPlayerTurn(true); showLog(`我が軍の手番です。`);
      } else {
          // ▼ 変更: AIターンの開始待ち時間を短縮 (800ms -> 200ms)
          setIsPlayerTurn(false); setTimeout(() => processAiTurn(currentDaimyo), 200);
      }
  }, [currentTurnIndex, turnOrder]);

  // 3. Helper Logic
  const showLog = (text) => { setLastLog(text); setLogs(prev => [...prev, `${getFormattedDate(turn)}: ${text}`]); };
  
  const updateResource = (id, g, r, f=0, d=0) => {
      setDaimyoStats(prev => ({...prev, [id]: { ...prev[id], gold: Math.max(0,(prev[id].gold||0)+g), rice: Math.max(0,(prev[id].rice||0)+r), fame: Math.max(0,(prev[id].fame||0)+f) }}));
  };
  const updateRelation = (target, diff) => setRelations(prev => ({...prev, [playerDaimyoId]: {...(prev[playerDaimyoId]||{}), [target]: Math.min(100, Math.max(0, (prev[playerDaimyoId]?.[target]||50)+diff))}}));
  const consumeAction = (pid) => setProvinces(prev => prev.map(p => p.id === pid ? { ...p, actionsLeft: Math.max(0, p.actionsLeft - 1) } : p));
  
  const getPlayerActionSource = () => provinces.find(p => p.ownerId === playerDaimyoId && p.actionsLeft > 0);

  const handleEventDecision = (event, choice) => {
      setModalState({ type: null });

      const context = {
          setProvinces,
          updateResource,
          showLog,
          setRelations,
          setDaimyoStats,
          setAlliances,
          setCeasefires
      };

      let nextEvent = null;

      if (choice) {
          if (choice.resolve) {
              nextEvent = choice.resolve(context);
          }
      } else {
          if (event.defaultResolve) {
              nextEvent = event.defaultResolve(context);
          }
      }

      if (nextEvent) {
          setModalState({ type: 'historical_event', data: nextEvent });
      } else {
          setModalState({ type: null });
          startNewSeason();
      }
  };

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
      // ▼ 変更: 季節開始時のターン順決定待ち時間を短縮 (500ms -> 200ms)
      setTimeout(determineTurnOrder, 200);
  };

  const determineTurnOrder = () => {
      const active = Object.keys(DAIMYO_INFO).filter(id => id !== 'Minor' && provincesRef.current.some(p => p.ownerId === id));
      active.sort((a,b) => (daimyoStats[b]?.fame||0) - (daimyoStats[a]?.fame||0));
      setTurnOrder(active); setCurrentTurnIndex(0);
  };

  const advanceTurn = () => { setSelectedProvinceId(null); setAttackSourceId(null); setTransportSourceId(null); setCurrentTurnIndex(prev => prev + 1); };

  // AI Logic
  const processAiTurn = (aiId) => {
      setProvinces(curr => {
          const next = curr.map(p => ({...p}));
          let { gold, rice, fame } = daimyoStats[aiId] || { gold:0, rice:0, fame: 0 };
          const originalGold = gold;
          const originalRice = rice;
          const originalFame = fame;
          
          const strategy = DAIMYO_INFO[aiId]?.strategy || 'balanced';
          
          const params = {
              aggressive: { attackChance: 0.8, recruitThreshold: 400, safetyMargin: 0.4, goldReserve: 300, riceReserve: 300 },
              balanced:   { attackChance: 0.5, recruitThreshold: 500, safetyMargin: 0.8, goldReserve: 1000, riceReserve: 1000 },
              defensive:  { attackChance: 0.2, recruitThreshold: 700, safetyMargin: 1.2, goldReserve: 2000, riceReserve: 2000 },
              ainu:       { attackChance: 0.0, recruitThreshold: 800, safetyMargin: 1.5, goldReserve: 3000, riceReserve: 3000 }
          };
          const prm = params[strategy] || params.balanced;

          const marketPrice = getRiceMarketPrice(turn);
          if (gold > prm.goldReserve * 1.5 && rice < prm.riceReserve) {
              const buyAmount = 200;
              const cost = Math.floor(buyAmount * marketPrice * 1.2);
              if (gold > cost + prm.goldReserve) { gold -= cost; rice += buyAmount; }
          } 
          else if (rice > prm.riceReserve * 1.5 && gold < prm.goldReserve) {
              const sellAmount = 200;
              const gain = Math.floor(sellAmount * marketPrice * 0.8);
              rice -= sellAmount; gold += gain;
          }

          if (aiId === 'Ainu' && Math.random() < 0.25) { 
             const myProv = next.filter(p => p.ownerId === aiId);
             const neighbors = [...new Set(myProv.flatMap(p => p.neighbors))].map(nid => next.find(x => x.id === nid)).filter(n => n && n.ownerId !== aiId);
             if (neighbors.length > 0) {
                 const target = neighbors[Math.floor(Math.random() * neighbors.length)];
                 const targetId = target.ownerId;
                 const isUnreasonable = Math.random() < 0.5;

                 if (targetId === playerDaimyoId) {
                     if (isUnreasonable) {
                         setTimeout(() => setModalState({ type: 'incoming_request', data: { sourceId: 'Ainu', type: 'ainu_demand' } }), 500);
                     } else {
                         setTimeout(() => setModalState({ type: 'incoming_request', data: { sourceId: 'Ainu', type: 'ainu_trade' } }), 500);
                     }
                 } else {
                     if (isUnreasonable) {
                         setRelations(prev => ({
                             ...prev,
                             [aiId]: { ...prev[aiId], [targetId]: Math.max(0, (prev[aiId]?.[targetId]||50) - 20) },
                             [targetId]: { ...prev[targetId], [aiId]: Math.max(0, (prev[targetId]?.[aiId]||50) - 20) }
                         }));
                         showLog(`アイヌが${DAIMYO_INFO[targetId].name}へ圧力をかけ、関係が悪化しました。`);
                     } else {
                         setRelations(prev => ({
                             ...prev,
                             [aiId]: { ...prev[aiId], [targetId]: Math.min(100, (prev[aiId]?.[targetId]||50) + 10) },
                             [targetId]: { ...prev[targetId], [aiId]: Math.min(100, (prev[targetId]?.[aiId]||50) + 10) }
                         }));
                     }
                 }
             }
          }

          const myProvinces = next.filter(p => p.ownerId === aiId);
          
          myProvinces.forEach(p => {
              while (p.actionsLeft > 0) {
                  const neighbors = p.neighbors.map(nid => next.find(x => x.id === nid)).filter(n => n);
                  const enemies = neighbors.filter(n => n.ownerId !== aiId && !alliances[aiId]?.includes(n.ownerId));
                  const isFrontline = enemies.length > 0;

                  const maxThreat = enemies.length > 0 ? Math.max(...enemies.map(e => e.troops)) : 0;
                  const requiredDefense = Math.floor(maxThreat * prm.safetyMargin);
                  
                  const isEmergency = isFrontline && p.troops < requiredDefense;

                  const availableForAttack = Math.max(0, p.troops - requiredDefense);
                  const attackForce = Math.floor(availableForAttack * 0.8);
                  const weakEnemy = enemies.find(e => e.troops < attackForce * 0.9);

                  if (isEmergency && gold >= COSTS.recruit.gold && rice >= COSTS.recruit.rice) {
                      gold -= COSTS.recruit.gold; rice -= COSTS.recruit.rice;
                      p.troops += COSTS.recruit.troops; p.actionsLeft--;
                      continue;
                  }
                  if (isEmergency && p.defense < 30 && gold >= COSTS.fortify.gold) {
                      gold -= COSTS.fortify.gold; p.defense += COSTS.fortify.boost; p.actionsLeft--;
                      continue;
                  }

                  let canAttack = true;
                  if (aiId === 'Ainu' && weakEnemy) {
                      const rel = relations[aiId]?.[weakEnemy.ownerId] ?? 50;
                      if (rel > 20) canAttack = false;
                  }

                  if (weakEnemy && rice >= COSTS.attack.rice + prm.riceReserve && attackForce > 100 && Math.random() < prm.attackChance && canAttack) {
                      rice -= COSTS.attack.rice;
                      p.actionsLeft--;
                      let atk = attackForce; 
                      p.troops -= atk; 
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
                          p.actionsLeft = 0; 
                          continue; 
                      } else {
                          weakEnemy.troops = def;
                          p.troops += Math.floor(atk * 0.5); 
                      }
                  }

                  else if (isFrontline && p.troops < prm.recruitThreshold && gold >= COSTS.recruit.gold + prm.goldReserve && rice >= COSTS.recruit.rice + prm.riceReserve) {
                      gold -= COSTS.recruit.gold; rice -= COSTS.recruit.rice;
                      p.troops += COSTS.recruit.troops; p.actionsLeft--;
                  }

                  else if (gold >= COSTS.develop.gold + prm.goldReserve) {
                      if (Math.random() > 0.5) {
                          gold -= COSTS.develop.gold; p.commerce += COSTS.develop.boost;
                      } else if (gold >= COSTS.cultivate.gold && rice >= COSTS.cultivate.rice + prm.riceReserve) {
                          gold -= COSTS.cultivate.gold; rice -= COSTS.cultivate.rice; p.agriculture += COSTS.cultivate.boost;
                      }
                      p.actionsLeft--;
                  }
                  else if (gold > 5000) { 
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
      // ▼ 変更: AI行動終了後の待機時間を短縮 (800ms -> 200ms)
      setTimeout(advanceTurn, 200);
  };

  const handleWheel = (e) => {
    const scaleAmount = -e.deltaY * 0.001;
    const newScale = Math.min(Math.max(0.2, mapTransform.scale + scaleAmount), 3);
    const ratio = newScale / mapTransform.scale;
    const newX = e.clientX - (e.clientX - mapTransform.x) * ratio;
    const newY = e.clientY - (e.clientY - mapTransform.y) * ratio;
    setMapTransform({ x: newX, y: newY, scale: newScale });
  };

  const handleProvinceDragStart = (pid, e) => {
      setDraggingProvinceId(pid);
  };

  const handleGlobalMouseMove = (e) => {
      if (draggingProvinceId && isEditMode) {
          const deltaX = e.movementX / mapTransform.scale;
          const deltaY = e.movementY / mapTransform.scale;

          setProvinces(prev => prev.map(p => {
              if (p.id === draggingProvinceId) {
                  return { ...p, cx: p.cx + deltaX, cy: p.cy + deltaY };
              }
              return p;
          }));
      } else if (e.buttons === 1) {
          if (Math.abs(e.clientX - dragStartPos.x) > 5 || Math.abs(e.clientY - dragStartPos.y) > 5) {
              setIsDragging(true);
              setMapTransform(p => ({ ...p, x: p.x + e.movementX, y: p.y + e.movementY }));
          }
      }
  };

  const handleGlobalMouseUp = () => {
      setDraggingProvinceId(null);
      setIsDragging(false);
  };

  const exportData = () => {
      const dataStr = `export const SEA_ROUTES = [\n` +
          `    ['usukeshi', 'tsugaru'],\n` +
          `    ['usukeshi', 'sannohe'],\n` +
          `    ['matsumae', 'tsugaru'],\n` +
          `    ['sado', 'kasugayama'],\n` +
          `    ['oki', 'gassan-toda'],\n` +
          `    ['sumoto', 'hyogo'],\n` +
          `    ['sumoto', 'tokushima'],\n` +
          `    ['imabari', 'fukuyama'],\n` +
          `    ['imabari', 'itsukushima'],\n` +
          `    ['imabari', 'funai'],\n` +
          `    ['shimonoseki', 'kokura'],\n` +
          `    ['shimonoseki', 'hakata'],\n` +
          `    ['tsushima', 'iki'],\n` +
          `    ['iki', 'matsuura'],\n` +
          `    ['tanegashima', 'kagoshima'],\n` +
          `    ['tanegashima', 'amami'],\n` +
          `    ['amami', 'shuri']\n` +
          `];\n\n` +
          `export const PROVINCE_DATA_BASE = [\n` + 
          provinces.map(p => {
              const originalCx = Math.round(p.cx / 2);
              const originalCy = Math.round(p.cy / 2);
              const neighborsStr = JSON.stringify(p.neighbors).replace(/"/g, "'");
              
              return `  { id: '${p.id}', name: '${p.name}', ownerId: '${p.ownerId}', troops: ${p.troops}, cx: ${originalCx}, cy: ${originalCy}, neighbors: ${neighborsStr}, commerce: ${p.commerce}, agriculture: ${p.agriculture}, defense: ${p.defense} },`;
          }).join('\n') + 
          `\n];`;
      
      const blob = new Blob([dataStr], { type: 'text/javascript' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'provinces.js';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
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
      if (type === 'attack') { 
          if (playerDaimyoId === 'Ainu') {
             setAttackSourceId(pid); setTransportSourceId(null); setSelectedProvinceId(null); showLog("攻撃目標を選択してください"); 
          } else {
             setAttackSourceId(pid); setTransportSourceId(null); setSelectedProvinceId(null); showLog("攻撃目標を選択してください"); 
          }
      }
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

          if (type === 'attack' && playerDaimyoId === 'Ainu') {
              const targetProv = provinces.find(p => p.id === pid);
              const rel = relations[playerDaimyoId]?.[targetProv.ownerId] ?? 50;
              if (rel > 20) {
                  showLog("関係が悪化していないため攻撃の大義名分がありません(必要関係値:20以下)");
                  setAttackSourceId(null);
                  return;
              }
          }

          setModalState({ type: 'troop', data: { type, sourceId: srcId, targetId: pid, maxTroops: src.troops } });
      } else {
          if (!attackSourceId && !transportSourceId) setSelectedProvinceId(pid === selectedProvinceId ? null : pid);
      }
  };

  const handleDiplomacy = (type, targetDaimyoId) => {
      const playerSource = getPlayerActionSource();
      if (!playerSource) return showLog("行動可能な自国拠点がありません"); 

      if (type === 'alliance') {
         const cost = 500;
         if (daimyoStats[playerDaimyoId].gold < cost) return showLog("金不足");
         updateResource(playerDaimyoId, -cost, 0);
         setAlliances(prev => ({...prev, [playerDaimyoId]: [...(prev[playerDaimyoId]||[]), targetDaimyoId], [targetDaimyoId]: [...(prev[targetDaimyoId]||[]), playerDaimyoId]}));
         showLog("同盟締結"); consumeAction(playerSource.id);
      }
      if (type === 'negotiate') {
          setModalState({ type: 'negotiate', data: { targetId: targetDaimyoId, provinceId: playerSource.id } }); 
      }
  };

  if (!playerDaimyoId) return <StartScreen onSelectDaimyo={setPlayerDaimyoId} />;

  const currentDaimyoId = turnOrder[currentTurnIndex];

  return (
    <div className="relative w-full h-screen overflow-hidden font-sans select-none text-stone-100 flex flex-col items-center justify-center bg-[#0f172a]">
        
        <ResourceBar stats={daimyoStats[playerDaimyoId]} turn={turn} isPlayerTurn={isPlayerTurn} shogunId={shogunId} playerId={playerDaimyoId} coalition={coalition} />

        <div className="absolute top-20 right-4 z-50 flex gap-2">
            <button 
                onClick={() => setIsEditMode(!isEditMode)} 
                className={`px-3 py-1 rounded text-xs font-bold border ${isEditMode ? 'bg-yellow-600 border-yellow-400 text-black' : 'bg-stone-800 border-stone-600 text-white'}`}
            >
                {isEditMode ? '編集終了' : 'マップ編集'}
            </button>
            {isEditMode && (
                <button 
                    onClick={exportData} 
                    className="px-3 py-1 rounded text-xs font-bold bg-blue-600 border border-blue-400 text-white"
                >
                    データ出力(保存)
                </button>
            )}
        </div>

        <div className="relative z-0 w-full h-full overflow-hidden cursor-move" 
             onMouseDown={(e) => { setDragStartPos({x:e.clientX, y:e.clientY}); setIsDragging(false); }}
             onMouseMove={handleGlobalMouseMove} 
             onMouseUp={handleGlobalMouseUp}     
             onWheel={handleWheel}>
            
            <div style={{ transform: `translate(${mapTransform.x}px, ${mapTransform.y}px) scale(${mapTransform.scale})` }} className="absolute origin-top-left transition-transform duration-75">
                
                <div className="absolute top-0 left-0 w-[5600px] h-[8800px] z-0 pointer-events-none">
                    <img src={japanMapImg} alt="日本地図" className="w-full h-full object-cover opacity-50" />
                </div>

                <div className="relative z-10">
                    <GameMap 
                        provinces={provinces} viewingRelationId={viewingRelationId} playerDaimyoId={playerDaimyoId}
                        alliances={alliances} ceasefires={ceasefires} coalition={coalition}
                        selectedProvinceId={selectedProvinceId} attackSourceId={attackSourceId} transportSourceId={transportSourceId}
                        onSelectProvince={handleMapSelect}
                        isEditMode={isEditMode}
                        onProvinceDragStart={handleProvinceDragStart}
                    />
                </div>
            </div>
        </div>

        {!isEditMode && (
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
        )}

        <ControlPanel 
            lastLog={lastLog} onHistoryClick={() => setModalState({type:'history'})} 
            onEndTurn={() => { setIsPlayerTurn(false); advanceTurn(); }} 
            onCancelSelection={() => { setAttackSourceId(null); setTransportSourceId(null); }}
            isPlayerTurn={isPlayerTurn} hasSelection={attackSourceId || transportSourceId}
            onViewBack={() => setViewingRelationId(null)} viewingRelationId={viewingRelationId}
            onDaimyoList={() => setModalState({type: 'list'})}
            currentDaimyoId={currentDaimyoId}
        />
        
        {modalState.type === 'incoming_request' && <IncomingRequestModal request={modalState.data} 
            onAccept={() => {
                if (modalState.data.type === 'ainu_demand') {
                    const cost = 1000;
                    if (daimyoStats[playerDaimyoId].gold >= cost && daimyoStats[playerDaimyoId].rice >= cost) {
                        updateResource(playerDaimyoId, -cost, -cost);
                        updateRelation('Ainu', 10);
                        showLog("アイヌの要求を受け入れました。");
                    } else {
                        showLog("要求された物資が足りません...関係が悪化しました。");
                        updateRelation('Ainu', -30);
                    }
                }
                if (modalState.data.type === 'ainu_trade') {
                    if (daimyoStats[playerDaimyoId].gold >= 500) {
                        updateResource(playerDaimyoId, -500, 500);
                        updateRelation('Ainu', 10);
                        showLog("交易成立：金500を支払い、兵糧500を得ました。");
                    } else {
                        showLog("資金が不足しています。");
                    }
                }
                setModalState({type:null});
            }}
            onReject={() => {
                if (modalState.data.type === 'ainu_demand') {
                    showLog("アイヌの要求を拒否しました。関係が極端に悪化しました！");
                    updateRelation('Ainu', -50);
                }
                if (modalState.data.type === 'ainu_trade') {
                    showLog("交易の申し出を断りました。");
                }
                setModalState({type:null});
            }}
        />}

        {modalState.type === 'historical_event' && (
             <HistoricalEventModal 
               event={modalState.data} 
               daimyoId={playerDaimyoId} 
               onSelect={(choice) => handleEventDecision(modalState.data, choice)} 
             />
        )}

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
                     if (defenderRemaining <= 0) return { ...p, troops: p.troops + atkRecovered };
                     else return { ...p, troops: p.troops + atkReturning };
                 }
                 return p;
             }));
             
             if (defenderRemaining <= 0) showLog(`${DAIMYO_INFO[attacker.ownerId].name}軍が${defender.name}を制圧！`);
             else if (attackerRemaining <= 0) showLog(`${DAIMYO_INFO[attacker.ownerId].name}軍、${defender.name}攻略に失敗。`);
             else showLog(`${DAIMYO_INFO[attacker.ownerId].name}軍、${defender.name}を攻めきれず撤退（引き分け）。`);
             setModalState({ type: null }); 
        }} />}
        {modalState.type === 'troop' && <TroopSelector maxTroops={modalState.data.maxTroops} type={modalState.data.type} onConfirm={handleTroopAction} onCancel={() => setModalState({type: null})} />}
        
        {modalState.type === 'negotiate' && <NegotiationScene targetDaimyoId={modalState.data.targetId} targetDaimyo={DAIMYO_INFO[modalState.data.targetId]} isAllied={alliances[playerDaimyoId]?.includes(modalState.data.targetId)} 
            isPlayerAinu={playerDaimyoId === 'Ainu'}
            onConfirm={(t) => {
            const p = provinces.find(x => x.id === modalState.data.provinceId);
            if (p.actionsLeft <= 0) { showLog("行動力不足"); return; }
            consumeAction(modalState.data.provinceId); 
            
            if(t==='gift') { updateResource(playerDaimyoId, -COSTS.gift.gold, 0); updateRelation(modalState.data.targetId, 10); showLog("贈答を行いました"); }
            if(t==='ceasefire') { updateResource(playerDaimyoId, -300, 0); setCeasefires(prev => ({...prev, [playerDaimyoId]: {...prev[playerDaimyoId], [modalState.data.targetId]: 5}})); showLog("停戦成立"); }
            if(t==='threaten') { showLog("脅迫しました..."); updateRelation(modalState.data.targetId, -20); }
            if(t==='ainu_demand') { 
                showLog("理不尽な圧力をかけました。"); 
                updateRelation(modalState.data.targetId, -30);
                if (Math.random() > 0.4) {
                    showLog("相手は要求を呑みました。(金・兵糧獲得)");
                    updateResource(playerDaimyoId, 1000, 1000);
                } else {
                    showLog("相手は激怒し、要求を拒否しました。");
                }
            }
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