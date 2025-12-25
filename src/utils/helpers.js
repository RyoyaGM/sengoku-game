// 日付フォーマット
export const getFormattedDate = (turn) => {
  const startYear = 1560;
  const elapsedYears = Math.floor((turn - 1) / 4);
  const seasonIdx = (turn - 1) % 4;
  const seasons = ['春', '夏', '秋', '冬'];
  return `${startYear + elapsedYears}年 ${seasons[seasonIdx]}`;
};

// 米相場計算
export const getRiceMarketPrice = (turn) => {
  const seasonIdx = (turn - 1) % 4;
  const prices = [1.5, 2.0, 0.6, 1.0]; // 春, 夏, 秋, 冬
  return prices[seasonIdx] || 1.0;
};

// 距離計算
export const getDistance = (p1, p2) => {
    return Math.sqrt(Math.pow(p1.cx - p2.cx, 2) + Math.pow(p1.cy - p2.cy, 2));
};
