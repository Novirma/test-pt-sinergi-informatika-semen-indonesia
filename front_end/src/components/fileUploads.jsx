import React, { useState, useRef } from "react";
import axios from "axios";
import logoDjp from "../assets/logoDjp.jpg";
import { FaCheckCircle } from "react-icons/fa";
import { VscError } from "react-icons/vsc";
// import "./styles.css";
import "../styles/styles.css";

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const fileInputRef = useRef(null);

  console.log(file, "ini file");

  console.log(response);

  const handleFileChange = (e) => {
    console.log("Masuk sini");
    setFile(e.target.files[0]);
    setResponse(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Pilih file terlebih dahulu!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("http://localhost:3010/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setResponse(res.data);
      setIsSuccessModalOpen(true); // Buka modal berhasil
    } catch (err) {
      console.error(err);
      setError("Gagal mengunggah file.");
      setIsErrorModalOpen(true); // Buka modal gagal
    }
  };

  const closeSuccessModal = () => {
    setIsSuccessModalOpen(false);
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Mereset elemen input file secara manual
    }
  };
  const closeErrorModal = () => setIsErrorModalOpen(false);

  return (
    <div className="container">
      <div
        className="logo-container"
        style={{ textAlign: "center", marginBottom: "20px" }}
      >
        <img
          src={logoDjp}
          alt="Logo DJP"
          style={{
            width: "250px",
            height: "auto",
            borderRadius: "5%",
            border: "2px solid black",
          }}
        />
      </div>
      <h3>Extract PDF Bukti Pembayaran Pajak</h3>
      {file ? (
        <p style={{ color: "green" }}>File {file.name} telah dipilih.</p>
      ) : (
        <p style={{ color: "red" }}>Belum ada file yang dipilih.</p>
      )}
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          style={{ marginLeft: "150px" }}
          ref={fileInputRef}
        />
        <button type="submit">Unggah</button>
      </form>

      {/* Pop-up Modal Berhasil */}
      {isSuccessModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3>Berhasil!</h3>
            <div style={{ textAlign: "center", marginTop: "10px" }}>
              <FaCheckCircle
                style={{ color: "blue", fontSize: "50px" }} // Atur warna biru dan ukuran 36px
              />
            </div>
            {/* <p>{response?.message}</p> */}
            <a
              href={response.downloadLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              Klik di sini untuk mengunduh file
            </a>
            <button onClick={closeSuccessModal}>Tutup</button>
          </div>
        </div>
      )}

      {/* Pop-up Modal Gagal */}
      {isErrorModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3>Gagal!</h3>
            <div style={{ textAlign: "center", marginTop: "10px" }}>
              <VscError
                style={{ color: "red", fontSize: "50px" }} // Atur warna biru dan ukuran 36px
              />
            </div>
            {/* <p>{error}</p> */}
            <button onClick={closeErrorModal}>Tutup</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
