import { DAIMYO_INFO } from './daimyos';

import okehazamaHyojoImg from '../assets/okehazama_hyojo.jpg';
import okehazamaMarchImg from '../assets/okehazama_march.jpg';
import okehazamaSuccessImg from '../assets/okehazama_success.jpg';
import okehazamaFailImg from '../assets/okehazama_fail.jpg';
import okehazamaSiegeImg from '../assets/okehazama_rojo.jpg';

// ゲーム内カレンダーロジック:
// Turn 1 = 1560年 春
// 1年 = 4ターン

export const HISTORICAL_EVENTS = [
  // 1. 桶狭間の戦い (Turn 2: 1560年 夏)
  {
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
  },

  // 2. 松平独立 (Turn 3: 1560年 秋)
  {
    id: 'matsudaira_independence',
    title: '松平元康の独立',
    image: null,
    year: 1560, season: '秋',

    description: (daimyoId) => {
        if (daimyoId === 'Tokugawa') return '今川義元の死により、今川家は混乱の極みにあります。\n長年、今川の人質として耐え忍んできましたが、ついに故郷・岡崎城への帰還を果たしました。\n今こそ、今川の支配を脱し、三河松平家の再興を宣言する時です。';
        if (daimyoId === 'Imagawa') return '松平元康が岡崎城にて勝手に兵を動かしているとの報告が入りました。\n義元公の弔い合戦もせぬまま、独立を企てているようです。\n許しがたい裏切りですが、今の我々にこれを止める余力があるでしょうか...';
        return '三河の松平元康が、今川家の混乱に乗じて岡崎城で独立を宣言しました。\n今川の支配力は大きく低下し、東海の情勢が変わりつつあります。';
    },

    trigger: (turn, provinces, daimyoStats) => {
        const imagawaAlive = daimyoStats['Imagawa']?.isAlive !== false;
        const okazakiIsImagawa = provinces.some(p => p.id === 'okazaki' && p.ownerId === 'Imagawa');
        return turn === 3 && imagawaAlive && okazakiIsImagawa;
    },

    choices: {
        Tokugawa: [
            {
                text: '独立を宣言する',
                description: '今川家と手切れし、三河の主として名乗りを上げる。',
                resolve: (ctx) => resolveMatsudairaIndependence(ctx, true)
            },
            {
                text: '今はまだ雌伏の時',
                description: '独立は時期尚早。今川家への義理を通し、好機を待つ。',
                resolve: (ctx) => {
                    ctx.showLog("徳川家は今川家への忠誠を維持しました。");
                    return null;
                }
            }
        ],
        Imagawa: [
            {
                text: '独立を容認する',
                description: '阻止する力はない... 黙認し、無用な争いを避ける。',
                resolve: (ctx) => resolveMatsudairaIndependence(ctx, false)
            },
            {
                text: '討伐令を出す',
                description: '裏切りは許さぬ。断固として戦う姿勢を示す。',
                resolve: (ctx) => {
                     ctx.showLog("今川家は松平元康に対し討伐令を出しました！関係が「敵対」になります。");
                     ctx.setRelations(prev => ({
                        ...prev,
                        Imagawa: { ...(prev.Imagawa || {}), Tokugawa: 0 },
                        Tokugawa: { ...(prev.Tokugawa || {}), Imagawa: 0 }
                     }));
                     ctx.setAlliances(prev => {
                        const next = { ...prev };
                        if (next['Imagawa']) next['Imagawa'] = next['Imagawa'].filter(id => id !== 'Tokugawa');
                        if (next['Tokugawa']) next['Tokugawa'] = next['Tokugawa'].filter(id => id !== 'Imagawa');
                        return next;
                     });
                     return null;
                }
            }
        ]
    },

    defaultResolve: (ctx) => resolveMatsudairaIndependence(ctx, false)
  },

  // 3. 斎藤義龍の死 (Turn 6: 1561年 夏)
  {
    id: 'saito_death',
    title: '斎藤義龍の死',
    image: null,
    year: 1561, season: '夏',

    description: '美濃の蝮と恐れられた斎藤義龍が急死しました。\n後を継いだ龍興は若く、家臣団の統制に苦しんでいるようです。\n美濃攻略の好機が訪れました。',

    trigger: (turn, provinces, daimyoStats) => {
        return turn === 6 && daimyoStats['Saito']?.isAlive !== false;
    },

    defaultResolve: (ctx) => {
        ctx.showLog("斎藤義龍が病没。美濃国内で動揺が広がっています。");
        ctx.setDaimyoStats(prev => {
            const s = prev['Saito'];
            if (!s) return prev;
            return {
                ...prev,
                Saito: { ...s, gold: Math.floor(s.gold * 0.7), rice: Math.floor(s.rice * 0.7) }
            };
        });
        ctx.setProvinces(prev => prev.map(p => {
            if (p.ownerId === 'Saito') {
                return { 
                    ...p, 
                    troops: Math.floor(p.troops * 0.7),
                    loyalty: Math.max(0, (p.loyalty || 50) - 20),
                    defense: Math.max(0, p.defense - 10)
                };
            }
            return p;
        }));
        return null;
    }
  },

  // 4. 清州同盟 (Turn 9: 1562年 春)
  {
    id: 'kiyosu_alliance',
    title: '清州同盟',
    image: null,
    year: 1562, season: '春',

    description: '織田信長と徳川家康、両雄が清洲城にて会談。\n東西の憂いを断つため、同盟を結ぶ運びとなりました。',

    trigger: (turn, provinces, daimyoStats) => {
        const odaAlive = daimyoStats['Oda']?.isAlive !== false;
        const tokugawaAlive = daimyoStats['Tokugawa']?.isAlive !== false;
        return turn === 9 && odaAlive && tokugawaAlive;
    },

    choices: {
        Oda: [
            {
                text: '同盟を結ぶ',
                description: '背後（東）を徳川に任せ、美濃攻略に集中する。',
                resolve: (ctx) => resolveKiyosuAlliance(ctx)
            },
            {
                text: '拒否する',
                description: '徳川を信用できない。独自に覇道を行く。',
                resolve: (ctx) => {
                    ctx.showLog("織田家は同盟を拒否しました。");
                    return null;
                }
            }
        ],
        Tokugawa: [
            {
                text: '同盟を結ぶ',
                description: '西の脅威を排除し、今川領への侵攻に集中する。',
                resolve: (ctx) => resolveKiyosuAlliance(ctx)
            },
            {
                text: '拒否する',
                description: '織田は信用できない。',
                resolve: (ctx) => {
                    ctx.showLog("徳川家は同盟を拒否しました。");
                    return null;
                }
            }
        ]
    },

    defaultResolve: (ctx) => resolveKiyosuAlliance(ctx)
  },

  // 5. 遠州忩劇 (Turn 12: 1562年 冬)
  {
    id: 'enshu_so_geki',
    title: '遠州忩劇',
    image: null,
    year: 1562, season: '冬',

    description: '今川家の弱体化に伴い、遠江（遠州）の国人衆が一斉に反乱を起こしました（遠州忩劇）。\n今川氏真は対応に追われ、統制力を失いつつあります。',

    trigger: (turn, provinces, daimyoStats) => {
        const imagawaAlive = daimyoStats['Imagawa']?.isAlive !== false;
        const hasHamamatsu = provinces.some(p => p.id === 'hamamatsu' && p.ownerId === 'Imagawa');
        return turn === 12 && imagawaAlive && hasHamamatsu;
    },

    defaultResolve: (ctx) => {
        ctx.showLog("【歴史イベント】遠江にて国人一揆発生！今川家の支配力が低下しました。");
        ctx.setProvinces(prev => prev.map(p => {
            if (p.ownerId === 'Imagawa') {
                if (p.id !== 'sunpu') {
                    return { 
                        ...p, 
                        troops: Math.floor(p.troops * 0.7), 
                        loyalty: Math.max(0, (p.loyalty || 50) - 30) 
                    };
                }
            }
            return p;
        }));
        
        if (ctx.daimyoStats && ctx.daimyoStats['Tokugawa']?.isAlive !== false) ctx.updateResource('Tokugawa', 0, 0, 20);
        if (ctx.daimyoStats && ctx.daimyoStats['Takeda']?.isAlive !== false) ctx.updateResource('Takeda', 0, 0, 20);
        
        return null;
    }
  },

  // 6. 駿河侵攻 (Turn 36: 1568年 冬)
  {
    id: 'suruga_invasion',
    title: '駿河侵攻',
    image: null,
    year: 1568, season: '冬',

    description: '甲斐の武田信玄が甲相駿三国同盟を破棄し、駿河への侵攻を開始しました。\n今川家は最大の危機を迎えています。',

    trigger: (turn, provinces, daimyoStats) => {
        const takedaAlive = daimyoStats['Takeda']?.isAlive !== false;
        const imagawaAlive = daimyoStats['Imagawa']?.isAlive !== false;
        const hasSunpu = provinces.some(p => p.id === 'sunpu' && p.ownerId === 'Imagawa');
        return turn === 36 && takedaAlive && imagawaAlive && hasSunpu;
    },

    choices: {
        Takeda: [
            {
                text: '同盟を破棄し、侵攻する',
                description: '今川領を切り取り、海への道を開く。',
                resolve: (ctx) => {
                    ctx.showLog("武田家が今川家との同盟を破棄！駿河へ侵攻を開始しました。");
                    resolveSurugaInvasion(ctx);
                    return null;
                }
            },
            {
                text: '同盟を維持する',
                description: '義理を重んじ、北（上杉）への備えを固める。',
                resolve: (ctx) => {
                    ctx.showLog("武田信玄は今川との同盟維持を選択しました。");
                    return null;
                }
            }
        ]
    },

    defaultResolve: (ctx) => {
        ctx.showLog("武田軍が国境を越え、駿河へ侵攻！今川家との同盟は破棄されました。");
        resolveSurugaInvasion(ctx);
        return null;
    }
  }
];


