from pathlib import Path

from docx import Document
from docx.enum.section import WD_ORIENT
from docx.enum.table import WD_ALIGN_VERTICAL, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK, WD_LINE_SPACING
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor


ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / "Contrato_integracion_frontend_citas_zonas_horarias.docx"

NAVY = "17365D"
PALE_BLUE = "EEF4FA"
LIGHT_GRAY = "D9D9D9"
CODE_BG = "F4F6F8"
BLACK = RGBColor(0, 0, 0)
GRAY = RGBColor(92, 99, 106)


def set_repeat_table_header(row):
    tr_pr = row._tr.get_or_add_trPr()
    tbl_header = OxmlElement("w:tblHeader")
    tbl_header.set(qn("w:val"), "true")
    tr_pr.append(tbl_header)


def set_cell_fill(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)


def set_cell_margins(cell, top=100, start=120, bottom=100, end=120):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    tc_mar = tc_pr.first_child_found_in("w:tcMar")
    if tc_mar is None:
        tc_mar = OxmlElement("w:tcMar")
        tc_pr.append(tc_mar)
    for margin, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = tc_mar.find(qn(f"w:{margin}"))
        if node is None:
            node = OxmlElement(f"w:{margin}")
            tc_mar.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def set_table_borders(table, color=LIGHT_GRAY, size="6"):
    tbl_pr = table._tbl.tblPr
    borders = tbl_pr.find(qn("w:tblBorders"))
    if borders is None:
        borders = OxmlElement("w:tblBorders")
        tbl_pr.append(borders)
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        tag = qn(f"w:{edge}")
        element = borders.find(tag)
        if element is None:
            element = OxmlElement(f"w:{edge}")
            borders.append(element)
        element.set(qn("w:val"), "single")
        element.set(qn("w:sz"), size)
        element.set(qn("w:space"), "0")
        element.set(qn("w:color"), color)


def set_cell_width(cell, width_inches):
    tc_pr = cell._tc.get_or_add_tcPr()
    tc_w = tc_pr.find(qn("w:tcW"))
    if tc_w is None:
        tc_w = OxmlElement("w:tcW")
        tc_pr.append(tc_w)
    tc_w.set(qn("w:w"), str(int(width_inches * 1440)))
    tc_w.set(qn("w:type"), "dxa")


def set_run_font(run, name, size=None, bold=None, color=None):
    run.font.name = name
    run._element.get_or_add_rPr().get_or_add_rFonts().set(qn("w:ascii"), name)
    run._element.get_or_add_rPr().get_or_add_rFonts().set(qn("w:hAnsi"), name)
    if size is not None:
        run.font.size = Pt(size)
    if bold is not None:
        run.bold = bold
    if color is not None:
        run.font.color.rgb = color


def add_body(doc, text, bold_lead=None):
    paragraph = doc.add_paragraph()
    paragraph.paragraph_format.space_after = Pt(6)
    paragraph.paragraph_format.line_spacing = 1.12
    if bold_lead and text.startswith(bold_lead):
        lead = paragraph.add_run(bold_lead)
        set_run_font(lead, "Aptos", 10.5, True, BLACK)
        body = paragraph.add_run(text[len(bold_lead):])
        set_run_font(body, "Aptos", 10.5, False, BLACK)
    else:
        run = paragraph.add_run(text)
        set_run_font(run, "Aptos", 10.5, False, BLACK)
    return paragraph


def add_bullet(doc, text, level=0):
    paragraph = doc.add_paragraph(style="List Bullet" if level == 0 else "List Bullet 2")
    paragraph.paragraph_format.space_after = Pt(3)
    paragraph.paragraph_format.line_spacing = 1.08
    run = paragraph.add_run(text)
    set_run_font(run, "Aptos", 10.2, False, BLACK)
    return paragraph


def add_number(doc, text):
    paragraph = doc.add_paragraph(style="List Number")
    paragraph.paragraph_format.space_after = Pt(4)
    run = paragraph.add_run(text)
    set_run_font(run, "Aptos", 10.2, False, BLACK)
    return paragraph


