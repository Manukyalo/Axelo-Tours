import { NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { createClient } from '@supabase/supabase-js';

// Styles for the PDF
const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 12, color: '#111827' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40, borderBottom: '2px solid #ea580c', paddingBottom: 10 },
  logoText: { fontSize: 24, fontWeight: 'bold', color: '#ea580c' },
  companyInfo: { fontSize: 10, color: '#6b7280', textAlign: 'right' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, letterSpacing: 1 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', borderBottom: '1px solid #e5e7eb', paddingBottom: 5, marginBottom: 10, color: '#374151' },
  row: { flexDirection: 'row', marginBottom: 5 },
  label: { width: 120, fontWeight: 'bold', color: '#4b5563' },
  value: { flex: 1 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, borderTop: '1px solid #e5e7eb', paddingTop: 10, fontSize: 10, color: '#9ca3af', textAlign: 'center' }
});

const VoucherDocument = ({ data }: { data: any }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logoText}>AXELO TOURS</Text>
          <Text style={{ fontSize: 10, color: '#ea580c', marginTop: 2 }}>& Safari Ltd.</Text>
        </View>
        <View style={styles.companyInfo}>
          <Text>123 Safari Way, Nairobi, Kenya</Text>
          <Text>info@axelotours.com</Text>
          <Text>+254 700 000 000</Text>
        </View>
      </View>

      <Text style={styles.title}>ACCOMMODATION VOUCHER</Text>

      {/* Booking Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Voucher Details</Text>
        <View style={styles.row}><Text style={styles.label}>Voucher Ref:</Text><Text style={styles.value}>{data.voucher_ref}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Date Issued:</Text><Text style={styles.value}>{new Date().toLocaleDateString()}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Property:</Text><Text style={styles.value}>{data.property_name}</Text></View>
      </View>

      {/* Guest Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Guest Information</Text>
        <View style={styles.row}><Text style={styles.label}>Guest Names:</Text><Text style={styles.value}>{data.client_names?.join(', ') || 'TBA'}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Party Size:</Text><Text style={styles.value}>{data.num_adults} Adults, {data.num_children} Children</Text></View>
        {data.client_nationality && <View style={styles.row}><Text style={styles.label}>Nationality:</Text><Text style={styles.value}>{data.client_nationality}</Text></View>}
      </View>

      {/* Accommodation Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accommodation</Text>
        <View style={styles.row}><Text style={styles.label}>Check In:</Text><Text style={styles.value}>{data.check_in}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Check Out:</Text><Text style={styles.value}>{data.check_out}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Total Nights:</Text><Text style={styles.value}>{data.nights}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Room Type:</Text><Text style={styles.value}>{data.room_type}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Meal Plan:</Text><Text style={styles.value}>{data.meal_plan}</Text></View>
      </View>

      {/* Services Included */}
      {(data.services_included && data.services_included.length > 0) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services Included</Text>
          {data.services_included.map((service: string, index: number) => (
             <Text key={index} style={{ marginBottom: 3, fontSize: 11 }}>• {service}</Text>
          ))}
        </View>
      )}

      {/* Notes */}
      {(data.special_requests || data.lodge_notes) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Requests / Notes</Text>
          {data.special_requests && <Text style={{ marginBottom: 5 }}>Guest Requests: {data.special_requests}</Text>}
          {data.lodge_notes && <Text>Lodge Notes: {data.lodge_notes}</Text>}
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text>Please provide the services above and bill them to Axelo Tours & Safari Ltd.</Text>
        <Text>This voucher is system generated and does not require a physical signature.</Text>
      </View>
    </Page>
  </Document>
);

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // 1. Generate PDF stream
    const pdfStream = await renderToStream(<VoucherDocument data={data} />);
    
    // Convert stream to Buffer
    const chunks = [];
    for await (const chunk of pdfStream) {
      chunks.push(chunk);
    }
    const pdfBuffer = Buffer.concat(chunks);

    // 2. Upload to Supabase Storage
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Ensure the bucket exists
    await supabase.storage.createBucket('vouchers', { public: true }).catch(() => {});

    const fileName = `voucher_${data.voucher_ref}_${Date.now()}.pdf`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('vouchers')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      console.error("Supabase storage upload error:", uploadError);
      throw new Error("Failed to upload PDF");
    }

    const { data: { publicUrl } } = supabase.storage.from('vouchers').getPublicUrl(fileName);

    // 3. Insert record into database
    const dbData = {
      ...data,
      pdf_url: publicUrl,
      status: 'draft', // By default
    };

    const { data: insertRow, error: dbError } = await supabase
      .from('vouchers')
      .insert([dbData])
      .select()
      .single();

    if (dbError) {
      console.error("Supabase vouchers insert error:", dbError);
      throw new Error("Failed to insert record in vouchers table");
    }

    return NextResponse.json({ success: true, url: publicUrl, voucher: insertRow });
  } catch (error: any) {
    console.error("Voucher Generation Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate voucher" },
      { status: 500 }
    );
  }
}
