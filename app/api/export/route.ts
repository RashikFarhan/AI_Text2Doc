import { NextResponse } from 'next/server';
import { convert } from 'pandoc-wasm';
import * as fs from 'fs';
import * as path from 'path';

// Pre-load the reference template at module scope for caching across invocations
let templateCache: ArrayBuffer | null = null;
let templateLoadAttempted = false;

function getTemplate(): ArrayBuffer | null {
  if (templateLoadAttempted) return templateCache;
  
  templateLoadAttempted = true;
  try {
    // The template is bundled in the same directory as this route
    const templatePath = path.join(process.cwd(), 'app', 'api', 'export', 'template.docx');
    
    if (fs.existsSync(templatePath)) {
      const buffer = fs.readFileSync(templatePath);
      // Convert Buffer to ArrayBuffer for pandoc-wasm
      templateCache = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
      console.log(`[export-api] Successfully loaded reference template (${buffer.length} bytes)`);
    } else {
      console.warn(`[export-api] Template not found at: ${templatePath}`);
    }
  } catch (error) {
    console.error(`[export-api] Error loading template:`, error);
  }
  
  return templateCache;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Invalid or missing text provided' },
        { status: 400 }
      );
    }

    console.log(`[export-api] Received export request (${text.length} chars)`);
    
    // Load template
    const templateData = getTemplate();
    
    // Prepare options
    const options: Record<string, any> = {
      from: 'markdown+hard_line_breaks',
      to: 'docx',
      'output-file': 'output.docx'
    };
    
    // Prepare files object
    const files: Record<string, any> = {};
    
    if (templateData) {
      options['reference-doc'] = 'template.docx';
      files['template.docx'] = new Blob([templateData]);
    }

    // Call pandoc-wasm convert
    console.log(`[export-api] Starting pandoc-wasm conversion...`);
    const startTime = Date.now();
    
    const result = await convert(options, text, files);
    
    const duration = Date.now() - startTime;
    console.log(`[export-api] Conversion completed in ${duration}ms`);

    // The result from docx conversion should be a Blob in result.files
    const docxBlob = result.files && result.files['output.docx'];

    if (!docxBlob) {
      const errMsg = result?.stderr || "Conversion returned empty output file";
      throw new Error(`Pandoc error: ${errMsg}`);
    }
    
    if (result.stderr) {
      console.warn(`[export-api] Pandoc warning/error output: ${result.stderr}`);
    }

    const outputBinary = await docxBlob.arrayBuffer();

    // Return the response as a downloadable file
    return new Response(outputBinary as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="output.docx"',
        'Content-Length': outputBinary.byteLength.toString()
      }
    });

  } catch (error: any) {
    console.error(`[export-api] Server error:`, error);
    
    return NextResponse.json(
      { 
        error: 'Error generating DOCX document',
        details: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}
