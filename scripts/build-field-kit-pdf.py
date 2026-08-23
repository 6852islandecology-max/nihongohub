# -*- coding: utf-8 -*-
"""build-field-kit-pdf.py — 読者に渡す印刷用フィールドキットを作る。

なぜ作るか (2026-08-23):
  ニュースレターの箱は「毎週メールを送ります」という約束しか差し出していなかった。
  6日間で登録0行。読者は将来のメールではなく、いま持ち帰れる物と交換する。
  中身はすべて公開済み記事の事実だけを使う。ここで新しい事実を作らない。

出典 (すべて自社記事、事実確認済み):
  blog/japanese-knife-towns-guide.html      工芸産地 (刃物)
  blog/japanese-pottery-towns-guide.html    工芸産地 (陶器)
  blog/japanese-tea-regions-guide.html      工芸産地 (茶)
  blog/japanese-whisky-towns-guide.html     工芸産地 (ウイスキー)
  blog/japanese-whetstones-guide.html       砥石の番手
  blog/japan-souvenirs-worth-carrying-home.html  免税制度改正・持ち帰り・買い物語彙
  blog/goshuin-temple-shrine-stamps.html 他  無料の収集系

出力: downloads/japan-craft-collectible-field-kit.pdf (A4・印刷前提・全ページ英語+日本語)
実行: python scripts/build-field-kit-pdf.py
"""
import io, os, re, sys

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, KeepTogether,
)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "downloads", "japan-craft-collectible-field-kit.pdf")
SITE = "www.nihongo-hub.com"
UPDATED = "August 2026"

JP = "HeiseiKakuGo-W5"
pdfmetrics.registerFont(UnicodeCIDFont(JP))

# ラテン側は DejaVu Sans を埋め込む。Helvetica の WinAnsi には長音つき (ō ū) も ☐ も無く、
# 印刷物で ■ になる。フォント実体は scripts/fonts/ に置く (scripts/ は .vercelignore で
# 本番配信されないので、ビルド時だけの資産)。DejaVu は再配布・埋め込みが許諾されている。
FONT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fonts")
pdfmetrics.registerFont(TTFont("Body", os.path.join(FONT_DIR, "DejaVuSans.ttf")))
pdfmetrics.registerFont(TTFont("Body-Bold", os.path.join(FONT_DIR, "DejaVuSans-Bold.ttf")))
pdfmetrics.registerFontFamily("Body", normal="Body", bold="Body-Bold")

INK = colors.HexColor("#1c1a16")
MUTED = colors.HexColor("#6f6757")
LINE = colors.HexColor("#d9cfb9")
GOLD = colors.HexColor("#b07a1e")
BAND = colors.HexColor("#f6f1e6")

# 日本語の連なりだけ CID フォントへ回す。長音つきラテン文字は DejaVu が持っているので回さない。
CJK = re.compile(r"[　-ヿ㐀-鿿＀-￯]+")


def t(s):
    """日本語の連なりだけ CID フォントに切り替える。英字は DejaVu のまま読みやすく保つ。"""
    return CJK.sub(lambda m: '<font name="%s">%s</font>' % (JP, m.group(0)), s)


S = {
    "title": ParagraphStyle("title", fontName="Body-Bold", fontSize=27, leading=31,
                            textColor=INK, alignment=TA_CENTER, spaceAfter=6),
    "sub": ParagraphStyle("sub", fontName="Body", fontSize=11.5, leading=16,
                          textColor=MUTED, alignment=TA_CENTER),
    "h": ParagraphStyle("h", fontName="Body-Bold", fontSize=15, leading=19,
                        textColor=INK, spaceBefore=2, spaceAfter=5),
    "h2": ParagraphStyle("h2", fontName="Body-Bold", fontSize=11, leading=14,
                         textColor=GOLD, spaceBefore=8, spaceAfter=3),
    "p": ParagraphStyle("p", fontName="Body", fontSize=9.4, leading=13.4,
                        textColor=INK, spaceAfter=5),
    "small": ParagraphStyle("small", fontName="Body", fontSize=8, leading=11,
                            textColor=MUTED),
    "cell": ParagraphStyle("cell", fontName="Body", fontSize=8.2, leading=11,
                           textColor=INK),
    "cellb": ParagraphStyle("cellb", fontName="Body-Bold", fontSize=8.2, leading=11,
                            textColor=INK),
    "kicker": ParagraphStyle("kicker", fontName="Body-Bold", fontSize=8, leading=11,
                             textColor=GOLD, alignment=TA_LEFT),
}


