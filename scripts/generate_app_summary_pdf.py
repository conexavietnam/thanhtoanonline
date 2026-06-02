from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_PATH = ROOT / "output" / "pdf" / "discwake-app-summary.pdf"


PAGE_WIDTH, PAGE_HEIGHT = A4
MARGIN = 34
GUTTER = 18
HEADER_HEIGHT = 62
HEADER_GAP = 14

BODY_FONT = "Helvetica"
BOLD_FONT = "Helvetica-Bold"
TEXT_COLOR = colors.HexColor("#10202f")
MUTED_COLOR = colors.HexColor("#56667a")
ACCENT_COLOR = colors.HexColor("#127a88")
HEADER_BG = colors.HexColor("#102b3f")
RULE_COLOR = colors.HexColor("#d7e0e8")


LEFT_COLUMN = [
    {
        "title": "What It Is",
        "paragraphs": [
            "A React + Spring Boot web app for DISC personality testing, paid plans, and role-based partner/admin operations.",
            "The repo defaults the public site name to DISCWAKE in config; the README title is DISCWAKE.",
        ],
        "bullets": [],
    },
    {
        "title": "Who It's For",
        "paragraphs": [
            "Primary persona: Not found in repo as one explicit role. Implemented flows center on DISC test takers.",
            "Landing content also targets students, parents, teachers, businesses, and separate partner/admin users.",
        ],
        "bullets": [],
    },
    {
        "title": "What It Does",
        "paragraphs": [],
        "bullets": [
            "Public landing, pricing, contact, and consultation request pages.",
            "DISC question flow with result submission, latest result, and test history.",
            "Register/login, Google sign-in, email verification, password reset, and JWT refresh.",
            "User and partner plan checkout, payment callback handling, and VNPay return flow.",
            "User dashboard for profile, orders, subscriptions, and DISC results.",
            "Partner tools for sessions, autosave/submit, referral links, quotas, and PDF/CSV exports.",
            "Admin tools for users, plans, catalog questions import/export, careers, insights, finance, referrals, audit logs, and settings.",
        ],
    },
]

RIGHT_COLUMN = [
    {
        "title": "How It Works",
        "paragraphs": [],
        "bullets": [
            "Frontend: discfe/ uses React 19, Vite, React Router, Tailwind, and DaisyUI; Axios sends /api requests through the Vite proxy in local dev.",
            "Backend: backend/ is Spring Boot 3.2 with controllers under /api/auth, /api/disc, /api/public, /api/partner, and /api/admin.",
            "Services handle auth, billing, testing, referrals, settings, and PDF export; Spring Security uses a JWT filter plus method-level role checks.",
            "JPA repositories persist models such as AppUser, TestSession, Result, Order, Referral, PdfExport, AppSettings, and AuditLog in PostgreSQL.",
            "Flyway migrations bootstrap schema changes, and Docker Compose wires Postgres 16, backend :8083, and frontend :5174.",
            "Optional integrations are exposed via config for SMTP email, Google OAuth, Telegram notifications, and site settings.",
        ],
    },
    {
        "title": "How To Run",
        "paragraphs": [],
        "bullets": [
            "Fastest path: from repo root, run docker compose up --build.",
            "Open the app at http://localhost:5174; the backend API listens on http://localhost:8083.",
            "Local dev alternative: cd backend && mvn spring-boot:run, then cd discfe && npm install && npm run dev.",
        ],
    },
]

FOOTER_TEXT = (
    "Evidence used: README.md, docker-compose.yml, discfe/package.json, discfe/vite.config.js, "
    "discfe/src/routes/routes.jsx, discfe/src/lib/api.js, public pages, Spring controllers/services, "
    "application.yml, models/repositories, and Flyway migrations."
)


def wrap_text(text: str, font_name: str, font_size: float, max_width: float) -> list[str]:
    if not text:
        return [""]

    lines: list[str] = []
    for raw_line in text.splitlines():
        words = raw_line.split()
        if not words:
            lines.append("")
            continue

        current = words[0]
        for word in words[1:]:
            trial = f"{current} {word}"
            if stringWidth(trial, font_name, font_size) <= max_width:
                current = trial
            else:
                lines.append(current)
                current = word
        lines.append(current)
    return lines


def measure_section(section: dict, width: float, body_size: float, title_size: float) -> float:
    leading = body_size + 2.4
    height = title_size + 8

    for paragraph in section["paragraphs"]:
        height += len(wrap_text(paragraph, BODY_FONT, body_size, width)) * leading + 4

    bullet_width = width - 12
    for bullet in section["bullets"]:
        height += len(wrap_text(bullet, BODY_FONT, body_size, bullet_width)) * leading + 3

    return height + 8


def measure_column(sections: list[dict], width: float, body_size: float, title_size: float) -> float:
    return sum(measure_section(section, width, body_size, title_size) for section in sections)


