"""Extract card-specific passages, excluding running headers and case studies."""
import re
import subprocess


CARD_CODES = {
    "шут": 22, "маг": 1, "верховная жрица": 2, "императрица": 3,
    "император": 4, "верховный жрец": 5, "влюбленные": 6, "колесница": 7,
    "справедливость": 8, "отшельник": 9, "колесо фортуны": 10, "сила": 11,
    "повешенный": 12, "смерть": 13, "умеренность": 14, "дьявол": 15,
    "башня": 16, "звезда": 17, "луна": 18, "солнце": 19, "суд": 20, "мир": 21,
}
CARD_HEADER = re.compile(
    r"(?mi)^\s*(Шут|Маг|Верховная\s+Жрица|Императрица|Император|"
    r"Верховный\s+Жрец|Влюбл[её]нные|Колесница|Справедливость|Отшельник|"
    r"Колесо\s+Фортуны|Сила|Повешенный|Смерть|Умеренность|Дьявол|Башня|"
    r"Звезда|Луна|Солнце|Суд|Мир)\s*\([^—–\n-]{1,24}[-—–]"
)


def extract_aspects(source, clean):
    # The book uses 231.96 × 326.4 pt scans. Its running title is above y=24,
    # the footer below y=285. Crop only those margins, never body paragraphs.
    raw_pages = subprocess.check_output([
        "pdftotext", "-layout", "-x", "0", "-y", "24", "-W", "240", "-H", "261",
        str(source), "-",
    ], text=True).split("\f")
    joined = ""
    boundaries = []
    for number, page in enumerate(raw_pages, 1):
        boundaries.append((len(joined), number))
        joined += "\n".join(re.sub(r"[ \t]+", " ", line).strip() for line in page.splitlines()) + "\n"

    def marker(pattern, start):
        match = re.search(pattern, joined[start:], re.I)
        assert match, f"Missing chapter boundary: {pattern}"
        return start + match.start()

    mission_start = boundaries[55][0]
    gift_start = marker(r"Следующая\s+карта\s+внешнего\s+Портрета", mission_start)
    gift_end = marker(r"Теперь\s+давайте\s+перейд[её]м", gift_start)
    self_start = marker(r"Значения\s+карт\s+на\s+13\.\s+позиции\s*:", gift_end)
    social_start = marker(r"Значения\s+карт\s+на\s+14\.\s+позиции\s*:", self_start)
    sections = [
        ("mission", 7, "Миссия и направление", mission_start, gift_start, 22),
        ("gifts", 8, "Ресурсы и дары", gift_start, gift_end, 22),
        ("harmony", 12, "Что помогает обрести равновесие", boundaries[51][0], boundaries[54][0], 12),
        ("self", 13, "Как вы видите себя", self_start, social_start, 22),
        ("social", 14, "Как вас могут воспринимать", social_start, boundaries[95][0], 22),
    ]
    readings = []
    for key, position, title, start, end, expected in sections:
        section = joined[start:end]
        headers = list(CARD_HEADER.finditer(section))
        assert len(headers) == expected, (key, len(headers), [clean(h[1]) for h in headers])
        codes = set()
        for index, heading in enumerate(headers):
            name = clean(heading[1])
            code = CARD_CODES[name.lower().replace("ё", "е")]
            assert code not in codes, (key, code)
            codes.add(code)
            # The book also prints World in the harmony list, despite its even-only
            # rule. Keep the workbook rule; an odd harmony code is never calculated.
            if key == "harmony" and code % 2:
                continue
            raw_start = start + heading.end()
            raw_end = start + (headers[index + 1].start() if index + 1 < len(headers) else len(section))
            fragment = joined[raw_start:raw_end].strip()
            text = clean(fragment)
            if key == "gifts" and code == 11:
                # Exclude claims of predicted physical health and immunity.
                text = text[text.index("Дополнительным даром"):]
            if key == "self" and code == 13:
                # Do not reproduce a death/lifespan suggestion as a personal result.
                text = text.split(", хотя")[0].rstrip(" ,.") + "."
            if key == "self" and code == 11:
                text = text.split(", хотя")[0] + "."
                text = text.replace(
                    "сильный, здоровый, имеет спортивное телосложение, здоровый иммунитет и сильную волю",
                    "сильный и имеет сильную волю",
                )
            text = text.replace(", а депрессии им вообще не известны", "")
            # Select non-medical passages only. These are symbolic readings,
            # not evidence of a healing ability or advice to practice treatment.
            text = " ".join(
                sentence for sentence in re.split(r"(?<=[.!?])\s+(?=[А-ЯЁ])", text)
                if not re.search(r"целител|биоэнер|Р[эе]йки", sentence, re.I)
            )
            assert 90 < len(text) < 6000, (key, code, len(text))
            assert not re.search(r"Бисмарк|Муссолини|Иоанн|Павел I|\d{2}\.\d{2}\.\d{4}", text), (key, code)
            first_page = max(n for offset, n in boundaries if offset <= raw_start)
            last_page = max(n for offset, n in boundaries if offset < raw_start + len(joined[raw_start:raw_end].rstrip()))
            readings.append({
                "id": f"portrait-{key}-{code}", "sourceId": "portrait",
                "title": f"{title} · {name}", "text": text,
                "pdfPages": list(range(first_page, last_page + 1)),
                "scope": "position", "positions": [position], "arcanaCode": code,
            })
    assert len(readings) == 99
    return readings
