// Debug helpers
const DEBUG = true;
function debugLog(...args) {
  if (DEBUG) console.log(...args);
}

class BirdSimulator {
  constructor(canvasId) {
    console.log("Initializing 3D bird simulator");
    
    // Get canvas and setup renderer
    this.canvas = document.getElementById(canvasId);
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true, // Transparency support
      antialias: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 0); // Transparent background
    
    // Create scene
    this.scene = new THREE.Scene();
    
    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      60, // Field of view
      window.innerWidth / window.innerHeight, // Aspect ratio
      0.1, // Near clipping plane
      3000 // Far clipping plane
    );
    this.camera.position.set(0, 200, 500);
    this.camera.lookAt(0, 100, 0);
    
    // Add ambient light
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(this.ambientLight);
    
    // Add directional light (sun)
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.directionalLight.position.set(200, 400, 200);
    this.scene.add(this.directionalLight);
    
    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());
    
    // Birds collection
    this.birds = [];
    
    // Model settings
    this.storkModelPath = 'C:/Users/15033/Desktop/BirdsFinal/stork.glb'; // Direct full path
    
    // Mouse tracking for bird following
    this.mousePosition = new THREE.Vector3();
    this.raycaster = new THREE.Raycaster();
    this.followCursor = false;
    
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    
    // Add initial birds
    this.addInitialBirds();
    
    // Make simulator instance globally available
    window.simulator = this;
    
    // Start animation loop
    this.animate();
    
    console.log("3D bird simulator initialized");
  }
  
  onWindowResize() {
    // Update camera and renderer on window resize
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  onMouseMove(event) {
    // Calculate mouse position in normalized device coordinates
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Update the raycaster
    this.raycaster.setFromCamera(mouse, this.camera);
    
    // Calculate a point in 3D space for birds to target
    const dist = 500; // Distance from camera
    this.mousePosition = this.camera.position.clone()
      .add(this.raycaster.ray.direction.multiplyScalar(dist));
  }
  
  addInitialBirds() {
    console.log("Adding initial birds");
    const initialCount = 5;
    for (let i = 0; i < initialCount; i++) {
      this.addBird();
    }
  }
  
  addBird() {
    console.log("Adding a bird");
    const bird = new StorkBird3D(this.scene, this.storkModelPath);
    this.birds.push(bird);
    return bird;
  }
  
  setBirdFollowing(enabled) {
    this.followCursor = enabled;
    console.log("Bird following set to:", enabled);
  }
  
  // Add separation behavior to prevent birds from stacking
  applySeparation() {
    // Only apply separation if there are at least 2 birds
    if (this.birds.length < 2) return;
    
    // Define minimum separation distance
    const minSeparation = 100; // Minimum distance between birds
    const separationForce = 0.1; // How strongly birds separate (higher = more separation)
    
    for (let i = 0; i < this.birds.length; i++) {
      const bird = this.birds[i];
      
      // For each bird, check distance to all other birds
      for (let j = 0; j < this.birds.length; j++) {
        if (i === j) continue; // Skip self
        
        const otherBird = this.birds[j];
        
        // Calculate distance between birds
        const dx = bird.position.x - otherBird.position.x;
        const dy = bird.position.y - otherBird.position.y;
        const dz = bird.position.z - otherBird.position.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        // If birds are too close, apply separation force
        if (distance < minSeparation) {
          // Calculate separation force (stronger when closer)
          const force = (minSeparation - distance) / minSeparation;
          
          // Direction away from other bird
          const dirX = dx / distance || 0;
          const dirY = dy / distance || 0;
          const dirZ = dz / distance || 0;
          
          // Apply force to velocity (adjusted by separation strength)
          bird.velocity.x += dirX * force * separationForce;
          bird.velocity.y += dirY * force * separationForce;
          bird.velocity.z += dirZ * force * separationForce;
        }
      }
      
      // Re-normalize velocity to maintain speed
      const speed = Math.sqrt(
        bird.velocity.x * bird.velocity.x + 
        bird.velocity.y * bird.velocity.y + 
        bird.velocity.z * bird.velocity.z
      );
      
      if (speed > 0) {
        bird.velocity.x = (bird.velocity.x / speed) * bird.maxSpeed;
        bird.velocity.y = (bird.velocity.y / speed) * bird.maxSpeed;
        bird.velocity.z = (bird.velocity.z / speed) * bird.maxSpeed;
      }
    }
  }
  
  animate() {
    requestAnimationFrame(() => this.animate());
    
    // Calculate delta time
    const deltaTime = 0.016; // Approximately 60 FPS
    
    // Apply separation to keep birds from clumping
    this.applySeparation();
    
    // Update birds
    this.birds.forEach(bird => {
      // Apply cursor following if enabled
      if (this.followCursor) {
        const distanceToMouse = bird.position.distanceTo(this.mousePosition);
        if (distanceToMouse < 800) {
          // Attraction strength decreases with distance
          const strength = Math.max(0, 1 - distanceToMouse / 800) * 0.1;
          bird.moveToward(this.mousePosition, strength);
        }
      }
      
      // Update bird position and animation
      bird.update(deltaTime);
    });
    
    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }
}

// Initialize the simulator when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM content loaded, initializing simulator");
  const simulator = new BirdSimulator('simulatorCanvas');
});