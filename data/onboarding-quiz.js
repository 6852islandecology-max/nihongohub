/* 14-question JLPT diagnostic quiz (static, no API). Coverage: PRE×2 (kana basics), N5×3, N4×3, N3×3, N2×2, N1×1.
   Each item has level, options (4 strings), correct index, and i18n-aware prompt + explanation.
   PRE level catches absolute beginners who don't even know kana yet. */
window.NH_ONBOARDING_QUIZ = [
  {
    id:'pre01', level:'PRE', type:'kana',
    prompt:{en:'Which one reads as <b>「sa」</b>?', ja:'<b>「sa」</b>と読むのはどれ？', zh:'哪一個讀作 <b>「sa」</b>？', es:'¿Cuál se lee como <b>「sa」</b>?', th:'ตัวไหนอ่านว่า <b>「sa」</b>?', id:'Yang mana dibaca <b>「sa」</b>?'},
    options:['さ','し','す','せ'],
    answer:0
  },
  {
    id:'pre02', level:'PRE', type:'kana',
    prompt:{en:'Which kanji means <b>"person"</b>?', ja:'<b>「人」</b>の意味の漢字は？', zh:'哪個漢字是 <b>「人」</b> 的意思？', es:'¿Qué kanji significa <b>"persona"</b>?', th:'คันจิตัวไหนแปลว่า <b>「คน」</b>?', id:'Kanji mana yang berarti <b>"orang"</b>?'},
    options:['人','大','日','本'],
    answer:0
  },
  {
    id:'on01', level:'N5', type:'vocab',
    prompt:{en:'What does <b>ありがとう</b> mean?', ja:'<b>ありがとう</b>の意味は？', zh:'<b>ありがとう</b>是什麼意思？', es:'¿Qué significa <b>ありがとう</b>?', th:'<b>ありがとう</b> หมายความว่าอย่างไร?', id:'Apa arti <b>ありがとう</b>?'},
    options:['Thank you','Hello','Goodbye','Sorry'],
    optionsI18n:{
      ja:['ありがとう','こんにちは','さようなら','ごめんなさい'],
      zh:['謝謝','你好','再見','對不起'],
      es:['Gracias','Hola','Adiós','Lo siento'],
      th:['ขอบคุณ','สวัสดี','ลาก่อน','ขอโทษ'],
      id:['Terima kasih','Halo','Selamat tinggal','Maaf']
    },
    answer:0
  },
  {
    id:'on02', level:'N5', type:'particle',
    prompt:{en:'Fill in: わたし___学生です。 (I am a student)', ja:'空欄を埋めよう: わたし___学生です。', zh:'填空: わたし___学生です。(我是學生)', es:'Completa: わたし___学生です。 (Soy estudiante)', th:'เติมคำ: わたし___学生です。 (ฉันเป็นนักเรียน)', id:'Isi: わたし___学生です。 (Saya pelajar)'},
    options:['は','を','で','が'],
    answer:0
  },
  {
    id:'on03', level:'N5', type:'reading',
    prompt:{en:'How do you read <b>水</b>?', ja:'<b>水</b>の読み方は？', zh:'<b>水</b>怎麼讀？', es:'¿Cómo se lee <b>水</b>?', th:'<b>水</b> อ่านว่าอย่างไร?', id:'Bagaimana membaca <b>水</b>?'},
    options:['みず','ひ','つき','き'],
    answer:0
  },
  {
    id:'on04', level:'N4', type:'vocab',
    prompt:{en:'What does <b>美しい</b> mean?', ja:'<b>美しい</b>の意味は？', zh:'<b>美しい</b>是什麼意思？', es:'¿Qué significa <b>美しい</b>?', th:'<b>美しい</b> หมายความว่าอย่างไร?', id:'Apa arti <b>美しい</b>?'},
    options:['Beautiful','New','Expensive','Difficult'],
    optionsI18n:{
      ja:['美しい','新しい','高い','難しい'],
      zh:['美麗','新的','貴的','困難'],
      es:['Hermoso','Nuevo','Caro','Difícil'],
      th:['สวยงาม','ใหม่','แพง','ยาก'],
      id:['Indah','Baru','Mahal','Sulit']
    },
    answer:0
  },
  {
    id:'on05', level:'N4', type:'grammar',
    prompt:{en:'Choose the correct form: 友達___手紙を書きます。 (write a letter to a friend)', ja:'正しい助詞: 友達___手紙を書きます。', zh:'選擇正確助詞: 友達___手紙を書きます。', es:'Elige la partícula correcta: 友達___手紙を書きます。', th:'เลือกคำช่วยที่ถูก: 友達___手紙を書きます。', id:'Pilih partikel yang benar: 友達___手紙を書きます。'},
    options:['に','で','が','を'],
    answer:0
  },
  {
    id:'on06', level:'N4', type:'reading',
    prompt:{en:'How do you read <b>地図</b>?', ja:'<b>地図</b>の読み方は？', zh:'<b>地図</b>怎麼讀？', es:'¿Cómo se lee <b>地図</b>?', th:'<b>地図</b> อ่านว่าอย่างไร?', id:'Bagaimana membaca <b>地図</b>?'},
    options:['ちず','じず','ちと','じと'],
    answer:0
  },
  {
    id:'on07', level:'N3', type:'vocab',
    prompt:{en:'What does <b>素直</b> mean?', ja:'<b>素直</b>の意味は？', zh:'<b>素直</b>是什麼意思？', es:'¿Qué significa <b>素直</b>?', th:'<b>素直</b> หมายความว่าอย่างไร?', id:'Apa arti <b>素直</b>?'},
    options:['Honest / obedient','Strong','Smart','Strange'],
    optionsI18n:{
      ja:['素直','強い','賢い','変な'],
      zh:['坦率/順從','強壯','聰明','奇怪'],
      es:['Honesto / obediente','Fuerte','Inteligente','Extraño'],
      th:['ซื่อสัตย์/เชื่อฟัง','แข็งแกร่ง','ฉลาด','แปลก'],
      id:['Jujur / patuh','Kuat','Pintar','Aneh']
    },
    answer:0
  },
  {
    id:'on08', level:'N3', type:'grammar',
    prompt:{en:'Choose: その問題は___解けません。 (cannot solve at all)', ja:'適切な副詞: その問題は___解けません。', zh:'選擇副詞: その問題は___解けません。 (完全無法解開)', es:'Elige el adverbio: その問題は___解けません。 (no puedo resolverlo en absoluto)', th:'เลือกคำขยาย: その問題は___解けません。 (แก้ไม่ออกเลย)', id:'Pilih kata keterangan: その問題は___解けません。 (sama sekali tidak bisa diselesaikan)'},
    options:['全然','なかなか','だんだん','どんどん'],
    answer:0
  },
  {
    id:'on09', level:'N3', type:'kanji',
    prompt:{en:'How do you read <b>経験</b>?', ja:'<b>経験</b>の読み方は？', zh:'<b>経験</b>怎麼讀？', es:'¿Cómo se lee <b>経験</b>?', th:'<b>経験</b> อ่านว่าอย่างไร?', id:'Bagaimana membaca <b>経験</b>?'},
    options:['けいけん','きょうけん','けいげん','きょうげん'],
    answer:0
  },
  {
    id:'on10', level:'N2', type:'grammar',
    prompt:{en:'Choose: 彼は時間___お金もない。 (has neither time nor money)', ja:'適切な助詞: 彼は時間___お金もない。', zh:'選擇助詞: 彼は時間___お金もない。 (既沒時間也沒錢)', es:'Elige: 彼は時間___お金もない。 (no tiene tiempo ni dinero)', th:'เลือก: 彼は時間___お金もない。 (ไม่มีทั้งเวลาและเงิน)', id:'Pilih: 彼は時間___お金もない。 (tidak punya waktu maupun uang)'},
    options:['も','だけ','こそ','ばかり'],
    answer:0
  },
  {
    id:'on11', level:'N2', type:'vocab',
    prompt:{en:'What does <b>予想に反して</b> mean?', ja:'<b>予想に反して</b>の意味は？', zh:'<b>予想に反して</b>是什麼意思？', es:'¿Qué significa <b>予想に反して</b>?', th:'<b>予想に反して</b> หมายความว่าอย่างไร?', id:'Apa arti <b>予想に反して</b>?'},
    options:['Contrary to expectation','According to plan','Before the forecast','After the event'],
    optionsI18n:{
      ja:['予想に反して','計画通り','予報前に','出来事の後で'],
      zh:['出乎意料','按計劃','預報前','事件後'],
      es:['Contrario a lo esperado','Según el plan','Antes del pronóstico','Después del evento'],
      th:['ตรงข้ามกับที่คาด','ตามแผน','ก่อนพยากรณ์','หลังเหตุการณ์'],
      id:['Bertentangan dengan dugaan','Sesuai rencana','Sebelum prediksi','Setelah peristiwa']
    },
    answer:0
  },
  {
    id:'on12', level:'N1', type:'vocab',
    prompt:{en:'What does <b>明快</b> mean in 「彼の説明は実に明快だ」?', ja:'「彼の説明は実に<b>明快</b>だ」の意味は？', zh:'「彼の説明は実に<b>明快</b>だ」中<b>明快</b>是什麼意思？', es:'¿Qué significa <b>明快</b> en 「彼の説明は実に明快だ」?', th:'<b>明快</b> ในประโยค 「彼の説明は実に明快だ」 หมายความว่าอย่างไร?', id:'Apa arti <b>明快</b> dalam 「彼の説明は実に明快だ」?'},
    options:['Clear and concise','Questionable','Vague','Complicated'],
    optionsI18n:{
      ja:['明快','疑わしい','曖昧','複雑'],
      zh:['清晰簡潔','可疑','模糊','複雜'],
      es:['Claro y conciso','Cuestionable','Vago','Complicado'],
      th:['ชัดเจนกระชับ','น่าสงสัย','คลุมเครือ','ซับซ้อน'],
      id:['Jelas dan ringkas','Meragukan','Kabur','Rumit']
    },
    answer:0
  },
  {
    id:'on13', level:'N2', type:'grammar',
    prompt:{en:'Choose: 経験の有無___関わらず応募できる。 (regardless of experience)', ja:'適切な助詞: 経験の有無___関わらず応募できる。', zh:'選擇助詞: 経験の有無___関わらず応募できる。 (不論有無經驗)', es:'Elige: 経験の有無___関わらず応募できる。 (sin importar la experiencia)', th:'เลือก: 経験の有無___関わらず応募できる。 (ไม่ว่าจะมีประสบการณ์หรือไม่)', id:'Pilih: 経験の有無___関わらず応募できる。 (terlepas dari pengalaman)'},
    options:['に','が','で','は'],
    answer:0
  },
  {
    id:'on14', level:'N2', type:'reading',
    prompt:{en:'How do you read <b>把握</b>?', ja:'<b>把握</b>の読み方は？', zh:'<b>把握</b>怎麼讀？', es:'¿Cómo se lee <b>把握</b>?', th:'<b>把握</b> อ่านว่าอย่างไร?', id:'Bagaimana membaca <b>把握</b>?'},
    options:['はあく','はしゃく','はあつ','はしゅう'],
    answer:0
  },
  {
    id:'on15', level:'N1', type:'grammar',
    prompt:{en:'Choose: 彼女は涙___禁じ得なかった。 (could not hold back tears)', ja:'適切な助詞: 彼女は涙___禁じ得なかった。', zh:'選擇助詞: 彼女は涙___禁じ得なかった。 (無法抑制眼淚)', es:'Elige: 彼女は涙___禁じ得なかった。 (no pudo contener las lágrimas)', th:'เลือก: 彼女は涙___禁じ得なかった。 (กลั้นน้ำตาไม่ไหว)', id:'Pilih: 彼女は涙___禁じ得なかった。 (tidak dapat menahan air mata)'},
    options:['を','に','が','と'],
    answer:0
  },
  {
    id:'on16', level:'N1', type:'vocab',
    prompt:{en:'What does <b>顧みる</b> mean?', ja:'<b>顧みる</b>の意味は？', zh:'<b>顧みる</b>是什麼意思？', es:'¿Qué significa <b>顧みる</b>?', th:'<b>顧みる</b> หมายความว่าอย่างไร?', id:'Apa arti <b>顧みる</b>?'},
    options:['Reflect on / look back at','Forget','Pretend','Ignore'],
    optionsI18n:{
      ja:['顧みる','忘れる','装う','無視する'],
      zh:['反省/回顧','忘記','假裝','忽視'],
      es:['Reflexionar / mirar atrás','Olvidar','Fingir','Ignorar'],
      th:['ใคร่ครวญ/หวนคิด','ลืม','แสร้ง','ละเลย'],
      id:['Merenungkan/mengenang','Lupa','Berpura-pura','Mengabaikan']
    },
    answer:0
  },
  {
    id:'on17', level:'N2', type:'vocab',
    prompt:{en:'What does <b>余儀なく</b> mean in 「中止を余儀なくされた」?', ja:'「中止を<b>余儀なく</b>された」の意味は？', zh:'「中止を<b>余儀なく</b>された」中<b>余儀なく</b>是什麼意思？', es:'¿Qué significa <b>余儀なく</b> en 「中止を余儀なくされた」?', th:'<b>余儀なく</b> ใน 「中止を余儀なくされた」 หมายความว่าอย่างไร?', id:'Apa arti <b>余儀なく</b> dalam 「中止を余儀なくされた」?'},
    options:['Inevitably forced to','Volunteered to','Hoped to','Was lucky to'],
    optionsI18n:{
      ja:['やむを得ず','自ら進んで','望んで','幸運にも'],
      zh:['不得不','自願','希望','幸運地'],
      es:['Forzado inevitablemente','Se ofreció','Esperaba','Tuvo suerte'],
      th:['ถูกบังคับโดยจำเป็น','อาสาเอง','หวังว่า','โชคดี'],
      id:['Terpaksa','Sukarela','Berharap','Beruntung']
    },
    answer:0
  },
  {
    id:'on18', level:'N1', type:'reading',
    prompt:{en:'How do you read <b>暫定</b>?', ja:'<b>暫定</b>の読み方は？', zh:'<b>暫定</b>怎麼讀？', es:'¿Cómo se lee <b>暫定</b>?', th:'<b>暫定</b> อ่านว่าอย่างไร?', id:'Bagaimana membaca <b>暫定</b>?'},
    options:['ざんてい','ざんじょう','せってい','ぜんてい'],
    answer:0
  }
];
