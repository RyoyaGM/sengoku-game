// src/components/MapComponents.jsx
import React, { useState } from 'react';
import { Coins, Wheat, Users, TrendingUp, Activity, Skull, Shield, Swords, ArrowRight, Heart, Handshake, Crown } from 'lucide-react';
import { DAIMYO_INFO } from '../data/daimyos';
import { SEA_ROUTES } from '../data/provinces';
import { COSTS } from '../data/constants';

export const GameMap = ({ 
    provinces, viewingRelationId, playerDaimyoId, 
    alliances, ceasefires, coalition, 
    selectedProvinceId, attackSourceId, transportSourceId, 
    onSelectProvince,
    isEditMode, onProvinceDragStart,
    iconSize = 40 
}) => {
    const currentViewId = viewingRelationId || playerDaimyoId;

    return (
        <svg viewBox="0 0 7000 11000" className="w-full h-full drop-shadow-2xl filter" style={{filter: 'saturate(1.1) contrast(1.1)'}}>
            {provinces.map(p => p.neighbors.map(nid => {
                const n = provinces.find(neighbor => neighbor.id === nid);
                if (!n || p.id > n.id) return null;
                const isSeaRoute = SEA_ROUTES.some(pair => (pair[0]===p.id && pair[1]===n.id) || (pair[1]===p.id && pair[0]===n.id));
                return <line key={`${p.id}-${n.id}`} x1={p.cx} y1={p.cy} x2={n.cx} y2={n.cy} stroke={isSeaRoute ? "#0ea5e9" : "white"} strokeWidth={isSeaRoute ? "3" : "2"} strokeDasharray={isSeaRoute ? "8,6" : "4,4"} opacity={isSeaRoute ? "0.6" : "0.3"} />;
            }))}
            
            {provinces.map((p) => {
                const daimyo = DAIMYO_INFO[p.ownerId] || { color: 'bg-stone-500', fill: '#6b7280' };
                let fill = daimyo.fill || '#6b7280';
                if (!daimyo.fill) {
                    if (daimyo.color.includes('red')) fill = '#ef4444';
                    else if (daimyo.color.includes('blue')) fill = '#3b82f6';
                    else if (daimyo.color.includes('green')) fill = '#22c55e';
                    else if (daimyo.color.includes('yellow')) fill = '#eab308';
                    else if (daimyo.color.includes('purple')) fill = '#a855f7';
                    else if (daimyo.color.includes('orange')) fill = '#f97316';
                    else if (daimyo.color.includes('cyan')) fill = '#06b6d4';
                    else if (daimyo.color.includes('pink')) fill = '#ec4899';
                    else if (daimyo.color.includes('stone')) fill = '#57534e';
                    else if (daimyo.color.includes('indigo')) fill = '#6366f1';
                    else if (daimyo.color.includes('teal')) fill = '#14b8a6';
                }

                const isSelected = selectedProvinceId === p.id;
                
                let strokeColor = "#fff"; 
                let strokeWidth = "2";
                let radius = iconSize; 

                if (isEditMode) {
                    strokeColor = "#facc15"; 
                    strokeWidth = "3";
                    radius = iconSize;
                } else if (currentViewId && p.ownerId !== currentViewId && p.ownerId !== 'Minor') {
                    const isAllied = alliances[currentViewId]?.includes(p.ownerId);
                    const isCeasefire = ceasefires[currentViewId]?.[p.ownerId] > 0;
                    const isCoalitionMember = coalition?.members.includes(p.ownerId);
                    const amICoalitionMember = coalition?.members.includes(currentViewId);

                    if (isAllied) { strokeColor = "#3b82f6"; strokeWidth = "6"; }
                    else if (isCoalitionMember && amICoalitionMember) { strokeColor = "#facc15"; strokeWidth = "6"; }
                    else if (isCeasefire) { strokeColor = "#22c55e"; strokeWidth = "6"; }
                    else if (coalition?.target === p.ownerId && amICoalitionMember) { strokeColor = "#ef4444"; strokeWidth = "6"; }
                }

                const isTargetable = !isEditMode && attackSourceId && provinces.find(pr => pr.id === attackSourceId)?.neighbors.includes(p.id) && p.ownerId !== playerDaimyoId;
                const isTransportTarget = !isEditMode && transportSourceId && provinces.find(pr => pr.id === transportSourceId)?.neighbors.includes(p.id) && p.ownerId === playerDaimyoId;

                if (!isEditMode) {
                    if (isSelected || attackSourceId === p.id || transportSourceId === p.id) { strokeColor = "#facc15"; strokeWidth = "8"; radius = iconSize * 1.1; }
                    else if (isTargetable) { strokeColor = "#ef4444"; strokeWidth = "8"; }
                    else if (isTransportTarget) { strokeColor = "#3b82f6"; strokeWidth = "8"; }
                }

                const fontSizeName = iconSize * 0.6;
                const fontSizeTroops = iconSize * 0.5;
                const barWidth = iconSize * 1.5;
                const barHeight = iconSize * 0.75;
                const barOffsetX = -barWidth / 2;
                const barOffsetY = iconSize * 0.25;

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
                        <circle cx={p.cx} cy={p.cy} r={radius} fill={fill} stroke={strokeColor} strokeWidth={strokeWidth} className={(isTargetable || isTransportTarget) ? 'animate-pulse' : ''} />
                        
                        {isEditMode ? (
                            <text x={p.cx} y={p.cy - iconSize * 1.1} textAnchor="middle" fill="yellow" fontSize="16" fontWeight="bold" className="pointer-events-none stroke-black stroke-2">
                                {Math.round(p.cx/2)},{Math.round(p.cy/2)}
                            </text>
                        ) : null}

                        <text x={p.cx + (p.labelOffset?.x || 0)} y={p.cy + (p.labelOffset?.y || 0) - (fontSizeName * 0.6)} textAnchor="middle" fill="white" fontSize={fontSizeName} fontWeight="bold" className="pointer-events-none drop-shadow-md" style={{ textShadow: '0px 0px 4px rgba(0,0,0,0.8)' }}>{p.name}</text>
                        
                        <g transform={`translate(${p.cx + barOffsetX}, ${p.cy + barOffsetY})`} className="pointer-events-none">
                            <rect x="0" y="0" width={barWidth} height={barHeight} rx={barHeight * 0.2} fill="rgba(0,0,0,0.6)" stroke={strokeColor} strokeWidth="1" />
                            <text x={barWidth / 2} y={barHeight * 0.73} textAnchor="middle" fill="white" fontSize={fontSizeTroops} fontWeight="bold">{p.troops}</text>
                        </g>
                        
                        {!isEditMode && p.loyalty < 30 && <text x={p.cx + iconSize*0.6} y={p.cy - iconSize*0.6} fontSize={iconSize*0.75}>🔥</text>}
                        
                        {isTargetable && <text x={p.cx} y={p.cy} textAnchor="middle" dominantBaseline="central" fontSize={iconSize} fill="white" fontWeight="bold" className="animate-pulse pointer-events-none">攻</text>}
                        {isTransportTarget && <text x={p.cx} y={p.cy} textAnchor="middle" dominantBaseline="central" fontSize={iconSize} fill="white" fontWeight="bold" className="animate-pulse pointer-events-none">輸</text>}
                        {!isEditMode && coalition?.target === p.ownerId && <text x={p.cx} y={p.cy - iconSize} className="animate-pulse" fontSize={iconSize*0.75}>🎯</text>}
                    </g>
                );
            })}
        </svg>
    );
};

