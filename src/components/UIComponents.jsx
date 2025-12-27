// src/components/UIComponents.jsx
import React, { useState, useEffect } from 'react';
import { Coins, Users, ArrowRight, RotateCcw, List, History, XCircle, Eye, Play, Pause, Activity, Map as MapIcon, Wheat, Star, BookOpen, Edit, Save, Settings, Download } from 'lucide-react';
import { DAIMYO_INFO } from '../data/daimyos';
import { SCENARIOS } from '../data/scenarios';

// --- スタート画面（変更なし） ---
export const StartScreen = ({ onStartGame }) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState(SCENARIOS[0].id);
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

// --- 上部リソースバー & 各種コントローラー ---
export const ResourceBar = ({ 
    stats, turn, isPlayerTurn, shogunId, playerId, coalition, startYear,
    aiSpeed, onSpeedChange, isPaused, onPauseToggle,
    onHistoryClick, onDaimyoList, isEditMode, onEditModeToggle,
    iconSize, onIconSizeChange, onExportData
}) => {
  const isSpectator = playerId === 'SPECTATOR';
  if (!stats && !isSpectator) return null;

  const currentYear = (startYear || 1560) + Math.floor((turn - 1) / 4);
  const currentSeason = ['春', '夏', '秋', '冬'][(turn - 1) % 4];

  // 倍率計算 (1000ms = x1.0)
  // 小数点第1位まで表示
  const currentMultiplier = (1000 / Math.max(10, aiSpeed)).toFixed(1);

  const handleSpeedInput = (e) => {
      let val = parseFloat(e.target.value);
      if (isNaN(val) || val <= 0.1) val = 0.1;
      // ms = 1000 / multiplier
      const newMs = Math.floor(1000 / val);
      onSpeedChange(Math.max(10, newMs));
  };

  const setPresetSpeed = (multiplier) => {
      const newMs = Math.floor(1000 / multiplier);
      onSpeedChange(newMs);
  };

  return (
    <div className="absolute top-0 left-0 right-0 bg-stone-900/95 text-white h-14 px-4 flex justify-between items-center shadow-md z-40 border-b border-stone-700 backdrop-blur-sm">
      
      {/* 左側: 時間操作 */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
            <div className="text-[10px] text-stone-400 font-serif leading-none mb-0.5">戦国絵巻</div>
            <div className="text-lg font-bold font-serif flex items-baseline gap-2 leading-none">
                {currentYear}年 <span className="text-xl text-yellow-500">{currentSeason}</span>
            </div>
        </div>

        <div className="flex items-center gap-2 bg-stone-800/50 p-1 pl-2 pr-2 rounded-full border border-stone-600/50">
            <button 
                onClick={onPauseToggle} 
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-all shadow-md ${isPaused ? 'bg-yellow-600 text-black animate-pulse' : 'bg-stone-700 text-stone-300 hover:bg-stone-600'}`}
                title={isPaused ? "再開" : "一時停止"}
            >
                {isPaused ? <Play size={14} className="fill-current"/> : <Pause size={14} className="fill-current"/>}
            </button>
            
            {/* プリセットボタン */}
            <div className="flex bg-stone-900 rounded border border-stone-700 overflow-hidden mr-2">
                <button onClick={() => setPresetSpeed(0.5)} className={`px-2 py-1 text-[10px] font-bold ${aiSpeed >= 2000 ? 'bg-stone-600 text-yellow-400' : 'text-stone-500 hover:text-stone-300'}`}>遅</button>
                <button onClick={() => setPresetSpeed(1.0)} className={`px-2 py-1 text-[10px] font-bold border-l border-stone-700 ${Math.abs(aiSpeed - 1000) < 100 ? 'bg-stone-600 text-yellow-400' : 'text-stone-500 hover:text-stone-300'}`}>普</button>
                <button onClick={() => setPresetSpeed(5.0)} className={`px-2 py-1 text-[10px] font-bold border-l border-stone-700 ${Math.abs(aiSpeed - 200) < 50 ? 'bg-stone-600 text-yellow-400' : 'text-stone-500 hover:text-stone-300'}`}>速</button>
                <button onClick={() => setPresetSpeed(20.0)} className={`px-2 py-1 text-[10px] font-bold border-l border-stone-700 ${aiSpeed <= 50 ? 'bg-stone-600 text-yellow-400' : 'text-stone-500 hover:text-stone-300'}`}>極</button>
            </div>

            {/* 自由入力 */}
            <div className="flex items-center gap-1 bg-black/30 px-2 py-1 rounded">
                <span className="text-xs text-stone-400">×</span>
                <input 
                    type="number" 
                    step="0.1"
                    min="0.1"
                    max="100"
                    value={currentMultiplier} 
                    onChange={handleSpeedInput}
                    className="w-12 bg-transparent text-sm font-mono font-bold text-yellow-400 text-center outline-none"
                />
            </div>
        </div>
      </div>

      {/* 中央: 状態表示 */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
             {isPlayerTurn ? (
                 <div className="px-4 py-1 bg-blue-900/80 border border-blue-500 rounded-full animate-pulse font-bold text-blue-200 shadow-[0_0_10px_rgba(59,130,246,0.3)] text-sm">
                     あなたの手番です
                 </div>
             ) : (
                 !isSpectator && (
                 <div className="px-4 py-1 bg-stone-800/80 border border-stone-600 rounded-full text-stone-500 flex items-center gap-2 text-sm">
                     <Activity size={14} className="animate-spin"/> 他国が行動中...
                 </div>
                 )
             )}
      </div>
      
      {/* 右側: 資源とメニューボタン */}
      <div className="flex items-center gap-6 relative">
        {!isSpectator && stats && (
            <div className="flex items-center gap-4 text-sm bg-stone-800/50 px-3 py-1 rounded-full border border-stone-700">
                <div className="flex items-center gap-1" title="軍資金">
                    <Coins size={14} className="text-yellow-400" />
                    <span className="font-mono font-bold text-yellow-100">{stats.gold.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1" title="兵糧">
                    <Wheat size={14} className="text-green-400" />
                    <span className="font-mono font-bold text-green-100">{stats.rice.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1" title="名声">
                    <Star size={14} className="text-purple-400" />
                    <span className="font-mono font-bold text-purple-100">{stats.fame}</span>
                </div>
            </div>
        )}

        {coalition && <div className="text-[10px] bg-red-900 text-red-100 px-2 py-1 rounded animate-pulse border border-red-500 font-bold whitespace-nowrap">包囲網 (残{coalition.duration})</div>}

        <div className="flex items-center gap-2">
            <button onClick={onHistoryClick} className="p-2 bg-stone-800 hover:bg-stone-700 rounded border border-stone-600 text-stone-300 transition-colors" title="履歴">
                <History size={18}/>
            </button>
            <button onClick={onDaimyoList} className="p-2 bg-stone-800 hover:bg-stone-700 rounded border border-stone-600 text-stone-300 transition-colors" title="勢力一覧">
                <List size={18}/>
            </button>
            
            {/* 編集ボタン */}
            <div className="relative group">
                <button 
                    onClick={onEditModeToggle} 
                    className={`p-2 rounded border transition-colors ${isEditMode ? 'bg-yellow-800 border-yellow-500 text-yellow-200' : 'bg-stone-800 border-stone-600 text-stone-300 hover:bg-stone-700'}`} 
                    title="マップ編集モード"
                >
                    {isEditMode ? <Settings size={18}/> : <Edit size={18}/>}
                </button>
                
                {/* 編集モード時のポップアップメニュー */}
                {isEditMode && (
                    <div className="absolute top-full right-0 mt-2 bg-stone-800 border border-stone-600 rounded-lg p-3 shadow-xl w-56 z-50 flex flex-col gap-3 animate-fade-in">
                        <div>
                            <div className="flex justify-between text-xs text-stone-400 mb-1">
                                <span>アイコンサイズ</span>
                                <span className="text-yellow-400 font-mono">{iconSize}px</span>
                            </div>
                            <input 
                                type="range" min="20" max="80" value={iconSize} 
                                onChange={(e) => onIconSizeChange(parseInt(e.target.value))}
                                className="w-full h-1 bg-stone-600 rounded accent-yellow-500"
                            />
                        </div>
                        <button 
                            onClick={onExportData}
                            className="flex items-center justify-center gap-2 bg-stone-700 hover:bg-stone-600 text-white text-xs py-2 rounded border border-stone-500 transition-colors"
                        >
                            <Download size={14}/>
                            <span>provinces.js 保存</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

// --- 一時的なアクションログ表示 ---
export const ActionLogToast = ({ log }) => {
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (log) {
            setMessage(log);
            setVisible(true);
            const timer = setTimeout(() => {
                setVisible(false);
            }, 4000); 
            return () => clearTimeout(timer);
        }
    }, [log]);

    if (!visible) return null;

    return (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
            <div className="bg-black/70 text-white px-6 py-2 rounded-full border border-stone-500/50 backdrop-blur-sm shadow-lg animate-bounce-in text-sm font-medium flex items-center gap-2">
                <History size={14} className="text-yellow-500"/>
                {message}
            </div>
        </div>
    );
};

// --- 右下フロートアクションパネル ---
export const FloatingActionPanel = ({ 
    onEndTurn, isPlayerTurn, onCancelSelection, hasSelection, 
    viewingRelationId, onViewBack, isPaused, currentDaimyoName 
}) => {
    return (
        <div className="absolute bottom-6 right-6 flex flex-col items-end gap-3 z-40 pointer-events-none">
            {viewingRelationId && (
                <button onClick={onViewBack} className="pointer-events-auto h-10 px-4 bg-stone-700 hover:bg-stone-600 text-white rounded shadow-lg flex items-center gap-2 border border-stone-500 transition-transform hover:scale-105">
                    <MapIcon size={16}/>
                    <span className="font-bold text-sm">自国へ戻る</span>
                </button>
            )}

            {hasSelection && (
                <button onClick={onCancelSelection} className="pointer-events-auto h-10 px-4 bg-red-800 hover:bg-red-700 text-white rounded shadow-lg flex items-center gap-2 border border-red-600 transition-transform hover:scale-105">
                    <XCircle size={16}/>
                    <span className="font-bold text-sm">選択解除</span>
                </button>
            )}

            <button 
                onClick={onEndTurn} 
                disabled={!isPlayerTurn}
                className={`pointer-events-auto h-14 px-8 rounded-full flex items-center justify-center transition-all gap-2 shadow-xl border-2 ${
                    isPlayerTurn 
                    ? 'bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black border-yellow-300 transform hover:scale-105 active:scale-95 cursor-pointer' 
                    : 'bg-stone-800 text-stone-500 border-stone-600 cursor-not-allowed opacity-80'
                }`}
            >
                {isPlayerTurn ? (
                    <>
                        <span className="text-lg font-black tracking-widest">評定終了</span>
                        <ArrowRight size={20} strokeWidth={3}/>
                    </>
                ) : (
                    <>
                        <RotateCcw size={16} className={isPaused ? "" : "animate-spin"}/>
                        <div className="flex flex-col items-start leading-none">
                            <span className="text-[10px] font-bold">待機中</span>
                            <span className="text-[9px] opacity-75">{currentDaimyoName}</span>
                        </div>
                    </>
                )}
            </button>
        </div>
    );
};