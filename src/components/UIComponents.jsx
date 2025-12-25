import React from 'react';
import { Shield, Coins, Users, Calendar, ArrowRight, RotateCcw, List, MessageSquare, History, XCircle } from 'lucide-react';
import { DAIMYO_INFO } from '../data/daimyos';

export const StartScreen = ({ onSelectDaimyo }) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-stone-900 text-white p-8 overflow-y-auto">
      <h1 className="text-6xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-600 filter drop-shadow-lg font-serif tracking-widest">戦国シミュレーション</h1>
      <p className="text-stone-400 mb-12 text-xl font-light tracking-wider">群雄割拠の時代を生き抜け</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl w-full">
        {Object.entries(DAIMYO_INFO).filter(([id]) => id !== 'Minor' && id !== 'Merchant').map(([id, info]) => (
          <button 
            key={id} 
            onClick={() => onSelectDaimyo(id)}
            className={`relative group overflow-hidden rounded-xl border-2 border-stone-700 hover:border-${info.color.replace('bg-', '')} transition-all duration-300 p-6 flex flex-col items-start gap-3 bg-stone-800 hover:bg-stone-750 hover:shadow-2xl hover:-translate-y-1 text-left`}
          >
            <div className={`absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 rounded-full ${info.color} opacity-20 group-hover:opacity-40 transition-opacity blur-xl`}></div>
            <div className="flex items-center gap-3 z-10 w-full border-b border-stone-700 pb-2 mb-1">
               <span className={`w-4 h-4 rounded-full ${info.color} shadow-[0_0_10px_currentColor]`}></span>
               <span className="text-2xl font-bold">{info.name}</span>
               <span className="ml-auto text-xs px-2 py-1 rounded bg-stone-900 text-stone-400">難易度: {info.difficulty}</span>
            </div>
            <div className="text-sm text-stone-400 z-10 leading-relaxed">
               戦略: <span className="text-stone-300">{info.strategy === 'aggressive' ? '天下布武 (好戦的)' : info.strategy === 'defensive' ? '領土保全 (守備的)' : info.strategy === 'ainu' ? '北の守護 (専守防衛)' : '富国強兵 (バランス)'}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export const ResourceBar = ({ stats, turn, isPlayerTurn, shogunId, playerId, coalition }) => {
  if (!stats) return null;
  const isShogun = playerId === shogunId;
  
  // ▼ 修正: ターン数から年数と季節を計算 (1560年開始)
  const currentYear = 1560 + Math.floor((turn - 1) / 4);
  const currentSeason = ['春', '夏', '秋', '冬'][(turn - 1) % 4];

  return (
    <div className="absolute top-0 left-0 right-0 bg-stone-900/95 text-white p-2 px-6 flex justify-between items-center shadow-md z-20 border-b border-stone-700 backdrop-blur-sm">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 bg-stone-800 px-3 py-1 rounded-full border border-stone-600">
            <span className={`w-3 h-3 rounded-full ${isPlayerTurn ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
            {/* ▼ 修正: 年・季節を表示 */}
            <span className="font-mono font-bold text-lg">{currentYear}年 {currentSeason}</span>
        </div>
        <div className="flex gap-6 text-sm font-bold">
            <div className="flex items-center gap-2 text-yellow-400" title="資金"><Coins size={16} /> {stats.gold}</div>
            <div className="flex items-center gap-2 text-green-400" title="兵糧"><Users size={16} /> {stats.rice}</div>
            <div className="flex items-center gap-2 text-purple-400" title="名声"><Shield size={16} /> {stats.fame}</div>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
          {coalition && <div className="text-xs bg-red-900 text-red-100 px-2 py-1 rounded animate-pulse border border-red-500 font-bold">⚠ {coalition.targetId === playerId ? '包囲網 対象' : '包囲網 参加中'} (残{coalition.duration}T)</div>}
          {isShogun && <div className="text-xs bg-yellow-900 text-yellow-100 px-2 py-1 rounded border border-yellow-500 flex items-center gap-1"><img src="/icons/shogun.svg" className="w-3 h-3 hidden"/> 征夷大将軍</div>}
          <div className="text-xs text-stone-500 font-mono">Build 0.9.6</div>
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
    currentDaimyoId 
}) => (
    // ▼ 修正: 黒いグラデーション (bg-gradient-to-t from-black/90) を削除
    <div className="fixed bottom-0 left-0 right-0 p-4 pointer-events-none flex justify-between items-end z-20">
        <div className="bg-stone-900/80 text-white p-3 rounded-lg pointer-events-auto border border-stone-600 max-w-xl shadow-lg backdrop-blur-sm flex items-center gap-3">
            <button onClick={onHistoryClick} className="p-2 hover:bg-stone-700 rounded-full transition-colors"><History size={20} className="text-stone-400" /></button>
            <span className="font-mono text-sm tracking-wide">{lastLog}</span>
        </div>

        <div className="flex gap-2 pointer-events-auto">
            {viewingRelationId && (
                <button onClick={onViewBack} className="bg-stone-700 text-white px-6 py-3 rounded-full font-bold border border-stone-500 hover:bg-stone-600 shadow-lg transition-all flex items-center gap-2">
                    <ArrowRight size={20} className="rotate-180"/> 戻る
                </button>
            )}
            
            <button onClick={onDaimyoList} className="bg-stone-800 text-white px-4 py-3 rounded-full font-bold border border-stone-600 hover:bg-stone-700 shadow-lg transition-all" title="勢力一覧">
                <List size={20}/>
            </button>

            {hasSelection && (
                <button onClick={onCancelSelection} className="bg-red-800 text-white px-6 py-3 rounded-full font-bold border border-red-600 hover:bg-red-700 shadow-lg transition-all flex items-center gap-2">
                    <XCircle size={20}/> 選択解除
                </button>
            )}

            {isPlayerTurn ? (
                <button onClick={onEndTurn} className="bg-yellow-600 text-black px-8 py-3 rounded-full font-bold border border-yellow-400 hover:bg-yellow-500 hover:scale-105 shadow-lg shadow-yellow-900/50 transition-all flex items-center gap-2">
                    <ArrowRight size={20}/> 評定終了(ターン送り)
                </button>
            ) : (
                <div className="bg-stone-800 text-stone-400 px-6 py-3 rounded-full font-bold border border-stone-600 flex items-center gap-2 animate-pulse">
                    <RotateCcw size={18} className="animate-spin"/> 
                    {currentDaimyoId && DAIMYO_INFO[currentDaimyoId] 
                        ? `${DAIMYO_INFO[currentDaimyoId].name}家 行動中...`
                        : "他国行動中..."}
                </div>
            )}
        </div>
    </div>
);