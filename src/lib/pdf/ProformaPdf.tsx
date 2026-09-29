import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer"
import { COMPANY, PROFORMA_VALIDITY_DAYS } from "./company"
import { amountToWords } from "./amount-in-words"
import { IVA_RATE } from "@/lib/proforma-totals"

export interface ProformaPdfItem {
  name: string
  unit: string
  quantity: number
  unitPrice: number | null
  total: number
}

export interface ProformaPdfData {
  number: string
  createdAt: Date
  client: { name: string; document: string; phone: string }
  // Deja los datos del cliente como líneas ____ para llenarlos a mano.
  blankClient: boolean
  sellerName: string
  branchName: string
  // Columnas opcionales de la tabla: por defecto van ocultas y solo la
  // sección de totales de abajo se muestra siempre.
  showUnitPrice: boolean
  showItemTotal: boolean
  items: ProformaPdfItem[]
  adjustment: { label: string; amount: number } | null
  subtotal: number
  iva: number
  total: number
}

const BORDER = "#333333"
const GRAY = "#555555"
const BLANK = "________________________"
// Alto mínimo del cuerpo de la tabla para que las líneas verticales lleguen
// hasta el bloque de totales aunque haya pocos items.
const MIN_BODY_HEIGHT = 250
const ROW_HEIGHT = 20
const TOTALS_WIDTH = 205

