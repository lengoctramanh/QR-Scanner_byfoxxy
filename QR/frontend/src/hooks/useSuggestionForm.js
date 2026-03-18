import { useRef, useState } from "react";
import { processFiles, removeFile } from "../utils/fileUtils";

const INITIAL_SUGGESTION_FORM = {
  contributorName: "",
  dob: "",
  companyName: "",
  details: "",
  attachments: [],
};

export default function useSuggestionForm() {
  const [submitted, setSubmitted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [formData, setFormData] = useState(INITIAL_SUGGESTION_FORM);
  const fileInputRef = useRef(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateSelect = (event) => {
    const rawDate = event.target.value;
    if (!rawDate) return;

    const [year, month, day] = rawDate.split("-");
    setFormData((prev) => ({
      ...prev,
      dob: `${day}/${month}/${year}`,
    }));
  };

  const handleFileChange = (event) => {
    setIsDragging(false);
    processFiles(Array.from(event.target.files || []), setFormData, fileInputRef);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    processFiles(Array.from(event.dataTransfer.files || []), setFormData, fileInputRef);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleRemoveFile = (indexToRemove) => {
    removeFile(indexToRemove, setFormData);
  };

  const resetForm = () => {
    setSubmitted(false);
    setIsDragging(false);
    setFormData(INITIAL_SUGGESTION_FORM);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const name = formData.contributorName.trim() === "" ? "Valued Contributor" : formData.contributorName;
    console.log("Feedback Sent from:", name, formData);
    setSubmitted(true);
  };

  return {
    submitted,
    isDragging,
    formData,
    fileInputRef,
    handleChange,
    handleDateSelect,
    handleFileChange,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleRemoveFile,
    handleSubmit,
    resetForm,
  };
}
