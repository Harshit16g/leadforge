"use client";

import { Document, Page, Text, View, StyleSheet, Image, Font } from "@react-pdf/renderer";

// Register fonts if needed, or use defaults
// Font.register({ family: 'Inter', src: 'https://fonts.gstatic.com/s/inter/v12/UcCOjFGCW6iiv5IQ-uP8GZ60ZNoR7z0.woff2' });

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    alignItems: 'center',
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 10,
    color: '#666',
    letterSpacing: 2,
    marginBottom: 30,
  },
  qrContainer: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 20,
    marginBottom: 40,
  },
  qrImage: {
    width: 300,
    height: 300,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  footerText: {
    fontSize: 10,
    color: '#999',
  },
  branding: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  brandingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  }
});

interface QRCodePDFProps {
  qrDataUrl: string;
  partnerName: string;
  slug: string;
}

export const QRCodePDF = ({ qrDataUrl, partnerName, slug }: QRCodePDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>{partnerName}</Text>
        <Text style={styles.subtitle}>Scan to reserve your session instantly</Text>
      </View>

      <View style={styles.qrContainer}>
        <Image src={qrDataUrl} style={styles.qrImage} />
      </View>

      <View style={styles.branding}>
        <Text style={styles.brandingText}>Powered by Leaex</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>leaex.com/{slug}</Text>
      </View>
    </Page>
  </Document>
);