def P(s, st="p"):
    return Paragraph(t(s), S[st])


def table(rows, widths, header=True, zebra=True):
    data = []
    for i, r in enumerate(rows):
        style = "cellb" if (header and i == 0) else "cell"
        data.append([Paragraph(t(str(c)), S[style]) for c in r])
    tb = Table(data, colWidths=widths, repeatRows=1 if header else 0)
    cmds = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LINEBELOW", (0, 0), (-1, -2), 0.4, LINE),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
    ]
    if header:
        cmds += [("BACKGROUND", (0, 0), (-1, 0), BAND), ("LINEBELOW", (0, 0), (-1, 0), 0.8, GOLD)]
    if zebra:
        for i in range(1 if header else 0, len(rows)):
            if i % 2 == 0:
                cmds.append(("BACKGROUND", (0, i), (-1, i), colors.HexColor("#faf7f1")))
    tb.setStyle(TableStyle(cmds))
    return tb


def checkbox_rows(n, widths, headers):
    rows = [headers]
    for _ in range(n):
        rows.append([""] * len(headers))
    tb = Table(rows, colWidths=widths, rowHeights=[16] + [21] * n)
    tb.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.4, LINE),
        ("BACKGROUND", (0, 0), (-1, 0), BAND),
        ("FONT", (0, 0), (-1, 0), "Body-Bold", 8.2),
        ("TEXTCOLOR", (0, 0), (-1, 0), INK),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
    ]))
    return tb


def page_furniture(canvas, doc):
    canvas.saveState()
    canvas.setFont("Body", 7.5)
    canvas.setFillColor(MUTED)
    if doc.page > 1:
        canvas.drawString(20 * mm, 12 * mm, "Japan Craft & Collectible Field Kit · %s" % SITE)
        canvas.drawRightString(A4[0] - 20 * mm, 12 * mm, "%d" % doc.page)
        canvas.setStrokeColor(LINE)
        canvas.setLineWidth(0.4)
        canvas.line(20 * mm, 15 * mm, A4[0] - 20 * mm, 15 * mm)
    canvas.restoreState()


story = []
W = A4[0] - 40 * mm

# ---------------------------------------------------------------- cover
story += [
    Spacer(1, 42 * mm),
    Paragraph("FREE PRINTABLE · UPDATED %s" % UPDATED.upper(), S["kicker"]),
    Spacer(1, 4 * mm),
    Paragraph("Japan Craft &amp; Collectible<br/>Field Kit", S["title"]),
    Spacer(1, 5 * mm),
    P("Eight pages to print and carry: which craft town makes what, what to check before "
      "you buy, the five free things worth collecting, the shop phrases you will actually "
      "need, and the tax-free rules that change on 1 November 2026.", "sub"),
    Spacer(1, 12 * mm),
    table([
        ["Page", "What is on it"],
        ["2", "Before you go — the 1 Nov 2026 tax-free change, and getting it home"],
        ["3", "Craft towns at a glance — knives and pottery"],
        ["4", "Craft towns at a glance — tea and whisky"],
        ["5", "What to check before you buy"],
        ["6", "The five free collections"],
        ["7", "Shop Japanese — 18 words and phrases"],
        ["8", "Collection log — print as many as you need"],
    ], [22 * mm, W - 22 * mm]),
    Spacer(1, 14 * mm),
    P("Made by NihongoHub · %s<br/>Every fact here comes from our own sourced guides. "
      "Nothing on these pages is sponsored." % SITE, "small"),
    PageBreak(),
]

