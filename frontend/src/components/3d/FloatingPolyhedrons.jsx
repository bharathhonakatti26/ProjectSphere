import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const FloatingPolyhedrons = () => {
  const containerRef = useRef(null);
  const mousePosition = useRef({ x: 0, y: 0 });
  const targetMouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any existing canvas from previous render
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }

    // Get responsive size
    const getSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      return { width, height };
    };

    let { width, height } = getSize();

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 25;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    containerRef.current.appendChild(renderer.domElement);

    // Color palette - brighter colors
    const colors = [
      new THREE.Color('#a855f7'), // Purple
      new THREE.Color('#8b5cf6'), // Violet
      new THREE.Color('#7c3aed'), // Dark Violet
      new THREE.Color('#06b6d4'), // Cyan
      new THREE.Color('#22d3ee'), // Light Cyan
      new THREE.Color('#c084fc'), // Light Purple
      new THREE.Color('#e879f9'), // Pink
    ];

    // Geometry types
    const geometryTypes = [
      () => new THREE.DodecahedronGeometry(1, 0),
      () => new THREE.OctahedronGeometry(1, 0),
      () => new THREE.IcosahedronGeometry(1, 0),
      () => new THREE.TetrahedronGeometry(1, 0),
    ];

    // Create polyhedrons
    const polyhedrons = [];
    const polyhedronCount = 12;

    for (let i = 0; i < polyhedronCount; i++) {
      const geometryCreator = geometryTypes[Math.floor(Math.random() * geometryTypes.length)];
      const geometry = geometryCreator();
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      // Create edges geometry for wireframe effect
      const edgesGeometry = new THREE.EdgesGeometry(geometry);
      
      // Main solid material - more visible
      const solidMaterial = new THREE.MeshPhongMaterial({
        color: color,
        transparent: true,
        opacity: 0.25,
        shininess: 100,
        side: THREE.DoubleSide,
      });

      // Wireframe material - brighter
      const wireMaterial = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.9,
        linewidth: 2,
      });

      // Glow material
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.15,
        side: THREE.BackSide,
      });

      // Create meshes - larger scale
      const scale = 1 + Math.random() * 2.5;
      
      const solidMesh = new THREE.Mesh(geometry, solidMaterial);
      solidMesh.scale.set(scale, scale, scale);

      const wireframe = new THREE.LineSegments(edgesGeometry, wireMaterial);
      wireframe.scale.set(scale, scale, scale);

      const glowGeometry = geometryCreator();
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.scale.set(scale * 1.3, scale * 1.3, scale * 1.3);

      // Group them together
      const group = new THREE.Group();
      group.add(solidMesh);
      group.add(wireframe);
      group.add(glow);

      // Distribute in a more visible way - closer to camera
      const angle = (i / polyhedronCount) * Math.PI * 2;
      const radius = 8 + Math.random() * 12;
      group.position.x = Math.cos(angle) * radius;
      group.position.y = (Math.random() - 0.5) * 15;
      group.position.z = (Math.random() - 0.5) * 10;

      // Store animation data with more pronounced movement
      group.userData = {
        originalPos: group.position.clone(),
        rotationSpeed: {
          x: (Math.random() - 0.5) * 0.015,
          y: (Math.random() - 0.5) * 0.015,
          z: (Math.random() - 0.5) * 0.01,
        },
        floatSpeed: 0.5 + Math.random() * 0.8,
        floatAmplitude: 2 + Math.random() * 3,
        phase: Math.random() * Math.PI * 2,
        baseScale: scale,
        color: color,
        solidMaterial: solidMaterial,
        wireMaterial: wireMaterial,
        glowMaterial: glowMaterial,
        // For mouse hover interaction
        hoverScale: 1,
        targetHoverScale: 1,
      };

      scene.add(group);
      polyhedrons.push(group);
    }

    // Add some larger background polyhedrons
    for (let i = 0; i < 6; i++) {
      const geometryCreator = geometryTypes[Math.floor(Math.random() * geometryTypes.length)];
      const geometry = geometryCreator();
      const color = colors[Math.floor(Math.random() * colors.length)];
      const edgesGeometry = new THREE.EdgesGeometry(geometry);

      const wireMaterial = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.3,
      });

      const wireframe = new THREE.LineSegments(edgesGeometry, wireMaterial);
      const scale = 4 + Math.random() * 4;
      wireframe.scale.set(scale, scale, scale);

      wireframe.position.x = (Math.random() - 0.5) * 50;
      wireframe.position.y = (Math.random() - 0.5) * 30;
      wireframe.position.z = -15 - Math.random() * 15;

      wireframe.userData = {
        rotationSpeed: {
          x: (Math.random() - 0.5) * 0.008,
          y: (Math.random() - 0.5) * 0.008,
          z: (Math.random() - 0.5) * 0.005,
        },
        floatSpeed: 0.2 + Math.random() * 0.3,
        floatAmplitude: 1 + Math.random() * 2,
        phase: Math.random() * Math.PI * 2,
        originalPos: wireframe.position.clone(),
      };

      scene.add(wireframe);
      polyhedrons.push(wireframe);
    }

    // Lighting - brighter
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0xa855f7, 3, 100);
    pointLight1.position.set(20, 20, 20);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x06b6d4, 3, 100);
    pointLight2.position.set(-20, -20, 20);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0x8b5cf6, 2, 80);
    pointLight3.position.set(0, 30, -10);
    scene.add(pointLight3);

    // Mouse tracking on window
    const handleMouseMove = (event) => {
      targetMouse.current = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: -(event.clientY / window.innerHeight) * 2 + 1,
      };
    };

    // Resize handler
    const handleResize = () => {
      const size = getSize();
      width = size.width;
      height = size.height;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    // Animation
    const clock = new THREE.Clock();
    let animationId;
    let isAnimating = true;

    const animate = () => {
      if (!isAnimating) return;
      animationId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse follow
      mousePosition.current.x += (targetMouse.current.x - mousePosition.current.x) * 0.05;
      mousePosition.current.y += (targetMouse.current.y - mousePosition.current.y) * 0.05;

      // Animate polyhedrons
      polyhedrons.forEach((poly, index) => {
        const { rotationSpeed, floatSpeed, floatAmplitude, phase, originalPos, baseScale } = poly.userData;

        // Always rotate
        poly.rotation.x += rotationSpeed.x;
        poly.rotation.y += rotationSpeed.y;
        poly.rotation.z += rotationSpeed.z;

        // Floating motion for all polyhedrons with originalPos
        if (originalPos) {
          // Smooth floating motion
          const floatX = Math.sin(elapsedTime * floatSpeed + phase) * floatAmplitude;
          const floatY = Math.cos(elapsedTime * floatSpeed * 0.7 + phase) * floatAmplitude;
          const floatZ = Math.sin(elapsedTime * floatSpeed * 0.4 + phase * 0.5) * floatAmplitude * 0.3;

          poly.position.x = originalPos.x + floatX;
          poly.position.y = originalPos.y + floatY;
          poly.position.z = originalPos.z + floatZ;

          // Mouse parallax effect - shapes follow mouse
          const parallaxStrength = 3 + (index % 5) * 0.5;
          poly.position.x += mousePosition.current.x * parallaxStrength;
          poly.position.y += mousePosition.current.y * parallaxStrength * 0.5;

          // Pulse glow effect
          if (poly.userData.glowMaterial) {
            poly.userData.glowMaterial.opacity = 0.1 + Math.sin(elapsedTime * 2.5 + index) * 0.08;
          }

          // Pulse wireframe opacity
          if (poly.userData.wireMaterial) {
            poly.userData.wireMaterial.opacity = 0.7 + Math.sin(elapsedTime * 2 + index * 0.3) * 0.2;
          }

          // Scale pulse for main polyhedrons
          if (baseScale && poly.children) {
            const pulseScale = baseScale * (1 + Math.sin(elapsedTime * 1.8 + index * 0.4) * 0.08);
            poly.children.forEach(child => {
              if (child.type === 'Mesh' && child.material.side !== THREE.BackSide) {
                child.scale.setScalar(pulseScale);
              } else if (child.type === 'LineSegments') {
                child.scale.setScalar(pulseScale);
              } else if (child.type === 'Mesh') {
                // Glow mesh
                child.scale.setScalar(pulseScale * 1.3);
              }
            });
          }
        }
      });

      // Camera subtle movement based on mouse
      camera.position.x = mousePosition.current.x * 4;
      camera.position.y = mousePosition.current.y * 3;
      camera.lookAt(0, 0, 0);

      // Animate lights in circular motion
      pointLight1.position.x = Math.sin(elapsedTime * 0.4) * 25;
      pointLight1.position.y = Math.cos(elapsedTime * 0.4) * 25;
      pointLight2.position.x = Math.cos(elapsedTime * 0.3) * 25;
      pointLight2.position.y = Math.sin(elapsedTime * 0.3) * 25;

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

      polyhedrons.forEach((poly) => {
        if (poly.children) {
          poly.children.forEach((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
          });
        }
        if (poly.geometry) poly.geometry.dispose();
        if (poly.material) poly.material.dispose();
      });

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
        zIndex: 1,
        pointerEvents: 'none',
      }}
    />
  );
};

export default FloatingPolyhedrons;
