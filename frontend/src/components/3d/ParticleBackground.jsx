import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const ParticleBackground = () => {
  const containerRef = useRef(null);
  const mousePosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Clear any existing canvas from previous render
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 50;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    containerRef.current.appendChild(renderer.domElement);

    // Particles
    const particleCount = 2000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    const colorPalette = [
      new THREE.Color('#a020f0'), // Purple
      new THREE.Color('#8b17d9'), // Dark Purple
      new THREE.Color('#18c7d4'), // Cyan
      new THREE.Color('#c77dff'), // Light Purple
      new THREE.Color('#2cd4e9'), // Light Cyan
    ];

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Random position in a sphere
      const radius = 50 + Math.random() * 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);

      // Random color from palette
      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      // Random size
      sizes[i] = Math.random() * 2 + 0.5;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Custom shader material
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        pixelRatio: { value: renderer.getPixelRatio() },
      },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        uniform float time;
        uniform float pixelRatio;
        
        void main() {
          vColor = color;
          vec3 pos = position;
          
          // Animate position
          pos.x += sin(time * 0.5 + position.y * 0.02) * 2.0;
          pos.y += cos(time * 0.3 + position.x * 0.02) * 2.0;
          pos.z += sin(time * 0.4 + position.z * 0.02) * 2.0;
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * pixelRatio * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          
          float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
          gl_FragColor = vec4(vColor, alpha * 0.8);
        }
      `,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Connecting lines
    const lineGeometry = new THREE.BufferGeometry();
    const linePositions = new Float32Array(300 * 6);
    const lineColors = new Float32Array(300 * 6);
    
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));
    
    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
    });
    
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);

    // Mouse movement
    const handleMouseMove = (event) => {
      mousePosition.current = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: -(event.clientY / window.innerHeight) * 2 + 1,
      };
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Resize handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Animation loop
    const clock = new THREE.Clock();
    let animationId;
    let isAnimating = true;

    const animate = () => {
      if (!isAnimating) return;
      animationId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();
      material.uniforms.time.value = elapsedTime;

      // Rotate based on mouse position
      particles.rotation.x += (mousePosition.current.y * 0.1 - particles.rotation.x) * 0.05;
      particles.rotation.y += (mousePosition.current.x * 0.1 - particles.rotation.y) * 0.05;
      
      // Slow rotation
      particles.rotation.z = elapsedTime * 0.02;

      // Update lines based on particle positions
      const posArray = geometry.attributes.position.array;
      let lineIndex = 0;
      const maxDistance = 20;
      const lineColorAttr = lineGeometry.attributes.color.array;
      const linePosAttr = lineGeometry.attributes.position.array;

      for (let i = 0; i < Math.min(100, particleCount); i++) {
        for (let j = i + 1; j < Math.min(100, particleCount); j++) {
          if (lineIndex >= 300) break;

          const i3 = i * 3;
          const j3 = j * 3;

          const dx = posArray[i3] - posArray[j3];
          const dy = posArray[i3 + 1] - posArray[j3 + 1];
          const dz = posArray[i3 + 2] - posArray[j3 + 2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < maxDistance) {
            const lineI = lineIndex * 6;
            
            linePosAttr[lineI] = posArray[i3];
            linePosAttr[lineI + 1] = posArray[i3 + 1];
            linePosAttr[lineI + 2] = posArray[i3 + 2];
            linePosAttr[lineI + 3] = posArray[j3];
            linePosAttr[lineI + 4] = posArray[j3 + 1];
            linePosAttr[lineI + 5] = posArray[j3 + 2];

            const alpha = 1 - dist / maxDistance;
            lineColorAttr[lineI] = 0.6 * alpha;
            lineColorAttr[lineI + 1] = 0.1 * alpha;
            lineColorAttr[lineI + 2] = 0.9 * alpha;
            lineColorAttr[lineI + 3] = 0.6 * alpha;
            lineColorAttr[lineI + 4] = 0.1 * alpha;
            lineColorAttr[lineI + 5] = 0.9 * alpha;

            lineIndex++;
          }
        }
      }

      lineGeometry.attributes.position.needsUpdate = true;
      lineGeometry.attributes.color.needsUpdate = true;
      lineGeometry.setDrawRange(0, lineIndex * 2);

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      isAnimating = false;
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      
      geometry.dispose();
      material.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      renderer.dispose();
      
      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
};

export default ParticleBackground;
