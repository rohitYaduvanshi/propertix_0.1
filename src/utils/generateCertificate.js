import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function generatePropertyCertificate({
  ownerName,
  propertyAddress,
  propertyType,
  area,
  priceUsd,
  hash,
}) {
  const imgUrl = "/certificate-template.jpg";       
  const res = await fetch(imgUrl);
  const imgBytes = await res.arrayBuffer();

  const pdfDoc = await PDFDocument.create();
  const certImage = await pdfDoc.embedJpg(imgBytes);

  const imgWidth = certImage.width;   // ~1600 etc.
  const imgHeight = certImage.height; // ~900 etc.

  const page = pdfDoc.addPage([imgWidth, imgHeight]);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // background
  page.drawImage(certImage, {
    x: 0,
    y: 0,
    width: imgWidth,
    height: imgHeight,
  });

  // ===== COORDINATES (Figma ke approximate points) =====
  // NOTE: pdf-lib me (0,0) bottom‑left hota hai.
  // Neeche values tumhare screenshot ke hisaab se rakhi hain;
  // 5‑10 px upar/neeche chahiye ho to sirf y badalna.

  const valueFontSize = 16;
  const smallFontSize = 11;

  
  const valueX = 780;          

  const ownerY   = imgHeight - 340;  
  const typeY    = imgHeight - 390;  
  const addrY    = imgHeight - 440;  
  const areaY    = imgHeight - 500;  
  const priceY   = imgHeight - 580;  
  const hashY    = imgHeight - 640; 
  const issuedY  = imgHeight - 735; 

  // Owner name
  page.drawText(ownerName || "-", {
    x: valueX,
    y: ownerY,
    size: valueFontSize,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  // Property type
  page.drawText(propertyType || "-", {
    x: valueX,
    y: typeY,
    size: valueFontSize,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  // Property address
  page.drawText(propertyAddress || "-", {
    x: valueX,
    y: addrY,
    size: valueFontSize,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  // Area (sq ft)
  page.drawText(`${area} sq ft`, {
    x: valueX,
    y: areaY,
    size: valueFontSize,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  // Price (USD)
  page.drawText(`$${priceUsd}`, {
    x: valueX,
    y: priceY,
    size: valueFontSize,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  // Property hash (2 lines ke liye wrap kar sakta hai)
  const hashText = hash || "-";
  page.drawText(hashText, {
    x: valueX - 60,       // thoda left, taaki lamba hash fit ho
    y: hashY,
    size: smallFontSize,
    font: fontNormal,
    color: rgb(1, 1, 1),
    maxWidth: imgWidth - (valueX - 60) - 80,
    lineHeight: 12,
  });

  // Issued at
  page.drawText(new Date().toLocaleString(), {
    x: valueX + 40,
    y: issuedY,
    size: valueFontSize,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