export const ProvincePopup = ({ 
    selectedProvince, daimyoStats, playerDaimyoId, isPlayerTurn, viewingRelationId,
    shogunId, alliances, ceasefires, coalition, onClose, onAction, isEditMode 
}) => {
    const [activeTab, setActiveTab] = useState('domestic');

    if (!selectedProvince) return null;

    const p = selectedProvince;
    const owner = DAIMYO_INFO[p.ownerId] || { name: '独立勢力', color: 'bg-stone-500' };
    const isOwner = p.ownerId === playerDaimyoId;
    
    const pop = p.population || 10000;
    const urb = p.urbanization || 0.1;
    const commDev = p.commerceDev || 0;
    const agriDev = p.agriDev || 0;
    const baseAgri = p.baseAgri || 1.0;

    const urbanPop = Math.floor(pop * urb);
    const ruralPop = Math.floor(pop * (1 - urb));
    const TAX_RATE = 0.015;
    const HARVEST_RATE = 0.02;
    
    const estGoldIncome = Math.floor(urbanPop * (commDev / 100) * TAX_RATE);
    const estRiceIncome = Math.floor(ruralPop * (agriDev / 100) * baseAgri * HARVEST_RATE);
    const maxRecruit = Math.floor(ruralPop * 0.1);

    return (
        <div className="fixed top-24 left-4 z-40 bg-stone-900/95 text-white p-4 rounded-xl border border-yellow-600 shadow-2xl w-80 backdrop-blur-sm animate-fade-in max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-3 border-b border-stone-700 pb-2">
                <div>
                    <div className="text-xl font-bold flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${owner.color} border border-stone-400`}></span>
                        {p.name}
                        {p.ownerId === shogunId && <span className="text-xs bg-yellow-600 text-black px-1 rounded ml-1">将軍</span>}
                    </div>
                    <div className="text-stone-400 text-xs">{owner.name}家 支配</div>
                </div>
                <button onClick={onClose} className="text-stone-400 hover:text-white bg-stone-800 rounded-full p-1"><Shield size={16}/></button>
            </div>

            <div className="space-y-3 mb-4">
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-stone-800 p-2 rounded border border-stone-700">
                        <div className="text-stone-400 mb-1 flex items-center gap-1"><Users size={12}/> 総人口</div>
                        <div className="text-lg font-mono font-bold text-white">{pop.toLocaleString()}</div>
                        <div className="text-[10px] text-stone-500">都市化率: {(urb * 100).toFixed(0)}%</div>
                    </div>
                    <div className="bg-stone-800 p-2 rounded border border-stone-700">
                        <div className="text-stone-400 mb-1 flex items-center gap-1"><Shield size={12}/> 軍事</div>
                        <div className="font-mono">
                            <span className="text-blue-300 font-bold">{p.troops}</span>
                            <span className="text-stone-500 mx-1">/</span>
                            <span className="text-stone-500 text-[10px]">役{maxRecruit}</span>
                        </div>
                        <div className="text-[10px] text-stone-500 mt-1 flex justify-between">
                            <span>守:{p.defense}</span>
                            <span>練:{p.training}</span>
                            <span>忠:{p.loyalty}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-stone-800 p-2 rounded border border-stone-700 space-y-2">
                    <div>
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-xs text-yellow-400 flex items-center gap-1"><Coins size={12}/> 商業 (都:{urbanPop.toLocaleString()})</span>
                            <span className="text-xs font-mono">Lv.{commDev}%</span>
                        </div>
                        <div className="w-full bg-stone-700 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-yellow-500 h-full" style={{ width: `${Math.min(100, commDev)}%` }}></div>
                        </div>
                        <div className="text-right text-[10px] text-stone-400">予想月収: <span className="text-yellow-200">+{estGoldIncome}</span> 金</div>
                    </div>

                    <div>
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-xs text-green-400 flex items-center gap-1"><Wheat size={12}/> 農業 (農:{ruralPop.toLocaleString()})</span>
                            <span className="text-xs font-mono">Lv.{agriDev}%</span>
                        </div>
                        <div className="w-full bg-stone-700 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-green-600 h-full" style={{ width: `${Math.min(100, agriDev)}%` }}></div>
                        </div>
                        <div className="text-right text-[10px] text-stone-400">秋収穫: <span className="text-green-200">+{estRiceIncome}</span> 兵糧</div>
                    </div>
                </div>
            </div>

            {isOwner && isPlayerTurn && !isEditMode && (
                <div className="space-y-2">
                    <div className="flex border-b border-stone-700">
                        {['domestic', 'military', 'diplomacy', 'fame'].map(tab => (
                            <button 
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-2 text-xs font-bold transition-colors ${
                                    activeTab === tab 
                                    ? 'text-yellow-500 border-b-2 border-yellow-500 bg-stone-800' 
                                    : 'text-stone-500 hover:text-stone-300 hover:bg-stone-800/50'
                                }`}
                            >
                                {tab === 'domestic' ? '内政' : tab === 'military' ? '軍事' : tab === 'diplomacy' ? '外交' : '名声'}
                            </button>
                        ))}
                    </div>

                    <div className="min-h-[140px]">
                        {activeTab === 'domestic' && (
                            <div className="grid grid-cols-2 gap-2 animate-fade-in">
                                <button onClick={() => onAction('develop', p.id)} className="flex flex-col items-center justify-center p-2 bg-stone-800 hover:bg-yellow-900/50 border border-stone-600 hover:border-yellow-500 rounded transition-colors">
                                    <TrendingUp size={18} className="text-yellow-500 mb-1"/>
                                    <span className="text-xs font-bold">商業投資</span>
                                </button>
                                <button onClick={() => onAction('cultivate', p.id)} className="flex flex-col items-center justify-center p-2 bg-stone-800 hover:bg-green-900/50 border border-stone-600 hover:border-green-500 rounded transition-colors">
                                    <Activity size={18} className="text-green-500 mb-1"/>
                                    <span className="text-xs font-bold">開墾・治水</span>
                                </button>
                                <button onClick={() => onAction('market', p.id)} className="flex flex-col items-center justify-center p-2 bg-stone-800 hover:bg-yellow-900/30 border border-stone-600 hover:border-yellow-500 rounded transition-colors">
                                    <Coins size={18} className="text-yellow-500 mb-1"/>
                                    <span className="text-xs font-bold">楽市 (米→金)</span>
                                </button>
                                <button onClick={() => onAction('trade', p.id)} className="flex flex-col items-center justify-center p-2 bg-stone-800 hover:bg-green-900/30 border border-stone-600 hover:border-green-500 rounded transition-colors">
                                    <Wheat size={18} className="text-green-500 mb-1"/>
                                    <span className="text-xs font-bold">交易 (金→米)</span>
                                </button>
                                <button onClick={() => onAction('fortify', p.id)} className="col-span-2 flex flex-row items-center justify-center p-2 bg-stone-800 hover:bg-stone-700 border border-stone-600 rounded transition-colors gap-2">
                                    <Shield size={16} className="text-stone-400"/>
                                    <span className="text-xs">城郭普請 (防御強化)</span>
                                </button>
                            </div>
                        )}

                        {activeTab === 'military' && (
                            <div className="grid grid-cols-2 gap-2 animate-fade-in">
                                <button onClick={() => onAction('recruit', p.id)} className="flex flex-col items-center justify-center p-2 bg-stone-800 hover:bg-blue-900/50 border border-stone-600 hover:border-blue-500 rounded transition-colors">
                                    <Users size={18} className="text-blue-500 mb-1"/>
                                    <span className="text-xs font-bold">徴兵</span>
                                </button>
                                <button onClick={() => onAction('train', p.id)} className="flex flex-col items-center justify-center p-2 bg-stone-800 hover:bg-red-900/50 border border-stone-600 hover:border-red-500 rounded transition-colors">
                                    <Swords size={18} className="text-red-500 mb-1"/>
                                    <span className="text-xs font-bold">訓練</span>
                                </button>
                                <button onClick={() => onAction('move', p.id)} className="flex flex-col items-center justify-center p-2 bg-stone-800 hover:bg-blue-900/30 border border-stone-600 hover:border-blue-500 rounded transition-colors">
                                    <ArrowRight size={18} className="text-blue-400 mb-1"/>
                                    <span className="text-xs font-bold">輸送・移動</span>
                                </button>
                                <button onClick={() => onAction('forced_recruit', p.id)} className="flex flex-col items-center justify-center p-2 bg-stone-800 hover:bg-red-950 border border-stone-600 hover:border-red-500 rounded transition-colors">
                                    <Skull size={18} className="text-red-500 mb-1"/>
                                    <span className="text-xs text-red-400">強制徴兵</span>
                                </button>
                            </div>
                        )}

                        {activeTab === 'diplomacy' && (
                            <div className="flex flex-col items-center justify-center h-32 text-stone-500 text-xs text-center animate-fade-in border border-stone-800 rounded bg-stone-800/30 p-4">
                                <Handshake size={32} className="mb-2 opacity-50"/>
                                <p>他国勢力の領地を選択するか<br/>全体マップメニューから<br/>外交を行ってください。</p>
                            </div>
                        )}

                        {activeTab === 'fame' && (
                            <div className="grid grid-cols-2 gap-2 animate-fade-in">
                                <button onClick={() => onAction('pacify', p.id)} className="col-span-2 flex flex-row items-center justify-center p-3 bg-stone-800 hover:bg-pink-900/30 border border-stone-600 hover:border-pink-500 rounded transition-colors gap-2">
                                    <Heart size={18} className="text-pink-500"/>
                                    <span className="text-xs font-bold">民心掌握 (忠誠回復)</span>
                                </button>
                                <button className="flex flex-col items-center justify-center p-2 bg-stone-800/50 border border-stone-700 text-stone-500 rounded cursor-not-allowed">
                                    <Coins size={18} className="mb-1"/>
                                    <span className="text-xs">寄付 (未)</span>
                                </button>
                                <button className="flex flex-col items-center justify-center p-2 bg-stone-800/50 border border-stone-700 text-stone-500 rounded cursor-not-allowed">
                                    <Crown size={18} className="mb-1"/>
                                    <span className="text-xs">朝廷 (未)</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {!isOwner && isPlayerTurn && !isEditMode && (
                <div className="mt-2">
                   <button onClick={() => onAction('attack', p.id)} className="w-full py-2 bg-red-900 hover:bg-red-800 border border-red-500 rounded font-bold flex items-center justify-center gap-2 text-sm">
                       <Swords size={18}/> 出陣 (攻撃)
                   </button>
                </div>
            )}
        </div>
    );
};