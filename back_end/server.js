const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const cors = require("cors"); // Import modul CORS
const PDFDocument = require("pdfkit");
const path = require('path');
const fs = require("fs");

const outputDirectory = path.join(__dirname, 'outputFiles');


const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors()); // Tambahkan middleware CORS

app.use('/outputFiles', express.static(outputDirectory));

app.use(express.json());
app.use(express.static("public"));

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const dataBuffer = fs.readFileSync(file.path);
    const pdfData = await pdfParse(dataBuffer);

    // Ekstrak data dari teks
    const extractedData = extractData(pdfData.text);

    console.log(extractedData);

    const transformedData = {
        [`Nomor Wajib Pajak(H1)`]: extractedData.H1,
        H2: extractedData.H2,
        [`NPWP(A1)`]: extractedData.A1,
        [`NAMA(A3)`]: extractedData.A3,
        A4: extractedData.A4,
        [`MASSA PAJA(B1)`]: extractedData.B1,
        B12: extractedData.B12,
        [`NPWP PEMOTONG(C1)`]: extractedData.C1,
        [`NAMA WAJIB PAJAK(C4)`]: extractedData.C4,
        [`PERNYATAAN WAJIB PAJAK(C5)`]: `${extractedData.C5} elektronik`, // Tambahkan "elektronik" di akhir
      };

    // Buat file PDF baru
    const outputPath = `output_${Date.now()}.pdf`;
    // createPDF(transformedData, outputPath);
    createPDF(transformedData, path.join(outputDirectory, outputPath));

    // Hapus file sementara
    fs.unlinkSync(file.path);

    res.status(200).json({
      message: "Berhasil memproses file!",
      // downloadLink: `http://localhost:3010/${outputPath}`,
      downloadLink: `http://localhost:3010/outputFiles/${outputPath}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal memproses file." });
  }
});

function extractData(text) {

  const patterns = {
    H1: /dinyatakan sah dan tidak diperlukan tanda tangan basah pada Bukti Pemotongan ini\.[\s\S]*?(\d{10})/,
    H2: /2000000004[\s\S]*?(X)[\s\S]*?(X)/,
    A1: /A\.1\s*NPWP:\s*([\d\s]+)/,
    A3: /A\.3\s*Nama\s*(.+)/, // Ambil teks setelah "A.3 Nama"
    A4: /A\.4\s*(.*)/,
    B1: /2000000004\s*X\s*X\s*0\s*(\d{1,2}-\d{4})/,
    B12: /B\.12\s*PPh yang dipotong\/dipungut.*\s*([\d.,]+)/,
    C1: /C\.1\s*:NPWP\s*([\d\s]+)/,
    C4: /C\.4\s*Nama Penandatangan\s*:\s*(.*)/,
    C5: /elektronik[\s\S]*?(Dengan ini saya menyatakan bahwa bukti Pemotongan\/Pemungutan Unifikasi telah saya isi dengan benar dan telah saya tandatangani secara)[\s\S]*?/,
  };

  const data = {};

  // Mencari nilai untuk setiap pola
  for (const [key, pattern] of Object.entries(patterns)) {
    const match = text.match(pattern);
    if (key === "A1" && match) {
      data[key] = fixNPWP(match[1].replace(/\s+/g, "")); // Perbaiki NPWP dengan fixNPWP
    } else if (key === "C1" && match) {
      // Memperbaiki NPWP C1 dengan menghapus spasi
      data[key] = match[1].replace(/\s+/g, "");
    } else {
      data[key] = match ? match[1].trim() : "Tidak ditemukan";
    }
    // data[key] = match ? match[1].trim() : 'Tidak ditemukan';
  }

  return data;
}

function fixNPWP(text) {
  // Tangkap angka NPWP menggunakan regex
  // const match = text.match(/A\.1\s*NPWP:\s*([\d\s]+)/);
  if (text) {
    // Ambil angka mentah dari hasil regex
    // let npwpRaw = text[1].replace(/\s+/g, ''); // Hapus spasi
    let npwpRaw = text; // Hapus spasi

    // Pindahkan posisi angka sesuai aturan
    const correctedNPWP =
      npwpRaw[9] + // Posisi 10 → Posisi 1
      npwpRaw[10] + // Posisi 11 → Posisi 2
      npwpRaw[12] + // Posisi 3 → Posisi 3
      npwpRaw[8] + // Posisi 4 → Posisi 4
      npwpRaw[0] + // Posisi 5 → Posisi 5
      npwpRaw[13] + // Posisi 6 → Posisi 6
      npwpRaw[14] + // Posisi 7 → Posisi 7
      npwpRaw[1] + // Posisi 8 → Posisi 8
      npwpRaw[2] + // Posisi 9 → Posisi 9
      npwpRaw[5] + // Posisi 1 → Posisi 10
      npwpRaw[6] + // Posisi 2 → Posisi 11
      npwpRaw[7] + // Posisi 12 → Posisi 12
      npwpRaw[3] + // Posisi 13 → Posisi 13
      npwpRaw[4] + // Posisi 14 → Posisi 14
      npwpRaw[11]; // Posisi 15 → Posisi 15

    return correctedNPWP; // Kembalikan NPWP yang sudah diperbaiki
  }

  return "Tidak ditemukan";
}

function createPDF(data, outputPath) {
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(outputPath));
  doc.fontSize(14).text("Bukti Potong Pajak", { align: "center" });
  for (const [key, value] of Object.entries(data)) {
    doc.text(`${key}: ${value}`);
  }
  doc.end();
}

app.listen(3010, () => {
  console.log("Server berjalan di http://localhost:3010");
});
