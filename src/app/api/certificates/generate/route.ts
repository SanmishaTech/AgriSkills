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

    // Add font for Unicode support
    pdf.addFileToVFS(unicodeFont.file, unicodeFont.data);
    pdf.addFont(unicodeFont.file, unicodeFont.name, 'normal');
    pdf.addFont(unicodeFont.file, unicodeFont.name, 'bold');

    // PDF dimensions
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Add certificate template image as background
    try {
      const templatePath = path.join(process.cwd(), 'src', 'assets', 'certificates', 'English Certificate.jpeg');
      const templateData = readFileSync(templatePath).toString('base64');
      pdf.addImage(`data:image/jpeg;base64,${templateData}`, 'JPEG', 0, 0, pageWidth, pageHeight);
    } catch (templateError) {
      console.log('Certificate template not found, using default styling');
      // Fallback: white background
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    }

    // Colors
    const textColor = '#1F2937'; // Gray-800
    const nameColor = '#1a365d'; // Dark blue
    const goldColor = '#FFD700'; // Gold

    // Check language of name
    const studentName = certificateData.studentName || 'Student Name';
    const isDevanagariName = containsDevanagari(studentName);

    // Student name - positioned on the first dotted line
    pdf.setFont(isDevanagariName ? unicodeFont.name : 'helvetica', 'bold');
    pdf.setFontSize(28);
    pdf.setTextColor(nameColor);
    pdf.text(studentName, 23, 68, { align: 'left' });

    // Determine the course name specifically so we can name the downloaded file
    let courseName = (certificateData.courseName || 'Course Title').replace(/\s*Certificate\s*$/i, '').trim();

    // Check if transliteration is needed for languages without explicit DB font mapping
    // Note: JS PDF natively has an issue rendering complex ligatures, but loading the TTF solves basic character shapes.
    // Ensure you fallback safely if it contains unsupported characters
    const isDevanagariCourse = containsDevanagari(courseName);

    // Course Name - positioned on the second dotted line
    pdf.setFont(isDevanagariCourse ? unicodeFont.name : 'helvetica', 'normal');
    pdf.setFontSize(22);
    pdf.setTextColor(textColor);
    pdf.text(courseName, 23, 90, { align: 'left' });

    // Certificate ID - bottom right slot
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(textColor); // Match the dark color of the template text
    const certId = `CERT-${Date.now().toString(36).toUpperCase()}`;
    pdf.text(certId, 230, 155.1, { align: 'left' });

    // Date at bottom - bottom right slot
    pdf.setTextColor(textColor);
    const dateValue = certificateData.date || new Date().toLocaleDateString();
    pdf.text(dateValue, 230, 161.5, { align: 'left' });

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
        hasMarathi: containsDevanagari(courseName),
        originalText: courseName,
        displayText: courseName
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
