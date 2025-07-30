import { useState } from "react";
import { motion } from "framer-motion";
import { FaPlus, FaTrash } from "react-icons/fa";
import { toast } from 'react-hot-toast';

const UploadModal = ({ sessionId, setUploadedDoc, setDocUploadError }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
    } else {
      toast.error('Only PDF files are allowed!');
    }
  };
  
  const handleUpload = async () => {
    if (!selectedFile) return;
    setShowModal(false);
    if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
      setDocUploadError('File size should be less than 10MB.');
      return;
    }
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('sessionId', sessionId);

    try {
      const res = await fetch('http://localhost:5000/api/upload-doc', {
        method: 'POST',
        credentials:'include',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      const data = await res.json();
      console.log("Uploaded doc response:", data);
      setUploadedDoc(selectedFile.name);
      setDocUploadError('');
      toast.success('File Uploaded Successfully!');
      setSelectedFile(null);
    } catch (err) {
      console.error('Error uploading document:', err);
      setDocUploadError('Failed to upload document.');
    }
  };

  return (
    <div className="relative">
      {/* ➕ Open Modal Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        onClick={() => setShowModal(true)}
        className="p-2 bg-purple-500 hover:bg-purple-600 text-white rounded-full transition"
      >
        <FaPlus size={20} />
      </motion.button>

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl p-6 w-96 shadow-2xl relative">
            <h2 className="text-lg font-semibold mb-4">Upload a PDF</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-blue-50 mb-4">
              <label htmlFor="pdf-upload" className="cursor-pointer text-blue-600 hover:underline">
                Drag & drop or <span className="font-semibold">Browse</span>
              </label>
              <input
                type="file"
                accept="application/pdf"
                id="pdf-upload"
                onChange={handleFileChange}
                className="hidden"
              />
              <p className="text-xs text-gray-500 mt-2">Only PDF format</p>
            </div>

            {selectedFile && (
              <div className="flex items-center justify-between bg-green-100 px-3 py-2 rounded-lg text-green-700 mb-4">
                <span className="truncate">{selectedFile.name}</span>
                <button onClick={() => setSelectedFile(null)} className="text-red-500 hover:text-red-700">
                  <FaTrash size={14} />
                </button>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!selectedFile}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl font-semibold transition"
            >
              Upload
            </button>

            {/* Close Modal Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-4 text-gray-500 hover:text-gray-700 text-2xl"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadModal;
