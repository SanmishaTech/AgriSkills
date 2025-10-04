import { NextRequest, NextResponse } from 'next/server';
import jsPDF from 'jspdf';

// Helper function to detect if text contains Devanagari characters (Marathi, Hindi, etc.)
function containsDevanagari(text: string): boolean {
  // Devanagari Unicode range: U+0900-U+097F
  const devanagariRegex = /[\u0900-\u097F]/;
  return devanagariRegex.test(text);
}

// Helper function to transliterate Marathi text to Roman script as fallback
function transliterateMarathi(text: string): string {
  const marathiToRoman: { [key: string]: string } = {
    'व': 'v', 'ि': 'i', 'ष': 'sh', 'म': 'm', 'ु': 'u', 'क': 'k', 'त': 't',
    'श': 'sh', 'े': 'e', 'त': 't', 'क': 'k', 'ऱ': 'r', 'य': 'y', 'ा': 'aa',
    'ं': 'n', 'च': 'ch', 'य': 'y', 'ा': 'aa', ' ': ' ', 'छ': 'chh',
    'ी': 'ee', 'ो': 'o', 'ळ': 'l', 'ख': 'kh', 'ू': 'oo', 'भ': 'bh',
    'ूत': 'oot', 'ौ': 'au', 'ध': 'dh', 'ग': 'g', 'ज': 'j', 'प': 'p',
    'न': 'n', 'ह': 'h', 'र': 'r', 'स': 's', 'द': 'd', 'ट': 'T',
    'ल': 'l', 'ब': 'b', 'फ': 'ph', 'ड': 'D', 'थ': 'th', 'ण': 'N'
  };

  let romanText = '';
  for (const char of text) {
    romanText += marathiToRoman[char] || char;
  }
  return romanText;
}

// Convert Marathi text to a readable format for PDF
function prepareMarathiTextForPDF(text: string): string {
  if (!containsDevanagari(text)) {
    return text;
  }
  
  // For now, return the original text with a note
  // jsPDF will show it as best as it can
  return text;
}

