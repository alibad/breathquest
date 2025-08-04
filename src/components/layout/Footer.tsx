const Footer = () => {
  return (
    <footer>
      <h3 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>
        Let's Connect
      </h3>
      <p style={{ marginBottom: '2rem' }}>
        Built with passion for the future of human-AI interaction
      </p>
      <div className="contact-info">
        <a href="https://github.com/alibadereddin/breathquest" target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
        <a href="http://linkedin.com/in/alibad" target="_blank" rel="noopener noreferrer">
          LinkedIn
        </a>
        <a href="https://humanquest.net/deepdive" target="_blank" rel="noopener noreferrer">
          My Other Work
        </a>
      </div>
      <p style={{ 
        marginTop: '3rem', 
        color: 'var(--gray)', 
        fontSize: '0.9rem' 
      }}>
        © 2025 Breath Quest - A living experiment in embodied AI
      </p>
    </footer>
  );
};

export default Footer;