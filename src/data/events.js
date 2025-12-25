import { DAIMYO_INFO } from './daimyos';

// ▼▼ 画像インポートエリア ▼▼
// ※お手元の画像ファイル名に合わせてパスを変更してください

// 1. 評定 (Hyojo): イベント開始時、作戦会議
import okehazamaHyojoImg from '../assets/okehazama_hyojo.jpg';

// 2. 進軍 (March): 今川の進軍、織田の出陣、桶狭間での対峙
import okehazamaMarchImg from '../assets/okehazama_march.jpg';

// 3. 奇襲成功 (Surprise Success): 織田勝利、今川敗北
import okehazamaSuccessImg from '../assets/okehazama_success.jpg';

// 4. 奇襲失敗 (Surprise Fail): 織田敗北、今川による返り討ち
import okehazamaFailImg from '../assets/okehazama_fail.jpg';

// 5. 籠城 (Rojo): 籠城策を選択した場合
import okehazamaSiegeImg from '../assets/okehazama_rojo.jpg';

// ▲▲ 画像インポートエリアここまで ▲▲


export const HISTORICAL_EVENTS = [
  {
    id: 'okehazama_phase1',
    title: '上洛の機運',
    image: okehazamaHyojoImg, // ▼ パターン1: 評定
    year: 1560,
    season: '夏',
    
    description: (daimyoId) => {
        if (daimyoId === 'Oda') return '駿河の今川義元が不穏な動きを見せています。\n大軍を率いて尾張へ侵攻する構えです。\n清洲城にて評定が開かれていますが、家臣団の意見は割れています。';
        if (daimyoId === 'Imagawa') return '国力は充実し、兵の士気も高まっています。\n館にて重臣たちと評定を行い、上洛の是非を問う時が来ました。\n天下に号令をかける好機です。';
        return '駿河の今川義元が尾張への侵攻を画策しているようです。';
    },

    trigger: (turn, provinces, daimyoStats) => {
      return turn === 2 && daimyoStats['Oda'] && daimyoStats['Imagawa'];
    },

    choices: {
      Oda: [
        {
          id: 'intercept',
          text: '迎撃の策を練る',
          description: '情報の収集を行い、一瞬の隙を探る。',
          type: 'normal',
          resolve: (ctx) => {
              // 次のフェーズへ（進軍・対峙）
              return {
                  title: '桶狭間の戦い - 開戦',
                  image: okehazamaMarchImg, // ▼ パターン2: 進軍
                  description: '報告によれば、今川軍は「桶狭間」付近で休息を取っている模様。\nしかも激しい豪雨が降り始めました。\nこれは天が与えた好機かもしれません。',
                  year: 1560, season: '夏',
                  choices: {
                      Oda: [
                          {
                              text: '乾坤一擲、本陣を急襲する',
                              description: '豪雨に紛れて今川義元の本陣のみを狙う奇策。',
                              resolve: (subCtx) => {
                                  // 確率判定
                                  if (Math.random() < 0.7) {
                                      return resolveOdaVictory(subCtx);
                                  } else {
                                      return resolveOdaDefeat(subCtx);
                                  }
                              }
                          },
                          {
                              text: '籠城し、好機を待つ',
                              description: '清洲城にて防御を固める。',
                              resolve: (subCtx) => {
                                  subCtx.showLog("籠城策を選択しました。長い戦いが始まります。");
                                  
                                  // ▼ パターン5: 籠城
                                  return {
                                      title: '清洲籠城',
                                      image: okehazamaSiegeImg, 
                                      description: '織田信長は籠城策を選択しました。\n城門を固く閉ざし、今川の大軍を迎え撃つ構えです。',
                                      year: 1560, season: '夏'
                                  };
                              }
                          }
                      ]
                  }
              };
          }
        },
        {
          id: 'ignore',
          text: '静観する',
          description: '特別な行動は起こさない。',
          resolve: (ctx) => {
              ctx.showLog("特に行動を起こしませんでした。");
              return null;
          }
        }
      ],
      Imagawa: [
        {
          id: 'march',
          text: '全軍、出陣せよ！',
          description: '大軍を率いて尾張へ侵攻し、上洛を目指す。',
          type: 'normal',
          resolve: (ctx) => {
              // 次のフェーズへ（進軍）
              return {
                  title: '桶狭間での休息',
                  image: okehazamaMarchImg, // ▼ パターン2: 進軍
                  description: '進軍は順調ですが、豪雨に見舞われました。\n兵たちは疲労しており、桶狭間山での休息を求めています。\nこれより先は敵地深くとなりますが...',
                  year: 1560, season: '夏',
                  choices: {
                      Imagawa: [
                          {
                              text: '兵を休ませる',
                              description: '雨が止むまで休息を取り、英気を養う。',
                              resolve: (subCtx) => {
                                  if (Math.random() < 0.8) {
                                      return resolveImagawaDefeat(subCtx);
                                  } else {
                                      subCtx.showLog("何事もなく休息を終えました。兵の士気が回復しました。");
                                      subCtx.setProvinces(prev => prev.map(p => {
                                          if (p.ownerId === 'Imagawa') return { ...p, training: Math.min(100, p.training + 10) };
                                          return p;
                                      }));
                                      // 無事だった場合の結果表示
                                      return {
                                          title: '休息完了',
                                          image: okehazamaMarchImg, // 進軍継続
                                          description: '雨も上がり、兵の疲労も回復しました。\n再び上洛へ向けて進軍を開始します。',
                                          year: 1560, season: '夏'
                                      };
                                  }
                              }
                          },
                          {
                              text: '警戒を厳にし、進軍を続ける',
                              description: 'この雨は敵にとっても好機。油断せずに進む。',
                              resolve: (subCtx) => {
                                  subCtx.showLog("警戒しつつ進軍しました。奇襲を受けることはありませんでしたが、兵に疲労が溜まっています。");
                                  subCtx.setProvinces(prev => prev.map(p => {
                                      if (p.ownerId === 'Imagawa') return { ...p, loyalty: Math.max(0, p.loyalty - 5) };
                                      return p;
                                  }));
                                  return {
                                      title: '進軍継続',
                                      image: okehazamaMarchImg,
                                      description: '警戒を緩めず進軍を続けました。\n織田軍の奇襲を未然に防いだようです。',
                                      year: 1560, season: '夏'
                                  };
                              }
                          }
                      ]
                  }
              };
          }
        },
        {
          id: 'wait',
          text: '時期尚早、好機を待つ',
          description: '今は内政に力を入れるべきだ。出陣を見送る。',
          type: 'normal',
          resolve: (ctx) => {
              ctx.showLog("上洛を見送りました。歴史の歯車が変わったようです。");
              // イベント終了（何も表示しないか、評定終了の絵を出すならここ）
              return null;
          }
        }
      ]
    },

    defaultResolve: (ctx) => {
         return resolveOdaVictory(ctx, true);
    }
  }
];

