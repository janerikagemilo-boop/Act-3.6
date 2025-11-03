import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import GUI from 'lil-gui';

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a2a);

// Sizes
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
};

// Camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 1000);
camera.position.set(0, 20, 50);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.maxDistance = 200;
controls.minDistance = 10;

// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

// Planet Configuration System
class PlanetConfig {
    constructor(params) {
        this.radius = params.radius || 1;
        this.color = params.color || 0xffffff;
        this.atmosphereColor = params.atmosphereColor || params.color || 0xffffff;
        this.atmosphereThickness = params.atmosphereThickness || 0.1;
        this.atmosphereOpacity = params.atmosphereOpacity || 0.2;
        this.orbitRadius = params.orbitRadius || 0;
        this.rotationSpeed = params.rotationSpeed || 0.005;
        this.orbitSpeed = params.orbitSpeed || 0.001;
        this.hasRings = params.hasRings || false;
        this.ringColor = params.ringColor || 0xffffff;
        this.ringInnerRadius = params.ringInnerRadius;
        this.ringOuterRadius = params.ringOuterRadius;
    }
}

// Create Sun
const createSun = () => {
    const sunGeometry = new THREE.SphereGeometry(8, 64, 64);
    const sunMaterial = new THREE.MeshBasicMaterial({
        color: 0xffdd00,
        transparent: true,
        opacity: 0.9
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    
    // Add glow effect
    const sunGlowGeometry = new THREE.SphereGeometry(8.5, 64, 64);
    const sunGlowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffdd00,
        transparent: true,
        opacity: 0.3,
        side: THREE.BackSide
    });
    const sunGlow = new THREE.Mesh(sunGlowGeometry, sunGlowMaterial);
    sun.add(sunGlow);
    
    return sun;
};

// Standardized Planet Creation System
class SolarSystem {
    constructor() {
        this.planets = new Map();
        this.planetGroup = new THREE.Group();
        scene.add(this.planetGroup);
        
        // Add sun
        this.sun = createSun();
        this.planetGroup.add(this.sun);
        
        // Add orbit lines
        this.createOrbitLines();
    }
    
    createOrbitLines() {
        const orbitLines = new THREE.Group();
        for(let i = 0; i < 8; i++) {
            const radius = (i + 1) * 15;
            const geometry = new THREE.RingGeometry(radius - 0.1, radius + 0.1, 128);
            const material = new THREE.MeshBasicMaterial({
                color: 0x666666,
                transparent: true,
                opacity: 0.2,
                side: THREE.DoubleSide
            });
            const orbitLine = new THREE.Mesh(geometry, material);
            orbitLine.rotation.x = -Math.PI / 2;
            orbitLines.add(orbitLine);
        }
        this.planetGroup.add(orbitLines);
    }

    createPlanet(name, config) {
        const planet = new THREE.Group();
        
        // Planet sphere
        const planetGeometry = new THREE.SphereGeometry(config.radius, 32, 32);
        const planetMaterial = new THREE.MeshStandardMaterial({
            color: config.color,
            roughness: 0.7,
            metalness: 0.3
        });
        const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
        
        // Atmosphere
        if (config.atmosphereOpacity > 0) {
            const atmosphereGeometry = new THREE.SphereGeometry(
                config.radius * (1 + config.atmosphereThickness),
                32,
                32
            );
            const atmosphereMaterial = new THREE.MeshPhongMaterial({
                color: config.atmosphereColor,
                transparent: true,
                opacity: config.atmosphereOpacity,
                side: THREE.BackSide
            });
            const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
            planet.add(atmosphere);
        }
        
        // Rings (for Saturn)
        if (config.hasRings) {
            const ringGeometry = new THREE.RingGeometry(
                config.ringInnerRadius,
                config.ringOuterRadius,
                64
            );
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: config.ringColor,
                transparent: true,
                opacity: 0.7,
                side: THREE.DoubleSide
            });
            const rings = new THREE.Mesh(ringGeometry, ringMaterial);
            rings.rotation.x = Math.PI / 2;
            planet.add(rings);
        }
        
        planet.add(planetMesh);
        this.planets.set(name, {
            group: planet,
            config: config,
            mesh: planetMesh
        });
        
        this.planetGroup.add(planet);
        return planet;
    }

    updatePlanets(time) {
        this.planets.forEach((planet, name) => {
            // Rotation
            planet.mesh.rotation.y += planet.config.rotationSpeed;
            
            // Orbital motion
            const angle = time * planet.config.orbitSpeed;
            planet.group.position.x = Math.cos(angle) * planet.config.orbitRadius;
            planet.group.position.z = Math.sin(angle) * planet.config.orbitRadius;
        });
        
        // Rotate sun
        this.sun.rotation.y += 0.001;
    }
}