const styles = StyleSheet.create({
  page: { paddingTop: 30, paddingBottom: 30, paddingHorizontal: 36, fontFamily: "Helvetica", fontSize: 9, color: "#000000" },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  logo: { width: 100, height: 64, objectFit: "contain" },
  company: { flex: 1, marginLeft: 12 },
  companyName: { fontFamily: "Helvetica-Bold", fontSize: 15, marginBottom: 2 },
  companyLine: { fontSize: 8.5, color: GRAY, marginTop: 1.5 },
  docBox: { width: 125, borderWidth: 1.2, borderColor: BORDER, borderRadius: 6, paddingVertical: 8, alignItems: "center" },
  docTitle: { fontFamily: "Helvetica-Bold", fontSize: 14, textDecoration: "underline" },
  docNumber: { fontFamily: "Helvetica-Bold", fontSize: 10.5, marginTop: 5 },
  box: { borderWidth: 0.8, borderColor: BORDER, borderRadius: 6, paddingVertical: 6, paddingHorizontal: 10, marginBottom: 6 },
  boxRow: { flexDirection: "row", marginTop: 3 },
  label: { color: GRAY, marginRight: 4 },
  clientName: { fontFamily: "Helvetica-Bold", fontSize: 11, marginTop: 2 },
  intro: { marginTop: 6, marginBottom: 8 },
  bold: { fontFamily: "Helvetica-Bold" },
  table: { borderWidth: 0.8, borderColor: BORDER, borderRadius: 6 },
  tableHead: { flexDirection: "row", borderBottomWidth: 0.8, borderBottomColor: BORDER, backgroundColor: "#EFEFEF", borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  th: { fontFamily: "Helvetica-Bold", paddingVertical: 6, paddingHorizontal: 5, textAlign: "center" },
  row: { flexDirection: "row", minHeight: ROW_HEIGHT },
  cell: { paddingVertical: 4, paddingHorizontal: 5 },
  colName: { flex: 1, borderRightWidth: 0.8, borderRightColor: BORDER },
  colQty: { width: 60, textAlign: "center" },
  colQtyMid: { width: 60, textAlign: "center", borderRightWidth: 0.8, borderRightColor: BORDER },
  colUnit: { width: 75, textAlign: "right" },
  colUnitMid: { width: 75, textAlign: "right", borderRightWidth: 0.8, borderRightColor: BORDER },
  colTotal: { width: 75, textAlign: "right" },
  bottom: { flexDirection: "row", borderTopWidth: 0.8, borderTopColor: BORDER },
  bottomLeft: { flex: 1, borderRightWidth: 0.8, borderRightColor: BORDER, paddingHorizontal: 10, paddingTop: 8, paddingBottom: 8 },
  words: { fontSize: 8.5, marginTop: 3, marginBottom: 8 },
  dashed: { borderBottomWidth: 0.8, borderBottomColor: BORDER, borderBottomStyle: "dashed", marginBottom: 6 },
  signLine: { width: 160, borderTopWidth: 0.8, borderTopColor: BORDER, marginTop: 34, paddingTop: 3 },
  bottomRight: { width: TOTALS_WIDTH, paddingVertical: 8, paddingHorizontal: 10 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  grandRow: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 0.8, borderTopColor: BORDER, paddingTop: 7, marginTop: 2 },
  grandText: { fontFamily: "Helvetica-Bold", fontSize: 12 },
  legalTitle: { fontFamily: "Helvetica-Bold", fontSize: 9, marginTop: 10, marginBottom: 2 },
  note: { fontSize: 8, color: GRAY, lineHeight: 1.4 },
})

const fmtMoney = (n: number) => n.toFixed(2)
const fmtDate = (d: Date) => d.toLocaleDateString("es-EC", { day: "2-digit", month: "2-digit", year: "numeric" })

function ProformaPdf({ data, logo }: { data: ProformaPdfData; logo: Buffer | null }) {
  const validUntil = new Date(data.createdAt)
  validUntil.setDate(validUntil.getDate() + PROFORMA_VALIDITY_DAYS)
  const { client, blankClient } = data
  const ivaPercent = Math.round(IVA_RATE * 100)
  const itemsSubtotal = data.subtotal - (data.adjustment?.amount ?? 0)
  const fillerHeight = Math.max(0, MIN_BODY_HEIGHT - data.items.length * ROW_HEIGHT)
  const colCount = 2 + (data.showUnitPrice ? 1 : 0) + (data.showItemTotal ? 1 : 0)

  return (
    <Document title={`Proforma ${data.number}`} author={COMPANY.name}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {logo ? (
            // eslint-disable-next-line jsx-a11y/alt-text -- Image de react-pdf no tiene prop alt
            <Image src={logo} style={styles.logo} />
          ) : null}
          <View style={styles.company}>
            <Text style={styles.companyName}>{COMPANY.name.toUpperCase()}</Text>
            <Text style={styles.companyLine}>
              RUC: {COMPANY.ruc} · Web: {COMPANY.web}
            </Text>
            <Text style={styles.companyLine}>
              Tel: {COMPANY.phone} · E-mail: {COMPANY.email}
            </Text>
            <Text style={styles.companyLine}>{COMPANY.address}</Text>
          </View>
          <View style={styles.docBox}>
            <Text style={styles.docTitle}>PROFORMA</Text>
            <Text style={styles.docNumber}>No.: {data.number}</Text>
          </View>
        </View>

        <View style={styles.box}>
          <View style={styles.boxRow}>
            <Text style={styles.label}>Señor (es):</Text>
          </View>
          <Text style={styles.clientName}>{blankClient ? BLANK : client.name || "CONSUMIDOR FINAL"}</Text>
          <View style={[styles.boxRow, { marginTop: 5 }]}>
            <View style={{ flexDirection: "row", width: 260 }}>
              <Text style={styles.label}>Ruc/CI:</Text>
              <Text>{blankClient ? BLANK : client.document || "9999999999999"}</Text>
            </View>
            <View style={{ flexDirection: "row" }}>
              <Text style={styles.label}>Telf.:</Text>
              <Text>{blankClient ? BLANK : client.phone}</Text>
            </View>
          </View>
        </View>

        <View style={styles.box}>
          <View style={[styles.boxRow, { marginTop: 0 }]}>
            <View style={{ flexDirection: "row", width: 190 }}>
              <Text style={styles.label}>Fecha:</Text>
              <Text>{fmtDate(data.createdAt)}</Text>
            </View>
            <View style={{ flexDirection: "row", width: 200 }}>
              <Text style={styles.label}>Validez:</Text>
              <Text>
                {PROFORMA_VALIDITY_DAYS} días (hasta {fmtDate(validUntil)})
              </Text>
            </View>
          </View>
          <View style={styles.boxRow}>
            <View style={{ flexDirection: "row", width: 190 }}>
              <Text style={styles.label}>Local:</Text>
              <Text>{data.branchName}</Text>
            </View>
            <View style={{ flexDirection: "row" }}>
              <Text style={styles.label}>Vendedor:</Text>
              <Text>{data.sellerName}</Text>
            </View>
          </View>
        </View>

        <View style={styles.intro}>
          <Text style={styles.bold}>De mi consideración:</Text>
          <Text style={styles.bold}>
            Reciba un cordial saludo de {COMPANY.name}. Al mismo tiempo pongo a su consideración la siguiente proforma:
          </Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHead}>
            <Text style={[styles.th, styles.colName]}>Descripción</Text>
            <Text style={[styles.th, colCount === 1 ? styles.colQty : styles.colQtyMid]}>Unidades</Text>
            {data.showUnitPrice && <Text style={[styles.th, (data.showItemTotal ? styles.colUnitMid : styles.colUnit)]}>V. Unitario</Text>}
            {data.showItemTotal && <Text style={[styles.th, styles.colTotal]}>Total</Text>}
          </View>
          {data.items.map((item, i) => (
            <View key={i} style={styles.row} wrap={false}>
              <Text style={[styles.cell, styles.colName]}>{item.name}</Text>
              <Text style={[styles.cell, colCount === 1 ? styles.colQty : styles.colQtyMid]}>
                {item.quantity} {item.unit}
              </Text>
              {data.showUnitPrice && (
                <Text style={[styles.cell, (data.showItemTotal ? styles.colUnitMid : styles.colUnit)]}>{item.unitPrice != null ? fmtMoney(item.unitPrice) : "—"}</Text>
              )}
              {data.showItemTotal && <Text style={[styles.cell, styles.colTotal]}>{fmtMoney(item.total)}</Text>}
            </View>
          ))}
          <View style={[styles.row, { height: fillerHeight, minHeight: 0 }]}>
            <View style={styles.colName} />
            <View style={colCount === 1 ? styles.colQty : styles.colQtyMid} />
            {data.showUnitPrice && <View style={data.showItemTotal ? styles.colUnitMid : styles.colUnit} />}
            {data.showItemTotal && <View style={styles.colTotal} />}
          </View>

          <View style={styles.bottom} wrap={false}>
            <View style={styles.bottomLeft}>
              <Text style={styles.bold}>La cantidad de:</Text>
              <Text style={styles.words}>{amountToWords(data.total)}</Text>
              <View style={styles.dashed} />
              <Text style={styles.bold}>Atentamente,</Text>
              <View style={styles.signLine}>
                <Text style={styles.bold}>{COMPANY.name}</Text>
                <Text style={{ color: GRAY }}>RUC: {COMPANY.ruc}</Text>
              </View>
            </View>
            <View style={styles.bottomRight}>
              {data.adjustment && (
                <>
                  <View style={styles.totalRow}>
                    <Text style={styles.label}>Subtotal:</Text>
                    <Text>{fmtMoney(itemsSubtotal)}</Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.label}>{data.adjustment.label}:</Text>
                    <Text>
                      {data.adjustment.amount < 0 ? "-" : ""}
                      {fmtMoney(Math.abs(data.adjustment.amount))}
                    </Text>
                  </View>
                </>
              )}
              <View style={styles.totalRow}>
                <Text style={styles.label}>Subtotal (sin IVA):</Text>
                <Text>{fmtMoney(data.subtotal)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.label}>I.V.A. {ivaPercent}%:</Text>
                <Text>{fmtMoney(data.iva)}</Text>
              </View>
              <View style={styles.grandRow}>
                <Text style={styles.grandText}>VALOR TOTAL:</Text>
                <Text style={styles.grandText}>{fmtMoney(data.total)}</Text>
              </View>
            </View>
          </View>
        </View>

        <View wrap={false}>
          <Text style={styles.legalTitle}>IMPORTANTE LEGAL:</Text>
          <Text style={styles.note}>
            Esta proforma NO tiene validez tributaria ante el SRI. Es una cotización comercial. Para formalizar la
            compra se requiere factura electrónica autorizada por el Servicio de Rentas Internas de Ecuador.
            {"\n"}* IVA del {ivaPercent}% según regulación tributaria Ecuador 2026. Aplica a todos los productos y servicios.
          </Text>
        </View>
      </Page>
    </Document>
  )
}

// El logo se descarga una sola vez y se guarda en memoria. Si falla, la
// proforma se genera igual, solo con el nombre de la empresa en texto.
let logoCache: Buffer | null = null

async function loadLogo(): Promise<Buffer | null> {
  if (logoCache) return logoCache
  try {
    const res = await fetch(COMPANY.logoUrl, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return null
    logoCache = Buffer.from(await res.arrayBuffer())
    return logoCache
  } catch {
    return null
  }
}

export async function renderProformaPdf(data: ProformaPdfData): Promise<Buffer> {
  const logo = await loadLogo()
  return renderToBuffer(<ProformaPdf data={data} logo={logo} />)
}