// ▼ ヘルパー関数: 結果処理

const resolveOdaVictory = (ctx, isAuto = false) => {
    ctx.updateResource('Oda', 1000, 1000, 80);
    ctx.updateResource('Imagawa', -500, -500, -50);
    
    ctx.setProvinces(prev => prev.map(p => {
        if (p.ownerId === 'Imagawa') {
            return { ...p, troops: Math.floor(p.troops * 0.5), loyalty: Math.max(0, p.loyalty - 15) };
        }
        return p;
    }));

    // ▼ パターン3: 奇襲成功
    return {
        title: '桶狭間の戦い - 決着',
        image: okehazamaSuccessImg, 
        description: isAuto 
            ? '【歴史イベント】\n織田信長が今川義元を急襲し、これを討ち取りました。\n今川家は混乱し、勢力が後退しました。'
            : '奇襲成功！\n敵本陣は大混乱に陥り、今川義元を討ち取りました！\nこの勝利により、織田家の名は天下に轟くことでしょう。',
        year: 1560, season: '夏'
    };
};

const resolveOdaDefeat = (ctx) => {
    ctx.updateResource('Oda', 0, 0, -30);
    
    ctx.setProvinces(prev => prev.map(p => {
        if (p.ownerId === 'Oda') {
            return { ...p, troops: Math.floor(p.troops * 0.8) };
        }
        return p;
    }));

    // ▼ パターン4: 奇襲失敗
    return {
        title: '桶狭間の戦い - 敗走',
        image: okehazamaFailImg, 
        description: '奇襲は失敗に終わりました...\n今川軍の厚い守りに阻まれ、多くの兵を失って撤退しました。',
        year: 1560, season: '夏'
    };
};

const resolveImagawaDefeat = (ctx) => {
    ctx.updateResource('Oda', 1000, 1000, 80);
    ctx.updateResource('Imagawa', -500, -500, -50);
    
    ctx.setProvinces(prev => prev.map(p => {
        if (p.ownerId === 'Imagawa') {
            return { ...p, troops: Math.floor(p.troops * 0.5), loyalty: Math.max(0, p.loyalty - 15) };
        }
        return p;
    }));

    // 今川視点の敗北 = 織田の奇襲成功のシーン (あるいは悲劇的な絵)
    // ここでは「奇襲成功」と同じ絵を使用するが、専用の「okehazamaFailImg」等を使ってもよい
    // 文脈的には「敵の奇襲が成功した」＝「自軍の奇襲被弾（失敗状態）」なので okehazamaFailImg でもいいが、
    // "Oda's Success" の絵の方が状況が伝わりやすいケースもある。
    // 今回は「織田の奇襲が成功した絵」を表示する。
    return {
        title: '桶狭間の悲劇',
        image: okehazamaSuccessImg, // 織田軍が攻め込んできている絵を想定
        description: '敵襲！！織田軍の奇襲です！\n油断していた本陣は壊滅し、義元公がお討たれになりました...\n軍は総崩れとなり、撤退を余儀なくされました。',
        year: 1560, season: '夏'
    };
};