import React, { useState, useRef } from 'react';
import axios from 'axios';
import './Home.css'; // We'll add styles for the home page

function Home() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [progress, setProgress] = useState({});

  const fileInputRef = useRef(null);
  const MAX_FILES = 10;

  const validateFiles = (files) => {
    const validFiles = [];
    const errors = [];

    for (let file of files) {
      if (!file.type.startsWith('image/')) {
        errors.push(`${file.name} is not an image file.`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        errors.push(`${file.name} is too large (max 10MB).`);
        continue;
      }
      validFiles.push(file);
    }

    return { validFiles, errors };
  };

  const handleFiles = (files) => {
    const { validFiles, errors } = validateFiles(files);
    const totalFiles = selectedFiles.length + validFiles.length;

    if (totalFiles > MAX_FILES) {
      setError(`Maximum ${MAX_FILES} images allowed. You tried to add ${validFiles.length} more.`);
      return;
    }

    if (errors.length > 0) {
      setError(errors.join(' '));
    }

    const newFiles = [...selectedFiles, ...validFiles];
    setSelectedFiles(newFiles);
    setResults([]); // Reset results on new files
    setError(null);

    // Create previews
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    setPreviews([...previews, ...newPreviews]);
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    handleFiles(files);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);
    const files = Array.from(event.dataTransfer.files);
    handleFiles(files);
  };

  const removeFile = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    const newResults = results.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setPreviews(newPreviews);
    setResults(newResults);
    setProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[index];
      return newProgress;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (selectedFiles.length === 0) {
      setError('Please select at least one image file.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);
    setProgress({});

    const newResults = [];
    const newProgress = {};

    for (let i = 0; i < selectedFiles.length; i++) {
      newProgress[i] = 0;
      setProgress({ ...newProgress });

      try {
        const formData = new FormData();
        formData.append('image', selectedFiles[i]);

        const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/analyze`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            newProgress[i] = percentCompleted;
            setProgress({ ...newProgress });
          },
        });

        newResults[i] = response.data;
        setResults([...newResults]);
      } catch (err) {
        console.error(err);
        newResults[i] = { error: 'Analysis failed for this image.' };
        setResults([...newResults]);
      }
    }

    setIsLoading(false);
  };

  return (
    <div className="home-container">
      <header className="hero-section">
        <h1 className="hero-title animate-fade-in">AI or Real? Image Detector</h1>
        <p className="hero-subtitle animate-slide-up">
          Discover the truth behind images in an era of advanced AI generation.
        </p>
        <div className="hero-upload-section">
          <div
            className={`upload-container ${isDragOver ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              id="hero-file-input"
              className="hero-file-input"
              ref={fileInputRef}
            />
            <label htmlFor="hero-file-input" className="hero-upload-button">
              <span className="upload-icon">📷</span>
              {isDragOver ? 'Drop images here' : 'Choose Images or Drag & Drop'}
            </label>
            <p className="upload-limit">Max {MAX_FILES} images, up to 10MB each</p>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || selectedFiles.length === 0}
              className="hero-analyze-button"
            >
              {isLoading ? 'Analyzing...' : `Analyze ${selectedFiles.length} Image${selectedFiles.length !== 1 ? 's' : ''}`}
            </button>
            {previews.length > 0 && (
              <div className="images-preview">
                {previews.map((preview, index) => (
                  <div key={index} className="image-preview-item">
                    <img src={preview} alt={`Preview ${index + 1}`} className="preview-image" />
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="remove-image-btn"
                      title="Remove image"
                    >
                      ✕
                    </button>
                    {progress[index] !== undefined && (
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${progress[index]}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          {error && <p className="hero-error">{error}</p>}
        </div>
      </header>

      {results.length > 0 && (
        <section className="results-section animate-slide-up">
          <div className="results-container">
            <h2 className="results-title">Analysis Results</h2>
            <div className="results-grid">
              {results.map((result, index) => (
                <div key={index} className="result-box">
                  <img src={previews[index]} alt={`Analyzed ${index + 1}`} className="result-image" />
                  <div className="result-details">
                    {result.error ? (
                      <h2 className="error">Analysis Failed</h2>
                    ) : (
                      <>
                        <h2 className={result.is_ai ? 'ai' : 'real'}>
                          {result.is_ai ? 'AI-Generated' : 'Likely Real'}
                        </h2>
                        <p>
                          <strong>Confidence:</strong>
                          <span> {Math.round(result.confidence * 100)}%</span>
                        </p>
                        <p>
                          <strong>Reason:</strong> {result.reason}
                        </p>

                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="description-section animate-fade-in">
        <div className="description-content">
          <h2 className="section-title animate-fade-in-delay">Why Image Detection Matters</h2>
          <p className="description-text animate-slide-up-delay">
            In today's digital world, artificial intelligence can create incredibly realistic images that are indistinguishable from real photographs. This technology has revolutionized creativity and design, but it also poses challenges in verifying authenticity. Misinformation, deepfakes, and manipulated content can spread rapidly, affecting journalism, social media, and even legal proceedings.
          </p>
          <p className="description-text animate-slide-up-delay">
            Our AI Image Detector uses cutting-edge machine learning algorithms to analyze images and determine whether they were likely generated by AI or captured in the real world. With high accuracy and fast processing, it helps users, content creators, and professionals make informed decisions about the media they encounter.
          </p>
        </div>

      </section>

      <section className="features-section">
        <h2 className="section-title animate-fade-in-delay">Key Features</h2>
        <div className="features-grid">
          <div className="feature-card animate-slide-up">
            <h3>High Accuracy</h3>
            <p>Advanced AI models trained on millions of images for reliable detection.</p>
          </div>
          <div className="feature-card animate-slide-up-delay">
            <h3>Fast Analysis</h3>
            <p>Get results in seconds, not minutes.</p>
          </div>
          <div className="feature-card animate-slide-up-delay-2">
            <h3>User-Friendly</h3>
            <p>Simple upload interface accessible to everyone.</p>
          </div>
          <div className="feature-card animate-slide-up-delay-3">
            <h3>Secure & Private</h3>
            <p>Your images are processed securely and not stored permanently.</p>
          </div>
        </div>
      </section>



      <footer className="footer">
        <p>&copy; 2024 AI Image Detector. Empowering truth in the digital age.</p>
      </footer>
    </div>
  );
}

export default Home;