# ---------------------------------------------------------------- p2 before you go
story += [
    P("Before you go", "h"),
    P("Two things decide whether shopping in Japan goes smoothly, and neither is about money. "
      "The first is a rule change most English guides have not caught up with.", "p"),
    P("Tax-free shopping changes on 1 November 2026", "h2"),
    table([
        ["", "Until 31 Oct 2026", "From 1 Nov 2026"],
        ["At the till", "Tax removed at purchase", "You pay the full tax-inclusive price"],
        ["Getting the money back", "Nothing to do",
         "Claim a refund on departure — customs terminals, or Visit Japan Web before check-in"],
        ["Minimum spend", "¥5,000 before tax, same store, same day", "Unchanged"],
        ["Time limit", "30 days consumables / 6 months general goods",
         "All goods bought within 90 days of departure"],
        ["Sealed bags", "Consumables sealed, not to be opened",
         "Category and packaging rule abolished — but do not consume before you leave"],
    ], [30 * mm, 52 * mm, W - 82 * mm]),
    Spacer(1, 3 * mm),
    P("In practice: budget the full shelf price, keep passport and receipts together, and leave "
      "time at the airport — the refund step happens before check-in, not after security. "
      "A trip that straddles 1 November will meet both systems.", "p"),
    P("Getting it home", "h2"),
    table([
        ["Knives", "Checked baggage. Always — never hand luggage, any airline, any airport. "
                   "Keep the shop's packaging."],
        ["Ceramics", "Hand luggage if you can. Buy them last, or ask about domestic shipping "
                     "(発送 hassō) to your hotel."],
        ["Alcohol", "Japan allows three 760 ml bottles on arrival. Your own country sets its own "
                    "limit, and most proxy services refuse alcohol."],
        ["Weight", "Pottery, cast iron, tools and stones are dense. Leave the space on the way "
                   "out, not the excess-baggage fee on the way back."],
        ["Duty at home", "Every country sets a personal allowance (the US, for example, "
                         "US$800 per person). Keep receipts and declare honestly."],
    ], [30 * mm, W - 30 * mm], header=False),
    Spacer(1, 4 * mm),
    P("What you cannot carry, you can still buy", "h2"),
    P("Kiln-direct ceramics, single-estate teas, named-quarry whetstones, left-handed "
      "single-bevel knives and most carpentry tools never reach amazon.com. They are sold on "
      "Japanese marketplaces, which a proxy service will buy from and forward on your behalf.", "p"),
    PageBreak(),
]

# ---------------------------------------------------------------- p3 knives + pottery
story += [
    P("Craft towns at a glance — knives", "h"),
    table([
        ["Town", "Known for", "What you can do there", "Best time"],
        ["Sakai, Osaka 堺", "Single-bevel professional kitchen knives",
         "Free museum; paid sharpening and handle-fitting classes", "Any time"],
        ["Seki, Gifu 関", "Volume production — Kai and Feather blades",
         "Swordsmith museum, monthly forging demo, October festival", "2nd weekend of Oct"],
        ["Echizen, Fukui 越前", "Hand-forged blades; first cutlery named a national craft",
         "Observation deck over a live workshop; bookable knife-making course", "Any time, book ahead"],
        ["Tsubame-Sanjo, Niigata 燕三条", "Stainless, Western cutlery, kitchen tools",
         "100+ factories open to the public — festival only", "1–4 Oct 2026"],
        ["Miki, Hyogo 三木", "Carpentry tools — saws, chisels, planes",
         "Hardware festival, tool markets, sharpening workshop", "Early Nov"],
    ], [34 * mm, 38 * mm, W - 106 * mm, 34 * mm]),
    Spacer(1, 2 * mm),
    P("Rail from Tokyo, fastest services (±20%): Tsubame-Sanjo ~100 min · Seki ~120 min · "
      "Sakai ~140 min · Miki ~160 min · Echizen ~175 min. All five need a further local hop.", "small"),
    Spacer(1, 6 * mm),
    P("Craft towns at a glance — pottery", "h"),
    table([
        ["Town", "Makes", "The walk", "Next big date"],
        ["Tokoname, Aichi 常滑", "Stoneware, teapots, the lucky cat",
         "Marked Pottery Footpath, 1.6 km or 4 km", "Any time"],
        ["Mashiko, Tochigi 益子", "Folk-craft stoneware, everyday tableware",
         "One long main street of shops and kilns", "31 Oct – 3 Nov 2026"],
        ["Arita, Saga 有田", "Porcelain — Japan's first",
         "~4 km between two stations, shop to shop", "Autumn fair in November"],
        ["Imbe (Bizen), Okayama 伊部", "Unglazed wood-fired stoneware",
         "Compact — the town is around the station", "17 Oct 2026"],
        ["Shigaraki, Shiga 信楽", "Stoneware, and the tanuki",
         "Workshop-lined streets plus a 40 ha park", "Any time"],
    ], [34 * mm, 38 * mm, W - 106 * mm, 34 * mm]),
    Spacer(1, 2 * mm),
    P("Rail from Tokyo: Mashiko ~50 min · Tokoname ~95 min · Shigaraki ~140 min · "
      "Imbe ~195 min · Arita ~345 min.", "small"),
    PageBreak(),
]

