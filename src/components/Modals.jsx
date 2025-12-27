// src/components/Modals.jsx
import React, { useState, useEffect } from 'react';
import { MessageCircle, History, XCircle, Scale, Crown, Zap, Landmark, Ship, Star, Handshake, Users, Sword, Shield, RefreshCw, Trophy, Skull, Eye, Scroll, Image as ImageIcon, ArrowUp, ArrowDown, Coins, Wheat } from 'lucide-react';
import { DAIMYO_INFO, TITLES, COURT_RANKS } from '../data/daimyos';
import { COSTS } from '../data/constants';

// ... (既存のコンポーネント: HistoricalEventModal, IncomingRequestModal, LogHistoryModal, MarketModal, TitlesModal, DonateModal, TradeModal, NegotiationScene, DaimyoListModal, BattleScene, GameOverScreen, TroopSelector, RecruitSelector, ReinforcementRequestModal はそのまま保持してください)
// ※ 以下の InvestmentSelector をファイル末尾に追加・確認してください

export const InvestmentSelector = ({ type, maxGold, maxRice, onConfirm, onCancel }) => {
    const isCultivate = type === 'cultivate';
    const [gold, setGold] = useState(50);
    const [rice, setRice] = useState(isCultivate ? 50 : 0);

    // 効果予測 (10につき+1)
    const predictedBoost = Math.floor((gold + rice) / 10);
    
    // 最大入力可能額 
    const limitGold = Math.max(0, maxGold);
    const limitRice = Math.max(0, maxRice);

    return (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-stone-800 text-white p-6 rounded-xl border border-yellow-600 shadow-2xl w-full max-w-sm">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-yellow-400">
                    {type === 'develop' ? <Coins size={24} /> : <Wheat size={24} />}
                    {type === 'develop' ? '商業投資' : '開墾投資'}
                </h3>
                
                <div className="mb-6 space-y-4">
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="flex items-center gap-1 text-yellow-300"><Coins size={14}/> 資金投入</span>
                            <span className="text-stone-400">所持: {limitGold}</span>
                        </div>
                        <input 
                            type="range" min="0" max={limitGold} step="10" 
                            value={gold} onChange={(e) => setGold(parseInt(e.target.value))} 
                            className="w-full h-2 bg-stone-600 rounded-lg appearance-none cursor-pointer accent-yellow-500" 
                        />
                        <div className="text-right font-mono font-bold text-xl">{gold}</div>
                    </div>

                    {isCultivate && (
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="flex items-center gap-1 text-green-300"><Wheat size={14}/> 種籾・資材投入</span>
                                <span className="text-stone-400">所持: {limitRice}</span>
                            </div>
                            <input 
                                type="range" min="0" max={limitRice} step="10" 
                                value={rice} onChange={(e) => setRice(parseInt(e.target.value))} 
                                className="w-full h-2 bg-stone-600 rounded-lg appearance-none cursor-pointer accent-green-500" 
                            />
                            <div className="text-right font-mono font-bold text-xl">{rice}</div>
                        </div>
                    )}
                </div>

                <div className="bg-stone-900 p-3 rounded mb-6 text-center border border-stone-700">
                    <div className="text-xs text-stone-400">効果予測</div>
                    <div className="text-2xl font-bold text-white">+{predictedBoost} <span className="text-sm font-normal">{type==='develop'?'商業':'石高'}</span></div>
                </div>

                <div className="flex gap-4">
                    <button onClick={onCancel} className="flex-1 py-2 bg-stone-600 rounded font-bold hover:bg-stone-500">キャンセル</button>
                    <button 
                        onClick={() => onConfirm(gold, rice)} 
                        disabled={predictedBoost <= 0}
                        className="flex-1 py-2 bg-yellow-700 hover:bg-yellow-600 rounded font-bold flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                        実行 <Zap size={14} className="text-white"/>
                    </button>
                </div>
            </div>
        </div>
    );
};

// ... (他に必要なExportがあればここに)
// HistoricalEventModal, IncomingRequestModal, LogHistoryModal, MarketModal, TitlesModal, DonateModal, TradeModal, NegotiationScene, DaimyoListModal, BattleScene, GameOverScreen, TroopSelector, RecruitSelector, ReinforcementRequestModal も忘れずにExportに含まれていることを確認してください。