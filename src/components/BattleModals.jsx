// src/components/BattleModals.jsx
import React from 'react';
import { DAIMYO_INFO } from '../data/daimyos';

// --- 戦術選択モーダル (新規追加) ---
export const TacticSelectionModal = ({ attacker, defender, season, onSelect }) => {
    const isSummer = season === '夏';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-stone-800 border-2 border-stone-500 p-6 rounded-lg max-w-2xl w-full text-stone-100 shadow-2xl">
                <h2 className="text-2xl font-bold mb-4 text-red-500 border-b border-stone-600 pb-2">
                    敵軍襲来！ 戦術を選択せよ
                </h2>
                <div className="mb-6 flex justify-between items-end">
                    <div>
                        <p className="text-lg">
                            <span className={`font-bold ${DAIMYO_INFO[attacker.ownerId]?.color || 'bg-gray-500'} px-2 py-0.5 rounded mr-2`}>
                                {DAIMYO_INFO[attacker.ownerId]?.name || attacker.ownerId}
                            </span>
                            が
                            <span className="font-bold text-yellow-400 mx-2">{defender.name}</span>
                            へ侵攻！
                        </p>
                        <p className="text-sm text-stone-400 mt-1">敵兵力: {attacker.troops} vs 自軍守備兵: {defender.troops}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-stone-400 text-sm">現在の季節</p>
                        <p className="text-xl font-bold">{season}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* 籠城ボタン */}
                    <button 
                        onClick={() => onSelect('siege')}
                        className="group relative p-4 border-2 border-stone-600 rounded bg-stone-900 hover:bg-stone-700 hover:border-blue-500 transition-all flex flex-col items-center text-center"
                    >
                        <h3 className="text-xl font-bold text-blue-400 mb-2">籠城戦</h3>
                        <div className="text-sm space-y-2 text-stone-300">
                            <p>城に立てこもり徹底抗戦する。</p>
                            <ul className="text-xs text-left bg-black/40 p-2 rounded w-full space-y-1">
                                <li className="text-green-400">▲ 防御力が大幅に上昇 (+50)</li>
                                <li className="text-red-400">▼ 商業収入が激減</li>
                                {isSummer && <li className="text-red-500 font-bold">▼▼ 秋の兵糧収入が激減</li>}
                            </ul>
                        </div>
                    </button>

                    {/* 出城ボタン */}
                    <button 
                        onClick={() => onSelect('field')}
                        className="group relative p-4 border-2 border-stone-600 rounded bg-stone-900 hover:bg-stone-700 hover:border-red-500 transition-all flex flex-col items-center text-center"
                    >
                        <h3 className="text-xl font-bold text-red-400 mb-2">出城迎撃</h3>
                        <div className="text-sm space-y-2 text-stone-300">
                            <p>城外に出て敵軍を迎え撃つ。</p>
                            <ul className="text-xs text-left bg-black/40 p-2 rounded w-full space-y-1">
                                <li className="text-yellow-400">▶ 防御力ボーナスなし</li>
                                <li className="text-green-400">▶ 商業収入の減少は軽微</li>
                                {isSummer && <li className="text-green-400">▶ 秋の兵糧収入の減少も軽微</li>}
                            </ul>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- 援軍要請モーダル ---