# ---------------------------------------------------------------- p4 tea + whisky
story += [
    P("Craft towns at a glance — tea", "h"),
    P("The production ranking most English guides still have backwards: Kagoshima has been "
      "ahead of Shizuoka in aracha for two consecutive years (FY2024 and FY2025).", "p"),
    table([
        ["Measure", "Kagoshima", "Shizuoka", "Note"],
        ["Aracha production, FY2025", "30,000 t", "24,100 t", "Kagoshima ahead, second year running"],
        ["First flush (ichibancha), 2025", "8,440 t", "8,120 t", "Shizuoka down ~19% year on year"],
        ["Tencha (matcha raw leaf)", "1st", "3rd", "Kyoto 2nd; national output 5,336 t in FY2024"],
    ], [44 * mm, 24 * mm, 24 * mm, W - 92 * mm]),
    Spacer(1, 3 * mm),
    table([
        ["Region", "What the cup tastes like", "From Tokyo"],
        ["Sayama, Saitama 狭山", "Extra firing — roasted aroma", "~25 min"],
        ["Shizuoka 静岡", "Bright everyday sencha", "~60 min"],
        ["Uji, Kyoto 宇治", "Matcha and gyokuro, the classical name", "~130 min"],
        ["Yame, Fukuoka 八女", "Shaded gyokuro — sweet and thick", "~300 min"],
        ["Chiran, Kagoshima 知覧", "Bright sencha from the new number one", "~395 min"],
    ], [40 * mm, W - 76 * mm, 36 * mm]),
    Spacer(1, 2 * mm),
    P("Buy small quantities. Japanese green tea is a fresh product and fades within months "
      "of opening.", "small"),
    Spacer(1, 6 * mm),
    P("Craft towns at a glance — whisky", "h"),
    P("The question that decides the trip is not which whisky, it is whether you can get in.", "p"),
    table([
        ["Distillery", "Town", "Can you get in?", "Cost"],
        ["Yoichi 余市", "Yoichi, Hokkaido", "Yes — free self-guided entry; guided tour by booking",
         "Free tour; paid tasting"],
        ["Yamazaki 山崎", "Shimamoto, Osaka", "Lottery — apply ~2 months ahead, short window",
         "~¥3,000 / ¥10,000"],
        ["Hakushu 白州", "Hokuto, Yamanashi", "Lottery, plus a first-come cancellation course",
         "~¥3,000 / ¥10,000"],
        ["Mars Komagatake 駒ヶ岳", "Miyada, Nagano", "Yes — free tour, booking prioritised when busy",
         "Free tour; tastings charged"],
        ["Chichibu 秩父", "Chichibu, Saitama", "No — trade only, by appointment", "—"],
    ], [32 * mm, 30 * mm, W - 100 * mm, 38 * mm]),
    PageBreak(),
]

