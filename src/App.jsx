// src/App.jsx
import React, { useState, useEffect, useRef } from 'react';
import { DAIMYO_INFO } from './data/daimyos';
import { getFormattedDate } from './utils/helpers';
import { SCENARIOS } from './data/scenarios';

import japanMapImg from './assets/japan_map.jpg'; 

// ★修正: ActionLogToast を追加インポート
import { StartScreen, ResourceBar, FloatingActionPanel, ActionLogToast } from './components/UIComponents';
import { GameMap, ProvincePopup } from './components/MapComponents';

import { 
  IncomingRequestModal, LogHistoryModal, MarketModal, TitlesModal, 
  DonateModal, TradeModal, NegotiationScene, DaimyoListModal, 
  TroopSelector, BattleScene, GameOverScreen, HistoricalEventModal,
  InvestmentSelector
} from './components/Modals';

import { 
  ReinforcementRequestModal, RewardPaymentModal, BetrayalWarningModal, TacticSelectionModal 
} from './components/BattleModals';

import { TransportModal } from './components/TransportModal';

import { useAiSystem } from './hooks/useAiSystem';
import { useBattleSystem } from './hooks/useBattleSystem';
import { usePlayerActions } from './hooks/usePlayerActions';
import { useGameLoop } from './hooks/useGameLoop';
import { useMapControls } from './hooks/useMapControls';