def fit_sizes(column_width: float, footer_width: float, available_height: float) -> tuple[float, float, float]:
    for body_size in [9.4, 9.2, 9.0, 8.8, 8.6, 8.4, 8.2, 8.0, 7.8]:
        title_size = body_size + 2.1
        footer_size = max(6.4, body_size - 2.2)
        footer_leading = footer_size + 1.8
        footer_height = len(wrap_text(FOOTER_TEXT, BODY_FONT, footer_size, footer_width)) * footer_leading
        column_limit = available_height - footer_height - 14
        left_height = measure_column(LEFT_COLUMN, column_width, body_size, title_size)
        right_height = measure_column(RIGHT_COLUMN, column_width, body_size, title_size)
        if max(left_height, right_height) <= column_limit:
            return body_size, title_size, footer_size
    raise RuntimeError("Could not fit content on one page")


def draw_section(
    pdf: canvas.Canvas,
    x: float,
    y: float,
    width: float,
    section: dict,
    body_size: float,
    title_size: float,
) -> float:
    leading = body_size + 2.4

    pdf.setStrokeColor(ACCENT_COLOR)
    pdf.setLineWidth(2)
    pdf.line(x, y - 2, x + 20, y - 2)

    pdf.setFont(BOLD_FONT, title_size)
    pdf.setFillColor(TEXT_COLOR)
    pdf.drawString(x, y - title_size - 1, section["title"])
    y -= title_size + 10

    pdf.setFont(BODY_FONT, body_size)
    pdf.setFillColor(TEXT_COLOR)

    for paragraph in section["paragraphs"]:
        for line in wrap_text(paragraph, BODY_FONT, body_size, width):
            pdf.drawString(x, y - body_size, line)
            y -= leading
        y -= 4

    bullet_indent = 10
    text_x = x + bullet_indent
    for bullet in section["bullets"]:
        lines = wrap_text(bullet, BODY_FONT, body_size, width - bullet_indent)
        for index, line in enumerate(lines):
            if index == 0:
                pdf.setFont(BOLD_FONT, body_size)
                pdf.drawString(x, y - body_size, "-")
                pdf.setFont(BODY_FONT, body_size)
            pdf.drawString(text_x, y - body_size, line)
            y -= leading
        y -= 3

    return y - 5


def draw_column(
    pdf: canvas.Canvas,
    x: float,
    top_y: float,
    width: float,
    sections: list[dict],
    body_size: float,
    title_size: float,
) -> float:
    y = top_y
    for section in sections:
        y = draw_section(pdf, x, y, width, section, body_size, title_size)
    return y


def build_pdf() -> Path:
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    content_width = PAGE_WIDTH - (MARGIN * 2)
    column_width = (content_width - GUTTER) / 2
    footer_width = content_width
    top_y = PAGE_HEIGHT - MARGIN - HEADER_HEIGHT - HEADER_GAP
    available_height = top_y - MARGIN
    body_size, title_size, footer_size = fit_sizes(column_width, footer_width, available_height)

    pdf = canvas.Canvas(str(OUTPUT_PATH), pagesize=A4)
    pdf.setTitle("DISCWAKE app summary")

    pdf.setFillColor(colors.white)
    pdf.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)

    pdf.setFillColor(HEADER_BG)
    pdf.roundRect(MARGIN, PAGE_HEIGHT - MARGIN - HEADER_HEIGHT, content_width, HEADER_HEIGHT, 12, fill=1, stroke=0)

    pdf.setFillColor(colors.white)
    pdf.setFont(BOLD_FONT, 18)
    pdf.drawString(MARGIN + 18, PAGE_HEIGHT - MARGIN - 25, "DISCWAKE App Repo Summary")
    pdf.setFont(BODY_FONT, 9.4)
    pdf.setFillColor(colors.HexColor("#d7ebf1"))
    pdf.drawString(
        MARGIN + 18,
        PAGE_HEIGHT - MARGIN - 42,
        "One-page overview based only on repo evidence",
    )
    pdf.setFont(BOLD_FONT, 8.4)
    pdf.drawRightString(
        PAGE_WIDTH - MARGIN - 18,
        PAGE_HEIGHT - MARGIN - 27,
        "React + Spring Boot + PostgreSQL",
    )

    left_x = MARGIN
    right_x = MARGIN + column_width + GUTTER

    left_bottom = draw_column(pdf, left_x, top_y, column_width, LEFT_COLUMN, body_size, title_size)
    right_bottom = draw_column(pdf, right_x, top_y, column_width, RIGHT_COLUMN, body_size, title_size)

    footer_lines = wrap_text(FOOTER_TEXT, BODY_FONT, footer_size, footer_width)
    footer_leading = footer_size + 1.8
    footer_y = min(left_bottom, right_bottom) - 6
    footer_y = max(footer_y, MARGIN + (len(footer_lines) * footer_leading) + 8)

    pdf.setStrokeColor(RULE_COLOR)
    pdf.setLineWidth(1)
    pdf.line(MARGIN, footer_y, PAGE_WIDTH - MARGIN, footer_y)

    pdf.setFont(BODY_FONT, footer_size)
    pdf.setFillColor(MUTED_COLOR)
    text_y = footer_y - 6
    for line in footer_lines:
        pdf.drawString(MARGIN, text_y - footer_size, line)
        text_y -= footer_leading

    pdf.showPage()
    pdf.save()
    return OUTPUT_PATH


if __name__ == "__main__":
    output = build_pdf()
    print(output)
