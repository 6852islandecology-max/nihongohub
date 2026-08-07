/* Per-spot-category phrase packs for travel × language linking.
   Each category has 4-6 phrases (jp/romaji + en/zh/es/th/id translations).
   Used by blog/blog-quiz.js — exposes window.NH_SPOT_PHRASES. */
window.NH_SPOT_PHRASES = {
  categories: [
    {
      key:'temple_shrine',
      icon:'⛩',
      label:{en:'At temples & shrines', ja:'寺院・神社で', zh:'寺廟・神社', es:'En templos y santuarios', th:'ที่วัด/ศาลเจ้า', id:'Di kuil & jinja'},
      match:['temple','shrine','jinja','taisha','-ji','-dera','-gu','-do','torii','pagoda','sensoji','fushimi','meiji'],
      phrases:[
        {jp:'写真を撮ってもいいですか？', ro:'Shashin o totte mo ii desu ka?', trans:{en:'May I take a photo?', ja:'May I take a photo? (写真を撮ってもいいですか)', zh:'我可以拍照嗎？', es:'¿Puedo hacer una foto?', th:'ขอถ่ายรูปได้ไหมคะ/ครับ?', id:'Boleh saya memotret?'}},
        {jp:'御朱印をお願いします。', ro:'Goshuin o onegaishimasu.', trans:{en:'A goshuin stamp, please.', ja:'A goshuin (寺社印) please.', zh:'請給我御朱印。', es:'Un sello goshuin, por favor.', th:'ขอตราโกชูอินด้วยค่ะ/ครับ', id:'Tolong stempel goshuin.'}},
        {jp:'拝観料はいくらですか？', ro:'Haikan-ryō wa ikura desu ka?', trans:{en:'How much is the entry fee?', ja:'How much is the entry fee?', zh:'參拜費用多少錢？', es:'¿Cuánto es la entrada?', th:'ค่าเข้าชมเท่าไหร่?', id:'Berapa biaya masuknya?'}},
        {jp:'お賽銭はいくらが普通ですか？', ro:'Osaisen wa ikura ga futsū desu ka?', trans:{en:'How much is a typical offering?', ja:'How much is a typical offering coin?', zh:'香油錢一般是多少？', es:'¿Cuánto suele ser la ofrenda?', th:'เงินทำบุญปกติเท่าไหร่?', id:'Berapa nominal sumbangan biasanya?'}},
        {jp:'静かにします。', ro:'Shizuka ni shimasu.', trans:{en:"I'll keep quiet.", ja:"I'll keep quiet (a polite signal).", zh:'我會保持安靜。', es:'Mantendré silencio.', th:'จะเงียบๆ นะคะ/ครับ', id:'Saya akan tenang.'}}
      ]
    },
    {
      key:'restaurant',
      icon:'🍱',
      label:{en:'At restaurants', ja:'飲食店で', zh:'餐廳裡', es:'En restaurantes', th:'ที่ร้านอาหาร', id:'Di restoran'},
      match:['restaurant','ramen','sushi','udon','soba','tempura','izakaya','kissaten','cafe','market','dotonbori','nishiki','tsukiji','omoide','street food','depachika','kushikatsu','okonomiyaki','takoyaki','curry'],
      phrases:[
        {jp:'すみません、注文お願いします。', ro:'Sumimasen, chūmon onegaishimasu.', trans:{en:"Excuse me, I'd like to order.", ja:"Excuse me, I'd like to order.", zh:'不好意思，我要點餐。', es:'Disculpe, quiero pedir.', th:'ขอโทษค่ะ/ครับ ขอสั่งอาหารหน่อย', id:'Permisi, saya mau memesan.'}},
        {jp:'おすすめは何ですか？', ro:'Osusume wa nan desu ka?', trans:{en:"What do you recommend?", ja:"What do you recommend?", zh:'有什麼推薦的？', es:'¿Qué recomiendan?', th:'แนะนำเมนูอะไรดี?', id:'Apa yang Anda rekomendasikan?'}},
        {jp:'これをください。', ro:'Kore o kudasai.', trans:{en:"I'll have this, please.", ja:"I'll have this (point at the menu).", zh:'我要這個。', es:'Esto, por favor.', th:'ขออันนี้ค่ะ/ครับ', id:'Saya minta ini.'}},
        {jp:'お会計をお願いします。', ro:'Okaikei o onegaishimasu.', trans:{en:'The bill, please.', ja:'The bill, please.', zh:'請結帳。', es:'La cuenta, por favor.', th:'ขอเช็คบิลค่ะ/ครับ', id:'Bonnya, tolong.'}},
        {jp:'とてもおいしいです！', ro:'Totemo oishii desu!', trans:{en:'Very delicious!', ja:'Very delicious!', zh:'非常好吃！', es:'¡Muy delicioso!', th:'อร่อยมากค่ะ/ครับ!', id:'Sangat enak!'}}
      ]
    },
    {
      key:'station',
      icon:'🚅',
      label:{en:'At stations', ja:'駅で', zh:'車站', es:'En estaciones', th:'ที่สถานี', id:'Di stasiun'},
      match:['station','train','metro','line','jr','yamanote','shinkansen','subway','keio','keihan','tokyo','shibuya','umeda','namba','sapporo'],
      phrases:[
        {jp:'渋谷駅まで何番線ですか？', ro:'Shibuya-eki made nan-ban-sen desu ka?', trans:{en:"Which platform for Shibuya station?", ja:"Which platform goes to Shibuya?", zh:'到澀谷站要搭幾號月台？', es:'¿Qué andén va a Shibuya?', th:'ไปสถานีชิบุยะชานชาลาที่เท่าไหร่?', id:'Peron berapa ke Stasiun Shibuya?'}},
        {jp:'切符はどこで買えますか？', ro:'Kippu wa doko de kaemasu ka?', trans:{en:'Where can I buy a ticket?', ja:'Where can I buy a ticket?', zh:'車票在哪裡買？', es:'¿Dónde compro el billete?', th:'ซื้อตั๋วที่ไหน?', id:'Di mana saya membeli tiket?'}},
        {jp:'急行に乗ればいいですか？', ro:'Kyūkō ni noreba ii desu ka?', trans:{en:'Should I take the express?', ja:'Should I take the express?', zh:'是該搭急行嗎？', es:'¿Tomo el expreso?', th:'ขึ้นรถด่วนได้ไหม?', id:'Apakah saya naik kereta ekspres?'}},
        {jp:'IC カードのチャージはどこですか？', ro:'IC-kādo no chāji wa doko desu ka?', trans:{en:'Where do I top up my IC card?', ja:'Where do I top up my IC card?', zh:'IC 卡儲值在哪裡？', es:'¿Dónde recargo la tarjeta IC?', th:'เติมเงินบัตร IC ที่ไหน?', id:'Di mana saya isi ulang kartu IC?'}},
        {jp:'次の電車は何時ですか？', ro:'Tsugi no densha wa nan-ji desu ka?', trans:{en:"When is the next train?", ja:"When is the next train?", zh:'下一班電車是幾點？', es:'¿A qué hora el próximo tren?', th:'รถไฟขบวนถัดไปกี่โมง?', id:'Kereta berikutnya pukul berapa?'}}
      ]
    },
    {
      key:'shopping',
      icon:'🛍',
      label:{en:'Shopping', ja:'買い物', zh:'購物', es:'Compras', th:'ช้อปปิ้ง', id:'Belanja'},
      match:['shop','store','market','souvenir','depachika','kappabashi','akihabara','harajuku','nishiki','don quijote','100 yen','outlet','mall'],
      phrases:[
        {jp:'これはいくらですか？', ro:'Kore wa ikura desu ka?', trans:{en:'How much is this?', ja:'How much is this?', zh:'這個多少錢？', es:'¿Cuánto cuesta esto?', th:'อันนี้เท่าไหร่?', id:'Berapa harganya?'}},
        {jp:'試着してもいいですか？', ro:'Shichaku shite mo ii desu ka?', trans:{en:'May I try this on?', ja:'May I try this on?', zh:'可以試穿嗎？', es:'¿Puedo probármelo?', th:'ลองใส่ได้ไหม?', id:'Boleh saya coba?'}},
        {jp:'もう少し安くなりますか？', ro:'Mō sukoshi yasuku narimasu ka?', trans:{en:'Could it be a little cheaper?', ja:'Could it be a little cheaper?', zh:'可以再便宜一點嗎？', es:'¿Podría rebajarme un poco?', th:'ลดราคาได้อีกไหม?', id:'Bisa lebih murah sedikit?'}},
        {jp:'袋をお願いします。', ro:'Fukuro o onegaishimasu.', trans:{en:'A bag, please.', ja:'A bag, please.', zh:'請給我一個袋子。', es:'Una bolsa, por favor.', th:'ขอถุงด้วยค่ะ/ครับ', id:'Tolong kantongnya.'}},
        {jp:'免税できますか？', ro:'Menzei dekimasu ka?', trans:{en:'Can I get tax-free?', ja:'Can I get tax-free?', zh:'可以辦免稅嗎？', es:'¿Tienen exención de impuestos?', th:'ขอ tax-free ได้ไหม?', id:'Bisa bebas pajak?'}}
      ]
    },
    {
      key:'castle_landmark',
      icon:'🏯',
      label:{en:'At castles & landmarks', ja:'城・名所で', zh:'城堡・名勝', es:'En castillos y monumentos', th:'ปราสาท/แลนด์มาร์ก', id:'Di kastil & landmark'},
      match:['castle','jō','jou','osaka castle','himeji','nijo','park','garden','observation','sky tree','tower','memorial'],
      phrases:[
        {jp:'入場券はどこで買えますか？', ro:'Nyūjōken wa doko de kaemasu ka?', trans:{en:'Where can I buy entry tickets?', ja:'Where can I buy entry tickets?', zh:'門票在哪裡買？', es:'¿Dónde compro la entrada?', th:'ซื้อบัตรเข้าชมที่ไหน?', id:'Di mana saya beli tiket masuk?'}},
        {jp:'ガイドは何時に始まりますか？', ro:'Gaido wa nan-ji ni hajimarimasu ka?', trans:{en:'What time does the guided tour start?', ja:'What time does the guided tour start?', zh:'導覽幾點開始？', es:'¿A qué hora empieza la visita guiada?', th:'ทัวร์เริ่มกี่โมง?', id:'Pukul berapa tur dimulai?'}},
        {jp:'英語のパンフレットはありますか？', ro:'Eigo no panfuretto wa arimasu ka?', trans:{en:"Is there an English brochure?", ja:"Is there an English brochure?", zh:'有英文簡介嗎？', es:'¿Tienen folleto en inglés?', th:'มีโบรชัวร์ภาษาอังกฤษไหม?', id:'Ada brosur berbahasa Inggris?'}},
        {jp:'閉館は何時ですか？', ro:'Heikan wa nan-ji desu ka?', trans:{en:'What time does it close?', ja:'What time does it close?', zh:'幾點閉館？', es:'¿A qué hora cierran?', th:'ปิดกี่โมง?', id:'Pukul berapa tutup?'}}
      ]
    },
    {
      key:'onsen',
      icon:'♨',
      label:{en:'At onsen', ja:'温泉で', zh:'溫泉', es:'En onsen', th:'ออนเซ็น', id:'Di onsen'},
      match:['onsen','sento','hot spring','bath','hakone','beppu','kusatsu','noboribetsu','yufuin','spa'],
      phrases:[
        {jp:'タオルは借りられますか？', ro:'Taoru wa kariraremasu ka?', trans:{en:'Can I rent a towel?', ja:'Can I rent a towel?', zh:'可以租毛巾嗎？', es:'¿Puedo alquilar una toalla?', th:'ยืมผ้าเช็ดตัวได้ไหม?', id:'Bisa sewa handuk?'}},
        {jp:'タトゥーは大丈夫ですか？', ro:'Tatū wa daijōbu desu ka?', trans:{en:'Are tattoos allowed?', ja:'Are tattoos allowed?', zh:'有刺青可以嗎？', es:'¿Se permiten tatuajes?', th:'มีรอยสักเข้าได้ไหม?', id:'Apakah tato diperbolehkan?'}},
        {jp:'入る前に体を洗います。', ro:'Hairu mae ni karada o araimasu.', trans:{en:"I'll wash before entering.", ja:"I'll wash before entering (politeness signal).", zh:'進入前會先洗身體。', es:'Me lavaré antes de entrar.', th:'จะอาบน้ำก่อนลงอ่าง', id:'Saya akan mandi sebelum masuk.'}},
        {jp:'何時まで開いていますか？', ro:'Nan-ji made aite imasu ka?', trans:{en:'What time is it open until?', ja:'What time is it open until?', zh:'開到幾點？', es:'¿Hasta qué hora abren?', th:'เปิดถึงกี่โมง?', id:'Buka sampai pukul berapa?'}}
      ]
    },
    {
      key:'admin_office',
      icon:'🏛',
      label:{en:'At the city office', ja:'市役所で', zh:'市役所/區公所', es:'En oficina municipal', th:'ที่ที่ว่าการเขต/อำเภอ', id:'Di kantor pemerintah daerah'},
      match:['city office','city hall','ward','residence','jūminhyō','immigration','japan post','town hall','myナンバー','my number','tax office'],
      phrases:[
        {jp:'住民票が必要です。', ro:'Jūminhyō ga hitsuyō desu.', trans:{en:'I need a resident registration certificate.', ja:'I need a jūminhyō (resident registration certificate).', zh:'我需要住民票（居民登記）', es:'Necesito el certificado de residencia.', th:'ฉันต้องการใบทะเบียนผู้พักอาศัย', id:'Saya butuh kartu daftar penduduk.'}},
        {jp:'英語の書類はありますか？', ro:'Eigo no shorui wa arimasu ka?', trans:{en:'Do you have forms in English?', ja:'Do you have forms in English?', zh:'有英文表格嗎？', es:'¿Tienen formularios en inglés?', th:'มีแบบฟอร์มภาษาอังกฤษไหม?', id:'Ada formulir berbahasa Inggris?'}},
        {jp:'外国人登録の手続きをしたいです。', ro:'Gaikokujin tōroku no tetsuzuki o shitai desu.', trans:{en:'I want to complete the foreign resident registration.', ja:'I want to do the foreign resident registration.', zh:'我想辦外國人登記手續', es:'Quiero hacer el registro de residente extranjero.', th:'ฉันต้องการลงทะเบียนผู้พำนักต่างชาติ', id:'Saya mau mendaftar penduduk asing.'}},
        {jp:'通訳をお願いできますか？', ro:'Tsūyaku o onegai dekimasu ka?', trans:{en:'Could I have an interpreter?', ja:'Could I have an interpreter?', zh:'可以麻煩翻譯嗎？', es:'¿Pueden facilitarme un intérprete?', th:'ขอล่ามได้ไหม?', id:'Bisa minta penerjemah?'}},
        {jp:'マイナンバーカードを申請したいです。', ro:'Mai-nambā kādo o shinsei shitai desu.', trans:{en:'I want to apply for a My Number card.', ja:'I want to apply for a My Number card.', zh:'我想申請個人番號卡', es:'Quiero solicitar la tarjeta My Number.', th:'ฉันต้องการสมัครบัตร My Number', id:'Saya mau mengajukan kartu My Number.'}}
      ]
    },
    {
      key:'bank',
      icon:'🏦',
      label:{en:'At the bank', ja:'銀行で', zh:'銀行', es:'En el banco', th:'ที่ธนาคาร', id:'Di bank'},
      match:['bank','atm','japan post','yucho','mizuho','mufg','smbc','remittance','transfer','open an account','口座'],
      phrases:[
        {jp:'口座を開きたいです。', ro:'Kōza o hirakitai desu.', trans:{en:'I want to open an account.', ja:'I want to open an account.', zh:'我想開戶', es:'Quiero abrir una cuenta.', th:'ฉันต้องการเปิดบัญชี', id:'Saya mau membuka rekening.'}},
        {jp:'必要な書類は何ですか？', ro:'Hitsuyō na shorui wa nan desu ka?', trans:{en:'What documents do I need?', ja:'What documents do I need?', zh:'需要哪些文件？', es:'¿Qué documentos necesito?', th:'ต้องใช้เอกสารอะไรบ้าง?', id:'Dokumen apa saja yang dibutuhkan?'}},
        {jp:'海外送金できますか？', ro:'Kaigai sōkin dekimasu ka?', trans:{en:'Can I do an overseas remittance?', ja:'Can I do an overseas remittance?', zh:'可以辦海外匯款嗎？', es:'¿Puedo hacer una transferencia al extranjero?', th:'โอนเงินต่างประเทศได้ไหม?', id:'Bisa kirim uang ke luar negeri?'}},
        {jp:'手数料はいくらですか？', ro:'Tesūryō wa ikura desu ka?', trans:{en:'How much is the fee?', ja:'How much is the fee?', zh:'手續費多少？', es:'¿Cuál es la comisión?', th:'ค่าธรรมเนียมเท่าไหร่?', id:'Berapa biayanya?'}}
      ]
    },
    {
      key:'visa_immigration',
      icon:'📋',
      label:{en:'At immigration', ja:'入管で', zh:'入管/移民', es:'En migración', th:'ที่สำนักงานตรวจคนเข้าเมือง', id:'Di kantor imigrasi'},
      match:['immigration','visa','residence card','在留','ビザ','永住','status of residence','renewal'],
      phrases:[
        {jp:'在留資格の更新をしたいです。', ro:'Zairyū shikaku no kōshin o shitai desu.', trans:{en:'I want to renew my residence status.', ja:'I want to renew my residence status.', zh:'我想更新在留資格', es:'Quiero renovar mi estatus de residencia.', th:'ฉันต้องการต่ออายุสถานะการพำนัก', id:'Saya mau memperpanjang status tinggal.'}},
        {jp:'在留カードを失くしました。', ro:'Zairyū kādo o nakushimashita.', trans:{en:'I lost my residence card.', ja:'I lost my residence card.', zh:'我把在留卡弄丟了', es:'Perdí mi tarjeta de residencia.', th:'ฉันทำบัตรประจำตัวผู้พำนักหาย', id:'Saya kehilangan kartu izin tinggal.'}},
        {jp:'家族滞在ビザに変更したいです。', ro:'Kazoku taizai biza ni henkō shitai desu.', trans:{en:'I want to change to a Dependent visa.', ja:'I want to change to a Dependent visa.', zh:'我想變更為家族滯在簽證', es:'Quiero cambiar a una visa de dependiente.', th:'ฉันต้องการเปลี่ยนเป็นวีซ่าผู้ติดตามครอบครัว', id:'Saya mau berpindah ke visa Dependen.'}},
        {jp:'申請はどこで行いますか？', ro:'Shinsei wa doko de okonaimasu ka?', trans:{en:'Where do I file the application?', ja:'Where do I file the application?', zh:'申請在哪裡辦？', es:'¿Dónde presento la solicitud?', th:'ยื่นเรื่องที่ไหน?', id:'Di mana saya mengajukan?'}}
      ]
    },
    {
      key:'festival',
      icon:'🎆',
      label:{en:'At festivals', ja:'お祭りで', zh:'祭典/節慶', es:'En festivales', th:'ที่งานเทศกาล', id:'Di festival'},
      match:['matsuri','festival','fes','nebuta','tanabata','gion','awa odori','snow festival','sumo','花火','まつり','祭'],
      phrases:[
        {jp:'打ち上げは何時からですか？', ro:'Uchiage wa nan-ji kara desu ka?', trans:{en:'What time do the fireworks start?', ja:'', zh:'煙火幾點開始？', es:'¿A qué hora empieza el fuego?', th:'พลุเริ่มกี่โมง?', id:'Pukul berapa kembang api mulai?'}},
        {jp:'屋台はどこにありますか？', ro:'Yatai wa doko ni arimasu ka?', trans:{en:'Where are the food stalls?', ja:'', zh:'攤販在哪裡？', es:'¿Dónde están los puestos de comida?', th:'แผงอาหารอยู่ตรงไหน?', id:'Di mana lapak makanannya?'}},
        {jp:'写真を一緒に撮ってもいいですか？', ro:'Shashin o issho ni totte mo ii desu ka?', trans:{en:'Can we take a photo together?', ja:'', zh:'可以一起拍照嗎？', es:'¿Podemos hacernos una foto juntos?', th:'ขอถ่ายรูปด้วยกันได้ไหม?', id:'Boleh foto bersama?'}},
        {jp:'これは何のお祭りですか？', ro:'Kore wa nan no omatsuri desu ka?', trans:{en:'What festival is this?', ja:'', zh:'這是什麼節慶？', es:'¿Qué festival es este?', th:'นี่เทศกาลอะไร?', id:'Festival apa ini?'}},
        {jp:'おみくじを引きたいです。', ro:'Omikuji o hikitai desu.', trans:{en:'I want to draw a fortune slip.', ja:'', zh:'我想抽籤', es:'Quiero sacar un omikuji.', th:'ฉันอยากเสี่ยงเซียมซี', id:'Saya mau menarik omikuji.'}}
      ]
    },
    {
      key:'sightseeing',
      icon:'🧭',
      label:{en:'Anywhere you stop', ja:'どこでも使える', zh:'到處都能用', es:'En cualquier parada', th:'ใช้ได้ทุกที่', id:'Di mana saja'},
      // Deliberately keyword-free: this is the fallback when nothing else matches,
      // so it must be useful standing in front of a lake, a museum or a viewpoint.
      match:[],
      phrases:[
        {jp:'ここはどこですか？', ro:'Koko wa doko desu ka?', trans:{en:'Where am I / what is this place?', ja:'Where am I / what is this place?', zh:'這裡是哪裡？', es:'¿Dónde estoy / qué lugar es este?', th:'ที่นี่ที่ไหน?', id:'Ini tempat apa?'}},
        {jp:'〜へはどう行きますか？', ro:'~ e wa dō ikimasu ka?', trans:{en:'How do I get to ~?', ja:'How do I get to ~? (name the place first)', zh:'去〜怎麼走？', es:'¿Cómo llego a ~?', th:'ไป〜ยังไง?', id:'Bagaimana cara ke ~?'}},
        {jp:'何時まで開いていますか？', ro:'Nan-ji made aite imasu ka?', trans:{en:'How late are you open?', ja:'How late are you open?', zh:'開到幾點？', es:'¿Hasta qué hora abren?', th:'เปิดถึงกี่โมง?', id:'Buka sampai jam berapa?'}},
        {jp:'写真を撮ってもいいですか？', ro:'Shashin o totte mo ii desu ka?', trans:{en:'May I take a photo?', ja:'May I take a photo?', zh:'我可以拍照嗎？', es:'¿Puedo hacer una foto?', th:'ขอถ่ายรูปได้ไหม?', id:'Boleh saya memotret?'}},
        {jp:'トイレはどこですか？', ro:'Toire wa doko desu ka?', trans:{en:'Where is the toilet?', ja:'Where is the toilet?', zh:'洗手間在哪裡？', es:'¿Dónde está el baño?', th:'ห้องน้ำอยู่ไหน?', id:'Di mana toiletnya?'}},
        {jp:'すみません、日本語が少しだけ話せます。', ro:'Sumimasen, nihongo ga sukoshi dake hanasemasu.', trans:{en:"Sorry — I only speak a little Japanese.", ja:"Sorry — I only speak a little Japanese.", zh:'不好意思，我只會一點日語。', es:'Perdón, solo hablo un poco de japonés.', th:'ขอโทษค่ะ/ครับ พูดญี่ปุ่นได้นิดหน่อย', id:'Maaf, saya hanya bisa sedikit bahasa Jepang.'}}
      ]
    },
    {
      key:'school',
      icon:'🎓',
      label:{en:'At school / for study', ja:'学校・進学で', zh:'學校/升學', es:'En la escuela / estudios', th:'ที่โรงเรียน/เรียนต่อ', id:'Di sekolah / studi'},
      match:['school','university','college','language school','japanese school','admission','tuition','vocational','専門学校','大学'],
      phrases:[
        {jp:'入学願書はどこでもらえますか？', ro:'Nyūgaku gansho wa doko de moraemasu ka?', trans:{en:'Where can I get the application form?', ja:'Where can I get the application form?', zh:'入學申請書在哪裡領取？', es:'¿Dónde puedo recoger el formulario de inscripción?', th:'รับใบสมัครได้ที่ไหน?', id:'Di mana saya bisa mendapatkan formulir pendaftaran?'}},
        {jp:'授業料はいくらですか？', ro:'Jugyōryō wa ikura desu ka?', trans:{en:'How much is tuition?', ja:'How much is tuition?', zh:'學費多少錢？', es:'¿Cuánto es la matrícula?', th:'ค่าเล่าเรียนเท่าไหร่?', id:'Berapa biaya kuliahnya?'}},
        {jp:'奨学金はありますか？', ro:'Shōgakukin wa arimasu ka?', trans:{en:'Are scholarships available?', ja:'Are scholarships available?', zh:'有獎學金嗎？', es:'¿Hay becas disponibles?', th:'มีทุนการศึกษาไหม?', id:'Ada beasiswa?'}},
        {jp:'入学試験はいつですか？', ro:'Nyūgaku shiken wa itsu desu ka?', trans:{en:'When is the entrance exam?', ja:'When is the entrance exam?', zh:'入學考試什麼時候？', es:'¿Cuándo es el examen de ingreso?', th:'สอบเข้าวันไหน?', id:'Kapan ujian masuknya?'}},
        {jp:'日本語のレベルが心配です。', ro:'Nihongo no reberu ga shinpai desu.', trans:{en:"I'm worried about my Japanese level.", ja:"I'm worried about my Japanese level.", zh:'我擔心自己的日語程度', es:'Me preocupa mi nivel de japonés.', th:'ฉันกังวลเรื่องระดับภาษาญี่ปุ่น', id:'Saya khawatir level bahasa Jepang saya.'}}
      ]
    }
  ],
  // fallback when no category matches
  default_label:{en:'Local phrases for here', ja:'ここで使えるフレーズ', zh:'這裡能用的句子', es:'Frases para usar aquí', th:'ประโยคที่ใช้ที่นี่ได้', id:'Frasa untuk dipakai di sini'}
};
