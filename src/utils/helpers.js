// src/utils/helpers.js
import { DAIMYO_INFO } from '../data/daimyos';

export const getRiceMarketPrice = (turn) => {
    // 秋(収穫期)は安く、春(端境期)は高い
    const season = (turn - 1) % 4; // 0:春, 1:夏, 2:秋, 3:冬
    const basePrice = 1.0;
    const fluctuation = Math.sin(turn * 0.5) * 0.2; 
    
    // 季節変動: 秋(2)は安く、春(0)は高く
    let seasonFactor = 0;
    if (season === 0) seasonFactor = 0.3; // 春: 高騰
    if (season === 2) seasonFactor = -0.3; // 秋: 暴落

    return Math.max(0.5, (basePrice + fluctuation + seasonFactor).toFixed(2));
};

// ★修正: 開始年を受け取れるように変更（デフォルトは1560）
export const getFormattedDate = (turn, startYear = 1560) => {
    const year = startYear + Math.floor((turn - 1) / 4);
    const seasons = ['春', '夏', '秋', '冬'];
    const season = seasons[(turn - 1) % 4];
    return `${year}年 ${season}`;
};

// ★拠点の軍役（最大維持可能兵数）
export const getTroopCapacity = (province) => {
    const koku = province.agriculture + province.commerce;
    return koku * 10; 
};

// ★ターンから季節IDを取得
export const getSeason = (turn) => {
    const seasonIdx = (turn - 1) % 4;
    return ['spring', 'summer', 'autumn', 'winter'][seasonIdx];
  };
  
// ★季節と大名の制度に応じたアクションコスト計算
export const getActionCost = (actionType, baseCost, turn, daimyoId) => {
  const season = getSeason(turn);
  const daimyo = DAIMYO_INFO[daimyoId];
  const system = daimyo?.militarySystem || 'standard';
  const isBusySeason = season === 'summer' || season === 'autumn';
  
  let modifier = 1.0;

  // 農繁期(夏・秋)の軍事行動コスト
  if (isBusySeason && ['attack', 'move', 'recruit', 'forced_recruit'].includes(actionType)) {
      if (system === 'separated') {
          // 兵農分離: 影響なし
          modifier = 1.0;
      } else if (system === 'ichiryo') {
          // 一領具足: 致命的コスト（ロジック側で農業減などのペナルティも追加されるがコストも増える）
          modifier = 3.0;
      } else {
          // 標準: コスト増
          modifier = 1.5;
      }
  }
  
  // 冬の進軍
  if (season === 'winter' && ['attack', 'move'].includes(actionType)) {
     modifier = Math.max(modifier, 2.0);
  }

  return {
      ...baseCost,
      gold: Math.floor(baseCost.gold * modifier),
      rice: Math.floor(baseCost.rice * modifier)
  };
};