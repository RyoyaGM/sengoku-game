// src/components/Modals.jsx
import React from 'react';
import { X, Handshake, Skull, ShieldAlert, Swords, Coins, Wheat } from 'lucide-react';
import { DAIMYO_INFO } from '../data/daimyos';

// ... (他のモーダルコンポーネントは変更なしのため省略、DaimyoListModalのみ抜粋・修正) ...

export const IncomingRequestModal = ({ request, onAccept, onReject }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-stone-800 text-white p-6 rounded-lg max-w-md w-full border border-stone-600 shadow-2xl">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-yellow-400">
                <Handshake /> 外交使節到来
            </h3>
            <p className="mb-6 leading-relaxed text-lg">
                <span className="font-bold text-yellow-200">{DAIMYO_INFO[request.sourceId].name}</span>より、
                <span className="font-bold text-white mx-1">
                    {request.type === 'alliance' ? '同盟' : request.type === 'ceasefire' ? '停戦' : '共闘'}
                </span>
                の申し入れがありました。<br/>
                <span className="text-sm text-stone-400 mt-2 block">
                    (現在の関係: {request.relation} / 提示額: 金{request.gold})
                </span>
            </p>
            <div className="flex gap-3">
                <button onClick={onAccept} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded font-bold transition-colors">受諾</button>
                <button onClick={onReject} className="flex-1 py-3 bg-red-600 hover:bg-red-500 rounded font-bold transition-colors">拒否</button>
            </div>
        </div>
    </div>
);

// ... (他の中略) ...

