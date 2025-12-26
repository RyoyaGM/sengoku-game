// src/components/TransportModal.jsx
import React, { useState } from 'react';

export const TransportModal = ({ maxTroops, maxGold, maxRice, onConfirm, onCancel }) => {
    const [troops, setTroops] = useState(0);
    const [gold, setGold] = useState(0);
    const [rice, setRice] = useState(0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-stone-800 border border-stone-600 p-6 rounded-lg w-96 shadow-2xl animate-fade-in text-white">
                <h3 className="text-xl font-bold mb-4 text-center">輸送物資の選択</h3>
                
                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span>兵士 (最大: {maxTroops})</span>
                            <span className="font-bold">{troops}</span>
                        </div>
                        <input type="range" min="0" max={maxTroops} value={troops} onChange={(e) => setTroops(parseInt(e.target.value))} className="w-full accent-blue-500 cursor-pointer" />
                    </div>
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-yellow-400">金 (最大: {maxGold})</span>
                            <span className="font-bold">{gold}</span>
                        </div>
                        <input type="range" min="0" max={maxGold} value={gold} onChange={(e) => setGold(parseInt(e.target.value))} className="w-full accent-yellow-500 cursor-pointer" />
                    </div>
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-green-400">兵糧 (最大: {maxRice})</span>
                            <span className="font-bold">{rice}</span>
                        </div>
                        <input type="range" min="0" max={maxRice} value={rice} onChange={(e) => setRice(parseInt(e.target.value))} className="w-full accent-green-500 cursor-pointer" />
                    </div>
                </div>

                <div className="flex gap-2 mt-6">
                    <button onClick={onCancel} className="flex-1 bg-stone-600 py-2 rounded hover:bg-stone-500 transition-colors">キャンセル</button>
                    <button onClick={() => onConfirm({ troops, gold, rice })} className="flex-1 bg-blue-700 py-2 rounded hover:bg-blue-600 font-bold transition-colors">輸送実行</button>
                </div>
            </div>
        </div>
    );
};