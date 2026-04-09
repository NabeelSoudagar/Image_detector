import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './Home.css';

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

  useEffect(() => {
    // Intersection Observer for the elegant scroll reveal animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Optional: observer.unobserve(entry.target); to only animate once
        }
      });
    }, { threshold: 0.1 });

    const hiddenElements = document.querySelectorAll('.scroll-reveal');
    hiddenElements.forEach((el) => observer.observe(el));

    // Cleanup when component unmounts
    return () => observer.disconnect();
  }, [results]); // We add results here so dynamically loaded result-boxes also get observed

  const validateFiles = (files) => {
    const validFiles = [];
    const errors = [];

    for (let file of files) {
      if (!file.type.startsWith('image/')) {
        errors.push(`"${file.name}" is not an image file.`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        errors.push(`"${file.name}" is too large (max 10MB).`);
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
    setResults([]); 
    setError(null);

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
          headers: { 'Content-Type': 'multipart/form-data' },
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
        <h1 className="hero-title scroll-reveal">AI or Real? <span className="highlight-text">Image Detector</span></h1>
        <p className="hero-subtitle scroll-reveal delay-small">
          Uncover the truth behind images in an era of hyper-realistic generative AI. Our machine learning core provides sub-second deep analysis.
        </p>

        <div className="hero-upload-section scroll-reveal delay-med">
          <div
            className={`upload-glass-panel ${isDragOver ? 'drag-over' : ''}`}
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
            
            <div className="upload-icon-wrapper">
              <svg className="upload-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
              </svg>
            </div>
            
            <label htmlFor="hero-file-input" className="hero-upload-button">
              {isDragOver ? 'Drop to analyze' : 'Select Images or Drag & Drop'}
            </label>
            <p className="upload-limit">Max {MAX_FILES} images, highest precision achievable up to 10MB.</p>
            
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || selectedFiles.length === 0}
              className="action-button-glow"
            >
              <div className="button-content">
                 {isLoading ? (
                    <span className="spinner-text">Analyzing</span>
                 ) : (
                    `Scan ${selectedFiles.length} Image${selectedFiles.length !== 1 ? 's' : ''}`
                 )}
              </div>
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
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
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
          {error && <p className="hero-error scroll-reveal">{error}</p>}
        </div>
      </header>

      {results.length > 0 && (
        <section className="results-section">
          <div className="results-container">
            <h2 className="section-title scroll-reveal">Analysis Engine Report</h2>
            <div className="results-grid">
              {results.map((result, index) => (
                <div key={index} className="result-glass-card scroll-reveal">
                  <div className="result-image-wrapper">
                    <img src={previews[index]} alt={`Analyzed ${index + 1}`} className="result-image" />
                    {/* Overlay badge on the image itself */}
                    {!result.error && (
                      <div className={`result-badge ${result.is_ai ? 'badge-ai' : 'badge-real'}`}>
                        {result.is_ai ? 'AI-GENERATED' : 'AUTHENTIC'}
                      </div>
                    )}
                  </div>
                  
                  <div className="result-details">
                    {result.error ? (
                     <div className="error-state">
                        <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                        <h3>Analysis Failed</h3>
                     </div>
                    ) : (
                      <>
                        <div className="confidence-meter">
                          <div className="meter-label">
                            <span className="meter-text">Confidence Level</span>
                            <span className="meter-value">{Math.round(result.confidence * 100)}%</span>
                          </div>
                          <div className="meter-track">
                             <div 
                                className={`meter-fill ${result.is_ai ? 'fill-ai' : 'fill-real'}`} 
                                style={{ width: `${result.confidence * 100}%` }}
                             ></div>
                          </div>
                        </div>
                        <div className="reasoning-box">
                          <strong>Analysis Reasoning:</strong>
                          <p>{result.reason}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="features-section">
        <h2 className="section-title scroll-reveal">Engine Capabilities</h2>
        <div className="features-grid">
          
          <div className="feature-glass-box scroll-reveal">
            <div className="feature-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg></div>
            <h3>Surgically Accurate</h3>
            <p>Our deep learning pipeline spots minute structural anomalies impossible for the human eye to perceive.</p>
          </div>

          <div className="feature-glass-box scroll-reveal delay-small">
            <div className="feature-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg></div>
            <h3>Real-time Inference</h3>
            <p>Leveraging high-end tensor processing units to return verdicts in absolute milliseconds.</p>
          </div>

          <div className="feature-glass-box scroll-reveal delay-med">
             <div className="feature-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></div>
            <h3>Zero Data Retention</h3>
            <p>We value privacy. Your uploaded files are analyzed exclusively in memory and wiped instantaneously.</p>
          </div>

        </div>
      </section>

      <footer className="footer scroll-reveal">
        <p>&copy; 2024 Project Ascendant. Authenticating the digital fabric.</p>
      </footer>
    </div>
  );
}

export default Home;
