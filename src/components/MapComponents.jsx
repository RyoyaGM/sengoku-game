// src/components/MapComponents.jsx
import React, { useState } from 'react';
import { Coins, Wheat, Crown, Zap, Skull } from 'lucide-react'; 
import { DAIMYO_INFO } from '../data/daimyos';
import { SEA_ROUTES } from '../data/provinces';
import { COSTS } from '../data/constants';

export const GameMap = ({ 
    provinces, viewingRelationId, playerDaimyoId, 
    alliances, ceasefires, coalition, 
    selectedProvinceId, attackSourceId, transportSourceId, 
    onSelectProvince,
    isEditMode, onProvinceDragStart 
}) => {
    const currentViewId = viewingRelationId || playerDaimyoId;

    return (
        <svg viewBox="0 0 2800 4400" className="w-[2800px] h-[4400px] select-none overflow-visible">
            {provinces.map(p => p.neighbors.map(nid => {
                const n = provinces.find(neighbor => neighbor.id === nid);
                if (!n || p.id > n.id) return null;
                const isSeaRoute = SEA_ROUTES.some(pair => (pair[0]===p.id && pair[1]===n.id) || (pair[1]===p.id && pair[0]===n.id));
                return <line key={`${p.id}-${n.id}`} x1={p.cx} y1={p.cy} x2={n.cx} y2={n.cy} stroke={isSeaRoute ? "#0ea5e9" : "white"} strokeWidth={isSeaRoute ? "2" : "1"} strokeDasharray={isSeaRoute ? "6,4" : "3,3"} opacity={isSeaRoute ? "0.6" : "0.3"} />;
            }))}
            
            {provinces.map((p) => {
                const daimyo = DAIMYO_INFO[p.ownerId] || { fill: '#6b7280' };
                const isSelected = selectedProvinceId === p.id;
                
                let strokeColor = "#fff"; 
                let strokeWidth = "1";
                let radius = 24;

                if (isEditMode) {
                    strokeColor = "#facc15"; 
                    strokeWidth = "2";
                    radius = 24;
                } else if (currentViewId && p.ownerId !== currentViewId && p.ownerId !== 'Minor') {
                    const isAllied = alliances[currentViewId]?.includes(p.ownerId);
                    const isCeasefire = ceasefires[currentViewId]?.[p.ownerId] > 0;
                    const isCoalitionMember = coalition?.members.includes(p.ownerId);
                    const amICoalitionMember = coalition?.members.includes(currentViewId);

                    if (isAllied) { strokeColor = "#3b82f6"; strokeWidth = "3"; }
                    else if (isCoalitionMember && amICoalitionMember) { strokeColor = "#facc15"; strokeWidth = "3"; }
                    else if (isCeasefire) { strokeColor = "#22c55e"; strokeWidth = "3"; }
                    else if (coalition?.target === p.ownerId && amICoalitionMember) { strokeColor = "#ef4444"; strokeWidth = "3"; }
                }

                const isTargetable = !isEditMode && attackSourceId && provinces.find(pr => pr.id === attackSourceId)?.neighbors.includes(p.id) && p.ownerId !== playerDaimyoId;
                const isTransportTarget = !isEditMode && transportSourceId && provinces.find(pr => pr.id === transportSourceId)?.neighbors.includes(p.id) && p.ownerId === playerDaimyoId;

                if (!isEditMode) {
                    if (isSelected || attackSourceId === p.id || transportSourceId === p.id) { strokeColor = "#facc15"; strokeWidth = "4"; radius = 28; }
                    else if (isTargetable) { strokeColor = "#ef4444"; strokeWidth = "4"; }
                    else if (isTransportTarget) { strokeColor = "#3b82f6"; strokeWidth = "4"; }
                }

                return (
                    <g 
                        key={p.id} 
                        onClick={() => onSelectProvince(p.id, isTargetable, isTransportTarget)} 
                        onMouseDown={(e) => {
                            if (isEditMode) {
                                e.stopPropagation();
                                onProvinceDragStart(p.id, e);
                            }
                        }}
                        className={`transition-all duration-300 ${isEditMode ? 'cursor-move hover:opacity-80' : 'cursor-pointer'}`}
                    >
                        <circle cx={p.cx} cy={p.cy} r={radius} fill={daimyo.fill} stroke={strokeColor} strokeWidth={strokeWidth} className={(isTargetable || isTransportTarget) ? 'animate-pulse' : ''} />
                        
                        {isEditMode ? (
                            <text x={p.cx} y={p.cy - 30} textAnchor="middle" fill="yellow" fontSize="12" fontWeight="bold" className="pointer-events-none stroke-black stroke-2">
                                {Math.round(p.cx/2)},{Math.round(p.cy/2)}
                            </text>
                        ) : null}

                        <text x={p.cx + (p.labelOffset?.x || 0)} y={p.cy + (p.labelOffset?.y || 0) - 8} textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" className="pointer-events-none drop-shadow-md" style={{ textShadow: '0px 0px 3px rgba(0,0,0,0.8)' }}>{p.name}</text>
                        <g transform={`translate(${p.cx-15}, ${p.cy+5})`} className="pointer-events-none"><rect x="0" y="0" width="30" height="18" rx="4" fill="rgba(0,0,0,0.5)" /><text x="15" y="13" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">{p.troops}</text></g>
                        
                        {!isEditMode && p.loyalty < 30 && <text x={p.cx + 20} y={p.cy - 20} fontSize="16">🔥</text>}
                        
                        {isTargetable && <text x={p.cx} y={p.cy} textAnchor="middle" dominantBaseline="central" fontSize="28" fill="white" fontWeight="bold" className="animate-pulse pointer-events-none">攻</text>}
                        {isTransportTarget && <text x={p.cx} y={p.cy} textAnchor="middle" dominantBaseline="central" fontSize="28" fill="white" fontWeight="bold" className="animate-pulse pointer-events-none">輸</text>}
                        {!isEditMode && coalition?.target === p.ownerId && <text x={p.cx} y={p.cy-30} className="animate-pulse" fontSize="20">🎯</text>}
                    </g>
                );
            })}
        </svg>
    );
};

