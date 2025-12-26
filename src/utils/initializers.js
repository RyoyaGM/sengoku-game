// src/utils/initializers.js
import { PROVINCES } from '../data/provinces';
import { DAIMYO_INFO, HISTORICAL_FAME } from '../data/daimyos';

export const INITIAL_PROVINCES = PROVINCES.map(p => ({
  ...p,
  troops: 100,
  agriculture: 100,
  commerce: 100,
  loyalty: 80,
  defense: 40,
  training: 40,
  actionsLeft: 3,
  
  // ★拠点ごとの資源（独立採算制）
  gold: 300, 
  rice: 500,
  
  battleDamage: null
}));

export const INITIAL_RESOURCES = Object.keys(DAIMYO_INFO).reduce((acc, id) => {
    // 大名自体の所持金・兵糧は削除（各拠点に分散）
    // Fame(名声)と生存フラグのみ管理する
    // UI互換性のためにgold, riceは残すが0固定
    acc[id] = { 
        fame: HISTORICAL_FAME[id] || 0, 
        isAlive: true,
        gold: 0, 
        rice: 0 
    };
    return acc;
}, {});

export const INITIAL_ALLIANCES = Object.keys(DAIMYO_INFO).reduce((acc, id) => { acc[id] = []; return acc; }, {});
export const INITIAL_CEASEFIRES = Object.keys(DAIMYO_INFO).reduce((acc, id) => { acc[id] = {}; return acc; }, {});
export const INITIAL_RELATIONS = {};