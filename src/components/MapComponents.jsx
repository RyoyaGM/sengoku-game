// src/components/MapComponents.jsx
import React from 'react';
import { Coins, Wheat, Users, TrendingUp, Activity, Skull, Shield, Swords } from 'lucide-react'; 
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
        // ★修正: viewBoxを画像サイズ(5600x8800)に合わせる
        <svg viewBox="0 0 7000 11000" className="w-full h-full drop-shadow-2xl filter" style={{filter: 'saturate(1.1) contrast(1.1)'}}>
            {/* 経路の描画 */}
            {provinces.map(p => p.neighbors.map(nid => {
                const n = provinces.find(neighbor => neighbor.id === nid);
                if (!n || p.id > n.id) return null;
                const isSeaRoute = SEA_ROUTES.some(pair => (pair[0]===p.id && pair[1]===n.id) || (pair[1]===p.id && pair[0]===n.id));
                return <line key={`${p.id}-${n.id}`} x1={p.cx} y1={p.cy} x2={n.cx} y2={n.cy} stroke={isSeaRoute ? "#0ea5e9" : "white"} strokeWidth={isSeaRoute ? "3" : "2"} strokeDasharray={isSeaRoute ? "8,6" : "4,4"} opacity={isSeaRoute ? "0.6" : "0.3"} />;
            }))}
            
            {/* プロヴィンス（拠点）の描画 */}
            {provinces.map((p) => {
                const daimyo = DAIMYO_INFO[p.ownerId] || { color: 'bg-stone-500', fill: '#6b7280' };
                // Tailwindの色クラスからSVG用のfill色を決定
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
                
                // ★修正: アイコンサイズを拡大 (radius 24 -> 40)
                let strokeColor = "#fff"; 
                let strokeWidth = "2";
                let radius = 40; 

                if (isEditMode) {
                    strokeColor = "#facc15"; 
                    strokeWidth = "3";
                    radius = 40;
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
                    if (isSelected || attackSourceId === p.id || transportSourceId === p.id) { strokeColor = "#facc15"; strokeWidth = "8"; radius = 44; }
                    else if (isTargetable) { strokeColor = "#ef4444"; strokeWidth = "8"; }
                    else if (isTransportTarget) { strokeColor = "#3b82f6"; strokeWidth = "8"; }
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
                        {/* 円アイコン */}
                        <circle cx={p.cx} cy={p.cy} r={radius} fill={fill} stroke={strokeColor} strokeWidth={strokeWidth} className={(isTargetable || isTransportTarget) ? 'animate-pulse' : ''} />
                        
                        {isEditMode ? (
                            <text x={p.cx} y={p.cy - 45} textAnchor="middle" fill="yellow" fontSize="16" fontWeight="bold" className="pointer-events-none stroke-black stroke-2">
                                {Math.round(p.cx/2)},{Math.round(p.cy/2)}
                            </text>
                        ) : null}

                        {/* 国名 (サイズアップ) */}
                        <text x={p.cx + (p.labelOffset?.x || 0)} y={p.cy + (p.labelOffset?.y || 0) - 15} textAnchor="middle" fill="white" fontSize="24" fontWeight="bold" className="pointer-events-none drop-shadow-md" style={{ textShadow: '0px 0px 4px rgba(0,0,0,0.8)' }}>{p.name}</text>
                        
                        {/* 兵数表示 (サイズアップ) */}
                        <g transform={`translate(${p.cx-30}, ${p.cy+10})`} className="pointer-events-none">
                            <rect x="0" y="0" width="60" height="30" rx="6" fill="rgba(0,0,0,0.6)" stroke={strokeColor} strokeWidth="1" />
                            <text x="30" y="22" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold">{p.troops}</text>
                        </g>
                        
                        {!isEditMode && p.loyalty < 30 && <text x={p.cx + 25} y={p.cy - 25} fontSize="30">🔥</text>}
                        
                        {isTargetable && <text x={p.cx} y={p.cy} textAnchor="middle" dominantBaseline="central" fontSize="40" fill="white" fontWeight="bold" className="animate-pulse pointer-events-none">攻</text>}
                        {isTransportTarget && <text x={p.cx} y={p.cy} textAnchor="middle" dominantBaseline="central" fontSize="40" fill="white" fontWeight="bold" className="animate-pulse pointer-events-none">輸</text>}
                        {!isEditMode && coalition?.target === p.ownerId && <text x={p.cx} y={p.cy-40} className="animate-pulse" fontSize="30">🎯</text>}
                    </g>
                );
            })}
        </svg>
    );
};

// ポップアップ (変更なし、再掲)
export const ProvincePopup = ({ 
    selectedProvince, daimyoStats, playerDaimyoId, isPlayerTurn, viewingRelationId,
    shogunId, alliances, ceasefires, coalition, onClose, onAction, isEditMode 
}) => {
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
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => onAction('develop', p.id)} className="flex flex-col items-center justify-center p-2 bg-stone-800 hover:bg-yellow-900/50 border border-stone-600 hover:border-yellow-500 rounded transition-colors group">
                        <TrendingUp size={18} className="text-yellow-500 mb-1"/>
                        <span className="text-xs font-bold">商業投資</span>
                    </button>
                    <button onClick={() => onAction('cultivate', p.id)} className="flex flex-col items-center justify-center p-2 bg-stone-800 hover:bg-green-900/50 border border-stone-600 hover:border-green-500 rounded transition-colors group">
                        <Activity size={18} className="text-green-500 mb-1"/>
                        <span className="text-xs font-bold">開墾・治水</span>
                    </button>
                    <button onClick={() => onAction('recruit', p.id)} className="flex flex-col items-center justify-center p-2 bg-stone-800 hover:bg-blue-900/50 border border-stone-600 hover:border-blue-500 rounded transition-colors group">
                        <Users size={18} className="text-blue-500 mb-1"/>
                        <span className="text-xs font-bold">徴兵</span>
                    </button>
                    <button onClick={() => onAction('train', p.id)} className="flex flex-col items-center justify-center p-2 bg-stone-800 hover:bg-red-900/50 border border-stone-600 hover:border-red-500 rounded transition-colors group">
                        <Swords size={18} className="text-red-500 mb-1"/>
                        <span className="text-xs font-bold">訓練</span>
                    </button>
                    <button onClick={() => onAction('fortify', p.id)} className="flex flex-col items-center justify-center p-2 bg-stone-800 hover:bg-stone-700 border border-stone-600 rounded transition-colors">
                        <Shield size={16} className="text-stone-400 mb-1"/>
                        <span className="text-xs">城郭普請</span>
                    </button>
                    <button onClick={() => onAction('forced_recruit', p.id)} className="flex flex-col items-center justify-center p-2 bg-stone-800 hover:bg-red-950 border border-stone-600 hover:border-red-500 rounded transition-colors">
                        <Skull size={16} className="text-red-500 mb-1"/>
                        <span className="text-xs text-red-400">強制徴兵</span>
                    </button>
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