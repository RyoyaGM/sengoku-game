// src/components/Modals.jsx
import React, { useState } from 'react';
import { Shield, Sword, User, Coins, TrendingUp, Handshake, Scroll, X, Users, Flag, Wheat, AlertTriangle, CheckCircle, Target, ChevronRight, Settings } from 'lucide-react';
import { DAIMYO_INFO } from '../data/daimyos';

const ModalBase = ({ title, children, onClose, width = "max-w-2xl" }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
    <div className={`bg-stone-900 border-2 border-stone-600 rounded-xl shadow-2xl w-full ${width} flex flex-col max-h-[90vh]`}>
      <div className="flex items-center justify-between p-4 border-b border-stone-700 bg-stone-800 rounded-t-xl">
        <h2 className="text-xl font-bold font-serif text-yellow-500 flex items-center gap-2">
            {title}
        </h2>
        <button onClick={onClose} className="text-stone-400 hover:text-white transition-colors">
          <X size={24} />
        </button>
      </div>
      <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
        {children}
      </div>
    </div>
  </div>
);

// --- ★新規: 設定モーダル ---
export const SettingsModal = ({ fontSize, setFontSize, iconSize, setIconSize, onClose }) => {
    return (
        <ModalBase title="設定" onClose={onClose} width="max-w-md">
            <div className="flex flex-col gap-8">
                {/* 文字の大きさ */}
                <div>
                    <div className="flex justify-between items-end mb-2">
                        <label className="text-stone-200 font-bold flex items-center gap-2">
                            <span className="text-lg">Aa</span> 文字の大きさ
                        </label>
                        <span className="text-yellow-400 font-mono">{fontSize}px</span>
                    </div>
                    <input 
                        type="range" min="12" max="24" step="1" 
                        value={fontSize} 
                        onChange={(e) => setFontSize(parseInt(e.target.value))}
                        className="w-full h-2 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                    />
                    <div className="flex justify-between text-xs text-stone-500 mt-1">
                        <span>小</span>
                        <span>標準</span>
                        <span>大</span>
                    </div>
                </div>

                {/* アイコンの大きさ */}
                <div>
                    <div className="flex justify-between items-end mb-2">
                        <label className="text-stone-200 font-bold flex items-center gap-2">
                            <Target size={18}/> マップ上のアイコンサイズ
                        </label>
                        <span className="text-yellow-400 font-mono">{iconSize}</span>
                    </div>
                    <input 
                        type="range" min="20" max="80" step="1" 
                        value={iconSize} 
                        onChange={(e) => setIconSize(parseInt(e.target.value))}
                        className="w-full h-2 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                    />
                    <div className="flex justify-between text-xs text-stone-500 mt-1">
                        <span>小</span>
                        <span>標準</span>
                        <span>大</span>
                    </div>
                </div>
            </div>
        </ModalBase>
    );
};

