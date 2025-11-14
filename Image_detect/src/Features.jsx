import React from 'react';
import './Home.css'; // Reuse styles from Home for consistency

function Features() {
  return (
    <div className="home-container">
      <header className="hero-section">
        <h1 className="hero-title animate-fade-in">Major Features</h1>
        <p className="hero-subtitle animate-slide-up">
          Explore the powerful capabilities of our AI Image Detector.
        </p>
      </header>

      <section className="features-section">
        <div className="features-grid">
          <div className="feature-card animate-slide-up">
            <h3>Upload Multiple Images</h3>
            <p>Effortlessly upload and analyze multiple images at once, saving time and increasing productivity.</p>
          </div>
          <div className="feature-card animate-slide-up-delay">
            <h3>Real-Time Processing</h3>
            <p>Get instant results with our advanced real-time image processing technology.</p>
          </div>
          <div className="feature-card animate-slide-up-delay-2">
            <h3>Accepting Various Formats</h3>
            <p>Supports a wide range of image formats including PNG, JPEG, JPG, and more for maximum compatibility.</p>
          </div>
          <div className="feature-card animate-slide-up-delay-3">
            <h3>Exporting/Download of Results</h3>
            <p>Download your analysis results in convenient formats for reporting and record-keeping.</p>
          </div>
          <div className="feature-card animate-slide-up-delay-4">
            <h3>High Accuracy Detection</h3>
            <p>Utilizes state-of-the-art AI models trained on millions of images for reliable AI vs. real image detection.</p>
          </div>
          <div className="feature-card animate-slide-up-delay-5">
            <h3>Secure & Private</h3>
            <p>Your images are processed securely and not stored permanently, ensuring your privacy.</p>
          </div>
        </div>
      </section>

      <footer className="footer">
        <p>&copy; 2024 AI Image Detector. Empowering truth in the digital age.</p>
      </footer>
    </div>
  );
}

export default Features;