export const DaimyoListModal = ({ provinces, daimyoStats, alliances, ceasefires, relations, playerDaimyoId, coalition, onClose, onViewOnMap }) => {
    // 存在する大名家のみ抽出
    const activeDaimyos = Object.keys(DAIMYO_INFO)
        .filter(id => id !== 'Minor' && id !== 'Merchant' && daimyoStats[id]?.isAlive !== false);
    
    // ソート: プレイヤー優先、次に国数
    activeDaimyos.sort((a, b) => {
        if (a === playerDaimyoId) return -1;
        if (b === playerDaimyoId) return 1;
        const countA = provinces.filter(p => p.ownerId === a).length;
        const countB = provinces.filter(p => p.ownerId === b).length;
        return countB - countA;
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-stone-900 text-white rounded-lg w-full max-w-5xl h-[80vh] flex flex-col border border-stone-600 shadow-2xl">
                <div className="p-4 border-b border-stone-700 flex justify-between items-center bg-stone-800 rounded-t-lg">
                    <h3 className="text-xl font-bold flex items-center gap-2"><Swords size={20}/> 勢力一覧</h3>
                    <button onClick={onClose}><X size={24} className="text-stone-400 hover:text-white"/></button>
                </div>
                <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-stone-400 border-b border-stone-700 text-sm">
                                <th className="p-2">家紋</th>
                                <th className="p-2">大名</th>
                                <th className="p-2 text-center">石高(国数)</th>
                                <th className="p-2 text-center">総兵力</th>
                                {/* ★追加: 資金と兵糧 */}
                                <th className="p-2 text-center text-yellow-400">資金</th>
                                <th className="p-2 text-center text-green-400">兵糧</th>
                                <th className="p-2 text-center">名声</th>
                                <th className="p-2 text-center">関係</th>
                                <th className="p-2 text-center">外交状態</th>
                                <th className="p-2 text-center">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activeDaimyos.map(id => {
                                const myProvinces = provinces.filter(p => p.ownerId === id);
                                const count = myProvinces.length;
                                const troops = myProvinces.reduce((s, p) => s + p.troops, 0);
                                const totalGold = myProvinces.reduce((s, p) => s + p.gold, 0); // ★計算
                                const totalRice = myProvinces.reduce((s, p) => s + p.rice, 0); // ★計算
                                
                                const isMe = id === playerDaimyoId;
                                const rel = relations[playerDaimyoId]?.[id] || 50;
                                const isAlly = alliances[playerDaimyoId]?.includes(id);
                                const isCeasefire = ceasefires[playerDaimyoId]?.[id];
                                const isCoalitionTarget = coalition?.targetId === id;
                                const isCoalitionMember = coalition?.members.includes(id);

                                return (
                                    <tr key={id} className={`border-b border-stone-800 hover:bg-stone-800/50 transition-colors ${isMe ? 'bg-blue-900/20' : ''}`}>
                                        <td className="p-3">
                                            <div className={`w-8 h-8 rounded-full ${DAIMYO_INFO[id].color} flex items-center justify-center font-bold text-xs shadow-md border border-stone-500`}>
                                                {DAIMYO_INFO[id].mon}
                                            </div>
                                        </td>
                                        <td className="p-3 font-bold text-lg">{DAIMYO_INFO[id].name}</td>
                                        <td className="p-3 text-center">{count}ヶ国</td>
                                        <td className="p-3 text-center font-mono">{troops.toLocaleString()}</td>
                                        {/* ★追加: 表示 */}
                                        <td className="p-3 text-center font-mono text-yellow-200">{totalGold.toLocaleString()}</td>
                                        <td className="p-3 text-center font-mono text-green-200">{totalRice.toLocaleString()}</td>
                                        
                                        <td className="p-3 text-center font-mono">{daimyoStats[id]?.fame || 0}</td>
                                        <td className="p-3 text-center">
                                            {!isMe && (
                                                <div className="flex items-center justify-center gap-1">
                                                    <div className="w-16 h-2 bg-stone-700 rounded-full overflow-hidden">
                                                        <div className={`h-full ${rel > 50 ? 'bg-blue-500' : 'bg-red-500'}`} style={{ width: `${rel}%` }} />
                                                    </div>
                                                    <span className="text-xs w-6">{rel}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-3 text-center text-xs">
                                            {isAlly && <span className="text-green-400 border border-green-600 px-1 rounded bg-green-900/30">同盟</span>}
                                            {isCeasefire && <span className="text-teal-400 border border-teal-600 px-1 rounded bg-teal-900/30 ml-1">停戦</span>}
                                            {isCoalitionTarget && <span className="text-red-500 font-bold ml-1">包囲網対象</span>}
                                            {isCoalitionMember && <span className="text-red-300 ml-1">包囲網参加</span>}
                                        </td>
                                        <td className="p-3 text-center">
                                            <button 
                                                onClick={() => onViewOnMap(id)}
                                                className="px-3 py-1 bg-stone-700 hover:bg-stone-600 rounded text-xs transition-colors"
                                            >
                                                場所
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// ... (以下のモーダルは基本的に変更なしだが、ファイル全体を更新する場合は記述が必要) ...
export const LogHistoryModal = ({ logs, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
        <div className="bg-stone-900 text-white rounded-lg w-full max-w-2xl h-[70vh] flex flex-col border border-stone-600 shadow-2xl">
            <div className="p-4 border-b border-stone-700 flex justify-between items-center bg-stone-800 rounded-t-lg">
                <h3 className="text-xl font-bold flex items-center gap-2"><History size={20}/> 歴史の記録</h3>
                <button onClick={onClose}><X size={24} className="text-stone-400 hover:text-white"/></button>
            </div>
            <div className="flex-1 overflow-auto p-4 font-mono text-sm leading-relaxed custom-scrollbar bg-[#0f172a]">
                {logs.length === 0 ? (
                    <div className="text-stone-500 text-center mt-10">記録はありません</div>
                ) : (
                    logs.slice().reverse().map((log, i) => (
                        <div key={i} className="mb-2 border-b border-stone-800 pb-2 last:border-0 hover:bg-white/5 p-1 rounded transition-colors">
                            {log}
                        </div>
                    ))
                )}
            </div>
        </div>
    </div>
);

export const TroopSelector = ({ maxTroops, type, onConfirm, onCancel }) => {
    const [amount, setAmount] = React.useState(Math.min(maxTroops, 100));
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-stone-800 text-white p-6 rounded-lg border border-stone-600 shadow-xl w-80">
                <h3 className="text-lg font-bold mb-4 border-b border-stone-600 pb-2">
                    {type === 'attack' ? '出陣兵数' : type === 'transport' ? '輸送兵数' : '移動兵数'}
                </h3>
                <div className="mb-6">
                    <div className="flex justify-between mb-2">
                        <span className="text-sm text-stone-400">兵数指定</span>
                        <span className="font-bold text-xl text-yellow-400">{amount}</span>
                    </div>
                    <input 
                        type="range" min="100" max={maxTroops} step="100" 
                        value={amount} onChange={(e) => setAmount(parseInt(e.target.value))}
                        className="w-full h-2 bg-stone-600 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                    />
                    <div className="text-right text-xs text-stone-500 mt-1">可能上限: {maxTroops}</div>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => onConfirm(amount)} className="flex-1 bg-yellow-700 hover:bg-yellow-600 py-2 rounded font-bold transition-colors">決定</button>
                    <button onClick={onCancel} className="flex-1 bg-stone-700 hover:bg-stone-600 py-2 rounded transition-colors">中止</button>
                </div>
            </div>
        </div>
    );
};

export const MarketModal = () => null; // 簡易版では使用しない
export const TitlesModal = () => null;
export const DonateModal = () => null;
export const TradeModal = () => null;
export const NegotiationScene = () => null;
export const BattleScene = ({ battleData, onFinish }) => {
    // 簡易的な戦闘画面 (実際は自動解決だが、演出として残す場合)
    React.useEffect(() => {
        const timer = setTimeout(() => {
            // 自動解決ロジックはフック側にあるが、ここでは演出後にコールバック
            // 実際の結果はuseBattleSystem側で計算済みだが、ここでは演出のみ
            // 簡易的に兵力が減ったと仮定して返す
            const atkDmg = Math.floor(battleData.attackerAmount * 0.1);
            const defDmg = Math.floor(battleData.originalDefenderTroops * 0.1);
            onFinish({ 
                attackerRemaining: Math.max(0, battleData.attackerAmount - atkDmg), 
                defenderRemaining: Math.max(0, battleData.originalDefenderTroops - defDmg) 
            });
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
            <div className="text-center animate-pulse">
                <h2 className="text-4xl font-bold text-red-500 mb-4 font-serif tracking-widest">合戦中...</h2>
                <div className="flex items-center gap-8 text-2xl">
                    <div className="text-blue-400">{battleData.attacker.name || '攻撃軍'}</div>
                    <Swords size={48} className="animate-spin-slow text-yellow-500"/>
                    <div className="text-red-400">{battleData.defender.name || '守備軍'}</div>
                </div>
            </div>
        </div>
    );
};
export const GameOverScreen = ({ gameState, onRestart }) => (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-white animate-fade-in">
        <h1 className={`text-6xl font-bold mb-8 font-serif tracking-widest ${gameState === 'won' ? 'text-yellow-500' : 'text-blue-500'}`}>
            {gameState === 'won' ? '天下統一' : '御家滅亡'}
        </h1>
        <p className="text-xl text-stone-400 mb-12">
            {gameState === 'won' ? 'すべての国を平定しました。' : '戦国の世に夢と消えました...'}
        </p>
        <button onClick={onRestart} className="px-8 py-3 bg-stone-800 hover:bg-stone-700 border border-stone-500 rounded-full text-xl transition-colors">
            トップに戻る
        </button>
    </div>
);
export const HistoricalEventModal = ({ event, daimyoId, onSelect }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
        <div className="bg-stone-900 border-2 border-yellow-700/50 text-white p-8 rounded-lg max-w-2xl w-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-800 via-yellow-500 to-yellow-800"></div>
            <h2 className="text-3xl font-bold mb-4 text-yellow-500 font-serif border-b border-stone-700 pb-2">{event.title}</h2>
            <p className="text-lg leading-relaxed mb-8 whitespace-pre-line text-stone-200">{event.description}</p>
            
            {event.choices ? (
                <div className="flex flex-col gap-3">
                    {event.choices.map((choice, i) => (
                        <button 
                            key={i} 
                            onClick={() => onSelect(choice)}
                            className="p-4 bg-stone-800 hover:bg-stone-700 border border-stone-600 hover:border-yellow-500 rounded text-left transition-all group"
                        >
                            <span className="font-bold text-yellow-200 group-hover:text-yellow-400 block mb-1">{choice.text}</span>
                            {choice.effectText && <span className="text-xs text-stone-400 block">{choice.effectText}</span>}
                        </button>
                    ))}
                </div>
            ) : (
                <button onClick={() => onSelect(null)} className="w-full py-3 bg-yellow-800 hover:bg-yellow-700 rounded font-bold transition-colors">
                    次へ
                </button>
            )}
        </div>
    </div>
);
export const InvestmentSelector = ({ type, maxGold, maxRice, onConfirm, onCancel }) => {
    const [goldInvest, setGoldInvest] = React.useState(0);
    const [riceInvest, setRiceInvest] = React.useState(0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-stone-800 text-white p-6 rounded-lg border border-stone-600 shadow-xl w-80">
                <h3 className="text-lg font-bold mb-4 border-b border-stone-600 pb-2">
                    {type === 'develop' ? '商業投資' : '農業投資'}
                </h3>
                
                <div className="mb-4">
                    <div className="flex justify-between mb-1 text-sm">
                        <span className="text-yellow-400"><Coins size={12} className="inline"/> 資金 ({maxGold})</span>
                        <span>{goldInvest}</span>
                    </div>
                    <input 
                        type="range" min="0" max={maxGold} step="10" 
                        value={goldInvest} onChange={(e) => setGoldInvest(parseInt(e.target.value))}
                        className="w-full h-2 bg-stone-600 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                    />
                </div>

                <div className="mb-6">
                    <div className="flex justify-between mb-1 text-sm">
                        <span className="text-green-400"><Wheat size={12} className="inline"/> 兵糧 ({maxRice})</span>
                        <span>{riceInvest}</span>
                    </div>
                    <input 
                        type="range" min="0" max={maxRice} step="10" 
                        value={riceInvest} onChange={(e) => setRiceInvest(parseInt(e.target.value))}
                        className="w-full h-2 bg-stone-600 rounded-lg appearance-none cursor-pointer accent-green-500"
                    />
                </div>
                
                <div className="text-center text-xs text-stone-400 mb-4">
                    予想効果: +{Math.floor((goldInvest + riceInvest) / 10)}
                </div>

                <div className="flex gap-3">
                    <button onClick={() => onConfirm(goldInvest, riceInvest)} className="flex-1 bg-blue-700 hover:bg-blue-600 py-2 rounded font-bold transition-colors">投資</button>
                    <button onClick={onCancel} className="flex-1 bg-stone-700 hover:bg-stone-600 py-2 rounded transition-colors">中止</button>
                </div>
            </div>
        </div>
    );
};