// --- ★改修: 資金・兵糧の合計を表示するDaimyoListModal ---
export const DaimyoListModal = ({ provinces, daimyoStats, alliances, ceasefires, relations, playerDaimyoId, coalition, onClose, onViewOnMap }) => {
    // 資金と兵糧の合計を計算
    const aggregatedStats = {};
    if (provinces) {
        provinces.forEach(p => {
            if (!aggregatedStats[p.ownerId]) {
                aggregatedStats[p.ownerId] = { gold: 0, rice: 0 };
            }
            aggregatedStats[p.ownerId].gold += p.gold;
            aggregatedStats[p.ownerId].rice += p.rice;
        });
    }

    const daimyos = Object.keys(DAIMYO_INFO)
        .filter(id => id !== 'Minor' && id !== 'Merchant')
        .map(id => {
            const stats = daimyoStats[id] || {};
            const provinceCount = provinces.filter(p => p.ownerId === id).length;
            const troopCount = provinces.filter(p => p.ownerId === id).reduce((acc, p) => acc + p.troops, 0);
            const totalGold = aggregatedStats[id]?.gold || 0;
            const totalRice = aggregatedStats[id]?.rice || 0;
            
            return {
                id,
                ...DAIMYO_INFO[id],
                ...stats,
                provinceCount,
                troopCount,
                totalGold,
                totalRice,
                isAlive: stats.isAlive !== false && provinceCount > 0
            };
        })
        .filter(d => d.isAlive)
        .sort((a, b) => b.provinceCount - a.provinceCount);

    return (
        <ModalBase title="勢力一覧" onClose={onClose} width="max-w-5xl">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="text-stone-400 border-b border-stone-700 text-sm">
                        <th className="p-2">家紋/大名</th>
                        <th className="p-2">領国数</th>
                        <th className="p-2">総兵力</th>
                        <th className="p-2">総資金</th>
                        <th className="p-2">総兵糧</th>
                        <th className="p-2">名声</th>
                        <th className="p-2">関係</th>
                        <th className="p-2">状態</th>
                        <th className="p-2">操作</th>
                    </tr>
                </thead>
                <tbody>
                    {daimyos.map(d => {
                        const rel = relations[playerDaimyoId]?.[d.id] || 50;
                        const isAlly = (alliances[playerDaimyoId] || []).includes(d.id);
                        const isCeasefire = (ceasefires[playerDaimyoId]?.[d.id] || 0) > 0;
                        const isTarget = coalition?.targetId === d.id;
                        const isMember = coalition?.members.includes(d.id);

                        return (
                            <tr key={d.id} className="border-b border-stone-800 hover:bg-stone-800/50 transition-colors">
                                <td className="p-3 flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${d.color} shadow-[0_0_5px_currentColor]`}></div>
                                    <span className="font-bold text-lg">{d.name}</span>
                                </td>
                                <td className="p-3 font-mono">{d.provinceCount}</td>
                                <td className="p-3 font-mono text-stone-300">{d.troopCount.toLocaleString()}</td>
                                <td className="p-3 font-mono text-yellow-400">{d.totalGold.toLocaleString()}</td>
                                <td className="p-3 font-mono text-green-400">{d.totalRice.toLocaleString()}</td>
                                <td className="p-3 font-mono text-purple-400">{d.fame || 0}</td>
                                <td className="p-3">
                                    {playerDaimyoId !== d.id && (
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-1.5 bg-stone-700 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full ${rel >= 70 ? 'bg-green-500' : rel <= 30 ? 'bg-red-500' : 'bg-yellow-500'}`} 
                                                    style={{ width: `${rel}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs w-6 text-right">{rel}</span>
                                        </div>
                                    )}
                                </td>
                                <td className="p-3">
                                    <div className="flex gap-1 flex-wrap">
                                        {isAlly && <span className="text-xs bg-blue-900 text-blue-200 px-1.5 py-0.5 rounded border border-blue-700">同盟</span>}
                                        {isCeasefire && <span className="text-xs bg-green-900 text-green-200 px-1.5 py-0.5 rounded border border-green-700">停戦</span>}
                                        {isTarget && <span className="text-xs bg-red-900 text-red-200 px-1.5 py-0.5 rounded border border-red-700 animate-pulse">包囲対象</span>}
                                        {isMember && <span className="text-xs bg-orange-900 text-orange-200 px-1.5 py-0.5 rounded border border-orange-700">包囲網</span>}
                                        {playerDaimyoId === d.id && <span className="text-xs bg-stone-700 px-1.5 py-0.5 rounded">自国</span>}
                                    </div>
                                </td>
                                <td className="p-3">
                                    <button 
                                        onClick={() => onViewOnMap(d.id)}
                                        className="text-xs bg-stone-700 hover:bg-stone-600 px-2 py-1 rounded flex items-center gap-1 transition-colors"
                                    >
                                        <Target size={12}/> 場所
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </ModalBase>
    );
};

export const LogHistoryModal = ({ logs, onClose }) => (
    <ModalBase title="履歴" onClose={onClose}>
        <div className="space-y-2 font-mono text-sm">
            {logs.length === 0 && <div className="text-stone-500 text-center py-8">履歴はありません</div>}
            {[...logs].reverse().map((log, i) => (
                <div key={i} className="border-b border-stone-800 pb-2 last:border-0">
                    {log}
                </div>
            ))}
        </div>
    </ModalBase>
);

export const TroopSelector = ({ maxTroops, type, onConfirm, onCancel }) => {
    const [amount, setAmount] = useState(Math.min(maxTroops, 100));
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-stone-900 border border-stone-600 p-6 rounded-xl shadow-2xl w-96 animate-scale-in">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-stone-200">
                    {type === 'attack' ? <Sword size={20}/> : <Shield size={20}/>}
                    {type === 'attack' ? '出陣兵数' : '輸送兵数'}
                </h3>
                
                <div className="mb-6">
                    <div className="flex justify-between text-sm text-stone-400 mb-2">
                        <span>兵数指定</span>
                        <span className="text-white font-mono">{amount} / {maxTroops}</span>
                    </div>
                    <input 
                        type="range" min="100" max={maxTroops} step="100" 
                        value={amount} onChange={(e) => setAmount(parseInt(e.target.value))}
                        className="w-full h-2 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                    />
                </div>

                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 py-2 bg-stone-800 rounded hover:bg-stone-700 text-stone-300 transition-colors">中止</button>
                    <button onClick={() => onConfirm(amount)} className="flex-1 py-2 bg-red-800 rounded hover:bg-red-700 text-white font-bold transition-colors">決定</button>
                </div>
            </div>
        </div>
    );
};

export const InvestmentSelector = ({ type, maxGold, maxRice, onConfirm, onCancel }) => {
    const [goldInvest, setGoldInvest] = useState(0);
    const [riceInvest, setRiceInvest] = useState(0);

    const totalInvest = goldInvest + riceInvest;
    const boost = Math.floor(totalInvest / 10);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-stone-900 border border-stone-600 p-6 rounded-xl shadow-2xl w-96 animate-scale-in">
                <h3 className="text-xl font-bold mb-4 text-stone-200 flex items-center gap-2">
                    <TrendingUp size={20} className="text-green-500"/>
                    {type === 'develop' ? '商業投資' : '農業投資'}
                </h3>
                
                <div className="space-y-4 mb-6">
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-yellow-400 flex items-center gap-1"><Coins size={12}/> 金投資</span>
                            <span className="font-mono">{goldInvest} / {maxGold}</span>
                        </div>
                        <input 
                            type="range" min="0" max={maxGold} step="10" 
                            value={goldInvest} onChange={(e) => setGoldInvest(parseInt(e.target.value))}
                            className="w-full h-2 bg-stone-700 rounded appearance-none cursor-pointer accent-yellow-500"
                        />
                    </div>
                    
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-green-400 flex items-center gap-1"><Wheat size={12}/> 米投資</span>
                            <span className="font-mono">{riceInvest} / {maxRice}</span>
                        </div>
                        <input 
                            type="range" min="0" max={maxRice} step="10" 
                            value={riceInvest} onChange={(e) => setRiceInvest(parseInt(e.target.value))}
                            className="w-full h-2 bg-stone-700 rounded appearance-none cursor-pointer accent-green-500"
                        />
                    </div>

                    <div className="bg-stone-800 p-3 rounded text-center">
                        <div className="text-xs text-stone-400">予想効果</div>
                        <div className="text-xl font-bold text-green-400">+{boost}</div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 py-2 bg-stone-800 rounded hover:bg-stone-700 text-stone-300">中止</button>
                    <button 
                        onClick={() => onConfirm(goldInvest, riceInvest)} 
                        disabled={boost === 0}
                        className={`flex-1 py-2 rounded font-bold ${boost > 0 ? 'bg-green-700 hover:bg-green-600 text-white' : 'bg-stone-700 text-stone-500 cursor-not-allowed'}`}
                    >
                        実行
                    </button>
                </div>
            </div>
        </div>
    );
};

export const IncomingRequestModal = ({ request, onAccept, onReject }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-stone-900 border-2 border-yellow-600 p-6 rounded-lg max-w-lg w-full shadow-2xl animate-bounce-in">
            <h3 className="text-xl font-bold text-yellow-500 mb-4 flex items-center gap-2">
                <Scroll size={24}/> {request.type === 'alliance' ? '同盟の打診' : request.type === 'ceasefire' ? '停戦の打診' : '交渉'}
            </h3>
            <p className="text-lg mb-6 leading-relaxed">
                <span className="font-bold text-white text-xl">{DAIMYO_INFO[request.sourceId]?.name}</span>家より、
                {request.type === 'alliance' ? '同盟' : '停戦'}の使者が参りました。<br/>
                <span className="text-stone-400 text-sm mt-2 block">「よしなに願いたい...」</span>
            </p>
            <div className="flex gap-4">
                <button onClick={onReject} className="flex-1 py-3 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded border border-stone-600 transition-colors">拒否</button>
                <button onClick={onAccept} className="flex-1 py-3 bg-yellow-700 hover:bg-yellow-600 text-white font-bold rounded shadow-lg border border-yellow-500 transition-colors">承諾</button>
            </div>
        </div>
    </div>
);

export const GameOverScreen = ({ gameState, onRestart }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 text-white animate-fade-in">
        <div className="text-center p-12 border-4 border-double border-stone-500 rounded-lg bg-stone-900 shadow-2xl">
            <h2 className={`text-6xl font-black mb-4 tracking-widest ${gameState === 'won' ? 'text-yellow-500' : 'text-stone-500'}`}>
                {gameState === 'won' ? '天下統一' : '滅亡'}
            </h2>
            <p className="text-xl text-stone-400 mb-8 font-serif">
                {gameState === 'won' ? '全ての国を平らげ、戦乱の世は終わった。' : '志半ばにして、夢は潰えた...'}
            </p>
            <button onClick={onRestart} className="px-10 py-4 bg-red-800 hover:bg-red-700 rounded-full font-bold text-xl shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-all hover:scale-105">
                新たな歴史へ
            </button>
        </div>
    </div>
);

export const HistoricalEventModal = ({ event, daimyoId, onSelect }) => {
    if (!event) return null;
    const isSubject = event.subjects?.includes(daimyoId);
    
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-stone-900 border-2 border-yellow-700 max-w-2xl w-full rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in">
                {event.image && (
                    <div className="h-48 w-full relative">
                        <img src={event.image} alt={event.title} className="w-full h-full object-cover mask-image-b" />
                        <div className="absolute inset-0 bg-gradient-to-t from-stone-900 to-transparent"></div>
                    </div>
                )}
                <div className="p-8">
                    <div className="text-yellow-500 text-sm font-bold mb-1 tracking-widest">歴史イベント</div>
                    <h2 className="text-3xl font-black mb-4 font-serif text-white">{event.title}</h2>
                    <p className="text-stone-300 mb-8 leading-relaxed text-lg whitespace-pre-wrap font-serif">
                        {event.description}
                    </p>
                    
                    {isSubject && event.choices ? (
                        <div className="flex flex-col gap-3">
                            {event.choices.map((choice, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => onSelect(choice)}
                                    className="p-4 bg-stone-800 hover:bg-stone-700 border border-stone-600 rounded text-left transition-all hover:border-yellow-600 hover:text-yellow-100 group"
                                >
                                    <div className="font-bold text-lg group-hover:text-yellow-400">➢ {choice.label}</div>
                                    {choice.effectText && <div className="text-sm text-stone-500 mt-1">{choice.effectText}</div>}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <button onClick={() => onSelect(null)} className="w-full py-3 bg-yellow-800 hover:bg-yellow-700 text-white font-bold rounded transition-colors">
                            閉じる
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// 以下のコンポーネントはplaceholderまたは今回変更なし
export const MarketModal = () => null;
export const TitlesModal = () => null;
export const DonateModal = () => null;
export const TradeModal = () => null;
export const NegotiationScene = () => null;