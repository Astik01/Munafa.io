import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Box, useTheme } from '@mui/material';

const SIZE = 36;

function GlobeWidget() {
  const canvasRef = useRef(null);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(SIZE, SIZE);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 3.5;

    const sphereGeo = new THREE.SphereGeometry(1, 16, 12);
    const wireGeo = new THREE.WireframeGeometry(sphereGeo);
    const wireMat = new THREE.LineBasicMaterial({
      color: new THREE.Color('#5C6BC0'),
      transparent: true,
      opacity: isDark ? 0.5 : 0.35,
    });
    const wireframe = new THREE.LineSegments(wireGeo, wireMat);
    scene.add(wireframe);

    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      wireframe.rotation.y += 0.003;
      wireframe.rotation.x += 0.001;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      sphereGeo.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      renderer.dispose();
    };
  }, [isDark]);

  return (
    <Box sx={{ width: SIZE, height: SIZE, flexShrink: 0, display: { xs: 'none', md: 'block' } }}>
      <canvas ref={canvasRef} style={{ width: SIZE, height: SIZE, display: 'block' }} />
    </Box>
  );
}

export default GlobeWidget;
