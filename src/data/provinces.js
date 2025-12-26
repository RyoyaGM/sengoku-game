// src/data/provinces.js

export const SEA_ROUTES = [
    [
        "usukeshi",
        "tsugaru"
    ],
    [
        "usukeshi",
        "sannohe"
    ],
    [
        "matsumae",
        "tsugaru"
    ],
    [
        "sado",
        "kasugayama"
    ],
    [
        "oki",
        "gassan-toda"
    ],
    [
        "sumoto",
        "hyogo"
    ],
    [
        "sumoto",
        "tokushima"
    ],
    [
        "imabari",
        "fukuyama"
    ],
    [
        "imabari",
        "itsukushima"
    ],
    [
        "imabari",
        "funai"
    ],
    [
        "shimonoseki",
        "kokura"
    ],
    [
        "shimonoseki",
        "hakata"
    ],
    [
        "tsushima",
        "iki"
    ],
    [
        "iki",
        "matsuura"
    ],
    [
        "tanegashima",
        "kagoshima"
    ],
    [
        "tanegashima",
        "amami"
    ],
    [
        "amami",
        "shuri"
    ]
];

// 1560年の国力バランスを反映したデータ
// 商業(Commerce): 金銭収入、農業(Agriculture): 兵糧収入、防御(Defense): 拠点耐久度、訓練(Training): 戦闘力補正
export const PROVINCE_DATA_BASE = [
  // --- 北海道・東北 ---
  {"id":"matsumae","name":"徳山","ownerId":"Kakizaki","troops":180,"cx":3754,"cy":2208,"neighbors":["ishikawa","sannohe","setanai","chinai"],"commerce":110,"agriculture":10,"defense":50,"training":50,"loyalty":60}, // 北方交易
  {"id":"setanai","name":"セタナイ","ownerId":"Ainu","troops":100,"cx":3742.5,"cy":2052.5,"neighbors":["matsumae","yoichi"],"commerce":40,"agriculture":5,"defense":20,"training":60,"loyalty":70},
  {"id":"chinai","name":"知内","ownerId":"Ainu","troops":90,"cx":3861.25,"cy":2072.5,"neighbors":["matsumae","shiraoi"],"commerce":40,"agriculture":5,"defense":20,"training":60,"loyalty":70},
  {"id":"yoichi","name":"ヨイチ","ownerId":"Ainu","troops":80,"cx":3816.25,"cy":1718.75,"neighbors":["setanai","ishikari_ainu"],"commerce":40,"agriculture":5,"defense":20,"training":60,"loyalty":70},
  {"id":"ishikari_ainu","name":"イシカリ","ownerId":"Ainu","troops":110,"cx":3937.5,"cy":1635,"neighbors":["yoichi","shiraoi","kusuri"],"commerce":50,"agriculture":10,"defense":20,"training":60,"loyalty":70},
  {"id":"shiraoi","name":"シラオイ","ownerId":"Ainu","troops":100,"cx":3926.25,"cy":1825,"neighbors":["chinai","ishikari_ainu","kusuri"],"commerce":40,"agriculture":5,"defense":20,"training":60,"loyalty":70},
  {"id":"kusuri","name":"クスリ","ownerId":"Ainu","troops":80,"cx":4423.75,"cy":1586.25,"neighbors":["ishikari_ainu","shiraoi"],"commerce":50,"agriculture":5,"defense":20,"training":60,"loyalty":70},
  {"id":"ishikawa","name":"石川","ownerId":"Nanbu","troops":300,"cx":3883.33,"cy":2453.33,"neighbors":["matsumae","sannohe","akita"],"commerce":50,"agriculture":50,"defense":40,"training":50,"loyalty":50},
  {"id":"sannohe","name":"三戸","ownerId":"Nanbu","troops":450,"cx":4056.66,"cy":2465,"neighbors":["ishikawa","matsumae","kozukata"],"commerce":40,"agriculture":70,"defense":60,"training":55,"loyalty":60}, // 南部本拠地
  {"id":"kozukata","name":"不来方","ownerId":"Nanbu","troops":320,"cx":4127.14,"cy":2592.85,"neighbors":["sannohe","yokote","nakaniida","teraike"],"commerce":30,"agriculture":50,"defense":40,"training":50,"loyalty":50},
  {"id":"akita","name":"湊","ownerId":"Ando","troops":350,"cx":3895.71,"cy":2697.14,"neighbors":["ishikawa","yokote","oura"],"commerce":120,"agriculture":50,"defense":40,"training":50,"loyalty":50}, // 日本海交易
  {"id":"yokote","name":"横手","ownerId":"Onodera","troops":220,"cx":4018.57,"cy":2778.57,"neighbors":["akita","kozukata","yamagata"],"commerce":30,"agriculture":60,"defense":40,"training":45,"loyalty":50},
  {"id":"oura","name":"尾浦","ownerId":"Daihoji","troops":210,"cx":3918.57,"cy":2918.57,"neighbors":["akita","yamagata","kamabara","kanbara"],"commerce":80,"agriculture":70,"defense":30,"training":45,"loyalty":50},
  {"id":"yamagata","name":"山形","ownerId":"Mogami","troops":400,"cx":4024.28,"cy":3062.85,"neighbors":["yokote","oura","yonezawa","nakaniida"],"commerce":60,"agriculture":80,"defense":50,"training":55,"loyalty":55}, // 最上義光初期
  {"id":"nakaniida","name":"中新田","ownerId":"Date","troops":430,"cx":4238.57,"cy":3005.71,"neighbors":["kozukata","yamagata","yonezawa","teraike","odaka"],"commerce":50,"agriculture":70,"defense":40,"training":55,"loyalty":50},
  {"id":"teraike","name":"寺池","ownerId":"Kasai","troops":180,"cx":4099.99,"cy":2915.71,"neighbors":["kozukata","nakaniida"],"commerce":30,"agriculture":50,"defense":30,"training":40,"loyalty":40},
  {"id":"yonezawa","name":"米沢","ownerId":"Date","troops":600,"cx":3961.42,"cy":3227.14,"neighbors":["yamagata","nakaniida","kurokawa","nihonmatsu"],"commerce":60,"agriculture":90,"defense":60,"training":65,"loyalty":70}, // 伊達本拠地
  {"id":"kurokawa","name":"黒川","ownerId":"Ashina","troops":450,"cx":3987.14,"cy":3425.71,"neighbors":["yonezawa","nasu","kanbara","shirakawa","nihonmatsu"],"commerce":50,"agriculture":90,"defense":80,"training":60,"loyalty":60}, // 蘆名盛氏全盛期
  {"id":"iwaki","name":"岩城","ownerId":"Iwaki","troops":240,"cx":4245.71,"cy":3457.14,"neighbors":["mito","shirakawa","odaka"],"commerce":40,"agriculture":50,"defense":30,"training":45,"loyalty":50},
  {"id":"nihonmatsu","name":"二本松","ownerId":"Date","troops":230,"cx":4114.28,"cy":3342.85,"neighbors":["yonezawa","kurokawa","shirakawa","odaka"],"commerce":30,"agriculture":50,"defense":40,"training":50,"loyalty":50},
  {"id":"odaka","name":"小高","ownerId":"Soma","troops":250,"cx":4172.85,"cy":3250,"neighbors":["nakaniida","iwaki","nihonmatsu"],"commerce":40,"agriculture":40,"defense":40,"training":55,"loyalty":60}, // 相馬野馬追
  {"id":"shirakawa","name":"白河","ownerId":"Yuki_S","troops":250,"cx":4105.71,"cy":3494.28,"neighbors":["nasu","kurokawa","iwaki","nihonmatsu"],"commerce":30,"agriculture":60,"defense":60,"training":50,"loyalty":50},

  // --- 関東 ---
  {"id":"nasu","name":"那須","ownerId":"Nasu","troops":200,"cx":4078.57,"cy":3587.14,"neighbors":["kurokawa","mito","utsunomiya","shirakawa"],"commerce":20,"agriculture":50,"defense":50,"training":55,"loyalty":50}, // 那須与一の末裔
  {"id":"utsunomiya","name":"宇都宮","ownerId":"Utsunomiya","troops":300,"cx":4055.71,"cy":3672.85,"neighbors":["nasu","mito","koga_castle","karasawayama"],"commerce":50,"agriculture":70,"defense":50,"training":50,"loyalty":50},
  {"id":"mito","name":"太田","ownerId":"Satake","troops":500,"cx":4165.71,"cy":3702.85,"neighbors":["iwaki","nasu","utsunomiya","kashima","sakura","koga_castle"],"commerce":60,"agriculture":90,"defense":60,"training":60,"loyalty":60}, // 佐竹義重
  {"id":"kashima","name":"鹿島","ownerId":"Kashima","troops":300,"cx":4252.02,"cy":3775.02,"neighbors":["mito","edo","sakura"],"commerce":80,"agriculture":60,"defense":40,"training":60,"loyalty":50}, // 剣豪
  {"id":"sakura","name":"本佐倉","ownerId":"Chiba","troops":260,"cx":4129.20,"cy":3826.34,"neighbors":["edo","kashima","kazusa","mito","koga_castle"],"commerce":70,"agriculture":70,"defense":40,"training":45,"loyalty":50},
  {"id":"umayabashi","name":"厩橋","ownerId":"Kitajo","troops":350,"cx":3817.14,"cy":3795.71,"neighbors":["karasawayama","kawagoe","saku","kasugayama"],"commerce":40,"agriculture":60,"defense":70,"training":55,"loyalty":40}, // 上杉・北条の係争地
  {"id":"karasawayama","name":"唐沢山","ownerId":"Sano","troops":250,"cx":3951.42,"cy":3744.28,"neighbors":["umayabashi","utsunomiya","koga_castle"],"commerce":30,"agriculture":40,"defense":90,"training":60,"loyalty":70}, // 佐野昌綱(堅城)
  {"id":"koga_castle","name":"古河","ownerId":"Koga_Kubo","troops":350,"cx":4042.85,"cy":3780.00,"neighbors":["karasawayama","utsunomiya","mito","sakura","edo","kawagoe"],"commerce":60,"agriculture":60,"defense":60,"training":40,"loyalty":50},
  {"id":"kawagoe","name":"河越","ownerId":"Hojo","troops":600,"cx":3921.42,"cy":3926.34,"neighbors":["umayabashi","edo","odawara","kai","koga_castle"],"commerce":80,"agriculture":90,"defense":80,"training":60,"loyalty":70},
  {"id":"edo","name":"江戸","ownerId":"Hojo","troops":500,"cx":4064.44,"cy":3966.66,"neighbors":["kawagoe","kashima","kazusa","sakura","odawara","koga_castle"],"commerce":120,"agriculture":80,"defense":60,"training":50,"loyalty":60},
  {"id":"kazusa","name":"上総","ownerId":"Satomi","troops":350,"cx":4250.00,"cy":3927.46,"neighbors":["edo","awa_boso","sakura"],"commerce":50,"agriculture":60,"defense":40,"training":60,"loyalty":60},
  {"id":"awa_boso","name":"安房","ownerId":"Satomi","troops":400,"cx":4191,"cy":4089,"neighbors":["kazusa"],"commerce":60,"agriculture":40,"defense":60,"training":70,"loyalty":70}, // 里見水軍
  {"id":"odawara","name":"小田原","ownerId":"Hojo","troops":1500,"cx":3959.99,"cy":4047.77,"neighbors":["kawagoe","sunpu","kai","izu","edo"],"commerce":100,"agriculture":100,"defense":150,"training":65,"loyalty":90}, // 難攻不落
  {"id":"izu","name":"伊豆","ownerId":"Hojo","troops":300,"cx":3950,"cy":4149,"neighbors":["odawara","sunpu"],"commerce":60,"agriculture":30,"defense":50,"training":55,"loyalty":60},

  // --- 甲信越・北陸 ---
  {"id":"kasugayama","name":"春日山","ownerId":"Uesugi","troops":1100,"cx":3622.5,"cy":3654,"neighbors":["kanbara","kawanakajima","toyama","umayabashi","sado"],"commerce":90,"agriculture":90,"defense":100,"training":85,"loyalty":80}, // 軍神
  {"id":"kanbara","name":"蒲原","ownerId":"Uesugi","troops":300,"cx":3773.33,"cy":3384.44,"neighbors":["kasugayama","kurokawa","oura"],"commerce":50,"agriculture":100,"defense":50,"training":70,"loyalty":60},
  {"id":"sado","name":"佐渡","ownerId":"Honma","troops":150,"cx":3610,"cy":3335.55,"neighbors":["kasugayama"],"commerce":200,"agriculture":20,"defense":40,"training":40,"loyalty":50}, // 金山
  {"id":"toyama","name":"富山","ownerId":"Jinbo","troops":250,"cx":3500,"cy":3750,"neighbors":["kasugayama","kanazawa","hida","noto"],"commerce":50,"agriculture":60,"defense":50,"training":50,"loyalty":50},
  {"id":"noto","name":"能登","ownerId":"Hatakeyama","troops":250,"cx":3333.33,"cy":3623.33,"neighbors":["toyama","kanazawa"],"commerce":70,"agriculture":40,"defense":50,"training":40,"loyalty":40},
  {"id":"kanazawa","name":"尾山御坊","ownerId":"Honganji","troops":900,"cx":3320,"cy":3873.33,"neighbors":["toyama","noto","ichijodani"],"commerce":90,"agriculture":100,"defense":90,"training":70,"loyalty":100}, // 加賀一向一揆
  {"id":"ichijodani","name":"一乗谷","ownerId":"Asakura","troops":750,"cx":3228.88,"cy":4045.55,"neighbors":["kanazawa","odani","tsuruga"],"commerce":120,"agriculture":80,"defense":60,"training":55,"loyalty":60}, // 小京都
  {"id":"tsuruga","name":"敦賀","ownerId":"Asakura","troops":350,"cx":3213.33,"cy":4167.77,"neighbors":["ichijodani","odani","obama"],"commerce":100,"agriculture":40,"defense":50,"training":50,"loyalty":60}, // 交易港
  {"id":"obama","name":"小浜","ownerId":"Takeda_W","troops":200,"cx":3143.33,"cy":4243.33,"neighbors":["tsuruga","miyazu"],"commerce":80,"agriculture":40,"defense":30,"training":40,"loyalty":40},
  {"id":"kawanakajima","name":"川中島","ownerId":"Uesugi","troops":500,"cx":3644.76,"cy":3773.80,"neighbors":["kasugayama","saku","azumi"],"commerce":30,"agriculture":60,"defense":50,"training":75,"loyalty":60},
  {"id":"saku","name":"佐久","ownerId":"Takeda","troops":350,"cx":3727.77,"cy":3854.44,"neighbors":["kawanakajima","umayabashi","suwa"],"commerce":30,"agriculture":50,"defense":50,"training":75,"loyalty":60},
  {"id":"suwa","name":"諏訪","ownerId":"Takeda","troops":400,"cx":3694.44,"cy":3976.66,"neighbors":["saku","kai","ina","azumi"],"commerce":50,"agriculture":50,"defense":60,"training":75,"loyalty":70},
  {"id":"kai","name":"甲斐","ownerId":"Takeda","troops":1200,"cx":3819.99,"cy":4052.22,"neighbors":["suwa","odawara","sunpu","kawagoe"],"commerce":80,"agriculture":60,"defense":90,"training":90,"loyalty":90}, // 武田騎馬隊
  {"id":"ina","name":"伊那","ownerId":"Takeda","troops":300,"cx":3636.66,"cy":4114.44,"neighbors":["suwa","hamamatsu","azumi","iwamura"],"commerce":40,"agriculture":60,"defense":50,"training":75,"loyalty":60},
  {"id":"azumi","name":"安曇","ownerId":"Takeda","troops":250,"cx":3596.66,"cy":3909.99,"neighbors":["kawanakajima","hida","suwa","ina"],"commerce":20,"agriculture":40,"defense":50,"training":75,"loyalty":60},
  {"id":"hida","name":"飛騨","ownerId":"Anegakoji","troops":150,"cx":3440.00,"cy":3917.77,"neighbors":["toyama","azumi","gujo"],"commerce":30,"agriculture":30,"defense":50,"training":45,"loyalty":50},

  // --- 東海 ---
  {"id":"sunpu","name":"駿府","ownerId":"Imagawa","troops":1300,"cx":3800.00,"cy":4188.88,"neighbors":["kai","odawara","izu","hamamatsu"],"commerce":150,"agriculture":100,"defense":80,"training":55,"loyalty":70}, // 東海道一の弓取り
  {"id":"hamamatsu","name":"引馬","ownerId":"Imagawa","troops":600,"cx":3727.77,"cy":4284.44,"neighbors":["sunpu","ina","okazaki"],"commerce":80,"agriculture":80,"defense":60,"training":55,"loyalty":50}, // 飯尾氏(不安定)
  {"id":"okazaki","name":"岡崎","ownerId":"Imagawa","troops":500,"cx":3558.88,"cy":4288.88,"neighbors":["hamamatsu","kiyosu","chita"],"commerce":60,"agriculture":90,"defense":50,"training":80,"loyalty":80}, // 松平元康(独立前だが精強)
  {"id":"kiyosu","name":"清洲","ownerId":"Oda","troops":600,"cx":3445.55,"cy":4233.33,"neighbors":["okazaki","inabayama","anotsu","chita"],"commerce":150,"agriculture":150,"defense":60,"training":70,"loyalty":80}, // 商業力高
  {"id":"chita","name":"知多","ownerId":"Mizuno","troops":300,"cx":3468.88,"cy":4310.00,"neighbors":["kiyosu","okazaki"],"commerce":80,"agriculture":40,"defense":30,"training":50,"loyalty":50},
  {"id":"inabayama","name":"稲葉山","ownerId":"Saito","troops":600,"cx":3427.77,"cy":4131.11,"neighbors":["kiyosu","gujo","azuchi","odani","iwamura"],"commerce":90,"agriculture":90,"defense":100,"training":60,"loyalty":50}, // 美濃のマムシ後
  {"id":"gujo","name":"郡上","ownerId":"Endo","troops":200,"cx":3418.88,"cy":4026.66,"neighbors":["inabayama","hida"],"commerce":30,"agriculture":30,"defense":70,"training":55,"loyalty":60},
  {"id":"iwamura","name":"岩村","ownerId":"Saito","troops":250,"cx":3529.99,"cy":4154.44,"neighbors":["ina","inabayama"],"commerce":30,"agriculture":40,"defense":90,"training":55,"loyalty":60}, // 難攻不落
  {"id":"anotsu","name":"安濃津","ownerId":"Kitabatake","troops":450,"cx":3362.22,"cy":4447.77,"neighbors":["kiyosu","azuchi","yamato","shima"],"commerce":80,"agriculture":80,"defense":50,"training":55,"loyalty":70}, // 北畠剣豪
  {"id":"shima","name":"志摩","ownerId":"Kuki","troops":250,"cx":3458,"cy":4463,"neighbors":["anotsu"],"commerce":70,"agriculture":20,"defense":40,"training":65,"loyalty":60}, // 九鬼水軍

  // --- 近畿 ---
  {"id":"odani","name":"小谷","ownerId":"Azai","troops":600,"cx":3314.44,"cy":4187.77,"neighbors":["azuchi","ichijodani","tsuruga","inabayama"],"commerce":50,"agriculture":70,"defense":90,"training":70,"loyalty":80}, // 江北の鷹
  {"id":"azuchi","name":"観音寺","ownerId":"Rokkaku","troops":700,"cx":3278.88,"cy":4334.44,"neighbors":["odani","kyoto","inabayama","koga","anotsu"],"commerce":100,"agriculture":90,"defense":70,"training":50,"loyalty":50},
  {"id":"koga","name":"甲賀","ownerId":"Rokkaku","troops":350,"cx":3270,"cy":4437.77,"neighbors":["azuchi","yamato"],"commerce":40,"agriculture":40,"defense":80,"training":75,"loyalty":60}, // 忍者
  {"id":"kyoto","name":"京都","ownerId":"Ashikaga","troops":400,"cx":3144.55,"cy":4335.00,"neighbors":["azuchi","ishiyama","yamato","sasayama"],"commerce":250,"agriculture":50,"defense":90,"training":40,"loyalty":40}, // 権威と金
  {"id":"yamato","name":"大和","ownerId":"Tsutsui","troops":500,"cx":3252.22,"cy":4556.66,"neighbors":["kyoto","sakai","koga","anotsu","totsukawa"],"commerce":100,"agriculture":70,"defense":60,"training":55,"loyalty":60},
  {"id":"totsukawa","name":"十津川","ownerId":"Hatakeyama","troops":150,"cx":3210.00,"cy":4734.44,"neighbors":["yamato","wakayama"],"commerce":20,"agriculture":20,"defense":80,"training":60,"loyalty":50},
  {"id":"wakayama","name":"雑賀","ownerId":"Saika","troops":700,"cx":3136.66,"cy":4635.55,"neighbors":["totsukawa","sakai","tokushima"],"commerce":100,"agriculture":40,"defense":80,"training":85,"loyalty":40}, // 雑賀衆
  {"id":"sakai","name":"堺","ownerId":"Merchant","troops":400,"cx":3154.44,"cy":4556.66,"neighbors":["ishiyama","yamato","wakayama"],"commerce":350,"agriculture":10,"defense":90,"training":60,"loyalty":60}, // 自治都市
  {"id":"ishiyama","name":"石山","ownerId":"Honganji","troops":1200,"cx":3158.88,"cy":4455.55,"neighbors":["kyoto","sakai","koshimizu","sasayama"],"commerce":150,"agriculture":80,"defense":180,"training":60,"loyalty":100}, // 石山本願寺
  {"id":"koshimizu","name":"越水","ownerId":"Miyoshi","troops":800,"cx":3029.99,"cy":4470.00,"neighbors":["ishiyama","harima","sasayama","sumoto","miki"],"commerce":160,"agriculture":90,"defense":70,"training":65,"loyalty":60}, // 三好長慶
  {"id":"sasayama","name":"八上","ownerId":"Hatano","troops":300,"cx":2993.33,"cy":4335.55,"neighbors":["kyoto","ishiyama","koshimizu","harima","miyazu","miki"],"commerce":40,"agriculture":60,"defense":80,"training":55,"loyalty":70}, // 丹波の赤鬼
  {"id":"miyazu","name":"弓木","ownerId":"Isshiki","troops":200,"cx":2981.11,"cy":4246.66,"neighbors":["obama","sasayama","toyooka"],"commerce":60,"agriculture":40,"defense":50,"training":45,"loyalty":50},
  {"id":"miki","name":"三木","ownerId":"Bessho","troops":300,"cx":2967.77,"cy":4428.88,"neighbors":["koshimizu","sasayama","harima"],"commerce":50,"agriculture":50,"defense":70,"training":55,"loyalty":60},
  {"id":"harima","name":"播磨","ownerId":"Akamatsu","troops":350,"cx":2865.55,"cy":4458.88,"neighbors":["koshimizu","sasayama","okayama","tottori","miki","takeda"],"commerce":80,"agriculture":90,"defense":50,"training":50,"loyalty":40},
  {"id":"toyooka","name":"此隅山","ownerId":"Yamana","troops":250,"cx":2868.88,"cy":4252.22,"neighbors":["miyazu","tottori","takeda"],"commerce":40,"agriculture":50,"defense":50,"training":45,"loyalty":50},
  {"id":"takeda","name":"竹田","ownerId":"Yamana","troops":180,"cx":2876.66,"cy":4346.66,"neighbors":["toyooka","tottori","harima"],"commerce":30,"agriculture":30,"defense":70,"training":50,"loyalty":50}, // 天空の城

  // --- 中国 ---
  {"id":"tottori","name":"鳥取","ownerId":"Yamana","troops":280,"cx":2728.88,"cy":4322.22,"neighbors":["toyooka","harima","gassan-toda","okayama","niimi","takeda"],"commerce":50,"agriculture":50,"defense":50,"training":50,"loyalty":50},
  {"id":"okayama","name":"天神山","ownerId":"Ukita","troops":450,"cx":2731.11,"cy":4547.77,"neighbors":["harima","niimi","takamatsu_s","fukuyama","tottori"],"commerce":80,"agriculture":80,"defense":60,"training":60,"loyalty":50}, // 宇喜多直家
  {"id":"niimi","name":"新見","ownerId":"Mimura","troops":220,"cx":2638.88,"cy":4472.22,"neighbors":["okayama","fukuyama","gassan-toda","tottori"],"commerce":30,"agriculture":60,"defense":60,"training":55,"loyalty":60},
  {"id":"gassan-toda","name":"月山富田","ownerId":"Amago","troops":800,"cx":2493,"cy":4411,"neighbors":["tottori","niimi","fukuyama","iwami","oki"],"commerce":60,"agriculture":70,"defense":130,"training":65,"loyalty":70}, // 尼子(堅城)
  {"id":"oki","name":"隠岐","ownerId":"Amago","troops":100,"cx":2518.33,"cy":4126.66,"neighbors":["gassan-toda"],"commerce":50,"agriculture":10,"defense":30,"training":50,"loyalty":50},
  {"id":"fukuyama","name":"神辺","ownerId":"Mori","troops":350,"cx":2623.33,"cy":4611.11,"neighbors":["niimi","gassan-toda","yoshida-koriyama","imabari","okayama"],"commerce":90,"agriculture":70,"defense":50,"training":60,"loyalty":60},
  {"id":"yoshida-koriyama","name":"吉田郡山","ownerId":"Mori","troops":1000,"cx":2467.77,"cy":4614.44,"neighbors":["fukuyama","iwami","itsukushima"],"commerce":80,"agriculture":70,"defense":110,"training":75,"loyalty":90}, // 毛利元就
  {"id":"iwami","name":"石見","ownerId":"Mori","troops":450,"cx":2346.66,"cy":4555.55,"neighbors":["yoshida-koriyama","gassan-toda","hagi","nagato"],"commerce":400,"agriculture":20,"defense":80,"training":60,"loyalty":70}, // 石見銀山(超富裕)
  {"id":"itsukushima","name":"厳島","ownerId":"Mori","troops":300,"cx":2366.66,"cy":4723.33,"neighbors":["yoshida-koriyama","hagi","imabari"],"commerce":150,"agriculture":30,"defense":60,"training":70,"loyalty":80}, // 瀬戸内交易
  {"id":"hagi","name":"山口","ownerId":"Mori","troops":350,"cx":2262.22,"cy":4786.66,"neighbors":["itsukushima","iwami","shimonoseki","nagato"],"commerce":60,"agriculture":60,"defense":60,"training":60,"loyalty":60},
  {"id":"shimonoseki","name":"下関","ownerId":"Mori","troops":450,"cx":2091.66,"cy":4837.66,"neighbors":["hagi","hakata","kokura","nagato"],"commerce":120,"agriculture":40,"defense":60,"training":65,"loyalty":60},
  {"id":"nagato","name":"長門","ownerId":"Mori","troops":250,"cx":2157.77,"cy":4743.33,"neighbors":["hagi","shimonoseki","iwami"],"commerce":40,"agriculture":40,"defense":50,"training":55,"loyalty":60},

  // --- 四国 ---
  {"id":"sumoto","name":"洲本","ownerId":"Miyoshi","troops":200,"cx":2999.99,"cy":4593.33,"neighbors":["koshimizu","tokushima"],"commerce":50,"agriculture":40,"defense":50,"training":55,"loyalty":60},
  {"id":"tokushima","name":"勝瑞","ownerId":"Miyoshi","troops":600,"cx":2920.00,"cy":4731.11,"neighbors":["sumoto","wakayama","takamatsu_s","kochi"],"commerce":80,"agriculture":80,"defense":50,"training":60,"loyalty":60}, // 三好阿波
  {"id":"takamatsu_s","name":"十河","ownerId":"Miyoshi","troops":400,"cx":2787.77,"cy":4674.44,"neighbors":["tokushima","imabari","kochi","okayama"],"commerce":70,"agriculture":70,"defense":50,"training":65,"loyalty":60}, // 十河一存
  {"id":"imabari","name":"湯築","ownerId":"Kono","troops":300,"cx":2561.11,"cy":4817.77,"neighbors":["takamatsu_s","kochi","itsukushima","funai","fukuyama","shimanto"],"commerce":60,"agriculture":60,"defense":50,"training":50,"loyalty":50},
  {"id":"kochi","name":"岡豊","ownerId":"Chosokabe","troops":550,"cx":2725,"cy":4878,"neighbors":["tokushima","takamatsu_s","imabari","shimanto"],"commerce":40,"agriculture":60,"defense":60,"training":65,"loyalty":70}, // 長宗我部元親
  {"id":"shimanto","name":"中村","ownerId":"Ichijo","troops":200,"cx":2605.55,"cy":5066.66,"neighbors":["kochi","imabari"],"commerce":60,"agriculture":50,"defense":30,"training":45,"loyalty":60}, // 土佐の小京都

  // --- 九州 ---
  {"id":"hakata","name":"博多","ownerId":"Otomo","troops":500,"cx":1953.33,"cy":5008.88,"neighbors":["shimonoseki","funai","saga","kokura","iki","tsushima"],"commerce":250,"agriculture":70,"defense":60,"training":60,"loyalty":60}, // 国際貿易港
  {"id":"kokura","name":"門司","ownerId":"Otomo","troops":400,"cx":2038.88,"cy":4932.22,"neighbors":["hakata","funai","shimonoseki"],"commerce":100,"agriculture":60,"defense":70,"training":65,"loyalty":60},
  {"id":"funai","name":"府内","ownerId":"Otomo","troops":900,"cx":2206.66,"cy":5043.33,"neighbors":["hakata","kokura","asou","usuki","imabari"],"commerce":180,"agriculture":80,"defense":80,"training":65,"loyalty":70}, // 大友宗麟
  {"id":"usuki","name":"臼杵","ownerId":"Otomo","troops":400,"cx":2328.88,"cy":5127.77,"neighbors":["funai","obi"],"commerce":90,"agriculture":50,"defense":70,"training":60,"loyalty":60},
  {"id":"saga","name":"村中","ownerId":"Ryuzoji","troops":700,"cx":1913.33,"cy":5099.99,"neighbors":["hakata","matsuura","arima","kumamoto"],"commerce":70,"agriculture":90,"defense":60,"training":75,"loyalty":60}, // 肥前の熊
  {"id":"matsuura","name":"松浦","ownerId":"Matsuura","troops":250,"cx":1762.22,"cy":5098.88,"neighbors":["saga","iki"],"commerce":100,"agriculture":50,"defense":40,"training":60,"loyalty":50},
  {"id":"arima","name":"有馬","ownerId":"Arima","troops":280,"cx":1905.55,"cy":5223.33,"neighbors":["saga","kumamoto"],"commerce":90,"agriculture":50,"defense":50,"training":55,"loyalty":50},
  {"id":"asou","name":"阿蘇","ownerId":"Aso","troops":200,"cx":2111.11,"cy":5192.22,"neighbors":["funai","obi","kumamoto"],"commerce":30,"agriculture":60,"defense":80,"training":55,"loyalty":60},
  {"id":"kumamoto","name":"隈本","ownerId":"Ida","troops":280,"cx":2086.66,"cy":5296.66,"neighbors":["saga","asou","arima","hitoyoshi"],"commerce":70,"agriculture":90,"defense":50,"training":55,"loyalty":50},
  {"id":"hitoyoshi","name":"人吉","ownerId":"Sagara","troops":250,"cx":2064.50,"cy":5402.72,"neighbors":["izumi_k","satsuma","kumamoto","osumi"],"commerce":40,"agriculture":60,"defense":70,"training":60,"loyalty":60},
  {"id":"obi","name":"飫肥","ownerId":"Ito","troops":350,"cx":2268.55,"cy":5417.66,"neighbors":["usuki","asou","satsuma","osumi"],"commerce":50,"agriculture":60,"defense":60,"training":55,"loyalty":50},
  {"id":"izumi_k","name":"出水","ownerId":"Shimazu","troops":400,"cx":2021.5,"cy":5512.6,"neighbors":["hitoyoshi","satsuma"],"commerce":50,"agriculture":50,"defense":60,"training":75,"loyalty":70},
  {"id":"satsuma","name":"薩摩","ownerId":"Shimazu","troops":1100,"cx":2057,"cy":5618.5,"neighbors":["izumi_k","hitoyoshi","obi","tanegashima","osumi"],"commerce":90,"agriculture":70,"defense":100,"training":90,"loyalty":90}, // 島津精鋭
  {"id":"osumi","name":"大隅","ownerId":"Shimazu","troops":350,"cx":2187,"cy":5655.2,"neighbors":["satsuma","obi","hitoyoshi","tanegashima"],"commerce":50,"agriculture":40,"defense":50,"training":75,"loyalty":70},
  {"id":"tanegashima","name":"種子島","ownerId":"Tanegashima","troops":200,"cx":2238.3,"cy":5879.6,"neighbors":["satsuma","amami","osumi"],"commerce":150,"agriculture":30,"defense":40,"training":70,"loyalty":60}, // 鉄砲
  {"id":"amami","name":"奄美","ownerId":"Ryukyu_Sho","troops":120,"cx":1958,"cy":6640,"neighbors":["tanegashima","shuri"],"commerce":50,"agriculture":30,"defense":30,"training":50,"loyalty":50},
  {"id":"tsushima","name":"対馬","ownerId":"So","troops":150,"cx":1654.5,"cy":4790.5,"neighbors":["iki","hakata"],"commerce":180,"agriculture":10,"defense":50,"training":60,"loyalty":60},
  {"id":"iki","name":"壱岐","ownerId":"Matsuura","troops":120,"cx":1763.33,"cy":4965.55,"neighbors":["tsushima","matsuura","hakata"],"commerce":70,"agriculture":20,"defense":30,"training":55,"loyalty":50},
  {"id":"shuri","name":"首里","ownerId":"Sho","troops":250,"cx":1693,"cy":7243,"neighbors":["amami"],"commerce":250,"agriculture":40,"defense":50,"training":50,"loyalty":60}
];

// ★修正: initializers.js で 'PROVINCES' としてインポートできるようにする
export const PROVINCES = PROVINCE_DATA_BASE;