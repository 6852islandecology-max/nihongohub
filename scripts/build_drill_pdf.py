# -*- coding: utf-8 -*-
"""build_drill_pdf.py — turn an exported quiz JSON into a print-ready tutor drill pack PDF.

Input : scripts/data/drill-<LEVEL>-<LANG>.json  (from export-drill-pack.mjs)
Output: a single PDF — cover / how-to / question sheets (no answers) / answer key + explanations.

Japanese renders via reportlab's built-in CID font (HeiseiKakuGo-W5) — no external font file needed.
Furigana <ruby>K<rt>r</rt></ruby> is flattened to K（r）so it prints in any viewer; the underline
<u>…</u> on reading questions is preserved. Run: python scripts/build_drill_pdf.py N5 en
"""
import sys, os, re, json, random

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    KeepTogether,
)

LEVEL = (sys.argv[1] if len(sys.argv) > 1 else "N5").upper()
LANG = (sys.argv[2] if len(sys.argv) > 2 else "en").lower()
SET_SIZE = 10  # questions per lesson set

# ---- localized UI strings (question text + explanations come from the JSON bank) ----
UI = {
    "en": {
        "cover_title": f"JLPT {LEVEL} Drill Pack",
        "cover_sub1": "{n} ready-to-use practice questions for Japanese tutors",
        "cover_sub2": "Reading · vocabulary · grammar · particles — with full answer key &amp; explanations",
        "license": ("<b>Tutor license.</b> You may use these questions in your own paid 1-on-1 or group "
                    "lessons (italki, Preply, Cafetalk, in person, or your own classes). Screen-share them, "
                    "print them for your students, or drop them into your lesson slides. "
                    "Please don't resell or redistribute the pack itself as a file."),
        "made_by": "Made by NihongoHub · nihongo-hub.com · A family walking all 47 prefectures of Japan",
        "howto_h": "How to use this pack",
        "howto_intro": (f"Every question is a single-answer multiple choice item at JLPT {LEVEL} level, "
                        "the same format your students meet on the real test. The questions are grouped "
                        "into sets of about ten — roughly one lesson each."),
        "howto_items": [
            "<b>1. Warm-up drill.</b> Read the sentence aloud, have the student pick A–D, then reveal the answer. "
            "Furigana is printed as 漢字（かんじ）so lower levels can read every word.",
            "<b>2. Teach from the wrong answers.</b> The answer key explains why each distractor is wrong — "
            "that is where the real learning is. Ask “why not B?” before you read it out.",
            "<b>3. Homework.</b> The question pages have no answers printed on them, so you can share or print "
            "them for self-study and keep the key for yourself.",
            "<b>4. Placement check.</b> Run one set cold to see whether a new student is really at this level.",
        ],
        "howto_tail": "The question pages come first; the full answer key with explanations is at the back.",
        "q_h": f"Questions — JLPT {LEVEL}",
        "q_sub": "(Answers and explanations are at the back of the pack.)",
        "set_label": "▶ SET {set_no} &nbsp;·&nbsp; questions {a}–{b}",
        "instr_fallback": "Choose the correct answer.",
        "ans_h": f"Answer key &amp; explanations — JLPT {LEVEL}",
        "ans_word": "Answer",
        "footer": f"NihongoHub · JLPT {LEVEL} Tutor Drill Pack · nihongo-hub.com · page {{page}}",
    },
    "id": {
        "cover_title": f"Paket Latihan JLPT {LEVEL}",
        "cover_sub1": "{n} soal latihan siap pakai untuk tutor bahasa Jepang",
        "cover_sub2": "Membaca · kosakata · tata bahasa · partikel — dengan kunci jawaban &amp; penjelasan lengkap",
        "license": ("<b>Lisensi tutor.</b> Anda boleh memakai soal-soal ini dalam pelajaran berbayar Anda "
                    "sendiri, baik privat 1-lawan-1 maupun kelompok (italki, Preply, Cafetalk, tatap muka, "
                    "atau kelas Anda sendiri). Bagikan lewat layar, cetak untuk murid Anda, atau masukkan ke "
                    "slide pelajaran Anda. Mohon jangan menjual ulang atau menyebarkan berkas paket ini."),
        "made_by": "Dibuat oleh NihongoHub · nihongo-hub.com · Keluarga yang menjelajahi 47 prefektur Jepang",
        "howto_h": "Cara memakai paket ini",
        "howto_intro": (f"Setiap soal adalah pilihan ganda satu jawaban setingkat JLPT {LEVEL}, format yang "
                        "sama dengan ujian sebenarnya. Soal dikelompokkan dalam set sekitar sepuluh — "
                        "kira-kira satu pelajaran tiap set."),
        "howto_items": [
            "<b>1. Latihan pemanasan.</b> Bacakan kalimatnya, minta murid memilih A–D, lalu tunjukkan "
            "jawabannya. Furigana dicetak sebagai 漢字（かんじ）agar tingkat dasar bisa membaca tiap kata.",
            "<b>2. Ajar dari jawaban yang salah.</b> Kunci jawaban menjelaskan mengapa tiap pengecoh salah — "
            "di situlah pembelajaran sebenarnya. Tanyakan “kenapa bukan B?” sebelum membacakannya.",
            "<b>3. Pekerjaan rumah.</b> Halaman soal tidak memuat jawaban, jadi Anda bisa membagikan atau "
            "mencetaknya untuk belajar mandiri dan menyimpan kuncinya sendiri.",
            "<b>4. Cek penempatan.</b> Berikan satu set tanpa persiapan untuk melihat apakah murid baru "
            "benar-benar di tingkat ini.",
        ],
        "howto_tail": "Halaman soal ada di depan; kunci jawaban lengkap dengan penjelasan ada di bagian belakang.",
        "q_h": f"Soal — JLPT {LEVEL}",
        "q_sub": "(Jawaban dan penjelasan ada di bagian belakang paket.)",
        "set_label": "▶ SET {set_no} &nbsp;·&nbsp; soal {a}–{b}",
        "instr_fallback": "Pilih jawaban yang benar.",
        "ans_h": f"Kunci jawaban &amp; penjelasan — JLPT {LEVEL}",
        "ans_word": "Jawaban",
        "footer": f"NihongoHub · Paket Latihan JLPT {LEVEL} · nihongo-hub.com · halaman {{page}}",
    },
}
L = LANG if LANG in UI else "en"
U = UI[L]

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(HERE, "data", f"drill-{LEVEL}-{LANG}.json")
OUT_DIR = r"C:\Users\Yurik\成果物\Product\nihongohub\gumroad"
_suffix = "" if LANG == "en" else "-" + LANG.upper()
OUT = os.path.join(OUT_DIR, f"NihongoHub-JLPT-{LEVEL}-Tutor-Drill-Pack{_suffix}.pdf")