export async function POST(request: NextRequest) {
  try {
    const { certificateData } = await request.json();
    
    console.log('📋 Certificate generation request:', {
      studentName: certificateData.studentName,
      courseName: certificateData.courseName,
      hasMarathi: containsDevanagari(certificateData.courseName || '')
    });
    
    // Create new PDF document
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // PDF dimensions
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Colors
    const primaryColor = '#059669'; // Green-600
    const secondaryColor = '#D97706'; // Amber-600
    const textColor = '#1F2937'; // Gray-800

    // Add background
    pdf.setFillColor(252, 252, 252); // Very light gray
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    // Add border
    pdf.setDrawColor(primaryColor);
    pdf.setLineWidth(3);
    pdf.rect(10, 10, pageWidth - 20, pageHeight - 20, 'S');

    // Add decorative border
    pdf.setDrawColor(secondaryColor);
    pdf.setLineWidth(1);
    pdf.rect(15, 15, pageWidth - 30, pageHeight - 30, 'S');

    // Title
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(36);
    pdf.setTextColor(primaryColor);
    pdf.text('This is the certification', pageWidth / 2, 40, { align: 'center' });

    // Certificate subtitle
    pdf.setFontSize(18);
    pdf.setTextColor(textColor);
    pdf.text('CERTIFICATE OF COMPLETION', pageWidth / 2, 55, { align: 'center' });

    // Decorative line
    pdf.setDrawColor(secondaryColor);
    pdf.setLineWidth(2);
    pdf.line(60, 65, pageWidth - 60, 65);

    // Certificate body text
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(14);
    pdf.setTextColor(textColor);
    
    const bodyText = `This certifies that`;
    pdf.text(bodyText, pageWidth / 2, 85, { align: 'center' });

    // Student name
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(28);
    pdf.setTextColor(primaryColor);
    pdf.text(certificateData.studentName || 'Student Name', pageWidth / 2, 105, { align: 'center' });

    // Course completion text
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(14);
    pdf.setTextColor(textColor);
    pdf.text('has successfully completed the course', pageWidth / 2, 125, { align: 'center' });

    // Course name - Enhanced Marathi handling
    const courseName = certificateData.courseName || 'Course Name';
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.setTextColor(secondaryColor);
    
    let displayText = courseName;
    let hasMarathiText = containsDevanagari(courseName);
    
    if (hasMarathiText) {
      console.log('🔍 Detected Marathi text in course name:', courseName);
      console.log('🔤 Character analysis:', [...courseName].map((char, i) => ({
        char,
        code: char.charCodeAt(0),
        hex: char.charCodeAt(0).toString(16),
        isDevanagari: char.charCodeAt(0) >= 0x0900 && char.charCodeAt(0) <= 0x097F
      })));
      
      // Try to render original text first, with better handling
      try {
        // Use a more permissive approach for Marathi text
        displayText = courseName;
        
        // Create a warning message that will be visible
        console.log('⚠️ Note: Marathi text may not display correctly in PDF due to font limitations');
        
        // Try to render as-is, jsPDF will do its best
      } catch (error) {
        console.error('❌ Error with Marathi text, using transliteration:', error);
        displayText = `${transliterateMarathi(courseName)} (Marathi)`;
      }
    }
    
    // Handle long course names by wrapping text
    let fontSize = 20;
    if (displayText.length > 50) {
      fontSize = 16;
    }
    if (displayText.length > 80) {
      fontSize = 14;
    }
    
    pdf.setFontSize(fontSize);
    
    try {
      const lines = pdf.splitTextToSize(displayText, pageWidth - 80);
      if (lines.length > 1) {
        // Multiple lines
        lines.forEach((line: string, index: number) => {
          const cleanLine = line.trim();
          console.log(`📏 Rendering line ${index + 1}:`, cleanLine);
          pdf.text(cleanLine, pageWidth / 2, 140 + (index * 8), { align: 'center' });
        });
      } else {
        // Single line
        console.log('📏 Rendering single line:', displayText);
        pdf.text(displayText, pageWidth / 2, 145, { align: 'center' });
      }
    } catch (renderError) {
      console.error('❌ Error rendering text, using safe fallback:', renderError);
      // Ultimate fallback
      const fallbackText = hasMarathiText ? 'Course Title (Marathi Language)' : 'Course Title';
      pdf.text(fallbackText, pageWidth / 2, 145, { align: 'center' });
    }

    // Achievement details
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    pdf.setTextColor(textColor);
    
    if (certificateData.score) {
      pdf.text(`with a score of ${certificateData.score}%`, pageWidth / 2, 160, { align: 'center' });
    }

    // Date and issuer section
    const leftX = 60;
    const rightX = pageWidth - 60;
    const bottomY = pageHeight - 50;

    // Date
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Date:', leftX, bottomY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(certificateData.date || new Date().toLocaleDateString(), leftX, bottomY + 10);

    // Issuer
    pdf.setFont('helvetica', 'bold');
    pdf.text('Issued by:', rightX - 30, bottomY, { align: 'right' });
    pdf.setFont('helvetica', 'normal');
    pdf.text(certificateData.issuer || 'AgriSkills Academy', rightX - 30, bottomY + 10, { align: 'right' });

    // Add signature line
    pdf.setDrawColor(textColor);
    pdf.setLineWidth(0.5);
    pdf.line(rightX - 60, bottomY + 20, rightX - 5, bottomY + 20);
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(10);
    pdf.text('Authorized Signature', rightX - 32.5, bottomY + 25, { align: 'center' });

    // Add certificate ID
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(120, 120, 120);
    const certId = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    pdf.text(`Certificate ID: ${certId}`, pageWidth / 2, pageHeight - 20, { align: 'center' });

    // Generate PDF as base64
    const pdfBase64 = pdf.output('datauristring');
    
    console.log('✅ Certificate generated successfully');
    
    return NextResponse.json({
      success: true,
      pdf: pdfBase64,
      debug: {
        hasMarathi: hasMarathiText,
        originalText: courseName,
        displayText: displayText
      }
    });

  } catch (error) {
    console.error('❌ Error generating certificate:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate certificate', details: error.message },
      { status: 500 }
    );
  }
}