# ---------------------------------------------------------------- p5 what to check
story += [
    P("What to check before you buy", "h"),
    P("Knives — three questions, in this order", "h2"),
    table([
        ["1. Single or double bevel?",
         "Single-bevel (片刃 kataba) is the professional Japanese shape — sharpened on one side, "
         "harder to sharpen, and left-handers need a left-handed one. Double-bevel (両刃 ryōba) "
         "santoku and gyuto are what most people actually want."],
        ["2. Hand-forged or made at scale?",
         "Neither is a fake. A hand-forged Sakai blade passes through a forger, a sharpener and "
         "a handle-maker. A Seki factory knife is finished to a tolerance no single smith can "
         "match, at a fifth of the price."],
        ["3. Carbon or stainless?",
         "Carbon steel is sharper and rusts — both facts arrive the same day. Budget for a stone "
         "at the same time, and dry the blade immediately every time."],
    ], [40 * mm, W - 40 * mm], header=False),
    Spacer(1, 4 * mm),
    P("Whetstones — the grit ladder", "h2"),
    table([
        ["Grit", "Japanese", "What it is for"],
        ["~#220–400", "荒砥 arato", "Repair work — chips and reshaping. Most travellers never need it."],
        ["~#800–2000", "中砥 nakato", "The main sharpening zone. If you buy one stone, buy #1000."],
        ["~#3000 and up", "仕上げ砥 shiageto", "Finishing an already-sharp edge."],
        ["Ungraded, fine", "合砥 awasedo", "Kyoto natural finishing stones. Every stone is different."],
        ["—", "面直し mennaoshi", "Flattening a dished stone. The maintenance nobody warns you about."],
    ], [30 * mm, 34 * mm, W - 64 * mm]),
    Spacer(1, 4 * mm),
    P("Pottery and tea", "h2"),
    table([
        ["Pottery", "Buy the fragile things last. Ask about domestic shipping to your hotel. "
                    "Two of the largest markets fall this autumn — Bizen on 17 Oct 2026, "
                    "Mashiko 31 Oct – 3 Nov 2026 — where hundreds of makers sell direct."],
        ["Tea", "Ask for the harvest, not just the grade. Buy small, sealed, and recent; "
                "green tea fades within months of opening."],
        ["Anything", "限定 (gentei, limited) is a regional or seasonal edition, not a marketing "
                     "word. It is also the word that empties wallets."],
    ], [30 * mm, W - 30 * mm], header=False),
    PageBreak(),
]

# ---------------------------------------------------------------- p6 free collections
story += [
    P("The five free collections", "h"),
    P("Japan runs several nationwide collecting systems that cost nothing or almost nothing. "
      "They double as a reason to go somewhere you would not otherwise visit — which is the "
      "actual point.", "p"),
    table([
        ["What", "Cost", "Where you get it", "The catch"],
        ["Goshuin 御朱印", "¥300–500", "Shrines and temples nationwide",
         "Bring the book first — a goshuinchō, sold at shrines and stationers. Not a stamp rally: "
         "it is written for you, by hand, one at a time."],
        ["Station stamps 駅スタンプ", "Free", "Station concourses; also a digital app",
         "Ink pads dry out. Bring your own book and press evenly."],
        ["Manhole cards マンホールカード", "Free",
         "Local tourist offices and town halls", "One per person per visit, and only in person. "
         "Check opening hours — many are municipal offices, closed at weekends."],
        ["Castle stamps 御城印", "Free rally stamps; paid gojōin sheets",
         "Japan's 100 Famous Castles and beyond", "The rally book and the paper sheets are two "
         "different collections."],
        ["Roadside stations 道の駅", "Free", "Michi-no-eki nationwide",
         "Practical only if you are driving. There are roughly 1,220 of them."],
    ], [38 * mm, 26 * mm, 42 * mm, W - 106 * mm]),
    Spacer(1, 4 * mm),
    P("The one thing to buy first", "h2"),
    P("A goshuinchō (御朱印帳) — an accordion-folded album sold at shrines and stationers. It turns "
      "a pile of loose paper into an object worth keeping, and it is the cheapest souvenir on "
      "this list that still means something in ten years.", "p"),
    Spacer(1, 3 * mm),
    P("Etiquette, in one line each", "h2"),
    table([
        ["Visit first, stamp after", "Pay respects, then go to the office. The stamp is a record "
                                     "of the visit, not a ticket."],
        ["Have the book open", "Hand it over open at the page you want, with the money ready. "
                               "Small coins."],
        ["Do not haggle or rush", "Someone is writing calligraphy for you. Wait quietly."],
        ["One book, one purpose", "Many people keep shrines and temples in separate books. "
                                  "Ask if you are unsure — the answer is polite either way."],
    ], [44 * mm, W - 44 * mm], header=False),
    PageBreak(),
]