// ▼ ヘルパー関数

// 1. 今川進軍（中間イベント）
const resolveImagawaMarch = (ctx, isPlayerImagawa) => {
    ctx.showLog("今川義元、2万5千の大軍を率いて尾張へ侵攻を開始！");
    
    return {
        title: '今川軍、進軍開始',
        image: okehazamaMarchImg,
        description: '「天下に号令をかける時が来た！」\n今川義元は本隊を率いて駿河を出立。\n東海道を西進し、尾張国境に迫っています。\n各地で土煙が上がり、大地が揺れています。',
        year: 1560, season: '夏',
        // AIなら史実(決着)へ、プレイヤーなら休息選択へ繋ぐ
        defaultResolve: (subCtx) => isPlayerImagawa ? resolveImagawaRestChoice(subCtx) : resolveOdaVictory(subCtx, true)
    };
};

// 2. 織田迎撃選択（中間イベント後）
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

// 3. 今川休息選択（プレイヤー用）
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

const resolveMatsudairaIndependence = (ctx, isPlayerTokugawa) => {
    ctx.showLog("【歴史イベント】松平元康（徳川家康）が今川家から独立を宣言！三河の地を取り戻しました。");

    ctx.setAlliances(prev => {
        const next = { ...prev };
        if (next['Imagawa']) next['Imagawa'] = next['Imagawa'].filter(id => id !== 'Tokugawa');
        if (next['Tokugawa']) next['Tokugawa'] = next['Tokugawa'].filter(id => id !== 'Imagawa');
        return next;
    });

    // ★修正: プレイヤーが誰であれ、織田と徳川の間で一時的な停戦を設定する
    ctx.setCeasefires(prev => ({
        ...prev,
        Oda: { ...(prev.Oda || {}), Tokugawa: 6 },
        Tokugawa: { ...(prev.Tokugawa || {}), Oda: 6 }
    }));
    ctx.showLog("織田家と徳川家の間で、一時的な停戦（6ターン）が成立しました。");

    ctx.setRelations(prev => ({
        ...prev,
        Imagawa: { ...(prev.Imagawa || {}), Tokugawa: 20 },
        Tokugawa: { ...(prev.Tokugawa || {}), Imagawa: 20 },
        Oda: { ...(prev.Oda || {}), Tokugawa: 60 },
        Tokugawa: { ...(prev.Tokugawa || {}), Oda: 60 }
    }));

    ctx.setDaimyoStats(prev => ({
        ...prev,
        Tokugawa: {
            ...prev.Tokugawa,
            gold: (prev.Tokugawa?.gold || 0) + 500,
            rice: (prev.Tokugawa?.rice || 0) + 500,
            fame: (prev.Tokugawa?.fame || 0) + 50,
            isAlive: true,
            targetOverride: 'sunpu'
        },
        Oda: { 
            ...prev.Oda,
            targetOverride: 'inabayama' 
        },
        Mizuno: { 
            ...prev.Mizuno,
            isAlive: false
        }
    }));

    ctx.setProvinces(prev => {
        const okazaki = prev.find(p => p.id === 'okazaki');
        const moveTroops = okazaki ? Math.max(0, okazaki.troops - 150) : 0;
        
        const chita = prev.find(p => p.id === 'chita');
        const chitaTroops = chita ? chita.troops : 0;
        const troopsToKiyosu = Math.max(0, chitaTroops - 100) + 200; 

        return prev.map(p => {
            if (p.id === 'okazaki') {
                return { 
                    ...p, 
                    ownerId: 'Tokugawa', 
                    troops: 150, 
                    loyalty: 100,
                    training: Math.min(100, (p.training || 50) + 20)
                };
            }
            if (p.id === 'sunpu') {
                return { ...p, troops: p.troops + moveTroops };
            }
            if (p.id === 'chita' && p.ownerId === 'Mizuno') {
                return {
                    ...p,
                    ownerId: 'Oda',
                    troops: 100, 
                    loyalty: 100,
                    actionsLeft: 0 
                };
            }
            if (p.id === 'kiyosu') {
                return { ...p, troops: p.troops + troopsToKiyosu };
            }
            return p;
        });
    });
    
    ctx.updateResource('Imagawa', 0, 0, -20);
    ctx.showLog("【織水同盟】水野家が織田家に合流。主力が清洲へ集結し、知多が織田領となりました。");

    return {
        title: '松平独立',
        image: null, 
        description: isPlayerTokugawa 
            ? '独立を宣言しました！\n今川のくびきを脱し、これよりは織田と結んで天下を目指します。\n名は「徳川家康」と改めましょう。\n\nまた、知多の水野信元が織田家に合流しました。'
            : '松平元康は「徳川家康」と名を改め、今川家との従属関係を破棄しました。\n三河における今川の影響力は失われました。\n\nまた、知多の水野信元が織田家に合流しました。',
        year: 1560, season: '秋'
    };
};

