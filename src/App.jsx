import React, { useState, useEffect, useRef } from 'react';
import { DAIMYO_INFO } from './data/daimyos';
import { COSTS } from './data/constants';
import { SEA_ROUTES } from './data/provinces';
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

import { StartScreen, ResourceBar, ControlPanel, SpectatorControls } from './components/UIComponents';
import { GameMap, ProvincePopup } from './components/MapComponents';
import { 
  IncomingRequestModal, LogHistoryModal, MarketModal, TitlesModal, 
  DonateModal, TradeModal, NegotiationScene, DaimyoListModal, 
  TroopSelector, BattleScene, GameOverScreen, HistoricalEventModal 
} from './components/Modals';

import { 
  ReinforcementRequestModal, 
  RewardPaymentModal, 
  BetrayalWarningModal 
} from './components/BattleModals'; //

import { useAiSystem } from './hooks/useAiSystem';

// --- Main App Component ---

const App = () => {
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

  const [aiSpeed, setAiSpeed] = useState(300);
  const [isPaused, setIsPaused] = useState(false);

  const [selectedProvinceId, setSelectedProvinceId] = useState(null);
  const [attackSourceId, setAttackSourceId] = useState(null);
  const [transportSourceId, setTransportSourceId] = useState(null);
  const [viewingRelationId, setViewingRelationId] = useState(null);
  const [mapTransform, setMapTransform] = useState({ x: 0, y: 0, scale: 0.6 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });

  const [isEditMode, setIsEditMode] = useState(false);
  const [draggingProvinceId, setDraggingProvinceId] = useState(null);

  const [modalState, setModalState] = useState({ type: null, data: null }); 
  const [logs, setLogs] = useState([]);
  const [lastLog, setLastLog] = useState('大名を選択して天下統一を目指せ。');

  const [turnOrder, setTurnOrder] = useState([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(-1);
  const [isPlayerTurn, setIsPlayerTurn] = useState(false);
  
  // Ref to access fresh state in closures
  const provincesRef = useRef(provinces);
  const alliancesRef = useRef(alliances);
  const ceasefiresRef = useRef(ceasefires);
  const daimyoStatsRef = useRef(daimyoStats);

  const [pendingBattles, setPendingBattles] = useState([]); 
  const [isResolvingBattles, setIsResolvingBattles] = useState(false);

  const { processAiTurn } = useAiSystem({
      provincesRef,
      daimyoStatsRef,
      alliancesRef,
      ceasefiresRef,
      relations,
      setProvinces,
      updateResource,
      setPendingBattles,
      showLog,
      advanceTurn,
      playerDaimyoId,
      turn,
      isPaused,
      aiSpeed
    });

  useEffect(() => { provincesRef.current = provinces; }, [provinces]);
  useEffect(() => { alliancesRef.current = alliances; }, [alliances]);
  useEffect(() => { ceasefiresRef.current = ceasefires; }, [ceasefires]);
  useEffect(() => { daimyoStatsRef.current = daimyoStats; }, [daimyoStats]);

  // 地図の初期位置を京都（山城）中心に合わせる
  useEffect(() => {
      const kyoto = provinces.find(p => p.id === 'kyoto' || p.id === 'yamashiro');
      if (kyoto) {
          const initialScale = 0.6; 
          const screenW = window.innerWidth;
          const screenH = window.innerHeight;
          const newX = (screenW / 2) - (kyoto.cx * initialScale);
          const newY = (screenH / 2) - (kyoto.cy * initialScale);
          setMapTransform({ x: newX, y: newY, scale: initialScale });
      }
  }, []); 

  const checkElimination = () => {
      setDaimyoStats(prev => {
          let hasChange = false;
          const next = { ...prev };
          Object.keys(next).forEach(id => {
              if (id === 'Minor') return;
              const hasLand = provincesRef.current.some(p => p.ownerId === id);
              if (!hasLand && next[id].isAlive !== false) {
                  next[id] = { ...next[id], isAlive: false };
                  hasChange = true;
              }
          });
          return hasChange ? next : prev;
      });
  };

  useEffect(() => {
    checkElimination();

    if (!playerDaimyoId || playerDaimyoId === 'SPECTATOR') return;

    const playerStats = daimyoStats[playerDaimyoId];
    const playerCount = provinces.filter(p => p.ownerId === playerDaimyoId).length;
    
    if (playerCount === provinces.length) {
        setGameState('won');
    }
    else if ((playerStats && playerStats.isAlive === false) || (playerCount === 0 && turn > 0)) {
        setGameState('lost');
    }
  }, [provinces, daimyoStats, playerDaimyoId]); 

  useEffect(() => { if (playerDaimyoId && turnOrder.length === 0) startNewSeason(); }, [playerDaimyoId]);
  
  useEffect(() => {
      if (turn > 1) { 
          showLog(`${getFormattedDate(turn)}になりました。`); 
          
          const occurredEvent = HISTORICAL_EVENTS.find(e => e.trigger(turn, provincesRef.current, daimyoStatsRef.current));
          if (occurredEvent) {
              setModalState({ type: 'historical_event', data: occurredEvent });
          } else {
              startNewSeason();
          }
      }
  }, [turn]);

  useEffect(() => {
      if (turnOrder.length === 0 || currentTurnIndex === -1 || isResolvingBattles) return;
      
      if (pendingBattles.length > 0) {
          setIsResolvingBattles(true);
          processNextPendingBattle();
          return;
      }

      if (currentTurnIndex >= turnOrder.length) { setTurn(t => t + 1); return; }
      
      const currentDaimyo = turnOrder[currentTurnIndex];
      if (daimyoStats[currentDaimyo] && daimyoStats[currentDaimyo].isAlive === false) { 
          advanceTurn(); 
          return; 
      }
      
      if (currentDaimyo === playerDaimyoId) {
          setIsPlayerTurn(true); showLog(`我が軍の手番です。`);
      } else {
          setIsPlayerTurn(false);
          if (!isPaused) {
              setTimeout(() => processAiTurn(currentDaimyo), aiSpeed);
          }
      }
  }, [currentTurnIndex, turnOrder, isPaused, pendingBattles.length, isResolvingBattles]); 

  const showLog = (text) => { 
      setLastLog(text); 
      setLogs(prev => {
          const newLogs = [...prev, `${getFormattedDate(turn)}: ${text}`];
          if (newLogs.length > 100) return newLogs.slice(newLogs.length - 100);
          return newLogs;
      }); 
  };
  
  const updateResource = (id, g, r, f=0, d=0) => {
      setDaimyoStats(prev => {
          if (!prev[id]) return prev; 
          return {
              ...prev, 
              [id]: { 
                  ...prev[id], 
                  gold: Math.max(0,(prev[id].gold||0)+g), 
                  rice: Math.max(0,(prev[id].rice||0)+r), 
                  fame: Math.max(0,(prev[id].fame||0)+f) 
              }
          };
      });
  };
  const updateRelation = (target, diff) => setRelations(prev => ({...prev, [playerDaimyoId]: {...(prev[playerDaimyoId]||{}), [target]: Math.min(100, Math.max(0, (prev[playerDaimyoId]?.[target]||50)+diff))}}));
  const consumeAction = (pid) => setProvinces(prev => prev.map(p => p.id === pid ? { ...p, actionsLeft: Math.max(0, p.actionsLeft - 1) } : p));
  
  const getPlayerActionSource = () => provinces.find(p => p.ownerId === playerDaimyoId && p.actionsLeft > 0);

  const handlePauseToggle = () => setIsPaused(prev => !prev);

  const handleEventDecision = (event, choice) => {
      setModalState({ type: null });

      const context = {
          setProvinces,
          updateResource,
          showLog,
          setRelations,
          setDaimyoStats,
          setAlliances,
          setCeasefires,
          daimyoStats: daimyoStatsRef.current,
          provinces: provincesRef.current,
          playerDaimyoId
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
          setTimeout(() => {
              setModalState({ type: 'historical_event', data: nextEvent });
          }, 300);
      } else {
          setModalState({ type: null });
          
          if (event.id === 'matsudaira_independence') {
              setIsPaused(true);
              showLog("イベントにより情勢が変化したため、一時停止しました。");
          }

          setTimeout(() => {
              startNewSeason();
          }, 500); 
      }
  };

  const startNewSeason = () => {
      checkElimination();

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
          if (daimyoStats[id] && daimyoStats[id].isAlive === false) return;

          const owned = provincesRef.current.filter(p => p.ownerId === id);
          if (owned.length) {
              const commerceIncome = Math.floor(owned.reduce((s,p)=>s+p.commerce,0) * 1.2); 
              const agIncome = isAutumn ? Math.floor(owned.reduce((s,p)=>s+p.agriculture,0) * 2.0) : 0; 
              updateResource(id, commerceIncome, agIncome);
          }
      });
      if (!isPaused) setTimeout(determineTurnOrder, aiSpeed);
  };

  const determineTurnOrder = () => {
      const active = Object.keys(DAIMYO_INFO).filter(id => {
          if (id === 'Minor') return false;
          return daimyoStats[id]?.isAlive !== false;
      });
      active.sort((a,b) => (daimyoStats[b]?.fame||0) - (daimyoStats[a]?.fame||0));
      setTurnOrder(active); setCurrentTurnIndex(0);
  };

  const advanceTurn = () => { setSelectedProvinceId(null); setAttackSourceId(null); setTransportSourceId(null); setCurrentTurnIndex(prev => prev + 1); };

  const processNextPendingBattle = () => {
      if (pendingBattles.length === 0) {
          setIsResolvingBattles(false);
          advanceTurn(); 
          return;
      }
      const battle = pendingBattles[0]; 
      const defenderProv = provinces.find(p => p.id === battle.defender.id);
      const neighbors = defenderProv.neighbors.map(nid => provinces.find(p => p.id === nid));
      const potentialAllies = neighbors
          .filter(n => n.ownerId !== playerDaimyoId && n.ownerId !== battle.attackerId) 
          .map(n => ({ id: n.ownerId, name: DAIMYO_INFO[n.ownerId].name }))
          .filter((v,i,a) => a.findIndex(t=>(t.id === v.id)) === i); 

      setModalState({ type: 'reinforcement_request', data: { battle, potentialAllies } });
  };

  const handleReinforcementDecision = (allyId) => {
      const { battle } = modalState.data;
      let allyTroops = 0;
      let allyName = null;
      let isSuccess = false;

      if (allyId) {
          const rel = relations[playerDaimyoId]?.[allyId] || 50;
          const successChance = rel / 100; 
          if (Math.random() < successChance) {
              isSuccess = true;
              allyName = DAIMYO_INFO[allyId].name;
              allyTroops = 500; 
              showLog(`${allyName}が援軍要請に応じました！ (兵+${allyTroops})`);
              updateRelation(allyId, 5); 
          } else {
              showLog(`${DAIMYO_INFO[allyId].name}に援軍を断られました...`);
              updateRelation(allyId, -5);
          }
      }

      setModalState({ 
          type: 'battle', 
          data: { 
              attacker: battle.attacker, 
              defender: { ...battle.defender, troops: battle.defender.troops + allyTroops }, 
              attackerAmount: battle.attackerAmount,
              originalDefenderTroops: battle.defender.troops,
              reinforcement: isSuccess ? { allyId, troops: allyTroops, cost: 500 } : null 
          } 
      });
  };

  const handleBattleFinish = (res) => {
      const { attacker, defender, attackerAmount, reinforcement } = modalState.data;
      const { attackerRemaining, defenderRemaining } = res;

      setProvinces(prev => prev.map(p => {
             if (p.id === defender.id) {
                 if (defenderRemaining <= 0) return { ...p, ownerId: attacker.ownerId, troops: attackerRemaining, actionsLeft: 0, loyalty: 30, defense: Math.max(0, p.defense - 20) };
                 else return { ...p, troops: Math.max(0, defenderRemaining - (reinforcement ? reinforcement.troops : 0)) };
             }
             return p;
      }));
      
      if (defenderRemaining <= 0) {
         const attackerName = DAIMYO_INFO[attacker.ownerId]?.name || attacker.ownerId;
         showLog(`${attackerName}軍が${defender.name}を制圧！`);
         updateResource(attacker.ownerId, 0, 0, 5); 
         
         const defenderInfo = DAIMYO_INFO[defender.ownerId];
         if (defenderInfo && defenderInfo.homeProvinceId === defender.id) {
             updateResource(defender.ownerId, 0, 0, -10);
             showLog(`${defenderInfo.name}家、本拠地陥落...名声失墜！`);
         } else {
             updateResource(defender.ownerId, 0, 0, -5); 
         }
      } else if (attackerRemaining <= 0) {
         const attackerName = DAIMYO_INFO[attacker.ownerId]?.name || attacker.ownerId;
         showLog(`${attackerName}軍、${defender.name}攻略に失敗。`);
         updateResource(attacker.ownerId, 0, 0, -5); 
         updateResource(defender.ownerId, 0, 0, 5); 
      } else {
         const attackerName = DAIMYO_INFO[attacker.ownerId]?.name || attacker.ownerId;
         showLog(`${attackerName}軍、${defender.name}を攻めきれず撤退（引き分け）。`);
         updateResource(attacker.ownerId, 0, 0, -5); 
         updateResource(defender.ownerId, 0, 0, 5); 
      }

      setPendingBattles(prev => prev.slice(1));

      if (defenderRemaining > 0 && reinforcement && defender.ownerId === playerDaimyoId) {
          setModalState({ type: 'reward_payment', data: { allyId: reinforcement.allyId, amount: reinforcement.cost } });
      } else {
          setModalState({ type: null }); 
          // ★修正: 戦闘終了後、未解決戦闘がなければ処理中フラグを下ろす（useEffectで次の進行へ）
          setIsResolvingBattles(false);
      }
  };

  const handleRewardPayment = (pay) => {
      const { allyId, amount } = modalState.data;
      if (pay) {
          if (daimyoStats[playerDaimyoId].gold >= amount) {
              updateResource(playerDaimyoId, -amount, 0);
              updateRelation(allyId, 10); 
              showLog(`${DAIMYO_INFO[allyId].name}に報酬を支払いました。関係が深まりました。`);
          } else {
              showLog(`資金不足で報酬を払えませんでした... ${DAIMYO_INFO[allyId].name}との関係が悪化しました。`);
              updateRelation(allyId, -20);
          }
      } else {
          showLog(`報酬を支払いませんでした。${DAIMYO_INFO[allyId].name}は激怒しています！`);
          updateRelation(allyId, -50);
      }
      setModalState({ type: null });
      // ★修正: 報酬支払い後、戦闘処理完了としてフラグを下ろす
      setIsResolvingBattles(false);
  };

  // --- 追加: 裏切り実行処理 ---
  const executeBetrayal = (targetId, sourceId) => {
      setModalState({ type: null });
      
      // 1. 同盟破棄
      setAlliances(prev => {
          const next = { ...prev };
          if (next[playerDaimyoId]) next[playerDaimyoId] = next[playerDaimyoId].filter(id => id !== targetId);
          if (next[targetId]) next[targetId] = next[targetId].filter(id => id !== playerDaimyoId);
          return next;
      });

      // 2. ペナルティ適用
      // 名声 -50
      updateResource(playerDaimyoId, 0, 0, -50);
      
      // 交渉禁止 (5年間 = 20ターン)
      setDaimyoStats(prev => ({
          ...prev,
          [playerDaimyoId]: {
              ...prev[playerDaimyoId],
              diplomacyBanUntil: turn + 20 
          }
      }));

      // 民忠低下 (自国全土 -20)
      setProvinces(prev => prev.map(p => {
          if (p.ownerId === playerDaimyoId) {
              return { ...p, loyalty: Math.max(0, (p.loyalty || 50) - 20) };
          }
          return p;
      }));

      showLog(`【裏切り】${DAIMYO_INFO[targetId].name}家との同盟を破棄し攻撃を開始しました！名声が失墜し、民忠が低下しました。`);

      // 3. 戦闘開始 (選択済みのソースIDを使って)
      const amount = modalState.data?.maxTroops || 0; // 一時保存していた兵数などがあれば使うが、ここは簡易的に
      // 実際はTroopSelectorを経てきているはずなので、再度TroopSelectorを開くか、攻撃処理を続行する
      // ここでは、TroopSelectorを再度開く形にする（攻撃先は確定済み）
      // ただし、handleTroopActionを呼ぶためにはmodalStateが必要。
      // なので、一度モーダルを閉じた後、TroopSelectorをtype='attack'で開く。
      // しかし、handleMapSelectの時点ではまだソースも決まっていない可能性があるため、
      // 警告 -> OK -> 通常の攻撃選択フローへ戻すのが綺麗。
      
      // ここでは「OK」を押したら、そのまま「部隊選択画面」に進むようにする
      const src = provinces.find(p => p.id === sourceId);
      setModalState({ 
          type: 'troop', 
          data: { 
              type: 'attack', 
              sourceId: sourceId, 
              targetId: provinces.find(p => p.ownerId === targetId && p.id === selectedProvinceId).id, 
              maxTroops: src.troops 
          } 
      });
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
          
          let enemyReinforcement = 0;
          const enemyId = tgt.ownerId;
          const enemyNeighbors = tgt.neighbors.map(nid => provinces.find(p => p.id === nid));
          const enemyAllies = enemyNeighbors.filter(n => alliances[enemyId]?.includes(n.ownerId) && n.ownerId !== enemyId);
          
          if (enemyAllies.length > 0 && Math.random() < 0.5) {
               const ally = enemyAllies[0];
               enemyReinforcement = 300; 
               const allyName = DAIMYO_INFO[ally.ownerId].name;
               showLog(`敵軍、${allyName}より援軍(${enemyReinforcement})到着！`);
          }

          setModalState({ 
              type: 'battle', 
              data: { attacker: src, defender: { ...tgt, troops: tgt.troops + enemyReinforcement }, attackerAmount: amount, isPlayerAttack: true } 
          });
      }
      setAttackSourceId(null); setTransportSourceId(null);
  };

  const handleMapSelect = (pid, isTargetable, isTransportTarget) => {
      if (isDragging) return;
      if (isTargetable || isTransportTarget) {
          const type = isTargetable ? 'attack' : 'transport';
          const srcId = isTargetable ? attackSourceId : transportSourceId;
          const src = provinces.find(p => p.id === srcId);
          const targetProv = provinces.find(p => p.id === pid);

          // ★修正: 攻撃かつ同盟国の場合、警告を表示
          if (type === 'attack') {
              const isAlly = alliances[playerDaimyoId]?.includes(targetProv.ownerId);
              if (isAlly) {
                  setModalState({
                      type: 'betrayal_warning',
                      data: {
                          targetDaimyoId: targetProv.ownerId,
                          sourceId: srcId, // ソースIDを保存しておく
                          targetProvinceId: pid
                      }
                  });
                  // 選択状態はいったん解除しない（モーダルキャンセル時に戻れるように）
                  return; 
              }
          }

          if (type === 'attack' && playerDaimyoId === 'Ainu') {
              const rel = relations[playerDaimyoId]?.[targetProv.ownerId] ?? 50;
              if (rel > 20) {
                  showLog("関係が悪化していないため攻撃の大義名分がありません(必要関係値:20以下)");
                  setAttackSourceId(null); return;
              }
          }
          setModalState({ type: 'troop', data: { type, sourceId: srcId, targetId: pid, maxTroops: src.troops } });
      } else {
          if (!attackSourceId && !transportSourceId) setSelectedProvinceId(pid === selectedProvinceId ? null : pid);
      }
  };

  const handleDiplomacy = (type, targetDaimyoId) => {
      // ★追加: 交渉禁止期間チェック
      const banUntil = daimyoStats[playerDaimyoId]?.diplomacyBanUntil || 0;
      if (turn < banUntil) {
          return showLog(`信義を失ったため、他国は交渉に応じてくれません (残り${banUntil - turn}ターン)`);
      }

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

  const handleDomesticAction = (type, pid) => {
      const p = provinces.find(pr => pr.id === pid);
      if (p.actionsLeft <= 0 && type !== 'market' && type !== 'titles') return showLog("行動力がありません");

      if (type === 'market') return setModalState({ type: 'market' });
      if (type === 'titles') return setModalState({ type: 'titles' });
      if (type === 'donate') return setModalState({ type: 'donate' });
      if (type === 'trade') return setModalState({ type: 'trade' });

      const cost = COSTS[type];
      const stats = daimyoStats[playerDaimyoId];
      if (stats.gold < cost.gold || stats.rice < (cost.rice||0)) return showLog("資源不足");

      updateResource(playerDaimyoId, -cost.gold, -(cost.rice||0));
      consumeAction(pid);

      setProvinces(prev => prev.map(pr => {
          if (pr.id !== pid) return pr;
          const next = { ...pr };
          if (type === 'develop') next.commerce += cost.boost;
          if (type === 'cultivate') next.agriculture += cost.boost;
          if (type === 'fortify') next.defense += cost.boost;
          if (type === 'pacify') next.loyalty = Math.min(100, (next.loyalty||50) + cost.boost);
          return next;
      }));
      showLog(`${DAIMYO_INFO[playerDaimyoId].name}家、${p.name}にて${type==='develop'?'商業発展':type==='cultivate'?'開墾':type==='fortify'?'普請':type==='pacify'?'施し':''}を行いました。`);
  };

  const handleMilitaryAction = (type, pid) => {
      const p = provinces.find(pr => pr.id === pid);
      if (p.actionsLeft <= 0) return showLog("行動力がありません");

      if (type === 'attack') {
          setAttackSourceId(pid);
          showLog("攻撃目標を選択してください");
          setSelectedProvinceId(null);
          return;
      }
      if (type === 'transport') {
          setTransportSourceId(pid);
          showLog("輸送先を選択してください");
          setSelectedProvinceId(null);
          return;
      }

      const cost = COSTS[type];
      const stats = daimyoStats[playerDaimyoId];
      if (stats.gold < cost.gold || stats.rice < (cost.rice||0)) return showLog("資源不足");

      updateResource(playerDaimyoId, -cost.gold, -(cost.rice||0));
      consumeAction(pid);

      setProvinces(prev => prev.map(pr => {
          if (pr.id !== pid) return pr;
          const next = { ...pr };
          if (type === 'recruit') {
              next.troops += cost.troops;
              next.loyalty = Math.max(0, (next.loyalty||50) - 5);
          }
          if (type === 'train') next.training = Math.min(100, (next.training||50) + cost.boost);
          return next;
      }));
      showLog(`${type==='recruit'?'徴兵':'訓練'}を行いました。`);
  };

  const exportData = () => {
      // 一時的なプロパティ(actionsLeft)を除外して保存用データを作成
      const cleanProvinces = provinces.map(({ actionsLeft, ...rest }) => rest);
      
      // 各都市データを1行のJSON文字列に変換し、カンマと改行で結合
      const provincesString = cleanProvinces
          .map(p => '  ' + JSON.stringify(p))
          .join(',\n');

      const fileContent = `// src/data/provinces.js

export const SEA_ROUTES = ${JSON.stringify(SEA_ROUTES, null, 4)};

export const PROVINCE_DATA_BASE = [
${provincesString}
];
`;
      
      // Blobを作成してダウンロードリンクを生成・実行
      const blob = new Blob([fileContent], { type: 'text/javascript' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'provinces.js';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert("provinces.jsをダウンロードしました。");
  };

  const handleWheel = (e) => {
    const scaleAmount = -e.deltaY * 0.001;
    const newScale = Math.min(Math.max(0.2, mapTransform.scale + scaleAmount), 3);
    const ratio = newScale / mapTransform.scale;
    const newX = e.clientX - (e.clientX - mapTransform.x) * ratio;
    const newY = e.clientY - (e.clientY - mapTransform.y) * ratio;
    setMapTransform({ x: newX, y: newY, scale: newScale });
  };

  const handleGlobalMouseMove = (e) => {
      if (draggingProvinceId && isEditMode) {
          const deltaX = e.movementX / mapTransform.scale;
          const deltaY = e.movementY / mapTransform.scale;
          setProvinces(prev => prev.map(p => {
              if (p.id === draggingProvinceId) return { ...p, cx: p.cx + deltaX, cy: p.cy + deltaY };
              return p;
          }));
      } else if (e.buttons === 1) {
          if (Math.abs(e.clientX - dragStartPos.x) > 5 || Math.abs(e.clientY - dragStartPos.y) > 5) {
              setIsDragging(true);
              setMapTransform(p => ({ ...p, x: p.x + e.movementX, y: p.y + e.movementY }));
          }
      }
  };

  if (!playerDaimyoId) return <StartScreen onSelectDaimyo={setPlayerDaimyoId} />;

  const currentDaimyoId = turnOrder[currentTurnIndex];

  return (
    <div className="relative w-full h-screen overflow-hidden font-sans select-none text-stone-100 flex flex-col items-center justify-center bg-[#0f172a]">
        
        <ResourceBar stats={daimyoStats[playerDaimyoId]} turn={turn} isPlayerTurn={isPlayerTurn} shogunId={shogunId} playerId={playerDaimyoId} coalition={coalition} />

        <div className="absolute top-20 left-4 z-50">
            <SpectatorControls aiSpeed={aiSpeed} onSpeedChange={setAiSpeed} isPaused={isPaused} onPauseToggle={handlePauseToggle} />
        </div>

        <div className="absolute top-20 right-4 z-50 flex gap-2">
            <button onClick={() => setIsEditMode(!isEditMode)} className={`px-3 py-1 rounded text-xs font-bold border ${isEditMode ? 'bg-yellow-600 border-yellow-400 text-black' : 'bg-stone-800 border-stone-600 text-white'}`}>{isEditMode ? '編集終了' : 'マップ編集'}</button>
            {isEditMode && (<button onClick={exportData} className="px-3 py-1 rounded text-xs font-bold bg-blue-600 border border-blue-400 text-white">データ出力(保存)</button>)}
        </div>

        <div className="relative z-0 w-full h-full overflow-hidden cursor-move" 
             onMouseDown={(e) => { setDragStartPos({x:e.clientX, y:e.clientY}); setIsDragging(false); }}
             onMouseMove={handleGlobalMouseMove} 
             onMouseUp={() => { setDraggingProvinceId(null); setIsDragging(false); }}     
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
                        onSelectProvince={handleMapSelect} isEditMode={isEditMode} onProvinceDragStart={setDraggingProvinceId}
                    />
                </div>
            </div>
        </div>

        {selectedProvinceId && (
            <ProvincePopup 
                selectedProvince={selectedProvinceId ? provinces.find(p => p.id === selectedProvinceId) : null}
                daimyoStats={daimyoStats} playerDaimyoId={playerDaimyoId} isPlayerTurn={isPlayerTurn} viewingRelationId={viewingRelationId}
                shogunId={shogunId} alliances={alliances} ceasefires={ceasefires} coalition={coalition}
                onClose={() => setSelectedProvinceId(null)}
                isEditMode={isEditMode}
                onAction={(type, pid, val) => {
                    if (type === 'change_owner') {
                         setProvinces(prev => prev.map(p => p.id === pid ? { ...p, ownerId: val } : p));
                         return;
                    }
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
            currentDaimyoId={currentDaimyoId} isPaused={isPaused}
        />
        
        {modalState.type === 'reinforcement_request' && <ReinforcementRequestModal attacker={modalState.data.battle.attacker} defender={modalState.data.battle.defender} potentialAllies={modalState.data.potentialAllies} relations={relations} onConfirm={handleReinforcementDecision} />}
        {modalState.type === 'reward_payment' && <RewardPaymentModal allyId={modalState.data.allyId} amount={modalState.data.amount} onPay={() => handleRewardPayment(true)} onRefuse={() => handleRewardPayment(false)} />}
        
        {/* 追加: 裏切り警告モーダル */}
        {modalState.type === 'betrayal_warning' && (
            <BetrayalWarningModal 
                targetDaimyoId={modalState.data.targetDaimyoId} 
                onConfirm={() => executeBetrayal(modalState.data.targetDaimyoId, modalState.data.sourceId)} 
                onCancel={() => { setModalState({ type: null }); setAttackSourceId(null); }} 
            />
        )}

        {modalState.type === 'battle' && <BattleScene battleData={modalState.data} onFinish={handleBattleFinish} />}
        {modalState.type === 'incoming_request' && <IncomingRequestModal request={modalState.data} onAccept={() => { setModalState({type:null}); }} onReject={() => { setModalState({type:null}); }} />}
        {modalState.type === 'historical_event' && <HistoricalEventModal event={modalState.data} daimyoId={playerDaimyoId} onSelect={(choice) => handleEventDecision(modalState.data, choice)} />}
        {modalState.type === 'history' && <LogHistoryModal logs={logs} onClose={() => setModalState({type: null})} />}
        {modalState.type === 'list' && <DaimyoListModal provinces={provinces} daimyoStats={daimyoStats} alliances={alliances} ceasefires={ceasefires} relations={relations} playerDaimyoId={playerDaimyoId} coalition={coalition} onClose={() => setModalState({type: null})} onViewOnMap={(id) => { setViewingRelationId(id); setModalState({type:null}); }} />}
        {modalState.type === 'troop' && <TroopSelector maxTroops={modalState.data.maxTroops} type={modalState.data.type} onConfirm={handleTroopAction} onCancel={() => setModalState({type: null})} />}
        {modalState.type === 'negotiate' && <NegotiationScene targetDaimyoId={modalState.data.targetId} targetDaimyo={DAIMYO_INFO[modalState.data.targetId]} isAllied={alliances[playerDaimyoId]?.includes(modalState.data.targetId)} isPlayerAinu={playerDaimyoId === 'Ainu'} onConfirm={(t) => { setModalState({type:null}); }} onCancel={() => setModalState({type: null})} />}
        {modalState.type === 'market' && <MarketModal currentGold={daimyoStats[playerDaimyoId].gold} currentRice={daimyoStats[playerDaimyoId].rice} price={getRiceMarketPrice(turn)} onClose={() => setModalState({type:null})} onTrade={(m, a, c) => { updateResource(playerDaimyoId, m==='buy'?-c:c, m==='buy'?a:-a); setModalState({type:null}); showLog("取引完了"); }} />}
        {modalState.type === 'titles' && <TitlesModal daimyoStats={daimyoStats} provinces={provinces} daimyoId={playerDaimyoId} onClose={() => setModalState({type:null})} onApply={(t) => { setModalState({type:null}); showLog("役職就任"); }} onApplyRank={(r) => { setModalState({type:null}); showLog("官位叙任"); }} />}
        {modalState.type === 'donate' && <DonateModal currentGold={daimyoStats[playerDaimyoId].gold} shogunName={DAIMYO_INFO[shogunId]?.name} isShogun={playerDaimyoId===shogunId} onCancel={() => setModalState({type:null})} onConfirm={(tgt, amt, fame) => { setModalState({type:null}); showLog("献金完了"); }} />}
        {modalState.type === 'trade' && <TradeModal onCancel={() => setModalState({type:null})} onConfirm={(t) => { setModalState({type:null}); showLog("貿易完了"); }} />}

        {gameState !== 'playing' && <GameOverScreen gameState={gameState} onRestart={() => window.location.reload()} />}

    </div>
  );
};

export default App;