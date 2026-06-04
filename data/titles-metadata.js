/* data/titles-metadata.js — 称号語 (title-word) pool, 47 prefectures × 5 words each.
 * Each word is [ja, en]. Rarity is derived by index (see RARITY_BY_INDEX in lib/titles.js):
 *   index 0,1 = common, 2 = rare, 3 = epic, 4 = legendary.
 * Title words are earned via no-miss (consecutive-correct) streak milestones; they are then
 * combined word + particle + word into a custom title (e.g. 雪原 の 覇者 = "Champion of the Snowfield").
 */
window.NH_TITLE_WORDS = {
  hokkaido:[['雪原','Snowfield'],['大地','Wildland'],['ジンギスカン','Jingisukan'],['踏破者','Trailblazer'],['覇者','Champion']],
  aomori:[['りんご','Apple'],['津軽','Tsugaru'],['ねぶた','Nebuta'],['灯篭持ち','Lanternbearer'],['北の守護者','Northguard']],
  iwate:[['南部','Nanbu'],['わんこ蕎麦','Wanko-soba'],['龍泉','Dragon-spring'],['健脚','Strider'],['岩の民','Stoneborn']],
  miyagi:[['牛タン','Gyutan'],['七夕','Tanabata'],['伊達','Date'],['杜の都','City-of-Trees'],['独眼竜','One-eyed-Dragon']],
  akita:[['きりたんぽ','Kiritanpo'],['秋田犬','Akita-inu'],['なまはげ','Namahage'],['雪国','Snowlander'],['美の郷','Land-of-Beauty']],
  yamagata:[['さくらんぼ','Cherry'],['蔵王','Zao'],['花笠','Hanagasa'],['樹氷','Ice-monster'],['山の民','Mountainfolk']],
  fukushima:[['桃','Peach'],['会津','Aizu'],['磐梯','Bandai'],['赤べこ','Red-ox'],['不屈','Unbroken']],
  ibaraki:[['納豆','Natto'],['梅花','Plum-blossom'],['偕楽','Kairaku'],['袋田','Falls-of-Fukuroda'],['常陸','Hitachi']],
  tochigi:[['苺','Strawberry'],['日光','Nikko'],['餃子','Gyoza'],['華厳','Kegon'],['雷都','Thunder-city']],
  gunma:[['温泉','Onsen'],['草津','Kusatsu'],['だるま','Daruma'],['上州','Joshu'],['空っ風','Windrider']],
  saitama:[['川越','Kawagoe'],['盆栽','Bonsai'],['煎餅','Senbei'],['彩の国','Land-of-Color'],['蔵造り','Kura-keeper']],
  chiba:[['落花生','Peanut'],['醤油','Shoyu'],['房総','Boso'],['海風','Sea-breeze'],['渚','Shoreborn']],
  tokyo:[['江戸','Edo'],['雷門','Kaminarimon'],['摩天楼','Skytower'],['帝都','Capital'],['流行','Trendsetter']],
  kanagawa:[['港','Harbor'],['鎌倉','Kamakura'],['大仏','Great-Buddha'],['湘南','Shonan'],['横濱','Yokohama']],
  niigata:[['米','Rice'],['錦鯉','Koi'],['越後','Echigo'],['雪見','Snowview'],['酒造り','Sake-brewer']],
  toyama:[['立山','Tateyama'],['鱒寿司','Trout-sushi'],['蜃気楼','Mirage'],['黒部','Kurobe'],['薬売り','Medicine-peddler']],
  ishikawa:[['金沢','Kanazawa'],['金箔','Goldleaf'],['加賀','Kaga'],['兼六','Kenroku'],['雅','Elegance']],
  fukui:[['恐竜','Dinosaur'],['越前','Echizen'],['蟹','Crab'],['東尋坊','Cliff-of-Tojinbo'],['永平','Eternal-Peace']],
  yamanashi:[['葡萄','Grape'],['富士','Fuji'],['武田','Takeda'],['湖畔','Lakeside'],['風林火山','Furinkazan']],
  nagano:[['信州','Shinshu'],['蕎麦','Soba'],['善光','Zenko'],['雷鳥','Snowgrouse'],['高嶺','Highpeak']],
  gifu:[['飛騨','Hida'],['白川','Shirakawa'],['鵜飼','Cormorant'],['合掌','Gassho'],['刃物匠','Bladesmith']],
  shizuoka:[['茶','Tea'],['鰻','Eel'],['駿河','Suruga'],['富士の麓','Foot-of-Fuji'],['波乗り','Wave-rider']],
  aichi:[['名古屋','Nagoya'],['味噌','Miso'],['尾張','Owari'],['金鯱','Golden-Orca'],['戦国','Sengoku']],
  mie:[['伊勢','Ise'],['真珠','Pearl'],['忍者','Ninja'],['神宮','Grand-Shrine'],['松阪','Matsusaka']],
  shiga:[['琵琶湖','Lake-Biwa'],['近江','Omi'],['信楽','Shigaraki'],['彦根','Hikone'],['湖国','Lake-Realm']],
  kyoto:[['抹茶','Matcha'],['舞妓','Maiko'],['古都','Ancient-Capital'],['千本鳥居','Thousand-Gates'],['雅','Refined']],
  osaka:[['たこ焼き','Takoyaki'],['浪速','Naniwa'],['道頓堀','Dotonbori'],['天下の台所','Kitchen-of-Japan'],['笑いの王','King-of-Comedy']],
  hyogo:[['神戸','Kobe'],['姫路','Himeji'],['白鷺','White-Heron'],['灘','Sake-Coast'],['港町','Port-town']],
  nara:[['鹿','Deer'],['大仏','Daibutsu'],['飛鳥','Asuka'],['古社','Old-Shrine'],['大和','Yamato']],
  wakayama:[['梅','Ume'],['熊野','Kumano'],['那智','Nachi'],['高野','Koya'],['巡礼者','Pilgrim']],
  tottori:[['砂丘','Dunes'],['梨','Pear'],['大山','Daisen'],['妖怪','Yokai'],['砂の民','Sandwalker']],
  shimane:[['出雲','Izumo'],['神話','Myth'],['石見','Iwami'],['縁結び','Matchmaker'],['神在','Where-Gods-Gather']],
  okayama:[['桃太郎','Momotaro'],['後楽','Korakuen'],['備前','Bizen'],['吉備','Kibi'],['晴れの国','Sunland']],
  hiroshima:[['お好み焼き','Okonomiyaki'],['厳島','Itsukushima'],['鯉','Carp'],['安芸','Aki'],['平和','Peace']],
  yamaguchi:[['ふぐ','Fugu'],['秋芳','Akiyoshi'],['萩','Hagi'],['角島','Tsunoshima'],['維新','Restoration']],
  tokushima:[['阿波踊り','Awa-Odori'],['渦潮','Whirlpool'],['藍','Indigo'],['鳴門','Naruto'],['祖谷','Iya']],
  kagawa:[['うどん','Udon'],['讃岐','Sanuki'],['瀬戸','Seto'],['金刀比羅','Kompira'],['オリーブ','Olive']],
  ehime:[['みかん','Mikan'],['道後','Dogo'],['今治','Imabari'],['伊予','Iyo'],['湯の街','Hot-Spring-Town']],
  kochi:[['鰹','Bonito'],['四万十','Shimanto'],['土佐','Tosa'],['龍馬','Ryoma'],['よさこい','Yosakoi']],
  fukuoka:[['博多','Hakata'],['ラーメン','Ramen'],['明太子','Mentaiko'],['屋台','Yatai'],['太宰府','Dazaifu']],
  saga:[['有田','Arita'],['焼物','Porcelain'],['嬉野','Ureshino'],['気球','Balloon'],['肥前','Hizen']],
  nagasaki:[['ちゃんぽん','Champon'],['出島','Dejima'],['眼鏡橋','Spectacles-Bridge'],['南蛮','Nanban'],['平和','Peace']],
  kumamoto:[['阿蘇','Aso'],['馬刺し','Basashi'],['熊本城','Castle-of-Kumamoto'],['火の国','Fire-Country'],['くまモン','Kumamon']],
  oita:[['別府','Beppu'],['温泉','Onsen'],['地獄','Hells'],['湯けむり','Steam-veil'],['豊後','Bungo']],
  miyazaki:[['マンゴー','Mango'],['高千穂','Takachiho'],['日向','Hyuga'],['神話','Myth'],['南国','Southland']],
  kagoshima:[['桜島','Sakurajima'],['黒豚','Kurobuta'],['薩摩','Satsuma'],['西郷','Saigo'],['火山','Volcano']],
  okinawa:[['美ら海','Churaumi'],['三線','Sanshin'],['シーサー','Shisa'],['琉球','Ryukyu'],['南風','Southwind']]
};

/* Connector particles. [ja, romaji, unlockAtCompletions].
 * Default = の only (unlockAt 0). Others unlock as the level test is cleared more times. */
window.NH_PARTICLES = [
  ['の','no',0],
  ['は','wa',1],
  ['を','wo',2],
  ['に','ni',3],
  ['へ','e',4],
  ['と','to',5],
  ['より','yori',6]
];