export const ReinforcementRequestModal = ({ attacker, defender, potentialAllies, relations, onConfirm }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-stone-800 border-2 border-red-600 p-6 rounded-lg max-w-lg w-full text-stone-100 shadow-2xl animate-fade-in">
                <h2 className="text-2xl font-bold mb-4 text-red-500">援軍要請</h2>
                <div className="mb-4">
                    <p className="text-lg">
                        <span className={`font-bold ${DAIMYO_INFO[attacker.ownerId]?.color || 'bg-gray-500'} px-2 py-0.5 rounded`}>
                            {DAIMYO_INFO[attacker.ownerId]?.name || attacker.ownerId}
                        </span>軍が
                    </p>
                    <p className="text-lg">我が領土 <span className="font-bold text-yellow-400">{defender.name}</span> へ侵攻を開始しました！</p>
                    <p className="mt-2 text-sm text-stone-400">敵兵力: 約{attacker.troops} / 自軍守備兵: {defender.troops}</p>
                </div>

                <h3 className="font-bold mb-2 border-b border-stone-600 pb-1">援軍を要請できる近隣勢力</h3>
                <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
                    {potentialAllies.length === 0 ? (
                        <p className="text-gray-500 text-sm">要請可能な勢力がありません...</p>
                    ) : (
                        potentialAllies.map(ally => {
                            const rel = relations[defender.ownerId]?.[ally.id] || 50;
                            const successRate = rel >= 80 ? '高' : rel >= 40 ? '中' : '低';
                            return (
                                <button key={ally.id} 
                                    onClick={() => onConfirm(ally.id)}
                                    className="w-full flex justify-between items-center p-3 bg-stone-700 hover:bg-stone-600 rounded border border-stone-500 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${DAIMYO_INFO[ally.id]?.color || 'bg-gray-500'}`}></div>
                                        <span>{DAIMYO_INFO[ally.id]?.name}</span>
                                        <span className="text-xs text-stone-400">(関係: {rel})</span>
                                    </div>
                                    <div className="text-xs text-yellow-400">
                                        成功率: {successRate}
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>

                <div className="flex justify-end gap-3">
                    <button onClick={() => onConfirm(null)} className="px-4 py-2 bg-stone-600 hover:bg-stone-500 rounded font-bold">
                        援軍なしで迎撃
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- 報酬支払いモーダル ---
export const RewardPaymentModal = ({ allyId, amount, onPay, onRefuse }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-stone-800 border-2 border-yellow-500 p-6 rounded-lg max-w-md text-stone-100 shadow-2xl">
                <h2 className="text-xl font-bold mb-3 text-yellow-400">論功行賞</h2>
                <p className="mb-4">
                    {DAIMYO_INFO[allyId]?.name}家の援軍により、防衛に成功しました。<br/>
                    約束の報酬（金{amount}）を支払いますか？
                </p>
                <div className="flex justify-end gap-3">
                    <button onClick={onRefuse} className="px-4 py-2 bg-red-800 hover:bg-red-700 rounded text-xs font-bold border border-red-600">
                        支払わない (関係悪化)
                    </button>
                    <button onClick={onPay} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 rounded font-bold text-black border border-yellow-400">
                        支払う (金{amount})
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- 裏切り警告モーダル ---
export const BetrayalWarningModal = ({ targetDaimyoId, onConfirm, onCancel }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
            <div className="bg-red-900/90 border-4 border-red-600 p-8 rounded-lg max-w-lg w-full text-white shadow-2xl animate-bounce-in">
                <h2 className="text-3xl font-bold mb-4 text-center text-yellow-400">警告：同盟破棄</h2>
                <p className="mb-4 text-lg">
                    {DAIMYO_INFO[targetDaimyoId]?.name}家とは同盟関係にあります。<br/>
                    攻撃を行うことは<span className="font-bold text-red-400">裏切り</span>となります。
                </p>
                <div className="bg-black/50 p-4 rounded mb-6 text-sm">
                    <p className="font-bold text-red-300 mb-2">【裏切りの代償】</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>名声が大幅に低下します (-50)</li>
                        <li>同盟は即座に破棄されます</li>
                        <li>自国全ての領土で民忠が低下します (-20)</li>
                        <li>今後5年間、他国との外交交渉が一切成功しなくなります</li>
                    </ul>
                </div>
                <p className="mb-6 text-center font-bold">それでも進軍しますか？</p>
                <div className="flex justify-center gap-6">
                    <button onClick={onCancel} className="px-6 py-3 bg-stone-600 hover:bg-stone-500 rounded font-bold text-lg border border-stone-400">
                        思いとどまる
                    </button>
                    <button onClick={onConfirm} className="px-6 py-3 bg-red-700 hover:bg-red-600 rounded font-bold text-lg border border-red-400 shadow-lg shadow-red-900/50">
                        攻撃する (裏切る)
                    </button>
                </div>
            </div>
        </div>
    );
};