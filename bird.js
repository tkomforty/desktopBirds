// StorkBird3D class - using the stork.glb model
class StorkBird3D {
  constructor(scene, modelPath, options = {}) {
    this.scene = scene;
    this.model = null;
    this.mixer = null;
    this.animations = [];
    this.clock = new THREE.Clock();
    
    // Position and movement
    this.position = options.position || new THREE.Vector3(
      Math.random() * 1000 - 500,
      Math.random() * 300 + 100,
      Math.random() * 1000 - 500
    );
    
    this.velocity = options.velocity || new THREE.Vector3(
      Math.random() * 2 - 1,
      Math.random() * 0.5 - 0.25,
      Math.random() * 2 - 1
    ).normalize().multiplyScalar(1 + Math.random());
    
    this.maxSpeed = options.maxSpeed || 2 + Math.random() * 1;
    this.acceleration = options.acceleration || 0.05;
    
    // Size and scale
    this.scale = options.scale || 0.5 + Math.random() * 0.5;
    
    // Simple placeholder until model loads
    this.createPlaceholder();
    
    // Load the 3D model
    this.loadModel(modelPath || 'stork.glb');
  }
  
  createPlaceholder() {
    // Create a simple placeholder until the model loads
    const geometry = new THREE.SphereGeometry(5, 8, 8);
    const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    this.placeholder = new THREE.Mesh(geometry, material);
    this.placeholder.position.copy(this.position);
    this.scene.add(this.placeholder);
  }
  
  loadModel(modelPath) {
    console.log("Loading stork model from:", modelPath);
    
    if (!modelPath) {
      console.error("No model path provided!");
      if (this.placeholder) {
        this.placeholder.material.color.set(0xff0000); // Red to indicate error
      }
      return;
    }
    
    // Create loader
    const loader = new THREE.GLTFLoader();
    
    // Use the file system to load the model directly
    try {
      const fs = require('fs');
      
      // Check if file exists
      console.log("Checking if file exists:", modelPath);
      if (fs.existsSync(modelPath)) {
        console.log("File exists, loading...");
        
        // Read the file as binary
        const modelData = fs.readFileSync(modelPath);
        
        // Convert to array buffer
        const arrayBuffer = new Uint8Array(modelData).buffer;
        
        // Parse the model data
        loader.parse(
          arrayBuffer,
          '',
          (gltf) => {
            console.log("Model parsed successfully!");
            
            // Remove placeholder
            if (this.placeholder) {
              this.scene.remove(this.placeholder);
              this.placeholder = null;
            }
            
            // Store the model
            this.model = gltf.scene;
            
            // Store animations
            if (gltf.animations && gltf.animations.length > 0) {
              console.log("Model has animations:", gltf.animations.length);
              this.animations = gltf.animations;
              
              // Create animation mixer
              this.mixer = new THREE.AnimationMixer(this.model);
              
              // Play first animation (typically flying)
              if (this.animations.length > 0) {
                const action = this.mixer.clipAction(this.animations[0]);
                action.play();
              }
            }
            
            // Scale the model
            this.model.scale.set(this.scale, this.scale, this.scale);
            
            // Set initial position
            this.model.position.copy(this.position);
            
            // Add to scene
            this.scene.add(this.model);
          },
          (error) => {
            console.error("Error parsing model:", error);
            if (this.placeholder) {
              this.placeholder.material.color.set(0xff0000); // Red to indicate error
            }
          }
        );
      } else {
        console.error("File not found:", modelPath);
        if (this.placeholder) {
          this.placeholder.material.color.set(0xff0000); // Red to indicate error
        }
      }
    } catch (error) {
      console.error("Error loading model with fs:", error);
      if (this.placeholder) {
        this.placeholder.material.color.set(0xff0000); // Red to indicate error
      }
    }
  }
  
  update(deltaTime) {
    // Update animation mixer
    if (this.mixer) {
      this.mixer.update(deltaTime);
    }
    
    // Add some random movement
    if (Math.random() < 0.02) {
      this.velocity.x += (Math.random() * 2 - 1) * this.acceleration;
      this.velocity.y += (Math.random() * 2 - 1) * this.acceleration * 0.5;
      this.velocity.z += (Math.random() * 2 - 1) * this.acceleration;
      
      // Normalize and scale
      if (this.velocity.length() > 0) {
        this.velocity.normalize().multiplyScalar(this.maxSpeed);
      }
    }
    
    // Keep birds from going too high or too low
    if (this.position.y < 50) {
      this.velocity.y += this.acceleration * 2;
    } else if (this.position.y > 500) {
      this.velocity.y -= this.acceleration * 2;
    }
    
    // Update position
    this.position.add(this.velocity);
    
    // Update model position
    if (this.model) {
      this.model.position.copy(this.position);
      
      // Update rotation to face direction of movement
      if (this.velocity.length() > 0) {
        this.model.lookAt(this.position.clone().add(this.velocity));
      }
    } else if (this.placeholder) {
      this.placeholder.position.copy(this.position);
    }
    
    // Wrap around boundaries
    const bounds = 1000;
    if (this.position.x < -bounds) this.position.x = bounds;
    if (this.position.x > bounds) this.position.x = -bounds;
    if (this.position.z < -bounds) this.position.z = bounds;
    if (this.position.z > bounds) this.position.z = -bounds;
  }
  
  moveToward(target, strength = 0.1) {
    // Calculate direction to target
    const direction = new THREE.Vector3()
      .subVectors(target, this.position)
      .normalize();
    
    // Add to velocity
    this.velocity.lerp(direction.multiplyScalar(this.maxSpeed), strength);
  }
  
  remove() {
    if (this.model) {
      this.scene.remove(this.model);
    }
    if (this.placeholder) {
      this.scene.remove(this.placeholder);
    }
  }
}