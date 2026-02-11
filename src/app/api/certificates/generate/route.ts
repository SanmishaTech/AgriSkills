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

    // Certificate body text
    pdf.setFont('times', 'normal');
    pdf.setFontSize(14);
    pdf.setTextColor(textColor);
    pdf.text('This Certifies That', pageWidth / 2, 80, { align: 'center' });
    pdf.text('Has Successfully Completed Course', pageWidth / 2, 88, { align: 'center' });

    // Student name - positioned on the blank line
    pdf.setFont('times', 'bold');
    pdf.setFontSize(28);
    pdf.setTextColor(nameColor);
    pdf.text(certificateData.studentName || 'Student Name', pageWidth / 2, 105, { align: 'center' });

    // Golden line under name
    pdf.setDrawColor(goldColor);
    pdf.setLineWidth(1);
    pdf.line(60, 112, pageWidth - 60, 112);

    // Success message with dates and course title - under the line
    pdf.setFont('times', 'normal');
    pdf.setFontSize(14);
    pdf.setTextColor(textColor);
    
    // Get course dates from certificate data (actual quiz attempt dates)
    const startDate = certificateData.startDate || certificateData.date || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const endDate = certificateData.endDate || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    
    const courseName = (certificateData.courseName || 'Course Title').replace(/\s*Certificate\s*$/i, '').trim();
    
    // Format in 2 lines with course title bold
    const textStart = 'Successfully completed a course of ';
    const textEndLine1 = ` from ${startDate} to ${endDate}`;
    const textLine2 = 'and gained both theoretical and practical knowledge in this field.';
    
    // Calculate widths for positioning
    pdf.setFont('times', 'normal');
    pdf.setFontSize(14);
    const startWidth = pdf.getTextWidth(textStart);
    const courseWidth = pdf.getTextWidth(courseName);
    const spaceWidth = pdf.getTextWidth(' ');
    const endWidth = pdf.getTextWidth(textEndLine1);
    
    // Center the entire line
    const totalWidth = startWidth + courseWidth + spaceWidth + endWidth;
    const startX = (pageWidth - totalWidth) / 2;
    
    // Render line 1: normal + bold course + space + end text
    pdf.text(textStart, startX, 125);
    pdf.setFont('times', 'bold');
    pdf.text(courseName, startX + startWidth, 125);
    pdf.setFont('times', 'normal');
    pdf.text(' ' + textEndLine1, startX + startWidth + courseWidth, 125);
    
    // Render line 2 (normal, centered)
    pdf.text(textLine2, pageWidth / 2, 133, { align: 'center' });

    // Date at bottom
    pdf.setFont('times', 'normal');
    pdf.setFontSize(12);
    pdf.setTextColor(textColor);
    const dateValue = certificateData.date || new Date().toLocaleDateString();
    pdf.text(`Date: ${dateValue}`, pageWidth / 2, pageHeight - 30, { align: 'center' });

    // Certificate ID at bottom
    pdf.setFontSize(8);
    pdf.setTextColor(120, 120, 120);
    const certId = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    pdf.text(`Certificate ID: ${certId}`, pageWidth / 2, pageHeight - 15, { align: 'center' });

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
