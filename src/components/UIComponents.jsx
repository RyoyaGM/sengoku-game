// src/components/UIComponents.jsx
import React, { useState } from 'react';
import { Shield, Coins, Users, ArrowRight, RotateCcw, List, History, XCircle, Eye, FastForward, Play, Pause, Activity, Menu, Map as MapIcon, Wheat, Star, BookOpen } from 'lucide-react';
import { DAIMYO_INFO } from '../data/daimyos';
import { SCENARIOS } from '../data/scenarios';

// ★修正: シナリオ選択と大名選択を統合
export const StartScreen = ({ onStartGame }) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState(SCENARIOS[0].id);

  // 選択中のシナリオ情報を取得
  const selectedScenario = SCENARIOS.find(s => s.id === selectedScenarioId) || SCENARIOS[0];

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-stone-900 text-white p-8 overflow-y-auto font-sans">
      <h1 className="text-6xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-600 filter drop-shadow-lg font-serif tracking-widest">戦国シミュレーション</h1>
      <p className="text-stone-400 mb-8 text-xl font-light tracking-wider">群雄割拠の時代を生き抜け</p>
      
      <div className="flex gap-8 max-w-7xl w-full">
        {/* 左カラム: シナリオ選択 */}
        <div className="w-1/3 flex flex-col gap-4">
          <h2 className="text-2xl font-serif text-yellow-500 border-b border-stone-700 pb-2 mb-2 flex items-center gap-2">
            <BookOpen size={24}/> シナリオ選択
          </h2>
          <div className="flex flex-col gap-3">
            {SCENARIOS.map(scenario => (
              <button
                key={scenario.id}
                onClick={() => setSelectedScenarioId(scenario.id)}
                className={`p-4 rounded-lg text-left transition-all border ${
                  selectedScenarioId === scenario.id
                    ? 'bg-stone-800 border-yellow-500 shadow-lg'
                    : 'bg-stone-800/50 border-stone-700 hover:bg-stone-800 text-stone-400'
                }`}
              >
                <div className="font-bold text-lg mb-1">{scenario.name}</div>
                <div className="text-xs opacity-70 mb-2">開始年: {scenario.startYear}年</div>
                <div className="text-sm leading-snug">{scenario.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 右カラム: 大名選択 */}
        <div className="w-2/3 flex flex-col gap-4">
            <h2 className="text-2xl font-serif text-yellow-500 border-b border-stone-700 pb-2 mb-2 flex items-center gap-2">
                <Users size={24}/> 大名家選択
            </h2>
            
            <button 
                onClick={() => onStartGame(selectedScenarioId, 'SPECTATOR')}
                className="mb-4 px-8 py-3 bg-stone-800 border border-stone-600 rounded-full hover:bg-stone-700 hover:border-stone-400 transition-all flex items-center justify-center gap-2 text-stone-300 font-bold shadow-lg w-full"
            >
                <Eye size={20} />
                観戦モード（AI同士の戦いを見る）
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {Object.entries(DAIMYO_INFO).filter(([id]) => id !== 'Minor' && id !== 'Merchant').map(([id, info]) => (
                <button 
                    key={id} 
                    onClick={() => onStartGame(selectedScenarioId, id)}
                    className={`relative group overflow-hidden rounded-xl border-2 border-stone-700 hover:border-${info.color.replace('bg-', '')} transition-all duration-300 p-5 flex flex-col items-start gap-2 bg-stone-800 hover:bg-stone-750 hover:shadow-2xl hover:-translate-y-1 text-left shrink-0`}
                >
                    <div className={`absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 rounded-full ${info.color} opacity-20 group-hover:opacity-40 transition-opacity blur-xl`}></div>
                    <div className="flex items-center gap-3 z-10 w-full border-b border-stone-700 pb-2 mb-1">
                    <span className={`w-4 h-4 rounded-full ${info.color} shadow-[0_0_10px_currentColor]`}></span>
                    <span className="text-xl font-bold">{info.name}</span>
                    <span className="ml-auto text-xs px-2 py-1 rounded bg-stone-900 text-stone-400">難易度: {info.difficulty}</span>
                    </div>
                    <div className="text-xs text-stone-400 z-10 leading-relaxed">
                    戦略: <span className="text-stone-300">{info.strategy === 'aggressive' ? '天下布武 (好戦的)' : info.strategy === 'defensive' ? '領土保全 (守備的)' : info.strategy === 'ainu' ? '北の守護 (専守防衛)' : '富国強兵 (バランス)'}</span>
                    </div>
                </button>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

// ★修正: startYearを受け取るように変更
export const ResourceBar = ({ stats, turn, isPlayerTurn, shogunId, playerId, coalition, startYear }) => {
  const isSpectator = playerId === 'SPECTATOR';
  if (!stats && !isSpectator) return null;

  const isShogun = playerId === shogunId;
  const currentYear = (startYear || 1560) + Math.floor((turn - 1) / 4);
  const currentSeason = ['春', '夏', '秋', '冬'][(turn - 1) % 4];

  return (
    <div className="absolute top-0 left-0 right-0 bg-stone-900/95 text-white h-14 px-6 flex justify-between items-center shadow-md z-40 border-b border-stone-700 backdrop-blur-sm">
      <div className="flex items-center gap-6">
        <div className="flex flex-col">
            <div className="text-xs text-stone-400 font-serif">戦国絵巻</div>
            <div className="text-lg font-bold font-serif flex items-baseline gap-2">
                {currentYear}年 <span className="text-xl text-yellow-500">{currentSeason}</span>
                <span className="text-xs text-stone-500 font-mono">(Turn {turn})</span>
            </div>
        </div>
        
        {isSpectator ? (
            <div className="flex items-center gap-2 text-stone-400 font-bold bg-stone-800 px-3 py-1 rounded border border-stone-600 text-xs">
                <Eye size={14} /> 観戦中
            </div>
        ) : (
             <div className="flex items-center gap-2 px-3 py-1 bg-stone-800 rounded border border-stone-600">
                <div className={`w-6 h-6 rounded-full ${DAIMYO_INFO[playerId]?.color || 'bg-gray-500'} border border-white shadow-lg flex items-center justify-center font-bold text-xs`}>
                    {DAIMYO_INFO[playerId]?.name?.[0]}
                </div>
                <div className="flex flex-col leading-none">
                    <span className="text-[10px] text-stone-400">当主</span>
                    <span className="font-bold text-sm">{DAIMYO_INFO[playerId]?.name}</span>
                </div>
            </div>
        )}
      </div>

      <div className="flex-1 flex justify-center">
             {isPlayerTurn ? (
                 <div className="px-4 py-1 bg-blue-900/50 border border-blue-500 rounded-full animate-pulse font-bold text-blue-200 shadow-[0_0_15px_rgba(59,130,246,0.5)] text-sm">
                     あなたの手番です
                 </div>
             ) : (
                 !isSpectator && (
                 <div className="px-4 py-1 bg-stone-800 border border-stone-600 rounded-full text-stone-500 flex items-center gap-2 text-sm">
                     <Activity size={14} className="animate-spin"/> 他国が行動中...
                 </div>
                 )
             )}
      </div>
      
      {!isSpectator && stats && (
        <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1" title="軍資金">
                <Coins size={16} className="text-yellow-400" />
                <span className="font-mono font-bold text-yellow-100">{stats.gold.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1" title="兵糧">
                <Wheat size={16} className="text-green-400" />
                <span className="font-mono font-bold text-green-100">{stats.rice.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1" title="名声">
                <Star size={16} className="text-purple-400" />
                <span className="font-mono font-bold text-purple-100">{stats.fame}</span>
            </div>
        </div>
      )}

      <div className="flex items-center gap-2 ml-4">
          {coalition && <div className="text-[10px] bg-red-900 text-red-100 px-2 py-1 rounded animate-pulse border border-red-500 font-bold">⚠ {coalition.targetId === playerId ? '包囲網 対象' : '包囲網'} (残{coalition.duration}T)</div>}
          {isShogun && <div className="text-[10px] bg-yellow-900 text-yellow-100 px-2 py-1 rounded border border-yellow-500 flex items-center gap-1">征夷大将軍</div>}
      </div>
    </div>
  );
};

export const SpectatorControls = ({ aiSpeed, onSpeedChange, isPaused, onPauseToggle }) => {
    return (
        <div className="bg-stone-900/80 p-1.5 rounded border border-stone-600 flex items-center gap-2 backdrop-blur scale-90 origin-top-left">
            <button 
                onClick={onPauseToggle} 
                className={`w-8 h-8 flex items-center justify-center rounded-full border shadow-lg transition-all ${isPaused ? 'bg-yellow-600 border-yellow-400 text-black animate-pulse' : 'bg-stone-800 border-stone-600 text-white hover:bg-stone-700'}`}
                title={isPaused ? "再開" : "一時停止"}
            >
                {isPaused ? <Play size={16} className="fill-current"/> : <Pause size={16} className="fill-current"/>}
            </button>

            <div className="h-4 w-px bg-stone-700 mx-1"></div>

            <div className="bg-stone-800 text-white rounded-full border border-stone-600 flex overflow-hidden shadow-lg">
                <button onClick={() => onSpeedChange(800)} className={`px-2 py-1.5 hover:bg-stone-600 transition-colors text-[10px] font-bold ${aiSpeed === 800 ? 'bg-stone-600 text-yellow-400' : 'text-stone-400'}`}>低</button>
                <button onClick={() => onSpeedChange(300)} className={`px-2 py-1.5 hover:bg-stone-600 transition-colors text-[10px] font-bold border-l border-r border-stone-700 ${aiSpeed === 300 ? 'bg-stone-600 text-yellow-400' : 'text-stone-400'}`}>中</button>
                <button onClick={() => onSpeedChange(50)} className={`px-2 py-1.5 hover:bg-stone-600 transition-colors text-[10px] font-bold border-r border-stone-700 ${aiSpeed === 50 ? 'bg-stone-600 text-yellow-400' : 'text-stone-400'}`}>高</button>
                <button onClick={() => onSpeedChange(10)} className={`px-2 py-1.5 hover:bg-stone-600 transition-colors text-[10px] font-bold ${aiSpeed === 10 ? 'bg-stone-600 text-yellow-400' : 'text-stone-400'}`}><FastForward size={12}/></button>
            </div>
        </div>
    );
};

export const ControlPanel = ({ 
    lastLog, 
    onHistoryClick, 
    onEndTurn, 
    onCancelSelection, 
    isPlayerTurn, 
    hasSelection, 
    onViewBack, 
    viewingRelationId, 
    onDaimyoList,
    currentDaimyoId,
    isPaused
}) => {
    const currentDaimyoName = DAIMYO_INFO[currentDaimyoId]?.name || '---';

    return (
    <div className="absolute bottom-0 left-0 w-full h-16 bg-stone-900 border-t border-stone-700 flex items-center px-4 z-40 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
        <div className="flex-1 mr-4 bg-black/40 h-10 rounded border border-stone-700 px-3 flex items-center relative group cursor-pointer" onClick={onHistoryClick}>
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <History size={14} className="text-stone-400"/>
            </div>
            <div className="text-xs text-stone-500 mr-2 border-r border-stone-700 pr-2 flex items-center gap-1">
                <span>ログ</span>
                {isPaused && <span className="text-red-500 font-bold">停止中</span>}
            </div>
            <div className="text-xs text-stone-300 font-mono truncate flex-1">{lastLog}</div>
        </div>

        <div className="flex items-center gap-2">
            {viewingRelationId ? (
                <button onClick={onViewBack} className="h-10 px-4 bg-stone-700 hover:bg-stone-600 rounded flex items-center justify-center border-b-2 border-stone-900 active:border-b-0 active:translate-y-0.5 transition-all text-white gap-2">
                    <MapIcon size={16}/>
                    <span className="text-xs font-bold">地図へ</span>
                </button>
            ) : (
                <button onClick={onDaimyoList} className="h-10 w-10 bg-stone-800 hover:bg-stone-700 rounded flex items-center justify-center border border-stone-600 transition-colors" title="勢力一覧">
                    <Menu size={18} className="text-stone-300"/>
                </button>
            )}

            {hasSelection && (
                <button onClick={onCancelSelection} className="h-10 px-4 bg-red-900 hover:bg-red-800 text-white rounded flex items-center justify-center border-b-2 border-red-950 active:border-b-0 active:translate-y-0.5 transition-all gap-1">
                    <XCircle size={16}/>
                    <span className="font-bold text-xs">解除</span>
                </button>
            )}

            <div className="h-8 w-px bg-stone-700 mx-1"></div>

            <button 
                onClick={onEndTurn} 
                disabled={!isPlayerTurn}
                className={`h-12 px-6 rounded-lg flex items-center justify-center transition-all gap-2 ${
                    isPlayerTurn 
                    ? 'bg-yellow-600 hover:bg-yellow-500 text-black border-b-4 border-yellow-800 active:border-b-0 active:translate-y-1 shadow-[0_0_15px_rgba(234,179,8,0.3)]' 
                    : 'bg-stone-800 text-stone-600 border border-stone-700 cursor-not-allowed opacity-50'
                }`}
            >
                {isPlayerTurn ? (
                    <>
                        <span className="text-sm font-black tracking-widest">評定終了</span>
                        <ArrowRight size={16}/>
                    </>
                ) : (
                    <>
                        <RotateCcw size={16} className={isPaused ? "" : "animate-spin"}/>
                        <div className="flex flex-col items-start leading-none">
                            <span className="text-[10px] font-bold">待機中</span>
                            <span className="text-[9px] opacity-75">{currentDaimyoName}家...</span>
                        </div>
                    </>
                )}
            </button>
        </div>
    </div>
    );
};