# ---- palette (matches the site: cream paper, ink, gold accent, brand red) ----
INK = colors.HexColor("#16100a")
MUT = colors.HexColor("#7a6a52")
GOLD = colors.HexColor("#c8911f")
RED = colors.HexColor("#bf3325")
SOFT = colors.HexColor("#ddcfb6")
CREAM = colors.HexColor("#fff7e6")
DARK = colors.HexColor("#0d0a14")

pdfmetrics.registerFont(UnicodeCIDFont("HeiseiKakuGo-W5"))
JP = "HeiseiKakuGo-W5"  # includes Latin glyphs, so we use it document-wide

# ---------------------------------------------------------------- text cleaning
RUBY = re.compile(r"<ruby>(.*?)<rt>(.*?)</rt></ruby>", re.S)
RT = re.compile(r"<rt>.*?</rt>", re.S)
TAG = re.compile(r"<[^>]+>")


def to_display(html: str) -> str:
    """Flatten furigana to K（r）and keep <u>…</u>/<b> for reportlab Paragraph."""
    s = RUBY.sub(lambda m: f"{m.group(1)}（{m.group(2)}）", html)
    # collapse any stray rt left over
    s = RT.sub("", s)
    return s.strip()


def to_plain(html: str) -> str:
    """Base text with no furigana and no tags — used for display/fallback."""
    s = RT.sub("", html)
    s = TAG.sub("", s)
    return re.sub(r"\s+", "", s)