// Create solar system
const solarSystem = new SolarSystem();

// Planet configurations
const planetConfigs = {
    mercury: new PlanetConfig({
        radius: 0.8,
        color: 0xa8a8a8,
        orbitRadius: 15,
        orbitSpeed: 0.008,
        rotationSpeed: 0.004
    }),
    venus: new PlanetConfig({
        radius: 1.2,
        color: 0xe6b88a,
        orbitRadius: 30,
        orbitSpeed: 0.007,
        rotationSpeed: 0.003
    }),
    earth: new PlanetConfig({
        radius: 1.4,
        color: 0x2233ff,
        atmosphereColor: 0x4477ff,
        atmosphereOpacity: 0.2,
        orbitRadius: 45,
        orbitSpeed: 0.006,
        rotationSpeed: 0.005
    }),
    mars: new PlanetConfig({
        radius: 1.0,
        color: 0xff4422,
        orbitRadius: 60,
        orbitSpeed: 0.005,
        rotationSpeed: 0.004
    }),
    jupiter: new PlanetConfig({
        radius: 4.0,
        color: 0xd8ca9d,
        orbitRadius: 75,
        orbitSpeed: 0.004,
        rotationSpeed: 0.007
    }),
    saturn: new PlanetConfig({
        radius: 3.5,
        color: 0xead6b8,
        orbitRadius: 90,
        orbitSpeed: 0.003,
        rotationSpeed: 0.006,
        hasRings: true,
        ringColor: 0xc2b280,
        ringInnerRadius: 4.5,
        ringOuterRadius: 7
    }),
    uranus: new PlanetConfig({
        radius: 2.5,
        color: 0x88ccff,
        orbitRadius: 105,
        orbitSpeed: 0.002,
        rotationSpeed: 0.005
    }),
    neptune: new PlanetConfig({
        radius: 2.3,
        color: 0x3456ff,
        orbitRadius: 120,
        orbitSpeed: 0.001,
        rotationSpeed: 0.005
    })
};

// Create all planets
Object.entries(planetConfigs).forEach(([name, config]) => {
    solarSystem.createPlanet(name, config);
});

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
scene.add(ambientLight);

const sunLight = new THREE.PointLight(0xffffff, 2, 300, 1);
scene.add(sunLight);

// Stars background
const createStars = () => {
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 2000;
    const positions = new Float32Array(starsCount * 3);
    const sizes = new Float32Array(starsCount);
    
    for(let i = 0; i < starsCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 300;
        positions[i + 1] = (Math.random() - 0.5) * 300;
        positions[i + 2] = (Math.random() - 0.5) * 300;
        sizes[i / 3] = Math.random() * 2;
    }
    
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starsGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.8,
        size: 0.5
    });
    
    return new THREE.Points(starsGeometry, starsMaterial);
};

const stars = createStars();
scene.add(stars);

// GUI
const gui = new GUI();
const parameters = {
    autoRotate: true,
    rotationSpeed: 1
};

// Solar System controls
const solarSystemFolder = gui.addFolder('Solar System');
solarSystemFolder.add(parameters, 'autoRotate').name('Auto Rotate');
solarSystemFolder.add(parameters, 'rotationSpeed', 0.1, 5, 0.1).name('Speed Multiplier');

// Animation
const tick = () => {
    if (parameters.autoRotate) {
        const time = performance.now() * 0.001 * parameters.rotationSpeed;
        solarSystem.updatePlanets(time);
    }
    
    // Update controls
    controls.update();
    
    // Render
    renderer.render(scene, camera);
    
    window.requestAnimationFrame(tick);
};

tick();

// Handle window resize
window.addEventListener('resize', () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();
    
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});