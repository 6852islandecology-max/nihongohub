/* Equipment metadata: 47 prefectures × 4 slots (weapon/head/body/feet) = 188 items.
   Each item is themed to that prefecture's traditional culture, food, or geography.
   Used by:
   - scripts/generate-pixel-art.mjs (DALL-E prompts)
   - lib/equipment.js (display names, stats)
   - rpg.html (equipment inventory UI)
*/
window.NH_EQUIPMENT = {
  hokkaido: {
    weapon: { name: { en: "Ice Spear", ja: "氷の槍" }, desc: "Forged from Lake Mashū's eternal ice", rarity: "epic", stats: { atk: 18, def: 4 } },
    head:   { name: { en: "Snow Hood", ja: "雪原のフード" }, desc: "Ainu-inspired snow visor", rarity: "rare", stats: { atk: 0, def: 12 } },
    body:   { name: { en: "Bear Pelt Coat", ja: "ヒグマの毛皮" }, desc: "Warmth of the Daisetsuzan mountains", rarity: "rare", stats: { atk: 2, def: 14 } },
    feet:   { name: { en: "Powder Snow Boots", ja: "粉雪のブーツ" }, desc: "Glides over Niseko powder", rarity: "common", stats: { atk: 0, def: 6 } }
  },
  aomori: {
    weapon: { name: { en: "Nebuta Lantern Staff", ja: "ねぶた灯篭の杖" }, desc: "Fiery festival staff", rarity: "epic", stats: { atk: 16, def: 2 } },
    head:   { name: { en: "Nebuta Mask", ja: "ねぶた面" }, desc: "Painted warrior visage", rarity: "rare", stats: { atk: 4, def: 8 } },
    body:   { name: { en: "Tsugaru Robe", ja: "津軽塗の羽織" }, desc: "Lacquered formal robe", rarity: "common", stats: { atk: 0, def: 9 } },
    feet:   { name: { en: "Apple Orchard Sandals", ja: "りんご園の草履" }, desc: "Light orchard footwear", rarity: "common", stats: { atk: 0, def: 5 } }
  },
  iwate: {
    weapon: { name: { en: "Nanbu Iron Mace", ja: "南部鉄器の鎚" }, desc: "Heavy ironware hammer", rarity: "rare", stats: { atk: 14, def: 6 } },
    head:   { name: { en: "Chagu Chagu Helm", ja: "チャグチャグ兜" }, desc: "Bell-adorned horseman helm", rarity: "rare", stats: { atk: 0, def: 11 } },
    body:   { name: { en: "Wanko Soba Apron", ja: "わんこそば前掛け" }, desc: "Endurance of a hundred bowls", rarity: "common", stats: { atk: 0, def: 8 } },
    feet:   { name: { en: "Hiraizumi Pilgrim Boots", ja: "平泉の足袋" }, desc: "UNESCO pilgrim soles", rarity: "common", stats: { atk: 0, def: 5 } }
  },
  miyagi: {
    weapon: { name: { en: "Date Masamune Katana", ja: "伊達政宗の刀" }, desc: "One-eyed dragon's blade", rarity: "legendary", stats: { atk: 22, def: 4 } },
    head:   { name: { en: "Crescent Moon Helm", ja: "三日月の兜" }, desc: "Date clan crescent crest", rarity: "epic", stats: { atk: 2, def: 14 } },
    body:   { name: { en: "Sendai Tanabata Robe", ja: "仙台七夕の浴衣" }, desc: "Star festival garments", rarity: "common", stats: { atk: 0, def: 8 } },
    feet:   { name: { en: "Matsushima Geta", ja: "松島の下駄" }, desc: "Bay-walking wooden sandals", rarity: "common", stats: { atk: 0, def: 5 } }
  },
  akita: {
    weapon: { name: { en: "Namahage Cleaver", ja: "なまはげの鎚" }, desc: "Demon's New Year cleaver", rarity: "epic", stats: { atk: 17, def: 3 } },
    head:   { name: { en: "Namahage Mask", ja: "なまはげ面" }, desc: "Red ogre visage", rarity: "epic", stats: { atk: 3, def: 10 } },
    body:   { name: { en: "Straw Cape", ja: "ケラ蓑" }, desc: "Traditional rain-cape of straw", rarity: "common", stats: { atk: 0, def: 7 } },
    feet:   { name: { en: "Kiritanpo Trekkers", ja: "きりたんぽ草鞋" }, desc: "Mountain hot-pot sandals", rarity: "common", stats: { atk: 0, def: 5 } }
  },
  yamagata: {
    weapon: { name: { en: "Cherry Blossom Sickle", ja: "桜の鎌" }, desc: "Sake-brewer's tool", rarity: "rare", stats: { atk: 12, def: 4 } },
    head:   { name: { en: "Hanagasa Crown", ja: "花笠" }, desc: "Flower-dance hat", rarity: "rare", stats: { atk: 2, def: 8 } },
    body:   { name: { en: "Yonezawa Silk Robe", ja: "米沢織の絹" }, desc: "Date clan silk weave", rarity: "rare", stats: { atk: 0, def: 11 } },
    feet:   { name: { en: "Ginzan Onsen Slippers", ja: "銀山温泉の下駄" }, desc: "Silver-mine hot-spring sandals", rarity: "common", stats: { atk: 0, def: 5 } }
  },
  fukushima: {
    weapon: { name: { en: "Aizu Lacquer Bow", ja: "会津漆の弓" }, desc: "Polished cherrywood bow", rarity: "rare", stats: { atk: 13, def: 3 } },
    head:   { name: { en: "Akabeko Mask", ja: "赤べこの面" }, desc: "Red-cow charm helm", rarity: "common", stats: { atk: 0, def: 8 } },
    body:   { name: { en: "Ouchi-juku Cloak", ja: "大内宿の羽織" }, desc: "Edo-era postal town robe", rarity: "common", stats: { atk: 0, def: 9 } },
    feet:   { name: { en: "Bandai Mountain Boots", ja: "磐梯山の登山靴" }, desc: "Volcanic-peak boots", rarity: "common", stats: { atk: 0, def: 6 } }
  },
  ibaraki: {
    weapon: { name: { en: "Mito Plum Naginata", ja: "水戸の梅薙刀" }, desc: "Kairaku-en plum-blossom polearm", rarity: "rare", stats: { atk: 14, def: 4 } },
    head:   { name: { en: "Natto Straw Hat", ja: "納豆藁の傘" }, desc: "Fermenting harvest hat", rarity: "common", stats: { atk: 0, def: 7 } },
    body:   { name: { en: "Kasama Pottery Apron", ja: "笠間焼の前掛け" }, desc: "Potter's earthen apron", rarity: "common", stats: { atk: 0, def: 8 } },
    feet:   { name: { en: "Hitachi Seaside Sandals", ja: "ひたち海浜の草履" }, desc: "Nemophila-field sandals", rarity: "common", stats: { atk: 0, def: 5 } }
  },
  tochigi: {
    weapon: { name: { en: "Nikko Toshogu Tachi", ja: "日光東照宮の太刀" }, desc: "Tokugawa-shrine blessed blade", rarity: "epic", stats: { atk: 18, def: 4 } },
    head:   { name: { en: "Three Monkeys Hood", ja: "三猿のフード" }, desc: "See/hear/speak no evil cowl", rarity: "rare", stats: { atk: 0, def: 10 } },
    body:   { name: { en: "Strawberry Field Cape", ja: "とちおとめの羽織" }, desc: "Royal berry-farm robe", rarity: "common", stats: { atk: 0, def: 7 } },
    feet:   { name: { en: "Kegon Waterfall Greaves", ja: "華厳の滝の脚絆" }, desc: "Cliffside waterfall boots", rarity: "common", stats: { atk: 0, def: 6 } }
  },
  gunma: {
    weapon: { name: { en: "Daruma Iron Fan", ja: "だるまの鉄扇" }, desc: "Wish-granting iron fan", rarity: "rare", stats: { atk: 11, def: 6 } },
    head:   { name: { en: "Daruma Mask", ja: "だるまの面" }, desc: "Red wish-doll visage", rarity: "rare", stats: { atk: 0, def: 9 } },
    body:   { name: { en: "Konjac Apron", ja: "こんにゃくの前掛け" }, desc: "Konnyaku-maker's apron", rarity: "common", stats: { atk: 0, def: 7 } },
    feet:   { name: { en: "Kusatsu Onsen Geta", ja: "草津温泉の下駄" }, desc: "Yubatake hot-spring sandals", rarity: "common", stats: { atk: 0, def: 5 } }
  },
  saitama: {
    weapon: { name: { en: "Kawagoe Bell Mace", ja: "川越の鐘鎚" }, desc: "Time-bell tower mace", rarity: "rare", stats: { atk: 12, def: 5 } },
    head:   { name: { en: "Edo Komon Helm", ja: "江戸小紋の兜" }, desc: "Fine-pattern dye helmet", rarity: "common", stats: { atk: 0, def: 8 } },
    body:   { name: { en: "Chichibu Silk Robe", ja: "秩父銘仙の羽織" }, desc: "Tie-dyed silk weave", rarity: "common", stats: { atk: 0, def: 9 } },
    feet:   { name: { en: "Bonsai Garden Slippers", ja: "盆栽の下駄" }, desc: "Omiya bonsai-village geta", rarity: "common", stats: { atk: 0, def: 5 } }
  },
  chiba: {
    weapon: { name: { en: "Boso Peninsula Trident", ja: "房総半島の三叉戟" }, desc: "Pacific-coast fisher's trident", rarity: "rare", stats: { atk: 15, def: 3 } },
    head:   { name: { en: "Narita Pilgrim Helm", ja: "成田山の兜" }, desc: "Shinshōji temple helmet", rarity: "common", stats: { atk: 0, def: 8 } },
    body:   { name: { en: "Peanut Farmer Robe", ja: "落花生農家の羽織" }, desc: "Yachimata peanut-field robe", rarity: "common", stats: { atk: 0, def: 7 } },
    feet:   { name: { en: "Mt Nokogiri Climbing Boots", ja: "鋸山の登山靴" }, desc: "Saw-mountain cliff boots", rarity: "common", stats: { atk: 0, def: 6 } }
  },
  tokyo: {
    weapon: { name: { en: "Edo Town Fireman's Hook", ja: "江戸火消しの纏" }, desc: "Brave firefighter's banner-hook", rarity: "epic", stats: { atk: 16, def: 6 } },
    head:   { name: { en: "Edo Fireman Helm", ja: "江戸火消し兜" }, desc: "Crested firefighter helmet", rarity: "epic", stats: { atk: 2, def: 13 } },
    body:   { name: { en: "Asakusa Hanten Coat", ja: "浅草の半纏" }, desc: "Festival worker's coat", rarity: "rare", stats: { atk: 0, def: 11 } },
    feet:   { name: { en: "Tokyo Sneakers", ja: "東京スニーカー" }, desc: "Modern city runners", rarity: "common", stats: { atk: 0, def: 7 } }
  },
  kanagawa: {
    weapon: { name: { en: "Great Wave Trident", ja: "神奈川沖浪の三叉戟" }, desc: "Hokusai's ocean-wave spear", rarity: "epic", stats: { atk: 17, def: 4 } },
    head:   { name: { en: "Daibutsu Crown", ja: "鎌倉大仏の頭飾り" }, desc: "Buddha-statue contemplation crown", rarity: "rare", stats: { atk: 0, def: 10 } },
    body:   { name: { en: "Yokohama Sailor Coat", ja: "横浜の水兵服" }, desc: "Meiji-era port-city sailor coat", rarity: "common", stats: { atk: 0, def: 9 } },
    feet:   { name: { en: "Enoshima Surf Sandals", ja: "江の島のサーフ草履" }, desc: "Beach-day sandals", rarity: "common", stats: { atk: 0, def: 5 } }
  },
  niigata: {
    weapon: { name: { en: "Sake Brewery Hammer", ja: "酒蔵の槌" }, desc: "Rice-mill master's tool", rarity: "rare", stats: { atk: 12, def: 5 } },
    head:   { name: { en: "Sado Ondeko Mask", ja: "佐渡おんでこの面" }, desc: "Demon-drum dancer mask", rarity: "rare", stats: { atk: 3, def: 8 } },
    body:   { name: { en: "Echigo Cotton Cloak", ja: "越後の木綿" }, desc: "Snow-country woven cloak", rarity: "common", stats: { atk: 0, def: 10 } },
    feet:   { name: { en: "Yuki Yu Snow Boots", ja: "雪国のブーツ" }, desc: "Heavy-snow region footwear", rarity: "common", stats: { atk: 0, def: 6 } }
  },
  toyama: {
    weapon: { name: { en: "Tateyama Halberd", ja: "立山の薙刀" }, desc: "Alpine-route polearm", rarity: "rare", stats: { atk: 14, def: 5 } },
    head:   { name: { en: "Owara Kaze-no-Bon Hat", ja: "おわら風の盆の編笠" }, desc: "Wind festival straw hat", rarity: "rare", stats: { atk: 0, def: 9 } },
    body:   { name: { en: "Gokayama Gassho Robe", ja: "五箇山合掌の羽織" }, desc: "Steep-roof village robe", rarity: "common", stats: { atk: 0, def: 9 } },
    feet:   { name: { en: "Toyama Bay Fishermen's Boots", ja: "富山湾の漁師長靴" }, desc: "Glow-squid fisher's boots", rarity: "common", stats: { atk: 0, def: 6 } }
  },
  ishikawa: {
    weapon: { name: { en: "Kanazawa Gold-leaf Katana", ja: "金沢金箔の刀" }, desc: "Maeda clan gilded blade", rarity: "legendary", stats: { atk: 20, def: 5 } },
    head:   { name: { en: "Kaga Yuzen Crown", ja: "加賀友禅の冠" }, desc: "Dyed-silk noble crown", rarity: "epic", stats: { atk: 0, def: 12 } },
    body:   { name: { en: "Wajima Lacquer Armor", ja: "輪島塗の鎧" }, desc: "Black-lacquer light armor", rarity: "epic", stats: { atk: 0, def: 13 } },
    feet:   { name: { en: "Kenroku-en Garden Geta", ja: "兼六園の下駄" }, desc: "Stroll-garden sandals", rarity: "common", stats: { atk: 0, def: 5 } }
  },
  fukui: {
    weapon: { name: { en: "Echizen Forged Blade", ja: "越前打刃物" }, desc: "700-year smithing tradition", rarity: "epic", stats: { atk: 17, def: 4 } },
    head:   { name: { en: "Wakasa Lacquered Helm", ja: "若狭塗の兜" }, desc: "Sea-shell inlaid helm", rarity: "rare", stats: { atk: 0, def: 10 } },
    body:   { name: { en: "Tojinbo Cliff Robe", ja: "東尋坊の羽織" }, desc: "Sea-cliff wind robe", rarity: "common", stats: { atk: 0, def: 7 } },
    feet:   { name: { en: "Dinosaur Fossil Boots", ja: "恐竜化石の靴" }, desc: "Dinosaur-museum digger's boots", rarity: "rare", stats: { atk: 0, def: 8 } }
  },
  yamanashi: {
    weapon: { name: { en: "Mt Fuji Pilgrim Staff", ja: "富士山の杖" }, desc: "Summit-trail walking staff", rarity: "epic", stats: { atk: 11, def: 6 } },
    head:   { name: { en: "Takeda Shingen Helm", ja: "武田信玄の兜" }, desc: "Tiger-of-Kai war helm", rarity: "legendary", stats: { atk: 4, def: 16 } },
    body:   { name: { en: "Grape-vineyard Cloak", ja: "ぶどう畑の羽織" }, desc: "Koshu wine-region robe", rarity: "common", stats: { atk: 0, def: 7 } },
    feet:   { name: { en: "Fuji Climbing Boots", ja: "富士登山靴" }, desc: "Cinder-trail trekking boots", rarity: "rare", stats: { atk: 0, def: 8 } }
  },
  nagano: {
    weapon: { name: { en: "Matsumoto Castle Spear", ja: "松本城の槍" }, desc: "Crow-castle long spear", rarity: "epic", stats: { atk: 15, def: 5 } },
    head:   { name: { en: "Zenkoji Pilgrim Hood", ja: "善光寺の頭巾" }, desc: "Temple pilgrim's cowl", rarity: "rare", stats: { atk: 0, def: 9 } },
    body:   { name: { en: "Soba-fields Coat", ja: "そば畑の羽織" }, desc: "Buckwheat-harvest robe", rarity: "common", stats: { atk: 0, def: 8 } },
    feet:   { name: { en: "Alps Trekking Boots", ja: "アルプス登山靴" }, desc: "Northern Alps boots", rarity: "rare", stats: { atk: 0, def: 9 } }
  },
  gifu: {
    weapon: { name: { en: "Seki Master Katana", ja: "関の刀" }, desc: "Legendary swordsmith blade", rarity: "legendary", stats: { atk: 22, def: 3 } },
    head:   { name: { en: "Gujo Odori Hat", ja: "郡上踊りの編笠" }, desc: "Summer-dance straw hat", rarity: "common", stats: { atk: 0, def: 7 } },
    body:   { name: { en: "Shirakawa-go Cape", ja: "白川郷の羽織" }, desc: "Gassho-village winter cape", rarity: "rare", stats: { atk: 0, def: 10 } },
    feet:   { name: { en: "Hida Beef Farmer Boots", ja: "飛騨牛農家の長靴" }, desc: "Mountain-ranch boots", rarity: "common", stats: { atk: 0, def: 6 } }
  },
  shizuoka: {
    weapon: { name: { en: "Suruga Bamboo Lance", ja: "駿河竹の槍" }, desc: "Bamboo-craft pole arm", rarity: "rare", stats: { atk: 13, def: 4 } },
    head:   { name: { en: "Tea Picker Hat", ja: "茶摘み笠" }, desc: "Shizuoka tea-field hat", rarity: "common", stats: { atk: 0, def: 7 } },
    body:   { name: { en: "Fuji-view Hanten", ja: "富士山ビューの半纏" }, desc: "Mountain-view festival coat", rarity: "common", stats: { atk: 0, def: 8 } },
    feet:   { name: { en: "Izu Onsen Sandals", ja: "伊豆温泉の下駄" }, desc: "Peninsula hot-spring sandals", rarity: "common", stats: { atk: 0, def: 5 } }
  },
  aichi: {
    weapon: { name: { en: "Nobunaga War Fan", ja: "信長の軍配" }, desc: "Oda warlord command fan", rarity: "legendary", stats: { atk: 18, def: 6 } },
    head:   { name: { en: "Nagoya Castle Helm", ja: "名古屋城の兜" }, desc: "Golden shachihoko helm", rarity: "epic", stats: { atk: 2, def: 13 } },
    body:   { name: { en: "Arimatsu Shibori Robe", ja: "有松絞りの羽織" }, desc: "Tie-dye master robe", rarity: "rare", stats: { atk: 0, def: 10 } },
    feet:   { name: { en: "Hitsumabushi Chef Geta", ja: "ひつまぶし料理人の下駄" }, desc: "Eel-rice chef sandals", rarity: "common", stats: { atk: 0, def: 5 } }
  },
  mie: {
    weapon: { name: { en: "Ninja Kunai", ja: "伊賀忍者の苦無" }, desc: "Iga ninja-clan kunai", rarity: "epic", stats: { atk: 16, def: 4 } },
    head:   { name: { en: "Ninja Hood", ja: "忍者の頭巾" }, desc: "Iga shinobi hood", rarity: "epic", stats: { atk: 4, def: 9 } },
    body:   { name: { en: "Ise Shinto Robe", ja: "伊勢神宮の白装束" }, desc: "Grand shrine pilgrim robe", rarity: "rare", stats: { atk: 0, def: 11 } },
    feet:   { name: { en: "Pearl Diver Fins", ja: "海女のひれ" }, desc: "Ama-diver pearl-hunting fins", rarity: "rare", stats: { atk: 0, def: 7 } }
  },
  shiga: {
    weapon: { name: { en: "Hikone Castle Naginata", ja: "彦根城の薙刀" }, desc: "Ii clan red-warrior polearm", rarity: "epic", stats: { atk: 15, def: 5 } },
    head:   { name: { en: "Ii Red Helm", ja: "井伊の赤備え兜" }, desc: "Crimson cavalry helm", rarity: "legendary", stats: { atk: 3, def: 15 } },
    body:   { name: { en: "Biwa Pearl Robe", ja: "琵琶湖真珠の羽織" }, desc: "Freshwater-pearl trimmed robe", rarity: "rare", stats: { atk: 0, def: 10 } },
    feet:   { name: { en: "Lake Biwa Boots", ja: "琵琶湖の長靴" }, desc: "Fishing-village waders", rarity: "common", stats: { atk: 0, def: 6 } }
  },
  kyoto: {
    weapon: { name: { en: "Tea Ceremony Chasen", ja: "茶筅" }, desc: "Bamboo whisk of Urasenke", rarity: "epic", stats: { atk: 12, def: 8 } },
    head:   { name: { en: "Maiko Wig Crown", ja: "舞妓の鬘" }, desc: "Geiko apprentice headdress", rarity: "legendary", stats: { atk: 2, def: 14 } },
    body:   { name: { en: "Nishijin Brocade Robe", ja: "西陣織の着物" }, desc: "Imperial silk weave", rarity: "legendary", stats: { atk: 0, def: 16 } },
    feet:   { name: { en: "Gion Pokkuri Geta", ja: "祇園のぽっくり下駄" }, desc: "Apprentice tall-clog sandals", rarity: "epic", stats: { atk: 0, def: 9 } }
  },
  osaka: {
    weapon: { name: { en: "Takoyaki Pan Mace", ja: "たこ焼き鉄板鎚" }, desc: "Iron-griddle warhammer", rarity: "rare", stats: { atk: 14, def: 6 } },
    head:   { name: { en: "Glico Runner Headband", ja: "グリコランナーの鉢巻" }, desc: "Dotonbori sign-runner headband", rarity: "rare", stats: { atk: 3, def: 7 } },
    body:   { name: { en: "Osaka Castle Hanten", ja: "大阪城の半纏" }, desc: "Hideyoshi castle robe", rarity: "epic", stats: { atk: 0, def: 12 } },
    feet:   { name: { en: "Shinsaibashi Sneakers", ja: "心斎橋のスニーカー" }, desc: "Modern shopping-arcade sneakers", rarity: "common", stats: { atk: 0, def: 7 } }
  },
  hyogo: {
    weapon: { name: { en: "Himeji White Heron Spear", ja: "姫路白鷺の槍" }, desc: "White-castle spear", rarity: "epic", stats: { atk: 17, def: 4 } },
    head:   { name: { en: "Akashi Octopus Helm", ja: "明石ダコの兜" }, desc: "Octopus-shaped sea helm", rarity: "rare", stats: { atk: 0, def: 10 } },
    body:   { name: { en: "Kobe Beef Chef Robe", ja: "神戸牛料理人の白衣" }, desc: "Wagyu chef's white coat", rarity: "rare", stats: { atk: 0, def: 9 } },
    feet:   { name: { en: "Arima Onsen Geta", ja: "有馬温泉の下駄" }, desc: "Imperial hot-spring sandals", rarity: "common", stats: { atk: 0, def: 5 } }
  },
  nara: {
    weapon: { name: { en: "Deer Antler Staff", ja: "鹿角の杖" }, desc: "Sacred-deer antler staff", rarity: "epic", stats: { atk: 14, def: 5 } },
    head:   { name: { en: "Todaiji Monk Cowl", ja: "東大寺の頭巾" }, desc: "Great-Buddha temple cowl", rarity: "rare", stats: { atk: 0, def: 11 } },
    body:   { name: { en: "Nara Period Kimono", ja: "天平の衣" }, desc: "8th-century court robe", rarity: "legendary", stats: { atk: 0, def: 14 } },
    feet:   { name: { en: "Kasugayama Pilgrim Sandals", ja: "春日山の草履" }, desc: "Forest-pilgrim sandals", rarity: "common", stats: { atk: 0, def: 5 } }
  },
  wakayama: {
    weapon: { name: { en: "Kumano Pilgrim Staff", ja: "熊野の金剛杖" }, desc: "Kumano-kodo wooden staff", rarity: "epic", stats: { atk: 13, def: 6 } },
    head:   { name: { en: "Mountain Mystic Hood", ja: "山伏の頭巾" }, desc: "Yamabushi ascetic hood", rarity: "rare", stats: { atk: 0, def: 10 } },
    body:   { name: { en: "Koyasan Monk Robe", ja: "高野山の僧衣" }, desc: "Shingon monk's robe", rarity: "rare", stats: { atk: 0, def: 11 } },
    feet:   { name: { en: "Pilgrimage Waraji", ja: "巡礼の草鞋" }, desc: "Straw pilgrim sandals", rarity: "common", stats: { atk: 0, def: 5 } }
  },
  tottori: {
    weapon: { name: { en: "Sand Dune Scimitar", ja: "鳥取砂丘の偃月刀" }, desc: "Desert-curved blade", rarity: "rare", stats: { atk: 13, def: 4 } },
    head:   { name: { en: "Detective Conan Cap", ja: "コナンの帽子" }, desc: "Mystery-museum tribute cap", rarity: "common", stats: { atk: 0, def: 7 } },
    body:   { name: { en: "Gegege Yokai Cloak", ja: "ゲゲゲの鬼太郎マント" }, desc: "Yokai-museum cape", rarity: "rare", stats: { atk: 0, def: 9 } },
    feet:   { name: { en: "Dune Camel Boots", ja: "砂丘ラクダ靴" }, desc: "Sand-dune hiking boots", rarity: "common", stats: { atk: 0, def: 6 } }
  },
  shimane: {
    weapon: { name: { en: "Izumo Shrine Sword", ja: "出雲大社の太刀" }, desc: "Grand-shrine ancient blade", rarity: "legendary", stats: { atk: 20, def: 4 } },
    head:   { name: { en: "Iwami Kagura Mask", ja: "石見神楽の面" }, desc: "Sacred-dance dragon mask", rarity: "epic", stats: { atk: 5, def: 9 } },
    body:   { name: { en: "Adachi Museum Robe", ja: "足立美術館の羽織" }, desc: "Garden-art robe", rarity: "common", stats: { atk: 0, def: 8 } },
    feet:   { name: { en: "Oki Islands Boots", ja: "隠岐諸島の長靴" }, desc: "Remote-island fisher boots", rarity: "common", stats: { atk: 0, def: 6 } }
  },
  okayama: {
    weapon: { name: { en: "Momotaro Sword", ja: "桃太郎の刀" }, desc: "Peach-boy hero's blade", rarity: "epic", stats: { atk: 15, def: 5 } },
    head:   { name: { en: "Bizen Pottery Helm", ja: "備前焼の兜" }, desc: "Earthen-fired helm", rarity: "rare", stats: { atk: 0, def: 10 } },
    body:   { name: { en: "Korakuen Garden Robe", ja: "後楽園の羽織" }, desc: "Three-great-gardens robe", rarity: "common", stats: { atk: 0, def: 8 } },
    feet:   { name: { en: "Kurashiki Canal Geta", ja: "倉敷川の下駄" }, desc: "White-walled canal sandals", rarity: "common", stats: { atk: 0, def: 5 } }
  },
  hiroshima: {
    weapon: { name: { en: "Itsukushima Naginata", ja: "厳島の薙刀" }, desc: "Floating-torii polearm", rarity: "epic", stats: { atk: 16, def: 5 } },
    head:   { name: { en: "Carp Helmet", ja: "鯉の兜" }, desc: "Hiroshima carp-team helm", rarity: "rare", stats: { atk: 0, def: 9 } },
    body:   { name: { en: "Peace Memorial Cloak", ja: "平和記念の羽織" }, desc: "Memorial-park robe", rarity: "rare", stats: { atk: 0, def: 10 } },
    feet:   { name: { en: "Okonomiyaki Chef Geta", ja: "お好み焼き職人の下駄" }, desc: "Hot-griddle chef sandals", rarity: "common", stats: { atk: 0, def: 5 } }
  },
  yamaguchi: {
    weapon: { name: { en: "Choshu Long Rifle", ja: "長州の長銃" }, desc: "Meiji-restoration musket", rarity: "epic", stats: { atk: 17, def: 3 } },
    head:   { name: { en: "Shimonoseki Pufferfish Cap", ja: "下関ふぐの帽子" }, desc: "Fugu-themed cap", rarity: "common", stats: { atk: 0, def: 7 } },
    body:   { name: { en: "Hagi Pottery Robe", ja: "萩焼の羽織" }, desc: "Aged-pottery master robe", rarity: "rare", stats: { atk: 0, def: 10 } },
    feet:   { name: { en: "Akiyoshido Cave Boots", ja: "秋芳洞のブーツ" }, desc: "Limestone-cave boots", rarity: "common", stats: { atk: 0, def: 6 } }
  },
  tokushima: {
    weapon: { name: { en: "Awa Odori Sandalwood Fan", ja: "阿波踊りの扇" }, desc: "Dance-festival fan", rarity: "rare", stats: { atk: 11, def: 5 } },
    head:   { name: { en: "Awa Dancer Crown", ja: "阿波踊りの編笠" }, desc: "Female-dancer woven hat", rarity: "rare", stats: { atk: 0, def: 8 } },
    body:   { name: { en: "Indigo Aizome Robe", ja: "藍染の羽織" }, desc: "Naruto-indigo dyed robe", rarity: "epic", stats: { atk: 0, def: 11 } },
    feet:   { name: { en: "Naruto Whirlpool Sandals", ja: "鳴門うずしおの草履" }, desc: "Whirlpool-bridge sandals", rarity: "common", stats: { atk: 0, def: 5 } }
  },
  kagawa: {
    weapon: { name: { en: "Sanuki Udon Rolling Pin", ja: "讃岐うどんの麺棒" }, desc: "Noodle-master's pin", rarity: "common", stats: { atk: 9, def: 3 } },
    head:   { name: { en: "Konpira Pilgrim Hood", ja: "金刀比羅宮の頭巾" }, desc: "1368-stairs pilgrim cowl", rarity: "rare", stats: { atk: 0, def: 9 } },
    body:   { name: { en: "Naoshima Art Cape", ja: "直島アートのマント" }, desc: "Art-island cape", rarity: "rare", stats: { atk: 0, def: 8 } },
    feet:   { name: { en: "Shodoshima Olive Sandals", ja: "小豆島オリーブの草履" }, desc: "Olive-island sandals", rarity: "common", stats: { atk: 0, def: 5 } }
  },
  ehime: {
    weapon: { name: { en: "Dogo Onsen Wooden Staff", ja: "道後温泉の杖" }, desc: "Ancient-bath walking staff", rarity: "rare", stats: { atk: 10, def: 5 } },
    head:   { name: { en: "Matsuyama Castle Helm", ja: "松山城の兜" }, desc: "Hilltop-castle helm", rarity: "rare", stats: { atk: 0, def: 10 } },
    body:   { name: { en: "Mikan Orchard Robe", ja: "みかん畑の羽織" }, desc: "Citrus-harvest robe", rarity: "common", stats: { atk: 0, def: 7 } },
    feet:   { name: { en: "Shimanami Cycling Shoes", ja: "しまなみ海道の自転車靴" }, desc: "Island-hop cycling shoes", rarity: "rare", stats: { atk: 0, def: 8 } }
  },
  kochi: {
    weapon: { name: { en: "Sakamoto Ryoma Revolver", ja: "坂本龍馬の拳銃" }, desc: "Bakumatsu samurai pistol", rarity: "legendary", stats: { atk: 19, def: 2 } },
    head:   { name: { en: "Yosakoi Headband", ja: "よさこいの鉢巻" }, desc: "Summer-dance headband", rarity: "rare", stats: { atk: 2, def: 7 } },
    body:   { name: { en: "Tosa Hineri Coat", ja: "土佐ひねりの羽織" }, desc: "Tosa-clan twist robe", rarity: "common", stats: { atk: 0, def: 8 } },
    feet:   { name: { en: "Shimanto River Boots", ja: "四万十川の長靴" }, desc: "Last-clear-river fishing boots", rarity: "common", stats: { atk: 0, def: 6 } }
  },
  fukuoka: {
    weapon: { name: { en: "Yamakasa Festival Pole", ja: "山笠の竿" }, desc: "Race-festival running pole", rarity: "epic", stats: { atk: 14, def: 5 } },
    head:   { name: { en: "Hakata Doll Crown", ja: "博多人形の冠" }, desc: "Clay-doll inspired crown", rarity: "rare", stats: { atk: 0, def: 9 } },
    body:   { name: { en: "Hakata Obi Robe", ja: "博多帯の着物" }, desc: "Traditional-obi weave robe", rarity: "rare", stats: { atk: 0, def: 10 } },
    feet:   { name: { en: "Tonkotsu Chef Geta", ja: "とんこつ職人の下駄" }, desc: "Ramen-chef wooden sandals", rarity: "common", stats: { atk: 0, def: 5 } }
  },
  saga: {
    weapon: { name: { en: "Arita Porcelain Mace", ja: "有田焼の鎚" }, desc: "White-porcelain warhammer", rarity: "rare", stats: { atk: 12, def: 5 } },
    head:   { name: { en: "Yoshinogari Bronze Crown", ja: "吉野ヶ里の青銅冠" }, desc: "Yayoi-era bronze crown", rarity: "epic", stats: { atk: 2, def: 11 } },
    body:   { name: { en: "Karatsu Cloth Robe", ja: "唐津織の羽織" }, desc: "Karatsu-weave robe", rarity: "common", stats: { atk: 0, def: 8 } },
    feet:   { name: { en: "Saga Balloon Festival Boots", ja: "佐賀バルーンフェスタの靴" }, desc: "Balloon-launch boots", rarity: "common", stats: { atk: 0, def: 6 } }
  },
  nagasaki: {
    weapon: { name: { en: "Dejima Dutch Saber", ja: "出島オランダの剣" }, desc: "Edo-era foreign trade saber", rarity: "epic", stats: { atk: 15, def: 5 } },
    head:   { name: { en: "Castella Baker's Cap", ja: "カステラ職人の帽子" }, desc: "Portuguese-cake chef hat", rarity: "common", stats: { atk: 0, def: 7 } },
    body:   { name: { en: "Glover Garden Coat", ja: "グラバー園のコート" }, desc: "Western-style coat", rarity: "rare", stats: { atk: 0, def: 10 } },
    feet:   { name: { en: "Gunkanjima Boots", ja: "軍艦島のブーツ" }, desc: "Battleship-island miner boots", rarity: "rare", stats: { atk: 0, def: 8 } }
  },
  kumamoto: {
    weapon: { name: { en: "Kumamoto Castle Spear", ja: "熊本城の槍" }, desc: "Kato Kiyomasa's castle spear", rarity: "epic", stats: { atk: 16, def: 5 } },
    head:   { name: { en: "Kumamon Headband", ja: "くまモンの鉢巻" }, desc: "Black-bear mascot band", rarity: "rare", stats: { atk: 0, def: 8 } },
    body:   { name: { en: "Aso Volcano Robe", ja: "阿蘇山の羽織" }, desc: "Volcanic-region robe", rarity: "rare", stats: { atk: 0, def: 9 } },
    feet:   { name: { en: "Aso Plateau Boots", ja: "阿蘇高原の長靴" }, desc: "Highland-grazing boots", rarity: "common", stats: { atk: 0, def: 6 } }
  },
  oita: {
    weapon: { name: { en: "Beppu Hot Spring Staff", ja: "別府温泉の杖" }, desc: "Eight-hells walking staff", rarity: "rare", stats: { atk: 10, def: 5 } },
    head:   { name: { en: "Yufuin Mist Hood", ja: "由布院の頭巾" }, desc: "Mist-valley hooded cowl", rarity: "common", stats: { atk: 0, def: 8 } },
    body:   { name: { en: "Onsen Yukata", ja: "温泉浴衣" }, desc: "Hot-spring resort yukata", rarity: "common", stats: { atk: 0, def: 8 } },
    feet:   { name: { en: "Hot Spring Geta", ja: "温泉下駄" }, desc: "Bath-town wooden sandals", rarity: "common", stats: { atk: 0, def: 5 } }
  },
  miyazaki: {
    weapon: { name: { en: "Takachiho Sacred Mirror Bow", ja: "高千穂の弓" }, desc: "Mythical-origin bow", rarity: "legendary", stats: { atk: 18, def: 4 } },
    head:   { name: { en: "Sun Goddess Crown", ja: "天照大神の冠" }, desc: "Amaterasu-myth crown", rarity: "legendary", stats: { atk: 3, def: 14 } },
    body:   { name: { en: "Mango Farmer Robe", ja: "マンゴー農家の羽織" }, desc: "Tropical-fruit farm robe", rarity: "common", stats: { atk: 0, def: 7 } },
    feet:   { name: { en: "Aoshima Surf Sandals", ja: "青島のサーフ草履" }, desc: "Devils-washboard beach sandals", rarity: "common", stats: { atk: 0, def: 5 } }
  },
  kagoshima: {
    weapon: { name: { en: "Sakurajima Volcanic Spear", ja: "桜島の火山槍" }, desc: "Volcanic-rock spear", rarity: "epic", stats: { atk: 17, def: 4 } },
    head:   { name: { en: "Satsuma Samurai Helm", ja: "薩摩武士の兜" }, desc: "Shimazu clan helm", rarity: "epic", stats: { atk: 2, def: 13 } },
    body:   { name: { en: "Oshima Tsumugi Robe", ja: "大島紬の羽織" }, desc: "Mud-dyed silk weave", rarity: "legendary", stats: { atk: 0, def: 13 } },
    feet:   { name: { en: "Yakushima Cedar Sandals", ja: "屋久杉の草履" }, desc: "Ancient-cedar wood sandals", rarity: "rare", stats: { atk: 0, def: 7 } }
  },
  okinawa: {
    weapon: { name: { en: "Ryukyu Sai Dagger", ja: "琉球の釵" }, desc: "Karate-master sai weapon", rarity: "epic", stats: { atk: 16, def: 5 } },
    head:   { name: { en: "Shisa Lion Helm", ja: "シーサーの兜" }, desc: "Guardian-lion helm", rarity: "epic", stats: { atk: 0, def: 12 } },
    body:   { name: { en: "Bingata Royal Robe", ja: "紅型の衣" }, desc: "Ryukyu-royal dyed silk", rarity: "legendary", stats: { atk: 0, def: 14 } },
    feet:   { name: { en: "Shuri Castle Sandals", ja: "首里城の草履" }, desc: "Royal-palace court sandals", rarity: "epic", stats: { atk: 0, def: 8 } }
  }
};
