"""Extract verified general book passages; never copy personal case studies."""
from pathlib import Path
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "attached_assets"
APP = ROOT / "artifacts/portrait-ios"


def pages(prefix):
    source = next(ASSETS.glob(prefix + "*.pdf"))
    return subprocess.check_output(
        ["pdftotext", "-layout", str(source), "-"], text=True
    ).split("\f")


def clean(text):
    text = re.sub(r"([А-Яа-яЁё])[-\u00ad]\s*\n\s*([а-яё])", r"\1\2", text)
    text = re.sub(r"(?m)^\s*\d+\s*$", "", text)
    return re.sub(r"\s+", " ", text).strip()


sources = [
    dict(id="magic", title="Магия Таро", author="Алла Хшановска", year="1999", pageCount=106,
         coverage="Психологические значения всех 22 Старших арканов. Не полный текст книги."),
    dict(id="portrait", title="Психологический портрет на основе карт Таро",
         author="Алла Алиция Хшановская", year="2011", pageCount=157,
         coverage="Общие правила интерпретации и назначение позиций. Персональные примеры исключены."),
    dict(id="mystery", title="Мистерия Таро", author="Алла Хшановска", year="2008", pageCount=121,
         coverage="Введение в повседневные темы и четыре масти Младших арканов.",
         notice="Справочное чтение: Младшие арканы не вычисляются из даты рождения в текущем алгоритме."),
    dict(id="health", title="Таро и здоровье",
         author="Алла Алиция Хшановская, Андрей Петр Залесский", year="2012", pageCount=82,
         coverage="Два предупреждения авторов из введения и заключения; вручную сверены со сканами.",
         notice="Не медицинская диагностика. Приложение не предсказывает болезни и не рекомендует лечение."),
]
readings = []
magic = pages("1_")
# The book orders Fool first (0); the user's workbook represents Fool as 22.
joined = ""
boundaries = []
for page_number, text in enumerate(magic, 1):
    boundaries.append((len(joined), page_number))
    joined += text + "\n"
matches = list(re.finditer(r"Психологическое значение\s*:\s*", joined))
assert len(matches) == 22, f"Expected 22 psychological passages, got {len(matches)}"
names = ["Шут", "Маг", "Верховная Жрица", "Императрица", "Император", "Иерофант",
         "Влюблённые", "Колесница", "Справедливость", "Отшельник", "Колесо Фортуны",
         "Сила", "Повешенный", "Смерть", "Умеренность", "Дьявол", "Башня", "Звезда",
         "Луна", "Солнце", "Суд", "Мир"]
for index, match in enumerate(matches):
    rest = joined[match.end():]
    stop = re.search(r"Другие названия\s*:|ЧАСТЬ ТРЕТЬЯ|Часть третья", rest)
    assert stop is not None, f"Missing card boundary: {names[index]}"
    end = match.end() + stop.start()
    fragment = joined[match.end():end].rstrip()
    end = match.end() + len(fragment)
    text = clean(fragment)
    assert 150 < len(text) < 6000, (names[index], len(text))
    start_page = max(n for offset, n in boundaries if offset <= match.end())
    end_page = max(n for offset, n in boundaries if offset < end)
    readings.append(dict(
        id=f"magic-{22 if index == 0 else index}", sourceId="magic",
        title=f"{names[index]} · психологическое значение", text=text,
        pdfPages=list(range(start_page, end_page + 1)), scope="arcana",
        arcanaCode=22 if index == 0 else index,
        note="Авторское символическое толкование аркана, а не научная характеристика личности."
    ))


def add(id, source, title, text, pdf_pages, positions=None, note=None):
    item = dict(id=id, sourceId=source, title=title, text=text, pdfPages=pdf_pages,
                scope="position" if positions else "reference")
    if positions:
        item["positions"] = positions
    if note:
        item["note"] = note
    readings.append(item)


# Transcribed general methodological passages, checked against the corresponding
# text-layer pages. No neighboring personal examples or formulas are imported.
add("portrait-path", "portrait", "Как читать жизненный путь",
    "Интерпретация, как правило, начинается с первого уровня горизонтальной линии карт, то есть с позиций 1., 2., 3. И расположенные здесь карты говорят о «Жизненном пути» человека, о том, что будет доминировать в детстве и подростковом возрасте (карта на позиции 1.), в среднем возрасте (позиция 2.), и в третьей части жизни (карта, которую получили, суммировав составляющие года рождения). Эти три позиции дают понимание того, какими человек располагает возможностями и к чему он предрасположен.",
    [36], [1, 2, 3], "Возрастные темы приведены в рамках авторской методики, не как прогноз событий.")
add("portrait-psyche", "portrait", "Три уровня психики",
    "Оставшиеся три карты раскрывают психику человека. Так карта на 4. позиции описывает подсознание, на 5. позиции — сознание, а на 6. позиции — сверхсознание.",
    [36], [4, 5, 6])
add("portrait-fears", "portrait", "Позиция страхов и комплексов",
    "Картой, которая указывает нам на комплексы, страхи и психологические блокады, скрытые в подсознании, является карта на 4. позиции Внутреннего Психологического Портрета (Горшочке).",
    [38], [4], "Это описание символической позиции. Наличие кода не доказывает травму, страх или расстройство.")