def dedupe_key(it: dict) -> str:
    """Aggressive key so the bank's many near-identical variants (same sentence with
    different trailing politeness, or the 学校/牛乳 reading clusters) collapse to one.
    Normalises away the （　）blank, punctuation, and trailing ます/ました forms, then
    keys on the bare stem + the (okurigana-stripped) correct answer."""
    s = to_plain(it["question"])
    s = re.sub(r"（[^）]*）", "", s)          # drop blanks/parentheticals
    s = re.sub(r"[。、，．！？\s]", "", s)     # drop punctuation/space
    s = re.sub(r"(ます|ました|ません|です)$", "", s)  # drop trailing politeness
    ans = re.sub(r"[ぁ-ん]+$", "", str(it.get("correct", "")))  # kanji core of the answer
    return s + "|" + (ans or str(it.get("correct", "")))


# ---------------------------------------------------------------- load + dedupe
with open(SRC, encoding="utf-8") as f:
    data = json.load(f)

seen = set()
items = []
for it in data["items"]:
    key = dedupe_key(it)
    if not key or key in seen:
        continue
    seen.add(key)
    items.append(it)

# deterministic option order per question (seeded by position so the key matches)
prepared = []
for idx, it in enumerate(items):
    opts = [("correct", it["correct"])] + [("d", d) for d in it["distractors"]]
    rng = random.Random(1000 + idx)
    rng.shuffle(opts)
    letters = ["A", "B", "C", "D", "E"]
    correct_letter = letters[next(i for i, (t, _) in enumerate(opts) if t == "correct")]
    prepared.append({
        "instr": (it.get("reading") or U["instr_fallback"]).strip(),
        "display": to_display(it["question"]),
        "options": [(letters[i], v) for i, (t, v) in enumerate(opts)],
        "correct_letter": correct_letter,
        "correct": it["correct"],
        "explanation": (it.get("explanation") or "").strip(),
    })

N = len(prepared)

# ---------------------------------------------------------------- styles
styles = getSampleStyleSheet()

def S(name, **kw):
    base = dict(fontName=JP, textColor=INK, leading=15)
    base.update(kw)
    return ParagraphStyle(name, **base)

st_title = S("title", fontSize=26, leading=32, textColor=INK, alignment=TA_CENTER)
st_sub = S("sub", fontSize=13, leading=19, textColor=MUT, alignment=TA_CENTER)
st_klabel = S("klabel", fontSize=10, leading=14, textColor=GOLD, alignment=TA_CENTER)
st_h2 = S("h2", fontSize=16, leading=21, textColor=INK, spaceBefore=4, spaceAfter=8)
st_setlabel = S("setlabel", fontSize=11, leading=14, textColor=RED, spaceBefore=2, spaceAfter=6)
st_body = S("body", fontSize=11, leading=16, textColor=INK)
st_mut = S("mut", fontSize=10, leading=15, textColor=MUT)
st_instr = S("instr", fontSize=9.5, leading=13, textColor=MUT, spaceAfter=2)
st_qjp = S("qjp", fontSize=14, leading=22, textColor=INK, spaceAfter=3)
st_opt = S("opt", fontSize=12, leading=18, textColor=INK)
st_ans = S("ans", fontSize=11, leading=15, textColor=INK)
st_expl = S("expl", fontSize=9.5, leading=14, textColor=MUT, spaceAfter=9)
st_foot = S("foot", fontSize=8.5, leading=11, textColor=MUT, alignment=TA_CENTER)

flow = []

