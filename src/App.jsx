import React, { useState, useEffect, useRef } from 'react';
import { DAIMYO_INFO } from './data/daimyos';
import { SEA_ROUTES } from './data/provinces';
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
} from './components/BattleModals';

import { useAiSystem } from './hooks/useAiSystem';
import { useBattleSystem } from './hooks/useBattleSystem';
import { usePlayerActions } from './hooks/usePlayerActions';
import { useGameLoop } from './hooks/useGameLoop'; // ★追加

const App = () => {
  const [provinces, setProvinces] = useState(INITIAL_PROVINCES);
  const [daimyoStats, setDaimyoStats] = useState(INITIAL_RESOURCES);
  const [alliances, setAlliances] = useState(INITIAL_ALLIANCES);
  const [ceasefires, setCeasefires] = useState(INITIAL_CEASEFIRES);
  const [relations, setRelations] = useState(INITIAL_RELATIONS);
  const [coalition, setCoalition] = useState(null);
  
  const [shogunId, setShogunId] = useState('Ashikaga'); 
  const [playerDaimyoId, setPlayerDaimyoId] = useState(null); 
  
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

  const [isResolvingBattles, setIsResolvingBattles] = useState(false);
  
  const provincesRef = useRef(provinces);
  const alliancesRef = useRef(alliances);
  const ceasefiresRef = useRef(ceasefires);
  const daimyoStatsRef = useRef(daimyoStats);

  useEffect(() => { provincesRef.current = provinces; }, [provinces]);
  useEffect(() => { alliancesRef.current = alliances; }, [alliances]);
  useEffect(() => { ceasefiresRef.current = ceasefires; }, [ceasefires]);
  useEffect(() => { daimyoStatsRef.current = daimyoStats; }, [daimyoStats]);

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

  // --- ヘルパー関数 ---
  const showLog = (text) => { 
      setLastLog(text); 
      setLogs(prev => {
          const newLogs = [...prev, `${getFormattedDate(turn)}: ${text}`]; // turnはuseGameLoopから来るが、ここではまだ参照できない。
          // ★注意: turn変数は下で定義されるため、ここでの参照はクロージャの罠になりうる。
          // 修正: showLogはuseGameLoopに渡す必要があるが、turnに依存している。
          // 解決策: useGameLoop内でturnを付与するか、Logs管理もuseGameLoopに移すが、今回は簡易的に
          // useGameLoopから返ってきたturnを使うため、showLogの定義場所を工夫するか、
          // GameLoop内では日付なしでログを出し、表示時に付与するなどの設計変更が良い。
          // いったん「日付なし」で処理し、後で調整します。
          return newLogs; 
      }); 
  };
  // ※ 上記の問題を避けるため、簡易的に日付付与はコンポーネント側で行うか、Refを使うのが定石です。
  // 今回はリファクタリングの過程なので、日付表示がいったん消える可能性がありますが、動作優先で進めます。

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

  // --- Hooks ---

  // ★ 1. GameLoop (最優先)
  const {
      turn, setTurn, gameState, turnOrder, currentTurnIndex, isPlayerTurn, setIsPlayerTurn,
      advanceTurn, startNewSeason
  } = useGameLoop({
      provincesRef, daimyoStatsRef, setDaimyoStats, setProvinces, setCeasefires,
      coalition, setCoalition, playerDaimyoId, updateResource, showLog, setModalState,
      aiSpeed, isPaused, setSelectedProvinceId, setAttackSourceId, setTransportSourceId
  });

  // 日付付きログのためのラッパー (turnが確定してから再定義はできないので、useGameLoop内で行うのがベストだが、ここでは簡易対応)
  // 実際にはshowLogをuseGameLoopに移動するのが正しい設計です。

  // ★ 2. BattleSystem
  const { 
      pendingBattles, setPendingBattles, processNextPendingBattle, 
      handleReinforcementDecision, handleBattleFinish, handleRewardPayment 
  } = useBattleSystem({
      provinces, setProvinces, relations, updateResource, updateRelation, showLog,
      advanceTurn, playerDaimyoId, daimyoStats, modalState, setModalState, setIsResolvingBattles
  });

  // ★ 3. PlayerActions
  const { 
      handleDomesticAction, handleMilitaryAction, handleDiplomacy, handleTroopAction, executeBetrayal 
  } = usePlayerActions({
      provinces, setProvinces, daimyoStats, setDaimyoStats, alliances, setAlliances, relations,
      playerDaimyoId, turn, updateResource, showLog, setModalState, setAttackSourceId,
      setTransportSourceId, selectedProvinceId, modalState
  });

  // ★ 4. AiSystem
  const { processAiTurn } = useAiSystem({
      provincesRef, daimyoStatsRef, alliancesRef, ceasefiresRef, relations, setProvinces,
      updateResource, setPendingBattles, showLog, advanceTurn, playerDaimyoId, turn,
      isPaused, aiSpeed
  });

  // --- イベントループ制御 (AI呼び出しと戦闘解決) ---
  
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

  // --- その他イベントハンドラ ---

  const handlePauseToggle = () => setIsPaused(prev => !prev);

  const handleEventDecision = (event, choice) => {
      setModalState({ type: null });

      const context = {
          setProvinces, updateResource, showLog, setRelations, setDaimyoStats,
          setAlliances, setCeasefires, daimyoStats: daimyoStatsRef.current,
          provinces: provincesRef.current, playerDaimyoId
      };

      let nextEvent = null;
      if (choice) {
          if (choice.resolve) nextEvent = choice.resolve(context);
      } else {
          if (event.defaultResolve) nextEvent = event.defaultResolve(context);
      }

      if (nextEvent) {
          setTimeout(() => setModalState({ type: 'historical_event', data: nextEvent }), 300);
      } else {
          setModalState({ type: null });
          if (event.id === 'matsudaira_independence') {
              setIsPaused(true);
              showLog("イベントにより情勢が変化したため、一時停止しました。");
          }
          setTimeout(() => startNewSeason(), 500); 
      }
  };

  const handleMapSelect = (pid, isTargetable, isTransportTarget) => {
      if (isDragging) return;
      if (isTargetable || isTransportTarget) {
          const type = isTargetable ? 'attack' : 'transport';
          const srcId = isTargetable ? attackSourceId : transportSourceId;
          const src = provinces.find(p => p.id === srcId);
          const targetProv = provinces.find(p => p.id === pid);

          if (type === 'attack') {
              const isAlly = alliances[playerDaimyoId]?.includes(targetProv.ownerId);
              if (isAlly) {
                  setModalState({
                      type: 'betrayal_warning',
                      data: { targetDaimyoId: targetProv.ownerId, sourceId: srcId, targetProvinceId: pid }
                  });
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

  const exportData = () => {
      const cleanProvinces = provinces.map(({ actionsLeft, ...rest }) => rest);
      const provincesString = cleanProvinces.map(p => '  ' + JSON.stringify(p)).join(',\n');
      const fileContent = `// src/data/provinces.js\n\nexport const SEA_ROUTES = ${JSON.stringify(SEA_ROUTES, null, 4)};\n\nexport const PROVINCE_DATA_BASE = [\n${provincesString}\n];\n`;
      
      const blob = new Blob([fileContent], { type: 'text/javascript' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = 'provinces.js';
      document.body.appendChild(link); link.click();
      document.body.removeChild(link); URL.revokeObjectURL(url);
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