add("portrait-consciousness", "portrait", "Сознание и самореализация",
    "Позиция 5. — сознание: стремления, цели, мораль, этика, сфера самореализации.",
    [38], [5])
add("portrait-talents", "portrait", "Скрытые возможности",
    "Позиция 6. — сверхсознание: скрытые таланты, способности, а так же духовные покровители.",
    [38], [6])
add("portrait-mission", "portrait", "Миссия в структуре портрета",
    "Карта на 7. позиции говорит о миссии, с которой человек пришел в мир и которую должен осуществить. Восьмая позиция покажет, какие «дары» получил при рождении человек, ведь именно они станут верными помощниками в реализации жизненной миссии.",
    [36], [7, 8])
add("portrait-harmony", "portrait", "Что означает психическая гармония",
    "Эта карта описывает ситуации и условия, в которых человек чувствует себя наиболее комфортно или, проще говоря, счастливо. Эта карта стоит всегда на позиции под номером 12. и записываем её сбоку нашей перевернутой пирамиды.",
    [51], [12])
add("portrait-self", "portrait", "Внутренний взгляд",
    "Карта на позиции 13. расскажет о внутреннем состоянии человека, о том, от чего отказался, что скрывает ото всех, как сам себя оценивает.",
    [36], [13])
add("portrait-social", "portrait", "Внешний взгляд",
    "В свою очередь, карта на позиции 14. проинформирует нас о том, как человек ведёт себя в обществе, и как общество его воспринимает.",
    [36, 37], [14])
add("portrait-karma", "portrait", "Назначение кармических позиций",
    "Значения позиций Кармического Портрета: 9 — кем был? 10 — чем занимался? 11 — какая моя кармическая задача? 15 — карта, которая указывает на способы проработки кармы; 17 — карта кармического комфорта; 18 — как работать с миссией в данном воплощении?",
    [98], [9, 10, 11, 15, 17, 18],
    "Карма и прошлые воплощения — понятия авторской эзотерической системы, не проверенные факты о человеке.")
add("portrait-free-will", "portrait", "Портрет не отменяет свободу выбора",
    "Нельзя забывать о том, что мы обладаем свободной волей, и через нее делаем свой выбор.",
    [37])
add("portrait-neighbours", "portrait", "Почему важен контекст соседних позиций",
    "Чтобы Тебе было легче, Читатель, ниже приведу примеры наиболее распространённых страхов и комплексов, на которые указывают Старшие Арканы, но хочу предупредить, что таковых может быть гораздо больше, а также обратите внимание на то, что влияние соседних карт может кардинально изменить значение карты, стоящей на 4. позиции.",
    [39], [4], "Отдельный фрагмент не следует читать как окончательный вывод о личности.")

mystery = pages("2_")
intro = clean(mystery[2])
start = intro.index("Младшие Арканы – это")
end = intro.index("В каждой масти")
add("mystery-daily", "mystery", "Четыре сферы повседневной жизни",
    intro[start:end].strip(), [3], note="Это справочный контекст, а не дополнительные коды вашего портрета.")
for id, page, marker, stop, title in [
    ("mystery-wands", 27, "Жезлы в целом", "Первый же", "Действие и развитие · Жезлы"),
    ("mystery-cups", 42, "Кубки, рассматриваемые", "Первый раз", "Чувства и переживания · Кубки"),
    ("mystery-swords", 56, "Мечи, рассматриваемые", "Мечи расскажут", "Мышление и обучение · Мечи"),
    ("mystery-coins", 71, "Масть Денариев рассказывает", "Денарии покажут", "Материальные вопросы · Денарии"),
]:
    text = clean(mystery[page - 1])
    start = text.index(marker)
    end = text.index(stop, start)
    add(id, "mystery", title, text[start:end].strip(), [page],
        note="Справочная символика масти. Приложение не определяет эту масть по дате рождения.")

# Image-only book: manually transcribed from PDF spreads 5–6 (printed 11–12)
# and 82 (conclusion). No disease predictions or treatment claims are imported.
add("health-boundaries", "health", "Главное ограничение: не вместо врача",
    "Ещё раз напоминаю, что таролог может только подсказать, но его советы ни в коем случае не заменяют визита к врачу, а также не являются основанием для прекращения лечения, назначенного врачом.",
    [5, 6], note="При вопросах здоровья обращайтесь к квалифицированному врачу.")
add("health-suggestion", "health", "Осторожность с внушением",
    "Мы знаем, насколько сильное влияние оказывает самовнушение, поэтому советуем внимательнее интерпретировать расклады, посвященные здоровью…",
    [82], note="Фрагмент заключения. Приложение не делает медицинских выводов по картам или дате рождения.")

assert len({r["id"] for r in readings}) == len(readings)
payload = (
    "// Selected source passages; regenerate with scripts/extract-portrait-books.py.\n"
    "import type { BookReading, BookSource } from './book-types';\n\n"
    "export const BOOK_SOURCES: BookSource[] = " + json.dumps(sources, ensure_ascii=False, indent=2) + ";\n\n"
    "export const BOOK_READINGS: BookReading[] = " + json.dumps(readings, ensure_ascii=False, indent=2) + ";\n"
)
(APP / "lib/book-data.ts").write_text(payload)
print(json.dumps({"sources": len(sources), "readings": len(readings), "arcana": len(matches)}, ensure_ascii=False))
