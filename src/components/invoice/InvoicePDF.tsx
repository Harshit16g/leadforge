import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// Register a clean sans-serif font (optional)
Font.register({
  family: "Inter",
  src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.ttf",
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.4,
  },
  header: {
    marginBottom: 20,
  },
  businessName: {
    fontSize: 18,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  businessSub: {
    fontSize: 9,
    fontWeight: "bold",
    letterSpacing: 2,
    color: "#555",
    marginTop: 2,
  },
  address: {
    fontSize: 9,
    color: "#444",
    marginTop: 4,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    marginVertical: 12,
  },
  customerBox: {
    marginBottom: 15,
  },
  customerLabel: {
    fontWeight: "bold",
    fontSize: 10,
    marginBottom: 4,
  },
  customerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  invoiceMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    paddingBottom: 6,
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  serviceCol: {
    flex: 3,
  },
  amountCol: {
    flex: 1,
    textAlign: "right",
  },
  serviceName: {
    fontWeight: "bold",
    fontSize: 11,
  },
  serviceDetails: {
    fontSize: 8,
    color: "#555",
    marginTop: 2,
  },
  totalsSection: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#000",
    paddingTop: 10,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  totalLabel: {
    fontWeight: "bold",
  },
  totalAmount: {
    fontWeight: "bold",
  },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#000",
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: "bold",
  },
  grandTotalAmount: {
    fontSize: 14,
    fontWeight: "bold",
  },
  paymentLine: {
    marginTop: 15,
    textAlign: "center",
    fontSize: 9,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  footer: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 8,
    color: "#666",
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    paddingTop: 12,
  },
  brand: {
    fontWeight: "bold",
    fontSize: 10,
    marginTop: 4,
  },
});

interface InvoicePDFProps {
  invoiceId: string;
  date: string;
  customerName: string;
  customerPhone?: string;
  items: Array<{
    service_name: string;
    price: number;
    duration?: number;
    addons?: string[];
  }>;
  subtotal: number;
  gst?: number;
  discount?: number;
  total: number;
  paymentMethod: string;
  businessName?: string;
  businessAddress?: string[];
  businessPhone?: string;
  businessWebsite?: string;
}

export const InvoicePDF: React.FC<InvoicePDFProps> = ({
  invoiceId,
  date,
  customerName,
  customerPhone,
  items,
  subtotal,
  gst = 0,
  discount = 0,
  total,
  paymentMethod,
  businessName = "INVOICE",
  businessAddress = [],
  businessPhone = "",
  businessWebsite = "www.leaex.com",
}) => {
  const formattedDate = new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).toUpperCase();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.businessName}>{businessName}</Text>
          <Text style={styles.businessSub}>PREMIUM SERVICE</Text>
          <Text style={styles.address}>
            {businessAddress.join("\n")}
          </Text>
          <Text style={styles.address}>TEL: {businessPhone}</Text>
        </View>

        <View style={styles.divider} />

        {/* Customer Info */}
        <View style={styles.customerBox}>
          <Text style={styles.customerLabel}>CUSTOMER:</Text>
          <Text style={{ fontWeight: "bold", fontSize: 12 }}>{customerName.toUpperCase()}</Text>
          {customerPhone && (
            <Text style={{ fontSize: 10, marginTop: 2 }}>PHONE: {customerPhone}</Text>
          )}
        </View>

        {/* Invoice Meta */}
        <View style={styles.invoiceMeta}>
          <Text>INVOICE #: {invoiceId}</Text>
          <Text>DATE: {formattedDate}</Text>
        </View>

        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={styles.serviceCol}>SERVICE</Text>
          <Text style={styles.amountCol}>AMT</Text>
        </View>

        {/* Items */}
        {items.map((item, idx) => (
          <View key={idx} style={styles.tableRow}>
            <View style={styles.serviceCol}>
              <Text style={styles.serviceName}>{item.service_name.toUpperCase()}</Text>
              {item.duration && (
                <Text style={styles.serviceDetails}>{item.duration} MIN DURATION</Text>
              )}
              {item.addons?.map((addon, i) => (
                <Text key={i} style={styles.serviceDetails}>{addon.toUpperCase()}</Text>
              ))}
            </View>
            <Text style={styles.amountCol}>{item.price.toFixed(2)}</Text>
          </View>
        ))}

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>SUBTOTAL</Text>
            <Text>{subtotal.toFixed(2)}</Text>
          </View>
          {discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>DISCOUNT (PROMO)</Text>
              <Text>-{discount.toFixed(2)}</Text>
            </View>
          )}
          {gst > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>GST (18%)</Text>
              <Text>{gst.toFixed(2)}</Text>
            </View>
          )}
          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalLabel}>TOTAL AMOUNT</Text>
            <Text style={styles.grandTotalAmount}>₹{total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Payment Method */}
        <Text style={styles.paymentLine}>*** PAID VIA {paymentMethod.toUpperCase()} · THANK YOU ***</Text>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>THANK YOU FOR YOUR VISIT</Text>
          <Text>PLEASE VISIT AGAIN</Text>
          <Text style={styles.brand}>{businessName.toUpperCase()}</Text>
          {businessWebsite && <Text style={{ marginTop: 2 }}>{businessWebsite}</Text>}
        </View>
      </Page>
    </Document>
  );
};
