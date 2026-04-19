import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import React from 'react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  PDFViewer, 
  renderToStream,
  Font,
  Image
} from '@react-pdf/renderer';
import { format } from "date-fns";

// Register fonts if needed, or use defaults
// Font.register({ family: 'Inter', src: '...' });

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
    marginBottom: 40,
    borderBottom: 1,
    borderBottomColor: '#f3f4f6',
    paddingBottom: 20,
  },
  brand: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A6B3A', // Primary Green
  },
  ref: {
    color: '#9ca3af',
    fontSize: 8,
    textAlign: 'right',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroBox: {
    backgroundColor: '#f9fafb',
    padding: 20,
    borderRadius: 8,
    marginBottom: 30,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 5,
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#1A6B3A',
    marginBottom: 15,
  },
  grid: {
    flexDirection: 'row',
    gap: 20,
  },
  gridItem: {
    flex: 1,
  },
  label: {
    fontSize: 8,
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 2,
    fontWeight: 'bold',
  },
  value: {
    fontSize: 10,
    color: '#111827',
    fontWeight: 'bold',
  },
  dayRow: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 15,
  },
  dayNumber: {
    width: 50,
    fontWeight: 'bold',
    color: '#1A6B3A',
  },
  dayContent: {
    flex: 1,
  },
  dayTitle: {
    fontWeight: 'bold',
    fontSize: 11,
    marginBottom: 3,
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

const ItineraryDocument = ({ booking, pkg, client }: any) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>AXELO TOURS</Text>
          <Text style={{ fontSize: 8, color: '#6b7280' }}>Safari & Adventure Specialists</Text>
        </View>
        <View>
          <Text style={styles.ref}>BOOKING REF: #{booking.id.slice(0, 8).toUpperCase()}</Text>
          <Text style={styles.ref}>ISSUED ON: {format(new Date(), "PPP")}</Text>
        </View>
      </View>

      {/* Hero Section */}
      <View style={styles.heroBox}>
        <Text style={styles.heroTitle}>{pkg.name}</Text>
        <Text style={styles.heroSubtitle}>{pkg.destination} • {pkg.duration_days} Days Adventure</Text>
        
        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <Text style={styles.label}>Lead Traveler</Text>
            <Text style={styles.value}>{client.full_name}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.label}>Start Date</Text>
            <Text style={styles.value}>{format(new Date(booking.travel_date), "PPP")}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.label}>Group Size</Text>
            <Text style={styles.value}>{booking.num_adults + booking.num_children} Guests</Text>
          </View>
        </View>
      </View>

      {/* Itinerary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Daily Itinerary</Text>
        {pkg.highlights.map((highlight: string, index: number) => (
          <View key={index} style={styles.dayRow}>
            <Text style={styles.dayNumber}>Day {index + 1}</Text>
            <View style={styles.dayContent}>
              <Text style={styles.dayTitle}>{highlight}</Text>
              <Text style={{ color: '#6b7280' }}>
                Full day exploration in {pkg.destination}. All meals and park entry fees included as per your booking.
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Preparation */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What to Bring</Text>
        <Text>• Valid Passport and Visa</Text>
        <Text>• Comfortable safari clothing (neutral colors)</Text>
        <Text>• Sunscreen, hat, and sunglasses</Text>
        <Text>• Binoculars and camera</Text>
        <Text>• Personal medications</Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.contact}>Support: +254 700 000 000</Text>
          <Text style={styles.contact}>Email: adventures@axelo-tours.com</Text>
        </View>
        <View style={{ textAlign: 'right' }}>
          <Text style={styles.contact}>www.axelo-tours.com</Text>
          <Text style={styles.contact}>Axelo Tours & Safari Ltd © 2026</Text>
        </View>
      </View>
    </Page>
  </Document>
);

export async function GET(
  req: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const { bookingId } = await params;
    const supabase = await createClient();

    // 1. Auth & Verification
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    // 2. Fetch data and verify ownership
    const { data: booking, error: bError } = await supabase
      .from("bookings")
      .select("*, package:packages(*), client:clients(*)")
      .eq("id", bookingId)
      .single();

    if (bError || !booking) return new NextResponse("Booking not found", { status: 404 });

    // Verify client belongs to auth user
    if (booking.client.user_id !== user.id) {
       return new NextResponse("Forbidden", { status: 403 });
    }

    // 3. Generate PDF
    const stream = await renderToStream(
      <ItineraryDocument 
        booking={booking} 
        pkg={booking.package} 
        client={booking.client} 
      />
    );

    // 4. Return as PDF
    return new NextResponse(stream as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Itinerary-${bookingId.slice(0, 8)}.pdf"`,
      },
    });

  } catch (error: any) {
    console.error("PDF Generation Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
