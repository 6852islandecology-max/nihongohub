/**
 * Additive depth for the 42 generated prefecture guides (keeps guides-data.js
 * untouched). Keyed by slug. Each entry: history / seasons / itinerary.
 * Accurate, well-established facts only; romaji given for place names.
 * Merged in by scripts/build-guides.mjs.
 */
export const EXTRA = {
  // ── TŌHOKU ──
  aomori: {
    history: "Aomori (青森) faces the Tsugaru Strait at Honshu's northern tip. The Sannai-Maruyama (三内丸山) site shows a large Jōmon settlement from over 5,000 years ago, and Hirosaki (弘前) grew as a castle town of the Tsugaru clan.",
    seasons: "Spring centers on Hirosaki Park's cherry blossoms in late April–May. Summer explodes with the Nebuta (ねぶた) float festival in early August. Autumn turns Oirase Gorge (奥入瀬) and Lake Towada (十和田湖) crimson, and winter brings some of Japan's deepest snow.",
    itinerary: "A good two-day loop: day one in Hirosaki for the castle and apple orchards, day two at Lake Towada and Oirase Gorge. Base yourself in Aomori City (青森市) for transport links and the morning fish market.",
  },
  iwate: {
    history: "Iwate (岩手) was the seat of the Northern Fujiwara, who built the gilded temples of Hiraizumi (平泉) in the 12th century as a Pure Land paradise on earth — now a UNESCO World Heritage Site.",
    seasons: "Spring and autumn are ideal for the Hiraizumi temples and the Sanriku (三陸) coast. Summer is festival and wanko-soba season in Morioka (盛岡); winter is quiet and snowy inland.",
    itinerary: "Start in Morioka for the famous noodles, then take the train to Hiraizumi to walk Chūson-ji (中尊寺) and Mōtsū-ji (毛越寺). Add the coast at Geibikei Gorge (猊鼻渓) if you have a third day.",
  },
  miyagi: {
    history: "Miyagi (宮城) is the domain of Date Masamune (伊達政宗), the one-eyed warlord who founded Sendai (仙台) in 1600 and shaped its culture, from cuisine to the Tanabata festival.",
    seasons: "Summer brings Sendai's grand Tanabata (七夕) in early August. Autumn frames Matsushima Bay (松島) in colour, and winter lights up Sendai's Pageant of Starlight. Spring is mild and cherry-lined at Aoba Castle (青葉城).",
    itinerary: "Spend a morning in Sendai (Zuihōden mausoleum, gyūtan lunch), then take the short train to Matsushima for a bay cruise among the pine islands. Naruko Onsen (鳴子温泉) makes a relaxing overnight add-on.",
  },
  akita: {
    history: "Akita (秋田) is old rice-and-sake country. Kakunodate (角館) preserves Edo-period samurai residences, and the Oga (男鹿) peninsula keeps the Namahage (なまはげ) New Year ritual alive.",
    seasons: "Spring drapes Kakunodate in weeping cherries; summer raises the towering Kantō (竿燈) lantern poles in early August. Autumn colours Lake Tazawa (田沢湖), and winter buries the region in snow and steam.",
    itinerary: "Pair Kakunodate's samurai street with nearby Lake Tazawa, Japan's deepest lake. Soak at the rustic Nyūtō Onsen (乳頭温泉) before heading back — it's one of Tōhoku's most atmospheric hot springs.",
  },
  yamagata: {
    history: "Yamagata (山形) is a land of sacred mountains. The poet Bashō climbed cliffside Yamadera (山寺) in 1689, and the Dewa Sanzan (出羽三山) have drawn yamabushi mountain ascetics for over a thousand years.",
    seasons: "Cherries ripen in June–July (Yamagata leads Japan in cherry output). Autumn gilds the temple steps, and February freezes the trees of Zaō (蔵王) into illuminated 'snow monsters'.",
    itinerary: "Climb the 1,000 steps of Yamadera in the morning, then ride to Ginzan Onsen (銀山温泉) for its lantern-lit Taishō-era streetscape. Add Zaō for skiing or the snow-monster ropeway in winter.",
  },
  fukushima: {
    history: "Fukushima's (福島) Aizu (会津) region was a loyal samurai stronghold; the Byakkotai (白虎隊) young warriors and Tsuruga Castle (鶴ヶ城) are central to its Boshin War history.",
    seasons: "Summer is peach season; autumn turns the Bandai (磐梯) highlands and Goshiki-numa (五色沼) lakes vivid. Winter is for Aizu's sake and snow, and spring is gentle and blossom-filled.",
    itinerary: "Base in Aizu-Wakamatsu (会津若松) for the castle and samurai sites, then ride the scenic line to the thatched post town of Ouchi-juku (大内宿) for negi-soba eaten with a leek.",
  },

  // ── KANTŌ ──
  ibaraki: {
    history: "Ibaraki (茨城) was the Mito (水戸) domain of a senior Tokugawa branch; the scholarly Mito lords created Kairaku-en (偕楽園), one of Japan's three great gardens, as a space to share with the public.",
    seasons: "Spring (late April–May) fills Hitachi Seaside Park (国営ひたち海浜公園) with sky-blue nemophila; autumn turns its kochia hills crimson. Plum blossoms open Kairaku-en in late winter.",
    itinerary: "Time a day trip from Tokyo to the nemophila or kochia peak at Hitachi Seaside Park, then add the giant Ushiku Daibutsu (牛久大仏) on the way back. Mito's Kairaku-en suits a plum-season visit.",
  },
  tochigi: {
    history: "Tochigi (栃木) holds Nikkō (日光), where Tokugawa Ieyasu was enshrined in 1617 at the lavishly carved Tōshō-gū (東照宮), making it one of Japan's most important shrine complexes.",
    seasons: "Late April–May brings the wisteria of Ashikaga Flower Park (あしかがフラワーパーク). Autumn (late October–November) sets Nikkō's mountains and Lake Chūzenji (中禅寺湖) ablaze — the region's peak season.",
    itinerary: "Reach Nikkō from Tokyo in about two hours, see Tōshō-gū and the cedar avenues, then continue up to Kegon Falls (華厳の滝) and Lake Chūzenji. Utsunomiya (宇都宮) is a gyōza stop on the way home.",
  },
  gunma: {
    history: "Gunma (群馬) launched Japan's modern era: the Tomioka Silk Mill (富岡製糸場), opened in 1872, mechanized silk production and is now a UNESCO site. Its mountains hide centuries-old onsen.",
    seasons: "Onsen towns shine year-round but feel best in cold months. Autumn colours Mount Haruna (榛名山) and the gorges; spring is mild for hiking.",
    itinerary: "Head to Kusatsu (草津) for the steaming yubatake and a yumomi hot-water performance, then unwind at Ikaho (伊香保) with its famous stone steps. Add the Tomioka Silk Mill for a history half-day.",
  },
  saitama: {
    history: "Saitama's (埼玉) Kawagoe (川越) thrived as a merchant town supplying Edo; its surviving kurazukuri clay warehouses and wooden Bell Tower (時の鐘) earn it the nickname 'Little Edo' (小江戸).",
    seasons: "April paints Hitsujiyama Park (羊山公園) with pink moss phlox below Chichibu's peaks. Kawagoe's old streets are pleasant year-round, and its Hikawa festival lights up autumn.",
    itinerary: "A half-day in Kawagoe covers the warehouse street, the Bell Tower, and Candy Alley (菓子屋横丁) with sweet-potato treats — an easy 30–45 minute hop from central Tokyo.",
  },
  chiba: {
    history: "Chiba (千葉) has long been Edo/Tokyo's coastal larder and gateway; Narita-san Shinshō-ji (成田山新勝寺), founded in 940, draws millions of New Year worshippers each year.",
    seasons: "Summer is for the Kujūkuri (九十九里) surf beaches and the Bōsō (房総) coast. Spring suits flower fields and temple visits; the climate stays mild year-round.",
    itinerary: "On a long Narita layover, take the quick train to Narita-san temple and the old approach street. With more time, the Bōsō Peninsula offers beaches and the cliff temple at Nokogiriyama (鋸山).",
  },
  kanagawa: {
    history: "Kanagawa (神奈川) was Japan's medieval capital: Kamakura (鎌倉) ruled as the seat of the shogunate from 1185, and its bronze Great Buddha (大仏) has sat in the open air since the 13th century. Yokohama (横浜) opened to the world in 1859.",
    seasons: "Clear, dry winter days give the sharpest Mount Fuji views from Hakone (箱根). Early summer hydrangeas line Kamakura's temple lanes; autumn colours Hakone's slopes.",
    itinerary: "Do Kamakura's Great Buddha and Hase-dera (長谷寺) in a day from Tokyo, or ride the Hakone loop — train, cablecar, and a Lake Ashi (芦ノ湖) cruise — using the Hakone Free Pass.",
  },

  // ── CHŪBU ──
  niigata: {
    history: "Niigata (新潟) grew rich on rice and as a port on the Sea of Japan; Sado Island (佐渡島) was once a gold-mine and a place of noble exile, leaving a distinctive island culture.",
    seasons: "Winter buries Yuzawa (湯沢) in famous powder for skiing. Late summer rice fields glow gold, and warm-season 'triennale' years fill the Echigo-Tsumari (越後妻有) hills with land art.",
    itinerary: "Ski or onsen at Echigo-Yuzawa (越後湯沢) — under 90 minutes from Tokyo — and sample dozens of local sakes at the station's tasting hall. Add a Sado Island ferry trip in warmer months.",
  },
  toyama: {
    history: "Toyama (富山) prospered from medicine peddlers and shipping; in the mountains, the Gokayama (五箇山) hamlets kept their steep thatched gasshō houses for centuries, now UNESCO-listed.",
    seasons: "The Tateyama Kurobe Alpine Route (立山黒部アルペンルート) opens mid-April with snow walls up to 20 m. Spring brings firefly squid; autumn colours the Kurobe Gorge (黒部峡谷).",
    itinerary: "Cross the Alpine Route between Toyama and Nagano in spring for the snow corridor, or ride the little Kurobe Gorge railway in autumn. Add Gokayama's thatched villages for a quieter alternative to Shirakawa-gō.",
  },
  ishikawa: {
    history: "Ishikawa's (石川) Kanazawa (金沢) was the seat of the wealthy Maeda clan, second only to the Tokugawa. Spared wartime bombing, it kept its samurai and geisha districts and the celebrated Kenroku-en (兼六園) garden.",
    seasons: "Kenroku-en is beautiful in every season — cherry blossoms in spring, snow held up by 'yukitsuri' ropes in winter. The Noto (能登) coast is best in the warmer months.",
    itinerary: "Spend a day in Kanazawa: Kenroku-en, the Higashi Chaya (東茶屋街) teahouse district with gold-leaf ice cream, and the 21st Century Museum. Extend along the rugged Noto Peninsula by car.",
  },
  fukui: {
    history: "Fukui (福井) is home to Eihei-ji (永平寺), founded in 1244 as the head temple of Sōtō Zen, and to so many dinosaur fossils that it hosts Japan's premier dinosaur museum.",
    seasons: "Winter (November–March) is Echizen (越前) snow-crab season. Spring and autumn suit Eihei-ji and the Tōjinbō (東尋坊) cliffs; summer is for the coast.",
    itinerary: "Combine the Fukui Prefectural Dinosaur Museum with the meditative Eihei-ji temple, then watch the sunset from the basalt cliffs of Tōjinbō. Maruoka Castle (丸岡城) adds a genuine old keep.",
  },
  yamanashi: {
    history: "Yamanashi (山梨) was the realm of the warlord Takeda Shingen (武田信玄). Its Kōfu (甲府) basin, ringed by mountains, became Japan's leading wine region thanks to native koshu grapes.",
    seasons: "Late autumn and winter mornings give the crispest Mount Fuji (富士山) views from the Fuji Five Lakes. Grape and wine season peaks in autumn; spring frames Fuji with cherry blossoms at Chūreitō (忠霊塔).",
    itinerary: "Base at Lake Kawaguchi (河口湖) for Fuji views and the Chūreitō Pagoda shot, then tour a Kōfu winery. Shōsenkyō Gorge (昇仙峡) adds easy autumn scenery.",
  },
  nagano: {
    history: "Nagano (長野) grew around the ancient temple of Zenkō-ji (善光寺) and the Nakasendō (中山道) highway post towns. It hosted the 1998 Winter Olympics, cementing its status as Japan's alpine heart.",
    seasons: "Winter is for skiing and the steaming snow monkeys of Jigokudani (地獄谷). Summer offers cool alpine hiking; autumn colours the Kiso Valley (木曽谷) post towns.",
    itinerary: "See Zenkō-ji and the snow monkeys near Nagano City, or walk the old highway between the preserved post towns of Tsumago (妻籠) and Magome (馬籠). Matsumoto Castle (松本城) is a striking original keep.",
  },
  gifu: {
    history: "Gifu (岐阜) sits on old trade and battle routes — Sekigahara (関ヶ原), the decisive 1600 battle, was fought here. Mountain isolation preserved Shirakawa-gō's (白川郷) thatched farmhouses and Takayama's (高山) merchant town.",
    seasons: "Winter is magical when snow caps Shirakawa-gō's gasshō roofs (with limited evening illuminations). Spring and autumn bring Takayama's grand festivals and crisp mountain air.",
    itinerary: "From Nagoya, ride to Takayama for the old town and Hida beef, then bus to Shirakawa-gō for the thatched village. Reserve early for the winter light-up nights.",
  },
  shizuoka: {
    history: "Shizuoka (静岡) was where Tokugawa Ieyasu spent his final years at Sunpu Castle (駿府城). Mild and sunny, its hillsides became Japan's green-tea heartland.",
    seasons: "Clear winter days give postcard Mount Fuji views; tea fields are greenest in spring and early summer. The Izu (伊豆) coast is warm enough for shoulder-season beaches.",
    itinerary: "View Fuji from Miho-no-Matsubara (三保松原), tour a tea plantation near Shizuoka City, then unwind in an Izu Peninsula onsen town such as Atami (熱海) or Shuzenji (修善寺).",
  },
  aichi: {
    history: "Aichi (愛知) produced three of Japan's great unifiers — Oda Nobunaga, Toyotomi Hideyoshi, and Tokugawa Ieyasu. Nagoya (名古屋) later became an industrial giant and the birthplace of Toyota.",
    seasons: "Comfortable year-round as a travel hub. Spring blossoms ring Nagoya Castle (名古屋城); the city's festivals and food scene run all year.",
    itinerary: "See Nagoya Castle and Atsuta Shrine (熱田神宮), eat your way through 'Nagoya meshi', then use the city as a base for day trips to Gifu's Takayama or Mie's Ise.",
  },

  // ── KANSAI ──
  mie: {
    history: "Mie (三重) holds Ise Jingū (伊勢神宮), Shintō's most sacred shrine, rebuilt every 20 years for over 1,300 years. The Shima (志摩) coast is the cradle of cultured pearls and the Ama (海女) free-divers.",
    seasons: "Early morning at Ise is serene year-round. Spring and autumn are mild for the coast; pearls and seafood are available throughout.",
    itinerary: "Visit Ise Jingū's Outer then Inner Shrine, walk the restored Okage Yokochō (おかげ横丁) street, then see the Wedded Rocks (夫婦岩) at Futami. Toba (鳥羽) adds pearls and the Ama divers.",
  },
  shiga: {
    history: "Shiga (滋賀) surrounds Lake Biwa (琵琶湖), a strategic heart of old Japan. Hikone Castle (彦根城), completed in 1622, is one of only twelve original keeps still standing.",
    seasons: "Cherry blossoms frame Hikone Castle in spring; the lake and Mount Hiei (比叡山) are pleasant spring through autumn. Winter is quiet and crisp.",
    itinerary: "An easy add-on to Kyoto: tour original Hikone Castle and its garden, then visit the vast Enryaku-ji (延暦寺) temple complex on Mount Hiei, reached by cablecar.",
  },
  hyogo: {
    history: "Hyōgo (兵庫) spans coast to coast. Himeji Castle (姫路城), the 'White Heron', survived war and earthquakes intact and became Japan's first UNESCO World Heritage site in 1993. Kobe (神戸) opened as a treaty port in 1868.",
    seasons: "Early April frames Himeji Castle in cherry blossoms. Kobe's harbour sparkles year-round; the Kinosaki (城崎温泉) onsen town is cosiest in winter.",
    itinerary: "Day-trip from Osaka to Himeji Castle by shinkansen (about 40 minutes), then explore Kobe's harbour and Chinatown for an evening of Kobe beef. Add Kinosaki for an onsen overnight.",
  },
  nara: {
    history: "Nara (奈良) was Japan's first permanent capital (710–784). Tōdai-ji's (東大寺) Great Buddha was cast in 752, and Hōryū-ji (法隆寺) contains some of the world's oldest surviving wooden buildings.",
    seasons: "Pleasant year-round; cherry blossoms and fresh greenery suit spring, and autumn colours Nara Park. The deer roam in every season.",
    itinerary: "A half-day covers Tōdai-ji, the bowing deer of Nara Park, and Kasuga Taisha (春日大社) with its stone lanterns. With more time, add ancient Hōryū-ji on the city's outskirts.",
  },
  wakayama: {
    history: "Wakayama (和歌山) is sacred ground: Kōbō Daishi founded the Kōyasan (高野山) monastery in 816, and the Kumano (熊野) shrines anchor pilgrimage routes walked for over a millennium — both UNESCO-listed.",
    seasons: "Spring through autumn suit the Kumano Kodō (熊野古道) trails. Kōyasan is profound in any season, magical under snow; Shirahama's (白浜) beaches draw summer crowds.",
    itinerary: "Take the train and cablecar to Kōyasan and stay overnight in a temple lodging (shukubō) to join dawn prayers and walk the lantern-lit Okunoin (奥之院). Hikers can add a stretch of the Kumano Kodō.",
  },

  // ── CHŪGOKU ──
  tottori: {
    history: "Tottori (鳥取) is Japan's least-populous prefecture. Its great coastal dunes (砂丘) have formed over 100,000 years from sand carried by the Sendai River and the Sea of Japan.",
    seasons: "The dunes are best in spring and autumn (summer sand gets scorching). Winter brings prized snow crab. Mount Daisen (大山) offers hiking and skiing in season.",
    itinerary: "Ride a camel or sandboard the dunes near sunset, see the adjoining Sand Museum's sculptures, then drive the coast toward Mount Daisen. Manga fans can add Mizuki Shigeru Road (水木しげるロード) in Sakaiminato.",
  },
  shimane: {
    history: "Shimane (島根) is the land of myth: Izumo Taisha (出雲大社) is one of Japan's oldest shrines, dedicated to the deity of marriage and good relationships. Iwami Ginzan (石見銀山) once supplied a third of the world's silver.",
    seasons: "October is the auspicious 'month of the gods' (神在月) at Izumo. Spring and autumn are mild for shrines and the silver-mine town; the Adachi Museum garden impresses year-round.",
    itinerary: "Pay respects at Izumo Taisha (clap four times for matchmaking), then visit original Matsue Castle (松江城) and the celebrated garden at the Adachi Museum of Art (足立美術館).",
  },
  okayama: {
    history: "Okayama (岡山) tied its identity to the Momotarō (桃太郎) peach-boy legend. Kōraku-en (後楽園), laid out in 1700, ranks among Japan's three great gardens, beside the black-walled 'Crow Castle'.",
    seasons: "Sunny most of the year (Okayama markets itself as the 'Land of Sunshine'). Summer brings peaches and muscat grapes; the gardens are lovely spring through autumn.",
    itinerary: "Pair Kōraku-en with adjacent Okayama Castle (岡山城), then take the train to Kurashiki (倉敷) to stroll the willow-lined Bikan (美観) canal quarter. Okayama is also the gateway to Shikoku's art islands.",
  },
  hiroshima: {
    history: "Hiroshima (広島) became a global symbol of peace after the atomic bombing of 6 August 1945. Nearby Itsukushima Shrine (厳島神社) on Miyajima (宮島) has stood since the 12th century, its torii rising from the sea.",
    seasons: "Mild and visitable year-round. Spring blossoms and autumn maples enhance Miyajima; check the tide tables to see the torii 'floating' versus walkable.",
    itinerary: "Spend a reflective morning at the Peace Memorial Park and Museum, then ferry to Miyajima for the floating torii, Itsukushima Shrine, and friendly deer. Hiroshima okonomiyaki makes the perfect dinner.",
  },
  yamaguchi: {
    history: "Yamaguchi (山口) shaped modern Japan: Chōshū (長州) domain samurai from here led the 1868 Meiji Restoration. The Kintai-kyō (錦帯橋) bridge, first built in 1673, is an engineering marvel of five wooden arches.",
    seasons: "Spring blossoms and autumn maples set off the Kintai-kyō bridge beautifully. The coast and caves are pleasant in the warmer months.",
    itinerary: "Cross the Kintai-kyō at Iwakuni (岩国), photograph the red gates of Motonosumi Inari (元乃隅神社) above the sea, and explore the Akiyoshidō (秋芳洞) limestone cave. Adventurous eaters try licensed fugu in Shimonoseki (下関).",
  },

  // ── SHIKOKU ──
  tokushima: {
    history: "Tokushima (徳島) is the home of Awa Odori (阿波踊り), a 400-year-old dance festival, and of the Naruto (鳴門) whirlpools, among the largest tidal whirlpools in the world.",
    seasons: "Mid-August is Awa Odori; spring and autumn 'big tides' produce the strongest whirlpools. The remote Iya Valley (祖谷) is greenest in summer and fiery in autumn.",
    itinerary: "Watch (or join) Awa Odori in August, then see the Naruto whirlpools from the Uzu-no-michi walkway. The vine bridges of the Iya Valley reward a deeper trip into the mountains.",
  },
  kagawa: {
    history: "Kagawa (香川) is Japan's smallest prefecture, long famous for sanuki udon (讃岐うどん). Since 2010 the Setouchi Triennale has turned its Inland Sea islands, led by Naoshima (直島), into a global art destination.",
    seasons: "Spring, summer, and autumn of triennale years are peak for the art islands. Udon is a year-round, all-day affair; Ritsurin Garden is lovely in every season.",
    itinerary: "Slurp self-serve udon for breakfast in Takamatsu (高松), stroll Ritsurin Garden (栗林公園), then ferry to Naoshima for its museums and the famous pumpkin sculptures.",
  },
  ehime: {
    history: "Ehime's (愛媛) Dōgo Onsen (道後温泉) appears in Japan's oldest texts as a bathing place of legend, and its 1894 wooden bathhouse helped inspire the bathhouse in 'Spirited Away'. Matsuyama (松山) keeps a fine original castle.",
    seasons: "Spring through autumn are ideal for cycling the Shimanami Kaidō (しまなみ海道); the onsen and castle are good year-round, and citrus ripens in winter.",
    itinerary: "Soak at Dōgo Onsen, ride the hilltop ropeway to Matsuyama Castle, then dedicate a day to cycling part of the Shimanami Kaidō across the Inland Sea bridges toward Hiroshima.",
  },
  kochi: {
    history: "Kōchi (高知) bred reformer Sakamoto Ryōma (坂本龍馬), a key figure in the Meiji Restoration. Its clear Shimanto River (四万十川) is called Japan's 'last clear stream'.",
    seasons: "Spring through autumn suit the river and coast; August brings the high-energy Yosakoi (よさこい) dance festival. The southern climate stays mild.",
    itinerary: "Tour original Kōchi Castle and the lively Sunday market, then head to the Shimanto River for cycling and 'submersible' bridges. Try katsuo no tataki (鰹のたたき) seared over straw.",
  },

  // ── KYŪSHŪ / OKINAWA ──
  fukuoka: {
    history: "Fukuoka (福岡) has been Japan's gateway to the Asian continent for centuries; Hakata (博多) merchants built its trading wealth, and its yatai (屋台) street-stall culture is unmatched in Japan.",
    seasons: "Lively year-round; warm evenings are best for the riverside yatai. Spring blossoms fill Maizuru Park, and summer brings the Hakata Gion Yamakasa float race.",
    itinerary: "Explore Ōhori Park (大濠公園) and Canal City by day, take the short trip to Dazaifu Tenmangū (太宰府天満宮), then eat tonkotsu ramen at a Nakasu (中洲) riverside yatai after dark.",
  },
  saga: {
    history: "Saga (佐賀) is the birthplace of Japanese porcelain: in the early 1600s, potters near Arita (有田) found kaolin clay and began making the wares exported worldwide as 'Imari' (伊万里).",
    seasons: "Late October–early November brings the spectacular Balloon Fiesta. Spring and autumn suit the porcelain towns and the Yutoku Inari (祐徳稲荷) shrine.",
    itinerary: "Browse the kilns and porcelain shops of Arita and Imari, see the reconstructed Yoshinogari (吉野ヶ里) prehistoric village, and time an autumn visit with the hot-air balloons over the Saga plains.",
  },
  nagasaki: {
    history: "Nagasaki (長崎) was Japan's only window to the West during its isolation, trading via the man-made island of Dejima (出島). It carries Dutch, Chinese, and Christian heritage — and the memory of 9 August 1945.",
    seasons: "Year-round; the night view from Mount Inasa (稲佐山) is famous in every season. Lunar New Year brings a vivid Chinatown lantern festival.",
    itinerary: "Walk Glover Garden (グラバー園) and the harbour, reflect at the Peace Park, tour reconstructed Dejima, then ride the ropeway up Mount Inasa for one of Japan's best night views.",
  },
  kumamoto: {
    history: "Kumamoto (熊本) is defined by its mighty castle, built by Katō Kiyomasa around 1607, and by Mount Aso (阿蘇), whose enormous caldera has shaped life on central Kyūshū for millennia.",
    seasons: "Spring and autumn are best for Aso (always check volcanic-gas advisories). The castle and Suizenji garden are good year-round; Kurokawa Onsen is cosy in winter.",
    itinerary: "See Kumamoto Castle and the strolling garden of Suizenji Jōjuen (水前寺成趣園), then drive into the Aso caldera for grasslands and craters. Kurokawa Onsen (黒川温泉) makes a superb overnight.",
  },
  oita: {
    history: "Ōita (大分) produces more hot-spring water than any prefecture in Japan. Beppu (別府) grew into a great onsen resort, while the Usuki (臼杵) stone Buddhas were carved into cliffs around the 12th century.",
    seasons: "Onsen are welcome year-round and especially soothing in cool months. Autumn colours Mount Yufu (由布岳) above stylish Yufuin.",
    itinerary: "Tour Beppu's vividly coloured 'hells' (for viewing), then soak in a real onsen. Spend a relaxed day in Yufuin (由布院) with its boutiques and mountain backdrop.",
  },
  miyazaki: {
    history: "Miyazaki (宮崎) is steeped in Japan's creation myths; Takachiho (高千穂) is said to be where the sun goddess's grandson descended to earth. Its sunny coast made it a honeymoon hotspot in the Shōwa era.",
    seasons: "Warm and sunny much of the year. Summer suits surfing and mango season; autumn is good for the gorge and shrines.",
    itinerary: "Row a boat beneath the waterfall in Takachiho Gorge and see its night kagura dance, then follow the Nichinan (日南) coast to the cave shrine of Udo Jingū (鵜戸神宮) and palm-fringed Aoshima (青島).",
  },
  kagoshima: {
    history: "Kagoshima (鹿児島) was the Satsuma (薩摩) domain that helped topple the shogunate; its lord's villa garden, Sengan-en (仙巌園), frames the smoking Sakurajima (桜島) volcano across the bay.",
    seasons: "Spring through autumn suit Yakushima's (屋久島) ancient forest hikes (it's one of Japan's wettest places). The city and sand baths are pleasant year-round.",
    itinerary: "Take the short ferry to active Sakurajima, stroll Sengan-en with its volcano view, then bury yourself in the natural hot sand baths at Ibusuki (指宿). Allow extra days for the cedar forests of Yakushima.",
  },
};