const resolveKiyosuAlliance = (ctx) => {
    ctx.showLog("織田家と徳川家が固い同盟を結びました（清州同盟）。");
    
    ctx.setAlliances(prev => {
        const next = { ...prev };
        if (!next['Oda']) next['Oda'] = [];
        if (!next['Oda'].includes('Tokugawa')) next['Oda'].push('Tokugawa');
        
        if (!next['Tokugawa']) next['Tokugawa'] = [];
        if (!next['Tokugawa'].includes('Oda')) next['Tokugawa'].push('Oda');
        return next;
    });

    ctx.setRelations(prev => ({
        ...prev,
        Oda: { ...prev.Oda, Tokugawa: 100 },
        Tokugawa: { ...prev.Tokugawa, Oda: 100 }
    }));
    
    ctx.setDaimyoStats(prev => ({
        ...prev,
        Oda: { ...prev.Oda, targetOverride: 'inabayama' },
        Tokugawa: { ...prev.Tokugawa, targetOverride: 'sunpu' }
    }));
    
    return {
        title: '清州同盟 締結',
        image: null,
        description: '織田信長と徳川家康は同盟を結びました。\n織田は北（美濃）へ、徳川は東（今川領）へ、\n互いに背後を預け、それぞれの覇道を進みます。',
        year: 1562, season: '春'
    };
};