const App = () => {
  const [provinces, setProvinces] = useState(null);
  const [daimyoStats, setDaimyoStats] = useState(null);
  const [alliances, setAlliances] = useState(null);
  const [ceasefires, setCeasefires] = useState(null);
  const [relations, setRelations] = useState(null);
  const [coalition, setCoalition] = useState(null);
  
  const [shogunId, setShogunId] = useState('Ashikaga'); 
  const [playerDaimyoId, setPlayerDaimyoId] = useState(null); 
  
  const [currentScenario, setCurrentScenario] = useState(null);

  // 初期速度: 1000ms (1倍速)
  const [aiSpeed, setAiSpeed] = useState(1000);
  const [isPaused, setIsPaused] = useState(false);
  const [iconSize, setIconSize] = useState(40);
  const [isEditMode, setIsEditMode] = useState(false);

  const [selectedProvinceId, setSelectedProvinceId] = useState(null);
  const [attackSourceId, setAttackSourceId] = useState(null);
  const [transportSourceId, setTransportSourceId] = useState(null);
  const [viewingRelationId, setViewingRelationId] = useState(null);
  
  const [modalState, setModalState] = useState({ type: null, data: null }); 
  const [logs, setLogs] = useState([]);
  const [lastLog, setLastLog] = useState('');
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

  const {
      mapTransform, isDragging, setDraggingProvinceId,
      handleWheel, handleMouseDown, handleGlobalMouseMove, handleMouseUp, exportData
  } = useMapControls({ provinces, setProvinces, isEditMode, setIsEditMode });

  const {
      turn, setTurn, gameState, turnOrder, currentTurnIndex, isPlayerTurn, setIsPlayerTurn,
      advanceTurn, startNewSeason, showLog
  } = useGameLoop({
      provincesRef, daimyoStatsRef, setDaimyoStats, setProvinces, setCeasefires,
      coalition, setCoalition, playerDaimyoId, updateResource, setModalState,
      aiSpeed, isPaused, setSelectedProvinceId, setAttackSourceId, setTransportSourceId,
      setLogs, setLastLog,
      startYear: currentScenario?.startYear || 1560,
      scenarioEvents: currentScenario?.events || []
  });

  const { 
      pendingBattles, setPendingBattles, processNextPendingBattle, 
      handleReinforcementDecision, handleBattleFinish, handleRewardPayment,
      handleTacticSelection
  } = useBattleSystem({
      provinces, setProvinces, relations, updateResource, setRelations, showLog,
      advanceTurn, playerDaimyoId, daimyoStats, modalState, setModalState, setIsResolvingBattles,
      turn
  });

  const { 
      handleDomesticAction, handleMilitaryAction, handleDiplomacy, executeBetrayal, handleTroopAction, handleInvestment
  } = usePlayerActions({
      provinces, setProvinces, daimyoStats, setDaimyoStats, alliances, setAlliances, relations,
      playerDaimyoId, turn, updateResource, showLog, setModalState, setAttackSourceId,
      setTransportSourceId, selectedProvinceId, modalState,
      setPendingBattles,
      setRelations 
  });

  const { processAiTurn } = useAiSystem({
      provincesRef, daimyoStatsRef, alliancesRef, ceasefiresRef, relations, setProvinces,
      updateResource, setPendingBattles, showLog, advanceTurn, playerDaimyoId, turn,
      isPaused, aiSpeed
  });

  const handleStartGame = (scenarioId, daimyoId) => {
    const scenario = SCENARIOS.find(s => s.id === scenarioId);
    if (!scenario) return;

    setProvinces(scenario.data.provinces);
    setDaimyoStats(scenario.data.daimyoStats);
    setRelations(scenario.data.relations);
    setAlliances(scenario.data.alliances || {});
    setCeasefires(scenario.data.ceasefires || {});
    setCoalition(scenario.data.coalition || null);
    
    setCurrentScenario(scenario);
    setPlayerDaimyoId(daimyoId);
    setTurn(1);
    setLogs([]);
    setLastLog(`${scenario.name}を開始しました。`);
  };

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
          setModalState({ 
              type: type === 'transport' ? 'transport_selection' : 'troop', 
              data: { 
                  type, 
                  sourceId: srcId, 
                  targetId: pid, 
                  maxTroops: src.troops,
                  maxGold: src.gold,
                  maxRice: src.rice 
              } 
          });
      } else {
          if (!attackSourceId && !transportSourceId) setSelectedProvinceId(pid === selectedProvinceId ? null : pid);
      }
  };

  if (!playerDaimyoId || !provinces || !daimyoStats) {
      return <StartScreen onStartGame={handleStartGame} />;
  }

  const playerProvinces = provinces.filter(p => p.ownerId === playerDaimyoId);
  const totalGold = playerProvinces.reduce((s, p) => s + p.gold, 0);
  const totalRice = playerProvinces.reduce((s, p) => s + p.rice, 0);
  
  const currentDaimyoStats = daimyoStats[playerDaimyoId] || {};
  const displayStats = { ...currentDaimyoStats, gold: totalGold, rice: totalRice };

  return (
    <div className="relative w-full h-screen overflow-hidden font-sans select-none text-stone-100 flex flex-col items-center justify-center bg-[#0f172a]">
        
        <ResourceBar 
            stats={displayStats} 
            turn={turn} 
            isPlayerTurn={isPlayerTurn} 
            shogunId={shogunId} 
            playerId={playerDaimyoId} 
            coalition={coalition} 
            startYear={currentScenario?.startYear || 1560}
            
            aiSpeed={aiSpeed}
            onSpeedChange={setAiSpeed}
            isPaused={isPaused}
            onPauseToggle={handlePauseToggle}
            
            onHistoryClick={() => setModalState({type:'history'})}
            onDaimyoList={() => setModalState({type: 'list'})}
            isEditMode={isEditMode}
            onEditModeToggle={() => setIsEditMode(!isEditMode)}
            // ★追加Props
            iconSize={iconSize}
            onIconSizeChange={setIconSize}
            onExportData={exportData}
        />

        {/* ★新規: 一時的なアクションログ（下部中央） */}
        <ActionLogToast log={lastLog} />

        <div className="relative z-0 w-full h-full overflow-hidden cursor-move" 
             onMouseDown={handleMouseDown} onMouseMove={handleGlobalMouseMove} onMouseUp={handleMouseUp} onWheel={handleWheel}>
            <div style={{ transform: `translate(${mapTransform.x}px, ${mapTransform.y}px) scale(${mapTransform.scale})` }} className="absolute origin-top-left transition-transform duration-75 w-[7000px] h-[11000px]">
                <div className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none">
                    <img src={japanMapImg} alt="日本地図" className="w-full h-full object-cover opacity-50" />
                </div>
                <div className="relative z-10 w-full h-full">
                    <GameMap 
                        provinces={provinces} viewingRelationId={viewingRelationId} playerDaimyoId={playerDaimyoId}
                        alliances={alliances} ceasefires={ceasefires} coalition={coalition}
                        selectedProvinceId={selectedProvinceId} attackSourceId={attackSourceId} transportSourceId={transportSourceId}
                        onSelectProvince={handleMapSelect} isEditMode={isEditMode} onProvinceDragStart={setDraggingProvinceId}
                        iconSize={iconSize}
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
                    if (type === 'update_province') {
                        setProvinces(prev => prev.map(p => p.id === pid ? { ...p, ...val } : p));
                        return;
                    }
                    if (type === 'change_owner') { setProvinces(prev => prev.map(p => p.id === pid ? { ...p, ownerId: val } : p)); return; }
                    const domesticTypes = ['develop', 'cultivate', 'pacify', 'fortify', 'market', 'trade'];
                    if (domesticTypes.includes(type)) {
                        handleDomesticAction(type, pid);
                    } else {
                        handleMilitaryAction(type, pid);
                    }
                }}
            />
        )}

        <FloatingActionPanel
            onEndTurn={() => { setIsPlayerTurn(false); advanceTurn(); }} 
            onCancelSelection={() => { setAttackSourceId(null); setTransportSourceId(null); }} 
            isPlayerTurn={isPlayerTurn} 
            hasSelection={attackSourceId || transportSourceId} 
            currentDaimyoName={DAIMYO_INFO[turnOrder[currentTurnIndex]]?.name}
            isPaused={isPaused} 
            viewingRelationId={viewingRelationId}
            onViewBack={() => setViewingRelationId(null)}
        />
        
        {modalState.type === 'tactic_selection' && <TacticSelectionModal attacker={modalState.data.battle.attacker} defender={modalState.data.battle.defender} season={getFormattedDate(turn, currentScenario?.startYear).split(' ')[1]} onSelect={handleTacticSelection} />}
        {modalState.type === 'reinforcement_request' && <ReinforcementRequestModal attacker={modalState.data.battle.attacker} defender={modalState.data.battle.defender} potentialAllies={modalState.data.potentialAllies} relations={relations} onConfirm={handleReinforcementDecision} />}
        {modalState.type === 'reward_payment' && <RewardPaymentModal allyId={modalState.data.allyId} amount={modalState.data.amount} onPay={() => handleRewardPayment(true)} onRefuse={() => handleRewardPayment(false)} />}
        
        {modalState.type === 'betrayal_warning' && 
            <BetrayalWarningModal 
                targetDaimyoId={modalState.data.targetDaimyoId} 
                onConfirm={() => executeBetrayal(modalState.data.targetDaimyoId, modalState.data.sourceId, modalState.data.targetProvinceId, modalState.data.amount, modalState.data.isCeasefire)} 
                onCancel={() => { setModalState({ type: null }); setAttackSourceId(null); }} 
            />
        }
        
        {modalState.type === 'battle' && <BattleScene battleData={modalState.data} onFinish={handleBattleFinish} />}
        {modalState.type === 'incoming_request' && <IncomingRequestModal request={modalState.data} onAccept={() => { setModalState({type:null}); }} onReject={() => { setModalState({type:null}); }} />}
        
        {modalState.type === 'historical_event' && (
            <HistoricalEventModal 
                event={modalState.data} daimyoId={playerDaimyoId} 
                onSelect={(choice) => {
                    const ctx = { 
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
                    if (choice && choice.resolve) nextEvent = choice.resolve(ctx);
                    else if (modalState.data.defaultResolve) nextEvent = modalState.data.defaultResolve(ctx);
                    
                    if (nextEvent) {
                        setModalState({ type: 'historical_event', data: nextEvent });
                    } else { 
                        setModalState({ type: null }); 
                        startNewSeason(); 
                    }
                }} 
            />
        )}
        
        {modalState.type === 'history' && <LogHistoryModal logs={logs} onClose={() => setModalState({type: null})} />}
        {modalState.type === 'list' && <DaimyoListModal provinces={provinces} daimyoStats={daimyoStats} alliances={alliances} ceasefires={ceasefires} relations={relations} playerDaimyoId={playerDaimyoId} coalition={coalition} onClose={() => setModalState({type: null})} onViewOnMap={(id) => { setViewingRelationId(id); setModalState({type:null}); }} />}
        
        {modalState.type === 'troop' && <TroopSelector maxTroops={modalState.data.maxTroops} type={modalState.data.type} onConfirm={(amount) => handleTroopAction(amount, ceasefires)} onCancel={() => setModalState({type: null})} />}
        
        {modalState.type === 'transport_selection' && <TransportModal maxTroops={modalState.data.maxTroops} maxGold={modalState.data.maxGold} maxRice={modalState.data.maxRice} onConfirm={(amounts) => handleTroopAction(amounts, ceasefires)} onCancel={() => setModalState({type: null})} />}

        {modalState.type === 'investment' && modalState.data && (
            <InvestmentSelector 
                type={modalState.data.type}
                maxGold={modalState.data.maxGold || 0}
                maxRice={modalState.data.maxRice || 0}
                onConfirm={handleInvestment} 
                onCancel={() => setModalState({type: null})} 
            />
        )}
        
        {gameState !== 'playing' && <GameOverScreen gameState={gameState} onRestart={() => window.location.reload()} />}
    </div>
  );
};

export default App;