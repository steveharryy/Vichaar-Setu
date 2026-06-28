const AnimatedBackground = () => {
  return (
    <div className="animated-bg">
      {/* Base mesh gradient */}
      <div className="mesh-gradient" />
      
      {/* Floating color orbs - slow, organic movement */}
      <div className="floating-orb floating-orb-1" />
      <div className="floating-orb floating-orb-2" />
      <div className="floating-orb floating-orb-3" />
      
      {/* Subtle grid for structure */}
      <div className="grid-lines" />
      
      {/* Film grain for texture */}
      <div className="grain-overlay" />
    </div>
  );
};

export default AnimatedBackground;