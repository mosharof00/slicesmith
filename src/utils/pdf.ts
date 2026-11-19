import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export function extractPdfText(pdfPath: string): string {
  if (!fs.existsSync(pdfPath)) return '';

  const pyScript = `
import pypdf
import sys

path = sys.argv[1]
try:
    reader = pypdf.PdfReader(path)
    text = ""
    for page in reader.pages:
        t = page.extract_text()
        if t: text += t + "\\n"
    print(text)
except Exception as e:
    sys.exit(1)
`;

  try {
    const output = execSync(`python3 -c '${pyScript.replace(/'/g, "'\\''")}' "${pdfPath}"`, {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 50 * 1024 * 1024,
    });

    if (output.trim().length > 50) {
      return output.trim();
    }
  } catch {}

  // Fallback to macOS Apple Vision OCR if PDF has scanned images / no direct text
  const swiftScript = `
import Cocoa
import Vision
import PDFKit

let path = CommandLine.arguments[1]
guard let doc = PDFDocument(url: URL(fileURLWithPath: path)) else { exit(0) }
var fullText = ""

for i in 0..<doc.pageCount {
    guard let page = doc.page(at: i) else { continue }
    let pageText = page.string ?? ""
    if pageText.trimmingCharacters(in: .whitespacesAndNewlines).count > 20 {
        fullText += pageText + "\\n"
        continue
    }
    // Render page to image and OCR
    let pageRect = page.bounds(for: .mediaBox)
    let renderer = NSImage(size: pageRect.size)
    renderer.lockFocus()
    if let ctx = NSGraphicsContext.current?.cgContext {
        page.draw(with: .mediaBox, to: ctx)
    }
    renderer.unlockFocus()
    guard let cgImage = renderer.cgImage(forProposedRect: nil, context: nil, hints: nil) else { continue }
    
    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
    try? handler.perform([request])
    if let observations = request.results as? [VNRecognizedTextObservation] {
        for obs in observations {
            if let top = obs.topCandidates(1).first {
                fullText += top.string + "\\n"
            }
        }
    }
}
print(fullText)
`;

  try {
    const ocrOutput = execSync(`swift -e '${swiftScript.replace(/'/g, "'\\''")}' "${pdfPath}"`, {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 50 * 1024 * 1024,
    });
    return ocrOutput.trim();
  } catch {
    return '';
  }
}

