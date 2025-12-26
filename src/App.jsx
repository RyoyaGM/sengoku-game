// src/App.jsx
import React, { useState, useEffect, useRef } from 'react';
import { DAIMYO_INFO } from './data/daimyos';
import { getRiceMarketPrice, getFormattedDate } from './utils/helpers';
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

// ★修正: Modalsのインポート元を正しく分割
import { 
  IncomingRequestModal, LogHistoryModal, MarketModal, TitlesModal, 
  DonateModal, TradeModal, NegotiationScene, DaimyoListModal, 
  TroopSelector, BattleScene, GameOverScreen, HistoricalEventModal
} from './components/Modals';

import { 
  ReinforcementRequestModal, RewardPaymentModal, BetrayalWarningModal, TacticSelectionModal 
} from './components/BattleModals';

import { useAiSystem } from './hooks/useAiSystem';
import { useBattleSystem } from './hooks/useBattleSystem';
import { usePlayerActions } from './hooks/usePlayerActions';
import { useGameLoop } from './hooks/useGameLoop';
import { useMapControls } from './hooks/useMapControls';

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

  const updateResource = (id, g, r, f=0) => {
      setDaimyoStats(prev => {
          if (!prev[id]) return prev; 
          return { ...prev, [id]: { ...prev[id], fame: Math.max(0, (prev[id].fame||0)+f) } };
      });
  };

  const updateRelation = (target, diff) => setRelations(prev => ({...prev, [playerDaimyoId]: {...(prev[playerDaimyoId]||{}), [target]: Math.min(100, Math.max(0, (prev[playerDaimyoId]?.[target]||50)+diff))}}));

  const {
      mapTransform, isDragging, isEditMode, setIsEditMode, setDraggingProvinceId,
      handleWheel, handleMouseDown, handleGlobalMouseMove, handleMouseUp, exportData
  } = useMapControls({ provinces, setProvinces });

  const {
      turn, setTurn, gameState, turnOrder, currentTurnIndex, isPlayerTurn, setIsPlayerTurn,
      advanceTurn, startNewSeason, showLog
  } = useGameLoop({
      provincesRef, daimyoStatsRef, setDaimyoStats, setProvinces, setCeasefires,
      coalition, setCoalition, playerDaimyoId, updateResource, setModalState,
      aiSpeed, isPaused, setSelectedProvinceId, setAttackSourceId, setTransportSourceId,
      setLogs, setLastLog
  });

  const { 
      pendingBattles, setPendingBattles, processNextPendingBattle, 
      handleReinforcementDecision, handleBattleFinish, handleRewardPayment,
      handleTacticSelection
  } = useBattleSystem({
      provinces, setProvinces, relations, updateResource, updateRelation, showLog,
      advanceTurn, playerDaimyoId, daimyoStats, modalState, setModalState, setIsResolvingBattles,
      turn
  });

  const { 
      handleDomesticAction, handleMilitaryAction, handleDiplomacy, executeBetrayal, handleTroopAction
  } = usePlayerActions({
      provinces, setProvinces, daimyoStats, setDaimyoStats, alliances, setAlliances, relations,
      playerDaimyoId, turn, updateResource, showLog, setModalState, setAttackSourceId,
      setTransportSourceId, selectedProvinceId, modalState,
      setPendingBattles 
  });

  const { processAiTurn } = useAiSystem({
      provincesRef, daimyoStatsRef, alliancesRef, ceasefiresRef, relations, setProvinces,
      updateResource, setPendingBattles, showLog, advanceTurn, playerDaimyoId, turn,
      isPaused, aiSpeed
  });

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

  const handlePauseToggle = () => setIsPaused(prev => !prev);
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

  if (!playerDaimyoId) return <StartScreen onSelectDaimyo={setPlayerDaimyoId} />;

  const playerProvinces = provinces.filter(p => p.ownerId === playerDaimyoId);
  const totalGold = playerProvinces.reduce((s, p) => s + p.gold, 0);
  const totalRice = playerProvinces.reduce((s, p) => s + p.rice, 0);
  const displayStats = { ...daimyoStats[playerDaimyoId], gold: totalGold, rice: totalRice };

  return (
    <div className="relative w-full h-screen overflow-hidden font-sans select-none text-stone-100 flex flex-col items-center justify-center bg-[#0f172a]">
        <ResourceBar stats={displayStats} turn={turn} isPlayerTurn={isPlayerTurn} shogunId={shogunId} playerId={playerDaimyoId} coalition={coalition} />
        <div className="absolute top-20 left-4 z-50">
            <SpectatorControls aiSpeed={aiSpeed} onSpeedChange={setAiSpeed} isPaused={isPaused} onPauseToggle={handlePauseToggle} />
        </div>
        <div className="absolute top-20 right-4 z-50 flex gap-2">
            <button onClick={() => setIsEditMode(!isEditMode)} className={`px-3 py-1 rounded text-xs font-bold border ${isEditMode ? 'bg-yellow-600 border-yellow-400 text-black' : 'bg-stone-800 border-stone-600 text-white'}`}>{isEditMode ? '編集終了' : 'マップ編集'}</button>
            {isEditMode && (<button onClick={exportData} className="px-3 py-1 rounded text-xs font-bold bg-blue-600 border border-blue-400 text-white">データ出力</button>)}
        </div>

        <div className="relative z-0 w-full h-full overflow-hidden cursor-move" 
             onMouseDown={handleMouseDown} onMouseMove={handleGlobalMouseMove} onMouseUp={handleMouseUp} onWheel={handleWheel}>
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
                    if (type === 'change_owner') { setProvinces(prev => prev.map(p => p.id === pid ? { ...p, ownerId: val } : p)); return; }
                    
                    // ★修正: コマンド種類によってハンドラを明確に分ける
                    // 強制徴兵や軍事系が handleDomesticAction に渡るとコスト未定義でクラッシュするため
                    const domesticTypes = ['develop', 'cultivate', 'pacify', 'fortify', 'market', 'trade'];
                    if (domesticTypes.includes(type)) {
                        handleDomesticAction(type, pid);
                    } else {
                        handleMilitaryAction(type, pid);
                    }
                }}
            />
        )}

        <ControlPanel lastLog={lastLog} onHistoryClick={() => setModalState({type:'history'})} onEndTurn={() => { setIsPlayerTurn(false); advanceTurn(); }} onCancelSelection={() => { setAttackSourceId(null); setTransportSourceId(null); }} isPlayerTurn={isPlayerTurn} hasSelection={attackSourceId || transportSourceId} onViewBack={() => setViewingRelationId(null)} viewingRelationId={viewingRelationId} onDaimyoList={() => setModalState({type: 'list'})} currentDaimyoId={turnOrder[currentTurnIndex]} isPaused={isPaused} />
        
        {modalState.type === 'tactic_selection' && <TacticSelectionModal attacker={modalState.data.battle.attacker} defender={modalState.data.battle.defender} season={getFormattedDate(turn).split(' ')[1]} onSelect={handleTacticSelection} />}
        {modalState.type === 'reinforcement_request' && <ReinforcementRequestModal attacker={modalState.data.battle.attacker} defender={modalState.data.battle.defender} potentialAllies={modalState.data.potentialAllies} relations={relations} onConfirm={handleReinforcementDecision} />}
        {modalState.type === 'reward_payment' && <RewardPaymentModal allyId={modalState.data.allyId} amount={modalState.data.amount} onPay={() => handleRewardPayment(true)} onRefuse={() => handleRewardPayment(false)} />}
        {modalState.type === 'betrayal_warning' && <BetrayalWarningModal targetDaimyoId={modalState.data.targetDaimyoId} onConfirm={() => executeBetrayal(modalState.data.targetDaimyoId, modalState.data.sourceId)} onCancel={() => { setModalState({ type: null }); setAttackSourceId(null); }} />}
        {modalState.type === 'battle' && <BattleScene battleData={modalState.data} onFinish={handleBattleFinish} />}
        {modalState.type === 'incoming_request' && <IncomingRequestModal request={modalState.data} onAccept={() => { setModalState({type:null}); }} onReject={() => { setModalState({type:null}); }} />}
        {modalState.type === 'historical_event' && <HistoricalEventModal event={modalState.data} daimyoId={playerDaimyoId} onSelect={(c) => { setModalState({ type: null }); if (c && c.resolve) c.resolve({setProvinces, updateResource, showLog, setRelations, setDaimyoStats, setAlliances, setCeasefires, daimyoStats: daimyoStatsRef.current, provinces: provincesRef.current, playerDaimyoId}); }} />}
        {modalState.type === 'history' && <LogHistoryModal logs={logs} onClose={() => setModalState({type: null})} />}
        {modalState.type === 'list' && <DaimyoListModal provinces={provinces} daimyoStats={daimyoStats} alliances={alliances} ceasefires={ceasefires} relations={relations} playerDaimyoId={playerDaimyoId} coalition={coalition} onClose={() => setModalState({type: null})} onViewOnMap={(id) => { setViewingRelationId(id); setModalState({type:null}); }} />}
        {modalState.type === 'troop' && <TroopSelector maxTroops={modalState.data.maxTroops} type={modalState.data.type} onConfirm={handleTroopAction} onCancel={() => setModalState({type: null})} />}
        
        {gameState !== 'playing' && <GameOverScreen gameState={gameState} onRestart={() => window.location.reload()} />}
    </div>
  );
};

export default App;