# ---------------------------------------------------------------- cover
flow += [Spacer(1, 40 * mm)]
flow += [Paragraph("NIHONGOHUB", st_klabel)]
flow += [Spacer(1, 6 * mm)]
flow += [Paragraph(U["cover_title"], st_title)]
flow += [Spacer(1, 4 * mm)]
flow += [Paragraph(U["cover_sub1"].format(n=N), st_sub)]
flow += [Spacer(1, 3 * mm)]
flow += [Paragraph(U["cover_sub2"], st_sub)]
flow += [Spacer(1, 16 * mm)]

license_tbl = Table(
    [[Paragraph(U["license"], st_body)]],
    colWidths=[150 * mm],
)
license_tbl.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), CREAM),
    ("BOX", (0, 0), (-1, -1), 1, GOLD),
    ("LEFTPADDING", (0, 0), (-1, -1), 14),
    ("RIGHTPADDING", (0, 0), (-1, -1), 14),
    ("TOPPADDING", (0, 0), (-1, -1), 12),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
]))
flow += [license_tbl]
flow += [Spacer(1, 10 * mm)]
flow += [Paragraph(U["made_by"], st_foot)]
flow += [PageBreak()]

# ---------------------------------------------------------------- how to use
flow += [Paragraph(U["howto_h"], st_h2)]
flow += [Paragraph(U["howto_intro"], st_body)]
flow += [Spacer(1, 5 * mm)]
for line in U["howto_items"]:
    flow += [Paragraph(line, st_body), Spacer(1, 3 * mm)]
flow += [Spacer(1, 4 * mm)]
flow += [Paragraph(U["howto_tail"], st_mut)]
flow += [PageBreak()]

# ---------------------------------------------------------------- question sheets
flow += [Paragraph(U["q_h"], st_h2)]
flow += [Paragraph(U["q_sub"], st_mut)]
flow += [Spacer(1, 5 * mm)]

for i, q in enumerate(prepared):
    if i % SET_SIZE == 0:
        set_no = i // SET_SIZE + 1
        last = min(i + SET_SIZE, N)
        flow += [Spacer(1, 2 * mm)]
        flow += [Paragraph(U["set_label"].format(set_no=set_no, a=i + 1, b=last), st_setlabel)]
    block = [
        Paragraph(f"<b>Q{i + 1}.</b> {q['instr']}", st_instr),
        Paragraph(q["display"], st_qjp),
    ]
    for letter, val in q["options"]:
        block += [Paragraph(f"&nbsp;&nbsp;<b>{letter}.</b> &nbsp;{val}", st_opt)]
    block += [Spacer(1, 6 * mm)]
    flow += [KeepTogether(block)]

flow += [PageBreak()]

# ---------------------------------------------------------------- answer key
flow += [Paragraph(U["ans_h"], st_h2)]
flow += [Spacer(1, 3 * mm)]
for i, q in enumerate(prepared):
    head = Paragraph(
        f"<b>Q{i + 1}.</b> &nbsp;{U['ans_word']}: <b>{q['correct_letter']}</b> &nbsp;— &nbsp;{q['correct']}",
        st_ans)
    expl = Paragraph(q["explanation"], st_expl) if q["explanation"] else Spacer(1, 4 * mm)
    flow += [KeepTogether([head, expl])]

# ---------------------------------------------------------------- footer on every page
def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont(JP, 8)
    canvas.setFillColor(MUT)
    canvas.drawCentredString(
        A4[0] / 2, 12 * mm,
        U["footer"].format(page=doc.page))
    canvas.restoreState()

doc = SimpleDocTemplate(
    OUT, pagesize=A4,
    leftMargin=22 * mm, rightMargin=22 * mm, topMargin=20 * mm, bottomMargin=20 * mm,
    title=f"NihongoHub JLPT {LEVEL} Tutor Drill Pack", author="NihongoHub",
)
doc.build(flow, onFirstPage=footer, onLaterPages=footer)
print(f"WROTE {OUT}  ({N} questions, {(N + SET_SIZE - 1)//SET_SIZE} sets)")
