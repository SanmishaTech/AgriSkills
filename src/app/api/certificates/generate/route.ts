import { NextRequest, NextResponse } from 'next/server';
import jsPDF from 'jspdf';
import { readFileSync } from 'fs';
import path from 'path';

// Register Unicode font for Marathi text (loaded once at module init)
const unicodeFont = {
  name: 'NotoSansDevanagari',
  file: 'NotoSansDevanagari-Regular.ttf',
  data: readFileSync(
    path.join(process.cwd(), 'public', 'fonts', 'NotoSansDevanagari-Regular.ttf')
  ).toString('base64')
};

// Helper function to detect if text contains Devanagari characters (Marathi, Hindi, etc.)
function containsDevanagari(text: string): boolean {
  // Devanagari Unicode range: U+0900-U+097F
  const devanagariRegex = /[\u0900-\u097F]/;
  return devanagariRegex.test(text);
}

// Helper function to transliterate Marathi text to Roman script as fallback
function transliterateMarathi(text: string): string {
  const marathiToRoman: { [key: string]: string } = {
    ' ': ' ',
    'ा': 'aa',
    'ि': 'i',
    'ी': 'ee',
    'ु': 'u',
    'ू': 'oo',
    'े': 'e',
    'ो': 'o',
    'ौ': 'au',
    'ं': 'n',
    'क': 'k',
    'ख': 'kh',
    'ग': 'g',
    'ज': 'j',
    'ट': 'T',
    'ड': 'D',
    'त': 't',
    'थ': 'th',
    'ध': 'dh',
    'न': 'n',
    'ण': 'N',
    'प': 'p',
    'फ': 'ph',
    'ब': 'b',
    'भ': 'bh',
    'म': 'm',
    'य': 'y',
    'र': 'r',
    'ऱ': 'r',
    'ल': 'l',
    'ळ': 'l',
    'व': 'v',
    'श': 'sh',
    'ष': 'sh',
    'स': 's',
    'ह': 'h'
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
    const primaryColor = '#1a365d'; // Dark blue
    const secondaryColor = '#c9a227'; // Golden
    const textColor = '#1F2937'; // Gray-800
    const goldColor = '#c9a227'; // Golden for borders

    // Add background
    pdf.setFillColor(255, 255, 255); // White
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    // Helper function to draw laurel/wheat pattern
    const drawDecorativeBorder = () => {
      const margin = 8;
      const patternSize = 6;
      
      // Draw outer golden border
      pdf.setDrawColor(goldColor);
      pdf.setLineWidth(2);
      pdf.rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2, 'S');
      
      // Draw inner golden border
      pdf.setLineWidth(1);
      pdf.rect(margin + 3, margin + 3, pageWidth - (margin + 3) * 2, pageHeight - (margin + 3) * 2, 'S');
      
      // Draw corner decorations (simulated with small lines)
      const cornerSize = 12;
      pdf.setLineWidth(1.5);
      
      // Top-left corner
      for (let i = 0; i < 5; i++) {
        const offset = i * 2;
        pdf.line(margin + 5 + offset, margin + 5, margin + 5, margin + 5 + offset);
      }
      
      // Top-right corner
      for (let i = 0; i < 5; i++) {
        const offset = i * 2;
        pdf.line(pageWidth - margin - 5 - offset, margin + 5, pageWidth - margin - 5, margin + 5 + offset);
      }
      
      // Bottom-left corner
      for (let i = 0; i < 5; i++) {
        const offset = i * 2;
        pdf.line(margin + 5 + offset, pageHeight - margin - 5, margin + 5, pageHeight - margin - 5 - offset);
      }
      
      // Bottom-right corner
      for (let i = 0; i < 5; i++) {
        const offset = i * 2;
        pdf.line(pageWidth - margin - 5 - offset, pageHeight - margin - 5, pageWidth - margin - 5, pageHeight - margin - 5 - offset);
      }
      
      // Draw side decorative patterns (small dashes to simulate wheat pattern)
      pdf.setLineWidth(0.5);
      const sideMargin = margin + 2;
      
      // Top and bottom borders - small decorative dashes
      for (let x = margin + 20; x < pageWidth - margin - 20; x += 8) {
        pdf.line(x, sideMargin, x + 3, sideMargin); // Top
        pdf.line(x, pageHeight - sideMargin, x + 3, pageHeight - sideMargin); // Bottom
      }
      
      // Left and right borders
      for (let y = margin + 20; y < pageHeight - margin - 20; y += 8) {
        pdf.line(sideMargin, y, sideMargin, y + 3); // Left
        pdf.line(pageWidth - sideMargin, y, pageWidth - sideMargin, y + 3); // Right
      }
    };
    
    drawDecorativeBorder();
    
    // Add logo at top
    try {
      const logoPath = path.join(process.cwd(), 'public', 'images', 'logo.png');
      const logoData = readFileSync(logoPath).toString('base64');
      pdf.addImage(`data:image/png;base64,${logoData}`, 'PNG', pageWidth / 2 - 15, 12, 30, 10);
    } catch (logoError) {
      console.log('Logo not found, skipping logo display');
    }

    // Organization header
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(primaryColor);
    pdf.text('SHOP FOR CHANGE FAIR TRADE, NGO', pageWidth / 2, 25, { align: 'center' });

    // Main title
    pdf.setFont('times', 'bold');
    pdf.setFontSize(32);
    pdf.setTextColor(primaryColor);
    pdf.text('CERTIFICATE OF COMPLETION', pageWidth / 2, 45, { align: 'center' });

    // Decorative line under title
    pdf.setDrawColor(goldColor);
    pdf.setLineWidth(2);
    pdf.line(60, 52, pageWidth - 60, 52);
    
    // Second decorative line
    pdf.setLineWidth(0.5);
    pdf.line(70, 55, pageWidth - 70, 55);

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
      // Use embedded Unicode font for Marathi text
      pdf.addFileToVFS(unicodeFont.file, unicodeFont.data);
      pdf.addFont(unicodeFont.file, unicodeFont.name, 'normal');
      pdf.setFont(unicodeFont.name, 'normal');
      pdf.setTextColor(secondaryColor);
      pdf.setFontSize(22);
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

    const bottomY = pageHeight - 55;
    
    // Draw signature line on the left
    const leftX = 40;
    pdf.setDrawColor(textColor);
    pdf.setLineWidth(0.5);
    pdf.line(leftX, bottomY, leftX + 60, bottomY);
    
    // Signature text
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(10);
    pdf.setTextColor(primaryColor);
    pdf.text('Mr.Sameer Ravindra Athavale', leftX + 30, bottomY + 6, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(textColor);
    pdf.text('CEO', leftX + 30, bottomY + 11, { align: 'center' });
    pdf.text('Shop For Change Fair Trade', leftX + 30, bottomY + 16, { align: 'center' });

    // Draw badge/star in the center
    const centerX = pageWidth / 2;
    const badgeY = bottomY - 5;
    
    // Draw outer circle (gold)
    pdf.setDrawColor(goldColor);
    pdf.setLineWidth(2);
    pdf.circle(centerX, badgeY + 10, 15, 'S');
    
    // Draw inner circle
    pdf.setLineWidth(1);
    pdf.circle(centerX, badgeY + 10, 12, 'S');
    
    // Draw star in center (simulated with text)
    pdf.setFont('times', 'bold');
    pdf.setFontSize(20);
    pdf.setTextColor(goldColor);
    pdf.text('★', centerX, badgeY + 16, { align: 'center' });
    
    // Draw ribbon below star
    pdf.setFillColor(goldColor);
    // Left ribbon part
    pdf.triangle(centerX - 8, badgeY + 18, centerX - 3, badgeY + 25, centerX - 3, badgeY + 18, 'F');
    // Right ribbon part  
    pdf.triangle(centerX + 3, badgeY + 18, centerX + 3, badgeY + 25, centerX + 8, badgeY + 18, 'F');

    // Proudly Supported By on the right
    const rightX = pageWidth - 60;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(primaryColor);
    pdf.text('Proudly Supported By:', rightX, bottomY - 5, { align: 'center' });
    
    // Date and Score info centered below the main content
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(textColor);
    
    const dateValue = certificateData.date || new Date().toLocaleDateString();
    const scoreText = certificateData.score ? `with a score of ${certificateData.score}%` : '';
    
    // Date and score in one line
    const infoText = `Date: ${dateValue} ${scoreText ? '| ' + scoreText : ''}`;
    pdf.text(infoText, pageWidth / 2, pageHeight - 25, { align: 'center' });
    
    // Issuer info
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    const issuerValue = certificateData.issuer || `${process.env.NEXT_PUBLIC_APP_NAME || 'Gram Kushal'} Academy`;
    pdf.text(`Issued by: ${issuerValue}`, pageWidth / 2, pageHeight - 18, { align: 'center' });

    // Add certificate ID at the very bottom
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(120, 120, 120);
    const certId = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    pdf.text(`Certificate ID: ${certId}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

    // Generate PDF as base64
    const fileSafeCourseName = courseName
      .trim()
      .replace(/[\\/:*?"<>|]/g, '-')
      .replace(/\s+/g, ' ')
      .trim();
    const pdfFileName = `${fileSafeCourseName || 'Certificate'}.pdf`;

    const pdfBase64 = pdf.output('datauristring');
    
    console.log('✅ Certificate generated successfully');
    
    return NextResponse.json({
      success: true,
      pdf: pdfBase64,
      fileName: pdfFileName,
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
