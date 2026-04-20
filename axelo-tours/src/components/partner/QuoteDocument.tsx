"use client";

import React from 'react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  Image
} from '@react-pdf/renderer';
import { format } from "date-fns";

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: 'Helvetica',
    color: '#1f2937',
    fontSize: 10,
    lineHeight: 1.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 30,
    borderBottom: 2,
    borderBottomColor: '#1A6B3A',
    paddingBottom: 20,
  },
  brand: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A6B3A',
  },
  tagline: {
    fontSize: 8,
    color: '#6b7280',
    marginTop: 2,
  },
  quoteTitleBox: {
    textAlign: 'right',
  },
  quoteTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  quoteRef: {
    fontSize: 10,
    color: '#1A6B3A',
    fontWeight: 'bold',
    marginTop: 4,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textTransform: 'uppercase',
    backgroundColor: '#f3f4f6',
    padding: '4 8',
    borderRadius: 4,
  },
  infoGrid: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottom: 1,
    borderBottomColor: '#f3f4f6',
    paddingBottom: 15,
  },
  infoCol: {
    flex: 1,
  },
  label: {
    fontSize: 8,
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  value: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#111827',
  },
  table: {
    display: 'flex',
    width: 'auto',
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    color: '#ffffff',
    padding: '6 8',
    borderRadius: 4,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    padding: '8 8',
    alignItems: 'center',
  },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: 'center' },
  colUnit: { flex: 1, textAlign: 'right' },
  colTotal: { flex: 1, textAlign: 'right' },
  
  totalSection: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: 200,
    paddingVertical: 4,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: 200,
    marginTop: 8,
    paddingTop: 8,
    borderTop: 2,
    borderTopColor: '#1A6B3A',
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
    marginRight: 20,
  },
  grandTotalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1A6B3A',
  },
  
  terms: {
    marginTop: 40,
    padding: 15,
    backgroundColor: '#fffbeb',
    borderLeft: 4,
    borderLeftColor: '#f59e0b',
    borderRadius: 4,
  },
  termsTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 5,
  },
  termsText: {
    fontSize: 8,
    color: '#b45309',
    lineHeight: 1.4,
  },
  
  footer: {
    position: 'absolute',
    bottom: 50,
    left: 50,
    right: 50,
    borderTop: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  contact: {
    fontSize: 8,
    color: '#6b7280',
  }
});

interface QuoteDocumentProps {
  quote: any;
  partner: any;
}

export const QuoteDocument = ({ quote, partner }: QuoteDocumentProps) => {
  const lineItems = (quote.line_items as any[]) || [];
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>AXELO TOURS</Text>
            <Text style={styles.tagline}>Official B2B Partner Quote</Text>
            <Text style={[styles.tagline, { marginTop: 10 }]}>Axelo Tours & Safari Ltd</Text>
            <Text style={styles.tagline}>Mombasa, Kenya</Text>
          </View>
          <View style={styles.quoteTitleBox}>
            <Text style={styles.quoteTitle}>GROUP QUOTE</Text>
            <Text style={styles.quoteRef}>REF: {quote.quote_ref}</Text>
            <Text style={[styles.tagline, { textAlign: 'right' }]}>Issued: {format(new Date(quote.created_at || new Date()), "PPP")}</Text>
            {quote.valid_until && (
              <Text style={[styles.tagline, { textAlign: 'right', color: '#dc2626', fontWeight: 'bold' }]}>
                Valid Until: {format(new Date(quote.valid_until), "PPP")}
              </Text>
            )}
          </View>
        </View>

        {/* Partner & Trip Info */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <Text style={styles.label}>Partner Agency</Text>
            <Text style={styles.value}>{partner?.company_name}</Text>
            <Text style={[styles.tagline, { color: '#4b5563' }]}>{partner?.contact_name}</Text>
            <Text style={[styles.tagline, { color: '#4b5563' }]}>{partner?.contact_email}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.label}>Destination</Text>
            <Text style={styles.value}>{quote.destination}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.label}>Travel Dates</Text>
            <Text style={styles.value}>
              {quote.travel_date ? format(new Date(quote.travel_date), "MMM d, yyyy") : "TBD"} – {quote.return_date ? format(new Date(quote.return_date), "MMM d, yyyy") : "TBD"}
            </Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.label}>Total Pax</Text>
            <Text style={styles.value}>{quote.pax_count} Guests</Text>
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Breakdown of Services</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.colDesc, { fontSize: 9, fontWeight: 'bold' }]}>Description</Text>
              <Text style={[styles.colQty, { fontSize: 9, fontWeight: 'bold' }]}>Qty</Text>
              <Text style={[styles.colUnit, { fontSize: 9, fontWeight: 'bold' }]}>Unit Net</Text>
              <Text style={[styles.colTotal, { fontSize: 9, fontWeight: 'bold' }]}>Total Net</Text>
            </View>
            
            {lineItems.map((item, i) => (
              <View key={i} style={styles.tableRow}>
                <View style={styles.colDesc}>
                  <Text style={{ fontWeight: 'bold' }}>{item.name}</Text>
                  <Text style={{ fontSize: 8, color: '#6b7280', textTransform: 'capitalize' }}>Category: {item.type}</Text>
                </View>
                <Text style={styles.colQty}>{item.qty}</Text>
                <Text style={styles.colUnit}>${(item.unit_price_usd || 0).toLocaleString()}</Text>
                <Text style={styles.colTotal}>${((item.unit_price_usd || 0) * (item.qty || 1)).toLocaleString()}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Totals */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={{ marginRight: 20, color: '#6b7280' }}>Subtotal Net USD</Text>
            <Text style={{ fontWeight: 'bold' }}>${(quote.total_net_usd || 0).toLocaleString()}</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>TOTAL NET PAYABLE</Text>
            <Text style={styles.grandTotalValue}>${(quote.total_net_usd || 0).toLocaleString()} USD</Text>
          </View>
        </View>

        {/* Terms */}
        <View style={styles.terms}>
          <Text style={styles.termsTitle}>Booking Terms & Conditions</Text>
          <Text style={styles.termsText}>
            • This quote is subject to availability at the time of booking.{"\n"}
            • Prices are based on the specified pax count. Changes in group size may affect the final rate.{"\n"}
            • A 30% deposit is required to secure the booking upon approval.{"\n"}
            • Standard Axelo Tours cancellation policies apply.{"\n"}
            • Payments are net payable to Axelo Tours & Safari Ltd via wire transfer.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View>
            <Text style={styles.contact}>Support: +254 700 000 000 (WhatsApp Available)</Text>
            <Text style={styles.contact}>Partner Desk: partnerships@axelotours.co.ke</Text>
          </View>
          <View style={{ textAlign: 'right' }}>
            <Text style={styles.contact}>www.axelotours.co.ke</Text>
            <Text style={styles.contact}>Axelo Tours & Safari Ltd · Licenced Tour Operator</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