# ---------------------------------------------------------------- p7 shop japanese
story += [
    P("Shop Japanese", "h"),
    P("Eighteen words that do real work in a craft shop. Point at this page if you need to — "
      "the kanji is there so a shop assistant can read it.", "p"),
    table([
        ["Japanese", "Reading", "What it does"],
        ["免税", "menzei", "Tax-free. The sign in the window and the counter you need."],
        ["発送", "hassō", "Shipping. Ask this when your hands are full."],
        ["割れ物", "waremono", "Fragile. Say it and the wrapping improves immediately."],
        ["包装", "hōsō", "Gift wrapping. Usually free, and very good."],
        ["限定", "gentei", "Limited — by region, season or store."],
        ["お土産", "omiyage", "A souvenir, specifically one brought back for other people."],
        ["片刃", "kataba", "Single-bevel — the professional Japanese blade."],
        ["両刃", "ryōba", "Double-bevel — the santoku and gyuto most people want."],
        ["左利き", "hidarikiki", "Left-handed. Ask before you buy a single-bevel knife."],
        ["砥石", "toishi", "Whetstone."],
        ["番手", "bante", "Grit number."],
        ["面直し", "mennaoshi", "Flattening a dished stone."],
        ["御朱印", "goshuin", "The hand-written shrine or temple seal."],
        ["御朱印帳", "goshuinchō", "The book you collect them in."],
        ["窯元", "kamamoto", "The kiln itself — where the potter works."],
        ["一番茶", "ichibancha", "First flush. The tea worth asking about."],
        ["試飲", "shiin", "A tasting. Distilleries and tea shops both use it."],
        ["予約", "yoyaku", "A booking. Two of the whisky distilleries run a lottery months ahead."],
    ], [26 * mm, 26 * mm, W - 52 * mm]),
    Spacer(1, 4 * mm),
    P("One sentence worth memorising: これを発送できますか (kore o hassō dekimasu ka) — "
      "\"can you ship this?\" It is the difference between carrying a box for nine days and not.", "p"),
    PageBreak(),
]

# ---------------------------------------------------------------- p8 log
story += [
    P("Collection log", "h"),
    P("Print as many copies as you need. One line per stamp, card or piece — the date and the "
      "place are what you will want later, not the photograph.", "p"),
    Spacer(1, 2 * mm),
    checkbox_rows(13, [22 * mm, 46 * mm, W - 118 * mm, 50 * mm],
                  ["Date", "Place", "What I got", "Notes"]),
    Spacer(1, 5 * mm),
    P("Before you fly", "h2"),
    table([
        ["☐", "Knives in checked baggage — never in hand luggage"],
        ["☐", "Ceramics in hand luggage, or shipped from the shop"],
        ["☐", "Receipts and passport together"],
        ["☐", "Tax refund claimed before check-in (from 1 Nov 2026)"],
        ["☐", "Consumables still sealed and unopened"],
        ["☐", "Bag weighed — pottery, tools and stones are dense"],
    ], [8 * mm, W - 8 * mm], header=False),
    Spacer(1, 5 * mm),
    P("Where this comes from", "h2"),
    P("Every fact in this kit is from a sourced guide on %s: knife towns, pottery towns, tea "
      "regions, whisky towns, whetstones, the souvenir hub, and the goshuin, station stamp, "
      "manhole card, castle and roadside-station guides. Nothing here is sponsored. Rail times "
      "are curated approximations (±20%%) for the fastest services. Dates and rules were correct "
      "in %s — the tax-free change takes effect on 1 November 2026, so check the current rule if "
      "you travel after that date." % (SITE, UPDATED), "small"),
]

doc = SimpleDocTemplate(
    OUT, pagesize=A4,
    leftMargin=20 * mm, rightMargin=20 * mm, topMargin=18 * mm, bottomMargin=20 * mm,
    title="Japan Craft & Collectible Field Kit",
    author="NihongoHub", subject="Printable field kit for craft towns and collectible hunting in Japan",
)
doc.build(story, onFirstPage=page_furniture, onLaterPages=page_furniture)
print("wrote %s (%.0f KB)" % (OUT, os.path.getsize(OUT) / 1024))