def add_code(doc, text):
    paragraph = doc.add_paragraph()
    paragraph.paragraph_format.left_indent = Inches(0.18)
    paragraph.paragraph_format.right_indent = Inches(0.18)
    paragraph.paragraph_format.space_before = Pt(4)
    paragraph.paragraph_format.space_after = Pt(8)
    paragraph.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
    p_pr = paragraph._p.get_or_add_pPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), CODE_BG)
    p_pr.append(shd)
    run = paragraph.add_run(text)
    set_run_font(run, "Consolas", 8.4, False, BLACK)
    return paragraph


def add_table(doc, headers, rows, widths, font_size=8.8):
    table = doc.add_table(rows=1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    set_table_borders(table)
    header = table.rows[0]
    set_repeat_table_header(header)
    for index, (cell, label) in enumerate(zip(header.cells, headers)):
        set_cell_width(cell, widths[index])
        set_cell_fill(cell, NAVY)
        set_cell_margins(cell, 110, 120, 110, 120)
        cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        paragraph = cell.paragraphs[0]
        paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
        paragraph.paragraph_format.space_after = Pt(0)
        run = paragraph.add_run(label)
        set_run_font(run, "Aptos", font_size, True, RGBColor(255, 255, 255))
    for row_index, values in enumerate(rows):
        row = table.add_row()
        for index, (cell, value) in enumerate(zip(row.cells, values)):
            set_cell_width(cell, widths[index])
            set_cell_margins(cell, 105, 120, 105, 120)
            if row_index % 2 == 1:
                set_cell_fill(cell, PALE_BLUE)
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            paragraph = cell.paragraphs[0]
            paragraph.paragraph_format.space_after = Pt(0)
            paragraph.paragraph_format.line_spacing = 1.05
            run = paragraph.add_run(str(value))
            set_run_font(run, "Aptos", font_size, False, BLACK)
    doc.add_paragraph().paragraph_format.space_after = Pt(1)
    return table


def add_heading(doc, text, level=1):
    paragraph = doc.add_heading(text, level=level)
    paragraph.paragraph_format.keep_with_next = True
    return paragraph


def add_page_number(paragraph):
    run = paragraph.add_run()
    begin = OxmlElement("w:fldChar")
    begin.set(qn("w:fldCharType"), "begin")
    instruction = OxmlElement("w:instrText")
    instruction.set(qn("xml:space"), "preserve")
    instruction.text = " PAGE "
    separate = OxmlElement("w:fldChar")
    separate.set(qn("w:fldCharType"), "separate")
    text = OxmlElement("w:t")
    text.text = "1"
    end = OxmlElement("w:fldChar")
    end.set(qn("w:fldCharType"), "end")
    run._r.extend([begin, instruction, separate, text, end])


doc = Document()
section = doc.sections[0]
section.page_width = Inches(8.5)
section.page_height = Inches(11)
section.orientation = WD_ORIENT.PORTRAIT
section.top_margin = Inches(0.7)
section.bottom_margin = Inches(0.65)
section.left_margin = Inches(0.72)
section.right_margin = Inches(0.72)

styles = doc.styles
normal = styles["Normal"]
normal.font.name = "Aptos"
normal._element.rPr.rFonts.set(qn("w:ascii"), "Aptos")
normal._element.rPr.rFonts.set(qn("w:hAnsi"), "Aptos")
normal.font.size = Pt(10.5)
normal.font.color.rgb = BLACK

title_style = styles["Title"]
title_style.font.name = "Aptos Display"
title_style._element.rPr.rFonts.set(qn("w:ascii"), "Aptos Display")
title_style._element.rPr.rFonts.set(qn("w:hAnsi"), "Aptos Display")
title_style.font.size = Pt(25)
title_style.font.bold = True
title_style.font.color.rgb = BLACK

for name, size, before, after in (("Heading 1", 15, 16, 6), ("Heading 2", 12, 10, 4)):
    style = styles[name]
    style.font.name = "Aptos Display"
    style._element.rPr.rFonts.set(qn("w:ascii"), "Aptos Display")
    style._element.rPr.rFonts.set(qn("w:hAnsi"), "Aptos Display")
    style.font.size = Pt(size)
    style.font.bold = True
    style.font.color.rgb = BLACK
    style.paragraph_format.space_before = Pt(before)
    style.paragraph_format.space_after = Pt(after)
    style.paragraph_format.keep_with_next = True

footer = section.footer
footer_p = footer.paragraphs[0]
footer_p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
footer_run = footer_p.add_run("Contrato API de citas  |  v1.0  |  Página ")
set_run_font(footer_run, "Aptos", 8, False, GRAY)
add_page_number(footer_p)

title = doc.add_paragraph(style="Title")
title.alignment = WD_ALIGN_PARAGRAPH.LEFT
title.paragraph_format.space_after = Pt(4)
title.add_run("Contrato de integración frontend para citas y zonas horarias")

subtitle = doc.add_paragraph()
subtitle.paragraph_format.space_after = Pt(14)
run = subtitle.add_run("Scheduling API")
set_run_font(run, "Aptos Display", 14, False, BLACK)

add_table(
    doc,
    ["Dato", "Valor"],
    [
        ["Versión", "1.0"],
        ["Fecha", "14 de septiembre de 2026"],
        ["Emisor", "Equipo backend"],
        ["Destinatario", "Equipo frontend"],
        ["Alcance", "Citas, zonas horarias, disponibilidad y visibilidad de servicios"],
    ],
    [1.45, 5.45],
    9.2,
)

add_body(
    doc,
    "Este contrato define cómo debe integrar el frontend las citas cuando cada empresa opera en una zona horaria IANA. La empresa es la fuente de verdad para la zona horaria. El frontend envía la fecha y la hora que el usuario eligió en esa zona; el backend las convierte a UTC, guarda el instante y devuelve ambas representaciones.",
)
add_body(
    doc,
    "Regla principal. Para crear una cita nueva, el frontend debe enviar scheduledLocalDate, scheduledLocalTime y timeZone juntos. Para mostrar una cita, debe priorizar scheduledLocalDate y scheduledLocalTime. scheduledAt identifica el instante UTC y se usa para sincronización, ordenamiento absoluto o integraciones externas.",
    "Regla principal.",
)

add_heading(doc, "Resumen de endpoints", 1)
add_table(
    doc,
    ["Método", "Ruta", "Acceso", "Uso"],
    [
        ["GET", "/api/company/me", "ADMIN", "Consultar la zona horaria de la empresa"],
        ["POST", "/api/appointments", "ADMIN", "Crear una cita administrativa"],
        ["POST", "/api/appointments/public", "Público", "Crear una cita desde el sitio del cliente"],
        ["GET", "/api/appointments/public/availability", "Público", "Consultar horarios en la zona de la empresa"],
        ["GET", "/api/appointments", "ADMIN", "Listar citas con UTC y campos locales"],
        ["GET", "/api/appointments/my", "EMPLOYEE", "Listar las citas del empleado"],
        ["GET", "/api/services", "ADMIN", "Listar servicios activos e inactivos"],
        ["GET", "/api/services/public", "Público", "Listar solo servicios activos"],
    ],
    [0.62, 2.55, 0.9, 2.83],
    8.2,
)

add_heading(doc, "Convenciones generales", 1)
add_heading(doc, "Identificación de empresa", 2)
add_body(doc, "Las rutas se muestran con el prefijo /api. Cada solicitud que dependa de una empresa debe identificar el tenant mediante uno de estos mecanismos:")
add_bullet(doc, "Header x-tenant con el frontendDomain de la empresa")
add_bullet(doc, "Header x-tenant-id con el UUID de la empresa")
add_bullet(doc, "Header x-tenant-domain con el frontendDomain de la empresa")
add_bullet(doc, "Ruta /api/{tenant}/... o /{tenant}/api/...")
add_body(doc, "Los endpoints privados también requieren Authorization: Bearer <token>.")

add_heading(doc, "Envoltorio de respuesta", 2)
add_body(doc, "Todas las respuestas exitosas se entregan dentro de data.")
add_code(doc, '''{
  "ok": true,
  "message": "OK",
  "data": { },
  "errors": null,
  "meta": {
    "path": "/api/appointments",
    "method": "POST",
    "timestamp": "2026-09-14T20:00:00.000Z",
    "statusCode": 201
  }
}''')
add_body(doc, "Los errores usan el mismo envoltorio con ok en false, data en null y un arreglo errors.")
add_code(doc, '''{
  "ok": false,
  "message": "timeZone debe coincidir con la zona horaria de la empresa",
  "data": null,
  "errors": [
    { "message": "timeZone debe coincidir con la zona horaria de la empresa" }
  ],
  "meta": { "statusCode": 400 }
}''')

add_heading(doc, "Zona horaria de la empresa", 1)
add_body(doc, "Cada empresa tiene un timeZone obligatorio en formato IANA. Ejemplos válidos: America/Bogota, Europe/Madrid y America/New_York. No se deben enviar abreviaturas como COT, EST o CET.")

add_heading(doc, "Consulta para administradores", 2)
add_code(doc, "GET /api/company/me")
add_code(doc, '''{
  "ok": true,
  "message": "OK",
  "data": {
    "id": "11111111-1111-4111-8111-111111111111",
    "name": "Empresa ejemplo",
    "frontendDomain": "empresa-ejemplo",
    "timeZone": "America/Bogota",
    "status": "ACTIVE"
  },
  "errors": null,
  "meta": { "statusCode": 200 }
}''')

add_heading(doc, "Creación y actualización de empresas", 2)
add_table(
    doc,
    ["Operación", "Campo timeZone", "Regla"],
    [
        ["POST /api/company", "Obligatorio", "Debe ser una zona IANA válida"],
        ["PUT /api/company/{id}", "Opcional", "Si se envía, debe ser una zona IANA válida"],
    ],
    [2.2, 1.25, 3.45],
    8.8,
)
add_body(doc, "El frontend administrativo debe refrescar la empresa después de un cambio de timeZone. Las respuestas de citas derivan los campos locales desde la zona configurada actualmente para la empresa.")

add_heading(doc, "Creación administrativa de citas", 1)
add_code(doc, "POST /api/appointments")
add_table(
    doc,
    ["Campo", "Tipo", "Requerido", "Regla"],
    [
        ["clientId", "UUID", "Sí", "Cliente activo de la empresa"],
        ["serviceId", "UUID", "Sí", "Servicio activo de la empresa"],
        ["employeeId", "UUID", "No", "Empleado activo habilitado para el servicio"],
        ["scheduledLocalDate", "string", "Sí en formato local", "YYYY-MM-DD"],
        ["scheduledLocalTime", "string", "Sí en formato local", "HH:mm en formato de 24 horas"],
        ["timeZone", "string", "Sí en formato local", "Debe coincidir con la empresa"],
        ["scheduledAt", "ISO 8601", "Solo legado", "Debe incluir Z u offset explícito"],
        ["durationMinutes", "integer", "No", "Mínimo 1; por defecto usa la duración del servicio"],
        ["notes", "string", "No", "Máximo 500 caracteres"],
    ],
    [1.47, 1.0, 1.28, 3.15],
    8.15,
)
add_body(doc, "Solicitud recomendada para una cita a las 10:00 en Bogotá:")
add_code(doc, '''{
  "clientId": "44444444-4444-4444-8444-444444444444",
  "serviceId": "33333333-3333-4333-8333-333333333333",
  "employeeId": "22222222-2222-4222-8222-222222222222",
  "scheduledLocalDate": "2026-09-21",
  "scheduledLocalTime": "10:00",
  "timeZone": "America/Bogota",
  "notes": "Primera visita"
}''')

add_heading(doc, "Creación pública de citas", 1)
add_code(doc, "POST /api/appointments/public")
add_body(doc, "La parte horaria sigue exactamente las mismas reglas. El endpoint público agrega los datos del cliente.")
add_code(doc, '''{
  "clientName": "Ana Torres",
  "clientEmail": "ana@example.com",
  "clientPhone": "3001234567",
  "serviceId": "33333333-3333-4333-8333-333333333333",
  "employeeId": "22222222-2222-4222-8222-222222222222",
  "scheduledLocalDate": "2026-09-21",
  "scheduledLocalTime": "10:00",
  "timeZone": "America/Bogota"
}''')
add_body(doc, "clientPhone debe ser una cadena numérica de máximo 20 caracteres. documentType, documentNumber, address, birthDate, durationMinutes y notes son opcionales.")

add_heading(doc, "Respuesta de una cita", 1)
add_body(doc, "La respuesta es igual para creación, consulta individual y listados. En Bogotá, 2026-09-21 a las 10:00 corresponde a 2026-09-21T15:00:00.000Z.")
add_code(doc, '''{
  "ok": true,
  "message": "OK",
  "data": {
    "id": "55555555-5555-4555-8555-555555555555",
    "scheduledAt": "2026-09-21T15:00:00.000Z",
    "scheduledLocalDate": "2026-09-21",
    "scheduledLocalTime": "10:00",
    "timeZone": "America/Bogota",
    "durationMinutes": 60,
    "notes": "Primera visita",
    "status": "PENDING",
    "servicePrice": 90000,
    "commissionRate": 10,
    "serviceId": "33333333-3333-4333-8333-333333333333",
    "clientId": "44444444-4444-4444-8444-444444444444",
    "clientName": "Ana Torres",
    "clientPhone": "3001234567",
    "employeeId": "22222222-2222-4222-8222-222222222222"
  },
  "errors": null,
  "meta": { "statusCode": 201 }
}''')

add_heading(doc, "Reglas de representación en frontend", 2)
add_bullet(doc, "Mostrar scheduledLocalDate y scheduledLocalTime como valores principales de la cita.")
add_bullet(doc, "Mostrar o conservar timeZone cuando el usuario necesite contexto geográfico.")
add_bullet(doc, "Usar scheduledAt para comparar instantes, integrar calendarios o enviar datos a sistemas externos.")
add_bullet(doc, "No construir el UTC con new Date(scheduledLocalDate + 'T' + scheduledLocalTime), porque esa operación usa la zona del navegador.")
add_bullet(doc, "No recalcular los campos locales si el backend ya los devolvió.")

add_heading(doc, "Disponibilidad por zona horaria", 1)
add_code(doc, "GET /api/appointments/public/availability?employeeId={uuid}&serviceId={uuid}&date=2026-09-21")
add_table(
    doc,
    ["Parámetro", "Tipo", "Regla"],
    [
        ["employeeId", "UUID", "Empleado que atenderá la cita"],
        ["serviceId", "UUID", "Servicio activo que determina la duración"],
        ["date", "string", "Fecha local YYYY-MM-DD en la zona de la empresa"],
    ],
    [1.35, 1.0, 4.55],
    8.8,
)
add_body(doc, "El frontend no envía la zona horaria en esta consulta. El backend toma timeZone de la empresa, convierte los límites del día local a UTC y busca las citas que bloquean ese periodo. Los horarios laborales del empleado también se interpretan en la zona de la empresa.")
add_code(doc, '''{
  "ok": true,
  "message": "OK",
  "data": {
    "date": "2026-09-21",
    "timeZone": "America/Bogota",
    "employeeId": "22222222-2222-4222-8222-222222222222",
    "serviceId": "33333333-3333-4333-8333-333333333333",
    "durationMinutes": 60,
    "availableSlots": ["08:00", "08:30", "10:30"],
    "slots": [
      { "time": "08:00", "available": true },
      { "time": "09:30", "available": false },
      { "time": "10:30", "available": true }
    ]
  },
  "errors": null,
  "meta": { "statusCode": 200 }
}''')
add_body(doc, "availableSlots contiene únicamente horas reservables. slots permite mostrar una cuadrícula completa con estados habilitado y deshabilitado. Una cita cancelada no bloquea disponibilidad; una cita pendiente, en progreso o completada sí la bloquea.")

add_heading(doc, "Horario de verano", 2)
add_body(doc, "El backend aplica las reglas de horario de verano de la zona IANA. Una hora local inexistente durante el adelanto del reloj se rechaza. Una hora repetida durante el atraso también se rechaza porque la solicitud local no incluye un offset para distinguir sus dos instantes. La disponibilidad no ofrece esas horas como reservables.")

add_heading(doc, "Errores de agenda que debe manejar el frontend", 2)
add_table(
    doc,
    ["HTTP", "Mensaje o condición", "Acción recomendada"],
    [
        ["400", "Los tres campos locales no fueron enviados juntos", "Corregir el payload"],
        ["400", "timeZone no coincide con la empresa", "Refrescar la configuración de empresa"],
        ["400", "Zona IANA inválida", "No enviar abreviaturas ni zonas manuales"],
        ["400", "Fecha u hora inexistente o ambigua", "Solicitar otro horario"],
        ["400", "El empleado no trabaja en ese horario", "Recargar disponibilidad"],
        ["400", "El empleado ya tiene una cita", "Recargar disponibilidad y elegir otro slot"],
        ["400", "Servicio, empleado o cliente no encontrado", "Refrescar los catálogos asociados"],
    ],
    [0.55, 3.0, 3.35],
    8.15,
)

add_heading(doc, "Flujo recomendado para frontend", 1)
add_number(doc, "Obtener el timeZone de la empresa. En el panel administrativo se usa GET /api/company/me. En el flujo público se puede conservar el timeZone recibido por disponibilidad.")
add_number(doc, "Enviar la fecha seleccionada como scheduledLocalDate sin convertirla a UTC.")
add_number(doc, "Enviar la hora seleccionada como scheduledLocalTime en formato HH:mm.")
add_number(doc, "Enviar exactamente el timeZone de la empresa.")
add_number(doc, "Después de crear, reemplazar los datos optimistas con la respuesta del backend.")
add_number(doc, "Si la creación devuelve un conflicto, volver a consultar disponibilidad antes de mostrar opciones nuevas.")

add_heading(doc, "Tipos TypeScript de referencia", 1)
add_code(doc, '''type AppointmentStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

interface LocalAppointmentFields {
  scheduledLocalDate: string; // YYYY-MM-DD
  scheduledLocalTime: string; // HH:mm
  timeZone: string;           // IANA
}

interface CreateAppointmentRequest extends LocalAppointmentFields {
  clientId: string;
  serviceId: string;
  employeeId?: string;
  durationMinutes?: number;
  notes?: string;
}

interface AppointmentResponse extends LocalAppointmentFields {
  id: string;
  scheduledAt: string;        // ISO 8601 UTC
  durationMinutes?: number;
  notes?: string;
  status: AppointmentStatus;
  servicePrice: number;
  commissionRate: number;
  completedAt?: string;
  serviceId: string;
  clientId: string;
  clientName?: string;
  clientPhone?: string;
  employeeId?: string;
}

interface ApiResponse<T> {
  ok: boolean;
  message: string;
  data: T | null;
  errors: Array<{ message: string; code?: string }> | null;
  meta: {
    path: string;
    method: string;
    timestamp: string;
    statusCode: number;
  };
}''')

add_heading(doc, "Compatibilidad con scheduledAt", 1)
add_body(doc, "El backend conserva una entrada heredada basada únicamente en scheduledAt. Este valor debe incluir Z o un offset explícito, por ejemplo 2026-09-21T15:00:00.000Z. El backend deriva la fecha local usando el timeZone de la empresa.")
add_body(doc, "Si el frontend envía scheduledAt junto con los tres campos locales, ambos deben representar exactamente el mismo instante. Si no coinciden, la API responde 400. Para desarrollo nuevo, el formato local es el contrato recomendado.")

add_heading(doc, "Visibilidad de servicios", 1)
add_table(
    doc,
    ["Endpoint", "Contenido", "Uso frontend"],
    [
        ["GET /api/services", "Servicios ACTIVE e INACTIVE", "Panel administrativo y acciones de reactivación"],
        ["GET /api/services/public", "Solo servicios ACTIVE", "Catálogo público y creación de citas"],
    ],
    [2.15, 2.0, 2.75],
    8.7,
)
add_body(doc, "El campo status de cada servicio contiene ACTIVE o INACTIVE. El frontend administrativo no debe filtrar los inactivos si necesita permitir su reactivación. El sitio público no debe usar el endpoint administrativo.")

add_heading(doc, "Lista de verificación de integración", 1)
for item in (
    "El frontend usa el timeZone de la empresa y no la zona del navegador.",
    "Los tres campos locales se envían juntos al crear una cita.",
    "Las pantallas muestran los campos locales devueltos por la API.",
    "La disponibilidad se vuelve a consultar después de un conflicto.",
    "El catálogo administrativo acepta ACTIVE e INACTIVE.",
    "El catálogo público consume únicamente /api/services/public.",
    "Los errores 400 se presentan al usuario con una acción concreta.",
):
    add_bullet(doc, item)

doc.core_properties.title = "Contrato de integración frontend para citas y zonas horarias"
doc.core_properties.subject = "Contrato técnico de integración de Scheduling API"
doc.core_properties.keywords = "API, frontend, citas, zona horaria, IANA, UTC, disponibilidad"

ROOT.mkdir(parents=True, exist_ok=True)
doc.save(OUTPUT)
print(OUTPUT)
