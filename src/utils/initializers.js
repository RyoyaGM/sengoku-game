// src/utils/initializers.js
import { PROVINCES } from '../data/provinces';
import { DAIMYO_INFO, HISTORICAL_FAME } from '../data/daimyos';
import { HISTORICAL_ALLIANCES_DATA } from '../data/initial_alliances';

export const INITIAL_PROVINCES = PROVINCES.map(p => ({
  ...p,
  
  // ★追加: 開発限界の設定
  // 初期値の2.5倍を上限とする（都市の規模に応じたキャップ）
  // 商業都市(堺:350) -> 875, 地方(30) -> 75 となり、格差が維持される
  maxCommerce: Math.floor(p.commerce * 2.5),
  maxAgriculture: Math.floor(p.agriculture * 2.5),

  actionsLeft: 3,
  gold: p.gold !== undefined ? p.gold : 300, 
  rice: p.rice !== undefined ? p.rice : 500,
  battleDamage: null
}));

export const INITIAL_RESOURCES = Object.keys(DAIMYO_INFO).reduce((acc, id) => {
    acc[id] = { 
        fame: HISTORICAL_FAME[id] || 0, 
        isAlive: true,
        gold: 0, 
        rice: 0 
    };
    return acc;
}, {});

export const INITIAL_ALLIANCES = Object.keys(DAIMYO_INFO).reduce((acc, id) => {
    acc[id] = [];
    return acc;
}, {});

HISTORICAL_ALLIANCES_DATA.forEach(([id1, id2]) => {
    if (INITIAL_ALLIANCES[id1] && INITIAL_ALLIANCES[id2]) {
        if (!INITIAL_ALLIANCES[id1].includes(id2)) INITIAL_ALLIANCES[id1].push(id2);
        if (!INITIAL_ALLIANCES[id2].includes(id1)) INITIAL_ALLIANCES[id2].push(id1);
    }
});

export const INITIAL_CEASEFIRES = Object.keys(DAIMYO_INFO).reduce((acc, id) => { acc[id] = {}; return acc; }, {});
export const INITIAL_RELATIONS = {};