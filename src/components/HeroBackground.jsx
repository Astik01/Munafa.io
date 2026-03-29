import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Box, useTheme } from '@mui/material';

const PARTICLE_COUNT = 250;
const HEIGHT = 280;

function HeroBackground() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.parentElement.clientWidth;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(width, HEIGHT);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / HEIGHT, 0.1, 1000);
    camera.position.z = 200;

    // Particles
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const velocities = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 400;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 250;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
      velocities.push({
        x: (Math.random() - 0.5) * 0.15,
        y: (Math.random() - 0.5) * 0.15,
        z: (Math.random() - 0.5) * 0.1,
      });
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: new THREE.Color('#5C6BC0'),
      size: isDark ? 2.5 : 2,
      transparent: true,
      opacity: isDark ? 0.6 : 0.3,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Gentle lines between close particles (connection web)
    const lineMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color('#5C6BC0'),
      transparent: true,
      opacity: isDark ? 0.08 : 0.04,
    });

    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      const pos = geometry.attributes.position.array;
      const mx = (mouseRef.current.x / width - 0.5) * 30;
      const my = -(mouseRef.current.y / HEIGHT - 0.5) * 30;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        pos[i * 3]     += velocities[i].x;
        pos[i * 3 + 1] += velocities[i].y;
        pos[i * 3 + 2] += velocities[i].z;

        // Gentle mouse attraction
        const dx = mx - pos[i * 3] * 0.05;
        const dy = my - pos[i * 3 + 1] * 0.05;
        pos[i * 3]     += dx * 0.002;
        pos[i * 3 + 1] += dy * 0.002;

        // Wrap around
        if (pos[i * 3] > 200) pos[i * 3] = -200;
        if (pos[i * 3] < -200) pos[i * 3] = 200;
        if (pos[i * 3 + 1] > 130) pos[i * 3 + 1] = -130;
        if (pos[i * 3 + 1] < -130) pos[i * 3 + 1] = 130;
      }
      geometry.attributes.position.needsUpdate = true;

      particles.rotation.y += 0.0005;
      particles.rotation.x += 0.0002;

      renderer.render(scene, camera);
    };
    animate();

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    };

    const handleResize = () => {
      const w = canvas.parentElement.clientWidth;
      renderer.setSize(w, HEIGHT);
      camera.aspect = w / HEIGHT;
      camera.updateProjectionMatrix();
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      geometry.dispose();
      material.dispose();
      lineMaterial.dispose();
      renderer.dispose();
    };
  }, [isDark]);

  return (
    <Box sx={{ position: 'relative', width: '100%', height: HEIGHT, overflow: 'hidden', borderRadius: 3, mb: -2 }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: HEIGHT, position: 'absolute', top: 0, left: 0 }}
      />
    </Box>
  );
}

export default HeroBackground;