const resolveSurugaInvasion = (ctx) => {
    ctx.setAlliances(prev => {
        const next = { ...prev };
        const remove = (a, b) => {
            if (next[a]) next[a] = next[a].filter(id => id !== b);
            if (next[b]) next[b] = next[b].filter(id => id !== a);
        };
        const add = (a, b) => {
            if (!next[a]) next[a] = [];
            if (!next[a].includes(b)) next[a].push(b);
            if (!next[b]) next[b] = [];
            if (!next[b].includes(a)) next[b].push(a);
        };
        remove('Takeda', 'Imagawa');
        remove('Takeda', 'Hojo');
        add('Imagawa', 'Hojo');
        return next;
    });

    ctx.setRelations(prev => {
        const next = { ...prev };
        const setRel = (a, b, val) => {
             if (!next[a]) next[a] = {};
             next[a][b] = val;
             if (!next[b]) next[b] = {};
             next[b][a] = val;
        };
        setRel('Takeda', 'Imagawa', 0);
        setRel('Takeda', 'Hojo', 0);
        setRel('Imagawa', 'Hojo', 100);
        return next;
    });

    ctx.setProvinces(prev => prev.map(p => {
        if (p.ownerId === 'Takeda') return { ...p, training: Math.min(100, (p.training || 50) + 20) };
        if (p.ownerId === 'Imagawa') return { ...p, loyalty: Math.max(0, (p.loyalty || 50) - 20) };
        return p;
    }));
};

const resolveOdaVictory = (ctx, isAuto = false) => {
    ctx.updateResource('Oda', 1000, 1000, 80);
    ctx.updateResource('Imagawa', -500, -500, -50);
    
    ctx.setProvinces(prev => prev.map(p => {
        if (p.ownerId === 'Imagawa') {
            return { ...p, troops: Math.floor(p.troops * 0.5), loyalty: Math.max(0, p.loyalty - 15) };
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
            return { ...p, troops: Math.floor(p.troops * 0.5), loyalty: Math.max(0, p.loyalty - 15) };
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