export const ProvincePopup = ({ selectedProvince, daimyoStats, playerDaimyoId, isPlayerTurn, viewingRelationId, shogunId, alliances, ceasefires, coalition, onClose, onAction, isEditMode }) => {
    if (!selectedProvince) return null;
    const p = selectedProvince;
    const isOwned = p.ownerId === playerDaimyoId;
    const daimyo = DAIMYO_INFO[p.ownerId] || { name: '不明', color: 'bg-gray-500' };
    const [tab, setTab] = useState('military');

    const canInteract = !viewingRelationId && isPlayerTurn;
    const isAllied = alliances[playerDaimyoId]?.includes(p.ownerId);
    const isCeasefire = ceasefires[playerDaimyoId]?.[p.ownerId] > 0;

    const CostBadge = ({ ap = 1 }) => (ap > 0 ? <span className="absolute top-0 right-0 bg-yellow-600 text-black text-[9px] px-1 rounded-bl-md font-bold flex items-center">⚡{ap}</span> : null);

    return (
        <div className="fixed top-[100px] left-[20px] z-30 w-80 bg-stone-800/95 text-white p-4 rounded-lg border border-stone-500 shadow-2xl backdrop-blur-sm animate-fade-in max-h-[calc(100vh-120px)] overflow-y-auto" onMouseDown={e => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-stone-600 pb-2 mb-2">
                <div>
                    <span className="font-bold text-lg">{p.name}</span>
                    <span className={`ml-2 text-xs ${daimyo.color} px-2 py-0.5 rounded text-white`}>{daimyo.name}</span>
                    {isAllied && <span className="ml-1 text-xs bg-blue-600 px-1 rounded">同盟</span>}
                    {isCeasefire && <span className="ml-1 text-xs bg-green-700 px-1 rounded">停戦</span>}
                    {shogunId === p.ownerId && <span className="ml-1 text-xs bg-yellow-600 px-1 rounded">将軍</span>}
                </div>
                <button onClick={onClose} className="text-stone-400 hover:text-white">✕</button>
            </div>
            
            {isEditMode ? (
                <div className="mb-4 bg-stone-900 p-2 rounded border border-yellow-600">
                    <div className="text-yellow-400 font-bold text-sm mb-1">【編集】所属大名の変更</div>
                    <select className="w-full bg-stone-800 text-white border border-stone-600 rounded p-1" value={p.ownerId} onChange={(e) => onAction('change_owner', p.id, e.target.value)}>
                        {Object.keys(DAIMYO_INFO).map(id => (<option key={id} value={id}>{DAIMYO_INFO[id].name}</option>))}
                    </select>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-3 gap-1 mb-2 text-xs bg-black/30 p-2 rounded">
                        <div className="flex items-center gap-1 text-yellow-300" title="拠点の軍資金"><Coins size={10}/>{p.gold}</div>
                        <div className="flex items-center gap-1 text-green-300" title="拠点の兵糧"><Wheat size={10}/>{p.rice}</div>
                        <div className="flex items-center gap-1 text-purple-300" title="大名の名声"><Crown size={10}/>{daimyoStats[p.ownerId]?.fame}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                        <div>兵数: {p.troops}</div><div>防御: {p.defense}</div>
                        <div>訓練: {p.training}</div><div>民忠: {p.loyalty}</div>
                        <div>商業: {p.commerce}</div><div>石高: {p.agriculture}</div>
                        <div className="col-span-2">行動力: {p.actionsLeft}/3</div>
                    </div>

                    {canInteract ? (
                        isOwned ? (
                            <div>
                                <div className="flex border-b border-stone-600 mb-2">
                                     {['military', 'domestic', 'fame'].map(t => (
                                         <button key={t} onClick={() => setTab(t)} className={`flex-1 py-1 text-xs font-bold ${tab===t ? 'bg-stone-600 text-white' : 'text-stone-400'}`}>
                                             {t==='military'?'軍事':t==='domestic'?'内政':'名声'}
                                         </button>
                                     ))}
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {tab === 'military' && (
                                        <>
                                        <button onClick={() => onAction('attack', p.id)} className="cmd-btn relative col-span-2 bg-red-900/50 border-red-700 text-red-100">出陣 <span className="text-[10px] ml-1">({COSTS.attack.gold}/{COSTS.attack.rice} +携行)</span><CostBadge/></button>
                                        <button onClick={() => onAction('transport', p.id)} className="cmd-btn relative col-span-2 bg-blue-900/50 border-blue-700 text-blue-100">輸送 <span className="text-[10px] ml-1">({COSTS.move.gold}/{COSTS.move.rice})</span><CostBadge/></button>
                                        <button onClick={() => onAction('recruit', p.id)} className="cmd-btn relative bg-blue-900/50 border-blue-700 text-blue-100">徴兵 <span className="text-[10px] ml-1">({COSTS.recruit.gold}/{COSTS.recruit.rice})</span><CostBadge/></button>
                                        <button onClick={() => onAction('forced_recruit', p.id)} className="cmd-btn relative bg-red-950/80 border-red-800 text-red-500 font-bold flex items-center justify-center gap-1"><Skull size={12}/>強制徴兵 <CostBadge/></button>
                                        <button onClick={() => onAction('train', p.id)} className="cmd-btn relative bg-orange-900/50 border-orange-700 text-orange-100">訓練 <span className="text-[10px] ml-1">({COSTS.train.gold})</span><CostBadge/></button>
                                        <button onClick={() => onAction('fortify', p.id)} className="cmd-btn relative bg-stone-700 border-stone-500 text-stone-100 ">普請 <span className="text-[10px] ml-1">({COSTS.fortify.gold})</span><CostBadge/></button>
                                        </>
                                    )}
                                    {tab === 'domestic' && (
                                        <>
                                        <button onClick={() => onAction('develop', p.id)} className="cmd-btn relative bg-yellow-900/50 border-yellow-700 text-yellow-100">商業 <span className="text-[10px] ml-1">({COSTS.develop.gold})</span><CostBadge/></button>
                                        <button onClick={() => onAction('cultivate', p.id)} className="cmd-btn relative bg-green-900/50 border-green-700 text-green-100">開墾 <span className="text-[10px] ml-1">({COSTS.cultivate.gold}/{COSTS.cultivate.rice})</span><CostBadge/></button>
                                        <button onClick={() => onAction('pacify', p.id)} className="cmd-btn relative bg-pink-900/50 border-pink-700 text-pink-100 col-span-2">施し <span className="text-[10px] ml-1">({COSTS.pacify.gold}/{COSTS.pacify.rice})</span><CostBadge/></button>
                                        <button onClick={() => onAction('market', p.id)} className="cmd-btn relative bg-orange-700 border-orange-500 text-white col-span-2">楽市楽座(米売却) <span className="text-[9px] ml-1 opacity-80">(FREE)</span></button>
                                        <button onClick={() => onAction('trade', p.id)} className="cmd-btn relative bg-teal-800 border-teal-500 text-white col-span-2">貿易 <span className="text-[10px] ml-1">({COSTS.trade.gold})</span><CostBadge/></button>
                                        </>
                                    )}
                                    {tab === 'fame' && (
                                        <div className="col-span-2 text-center text-xs text-gray-400">名声コマンドは調整中です</div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-2">
                                <div className="text-center text-gray-400 text-xs">他国領地への干渉は現在制限されています</div>
                            </div>
                        )
                    ) : (
                        <div className="text-center p-4 bg-stone-900/50 rounded text-stone-400">操作不可</div>
                    )}
                </>
            )}
        </div>
    );
};