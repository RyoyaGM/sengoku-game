// src/data/events/okehazama.js

import okehazamaHyojoImg from '../../assets/okehazama_hyojo.jpg';
import okehazamaMarchImg from '../../assets/okehazama_march.jpg';
import okehazamaSuccessImg from '../../assets/okehazama_success.jpg';
import okehazamaFailImg from '../../assets/okehazama_fail.jpg';
import okehazamaSiegeImg from '../../assets/okehazama_rojo.jpg';

// --- ヘルパー関数群 ---

const resolveImagawaMarch = (ctx, isPlayerImagawa) => {
    ctx.showLog("今川義元、2万5千の大軍を率いて尾張へ侵攻を開始！");
    return {
        title: '今川軍、進軍開始',
        image: okehazamaMarchImg,
        description: '「天下に号令をかける時が来た！」\n今川義元は本隊を率いて駿河を出立。\n東海道を西進し、尾張国境に迫っています。\n各地で土煙が上がり、大地が揺れています。',
        year: 1560, season: '夏',
        defaultResolve: (subCtx) => isPlayerImagawa ? resolveImagawaRestChoice(subCtx) : resolveOdaVictory(subCtx, true)
    };
};

const resolveOdaInterceptChoice = () => {
    return {
        title: '桶狭間の戦い - 開戦',
        image: okehazamaMarchImg,
        description: '報告によれば、今川軍は「桶狭間」付近で休息を取っている模様。\nしかも激しい豪雨が降り始めました。\nこれは天が与えた好機かもしれません。',
        year: 1560, season: '夏',
        choices: {
            Oda: [
                {
                    text: '乾坤一擲、本陣を急襲する',
                    description: '豪雨に紛れて今川義元の本陣のみを狙う奇策。',
                    resolve: (subCtx) => {
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
};

const resolveImagawaRestChoice = (ctx) => {
    return {
        title: '桶狭間での休息',
        image: okehazamaMarchImg,
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
                            return {
                                title: '休息完了',
                                image: okehazamaMarchImg,
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
};

const resolveOdaVictory = (ctx, isAuto = false) => {
    ctx.updateResource('Oda', 1000, 1000, 80);
    ctx.updateResource('Imagawa', -500, -500, -50);
    
    ctx.setProvinces(prev => prev.map(p => {
        if (p.ownerId === 'Imagawa') {
            // ★修正: 兵力30%まで削減、ただし最低150は残す（即死防止）
            const newTroops = Math.max(150, Math.floor(p.troops * 0.3));
            return { ...p, troops: newTroops, loyalty: Math.max(0, p.loyalty - 15) };
        }
        return p;
    }));

    return {
        title: '桶狭間の戦い - 決着',
        image: okehazamaSuccessImg, 
        description: isAuto 
            ? '【歴史的勝利】\n豪雨轟く桶狭間にて、歴史が動きました。\n織田信長の乾坤一擲の奇襲が、今川本陣を直撃！\n「海道一の弓取り」と謳われた今川義元は、露と消えました。\n主を失った今川の大軍は蜘蛛の子を散らすように敗走しています。'
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
            // ★修正: 兵力30%まで削減、ただし最低150は残す
            const newTroops = Math.max(150, Math.floor(p.troops * 0.3));
            return { ...p, troops: newTroops, loyalty: Math.max(0, p.loyalty - 15) };
        }
        return p;
    }));
    return {
        title: '桶狭間の悲劇',
        image: okehazamaSuccessImg, 
        description: '敵襲！！織田軍の奇襲です！\n油断していた本陣は壊滅し、義元公がお討たれになりました...\n軍は総崩れとなり、撤退を余儀なくされました。',
        year: 1560, season: '夏'
    };
};

// --- イベント定義 ---

export const okehazamaEvent = {
    id: 'okehazama_phase1',
    title: '上洛の機運',
    image: okehazamaHyojoImg,
    year: 1560,
    season: '夏',
    
    description: (daimyoId) => {
        if (daimyoId === 'Oda') return '駿河の今川義元が不穏な動きを見せています。\n大軍を率いて尾張へ侵攻する構えです。\n清洲城にて評定が開かれていますが、家臣団の意見は割れています。';
        if (daimyoId === 'Imagawa') return '国力は充実し、兵の士気も高まっています。\n館にて重臣たちと評定を行い、上洛の是非を問う時が来ました。\n天下に号令をかける好機です。';
        return '駿河の今川義元が、上洛を目指して尾張への侵攻を画策しているようです。\n東海の情勢が大きく動こうとしています。';
    },

    trigger: (turn, provinces, daimyoStats) => {
      const odaAlive = daimyoStats['Oda']?.isAlive !== false;
      const imagawaAlive = daimyoStats['Imagawa']?.isAlive !== false;
      const hasSunpu = provinces.some(p => p.id === 'sunpu' && p.ownerId === 'Imagawa');
      const hasKiyosu = provinces.some(p => p.id === 'kiyosu' && p.ownerId === 'Oda');
      
      return turn === 2 && odaAlive && imagawaAlive && hasSunpu && hasKiyosu;
    },

    choices: {
      Oda: [
        {
          id: 'intercept',
          text: '迎撃の策を練る',
          description: '情報の収集を行い、一瞬の隙を探る。',
          type: 'normal',
          resolve: (ctx) => {
              return {
                  title: '今川軍、侵攻開始',
                  image: okehazamaMarchImg,
                  description: '報告が入りました！\n今川義元、兵2万5千を率いて沓掛城に入城。\n先鋒は既に大高城周辺に展開しています。',
                  year: 1560, season: '夏',
                  defaultResolve: () => resolveOdaInterceptChoice() 
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
          resolve: (ctx) => resolveImagawaMarch(ctx, true)
        },
        {
          id: 'wait',
          text: '時期尚早、好機を待つ',
          description: '今は内政に力を入れるべきだ。出陣を見送る。',
          resolve: (ctx) => {
              ctx.showLog("上洛を見送りました。歴史の歯車が変わったようです。");
              return null;
          }
        }
      ]
    },

    defaultResolve: (ctx) => resolveImagawaMarch(ctx, false)
};