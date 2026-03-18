import { Lightbulb } from "lucide-react";
import SuggestionFormPanel from "../components/suggestion/SuggestionFormPanel";
import SuggestionIntroCard from "../components/suggestion/SuggestionIntroCard";
import useSuggestionForm from "../hooks/useSuggestionForm";
import "./Suggestion.css";

export default function Suggestion() {
  const {
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
  } = useSuggestionForm();

  return (
    <main className="suggestion-main">
      <div className="page-title-area">
        <h1 className="page-title">
          <Lightbulb className="title-icon-main" /> SUGGESTION
        </h1>
        <div className="title-divider"></div>
      </div>

      <div className="suggestion-layout">
        <SuggestionIntroCard submitted={submitted} onReset={resetForm} />
        <SuggestionFormPanel
          submitted={submitted}
          formData={formData}
          fileInputRef={fileInputRef}
          isDragging={isDragging}
          onChange={handleChange}
          onDateSelect={handleDateSelect}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onFileChange={handleFileChange}
          onRemoveFile={handleRemoveFile}
          onSubmit={handleSubmit}
        />
      </div>
    </main>
  );
}
