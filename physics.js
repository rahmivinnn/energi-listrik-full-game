// Unity-style Physics Engine with Cannon.js
class PhysicsEngine {
    constructor() {
        this.world = null;
        this.bodies = new Map();
        this.constraints = new Map();
        this.contactMaterials = new Map();
        this.setupPhysics();
    }

    setupPhysics() {
        // Create physics world
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0);
        this.world.broadphase = new CANNON.NaiveBroadphase();
        this.world.solver.iterations = 10;
        this.world.solver.tolerance = 0.1;

        // Setup contact materials
        this.setupContactMaterials();

        // Setup default materials
        this.setupMaterials();
    }

    setupContactMaterials() {
        // Default material
        this.defaultMaterial = new CANNON.Material('default');
        
        // Electrical material
        this.electricalMaterial = new CANNON.Material('electrical');
        
        // Metal material
        this.metalMaterial = new CANNON.Material('metal');
        
        // Plastic material
        this.plasticMaterial = new CANNON.Material('plastic');
        
        // Contact between materials
        this.defaultContact = new CANNON.ContactMaterial(
            this.defaultMaterial,
            this.defaultMaterial,
            {
                friction: 0.4,
                restitution: 0.3
            }
        );
        
        this.electricalContact = new CANNON.ContactMaterial(
            this.electricalMaterial,
            this.electricalMaterial,
            {
                friction: 0.1,
                restitution: 0.8
            }
        );
        
        this.metalContact = new CANNON.ContactMaterial(
            this.metalMaterial,
            this.metalMaterial,
            {
                friction: 0.6,
                restitution: 0.2
            }
        );
        
        this.world.addContactMaterial(this.defaultContact);
        this.world.addContactMaterial(this.electricalContact);
        this.world.addContactMaterial(this.metalContact);
    }

    setupMaterials() {
        this.materials = {
            default: this.defaultMaterial,
            electrical: this.electricalMaterial,
            metal: this.metalMaterial,
            plastic: this.plasticMaterial
        };
    }

    createRigidBody(geometry, position, mass = 1, material = 'default') {
        let shape;
        
        if (geometry.type === 'BoxGeometry') {
            shape = new CANNON.Box(new CANNON.Vec3(
                geometry.parameters.width / 2,
                geometry.parameters.height / 2,
                geometry.parameters.depth / 2
            ));
        } else if (geometry.type === 'SphereGeometry') {
            shape = new CANNON.Sphere(geometry.parameters.radius);
        } else if (geometry.type === 'CylinderGeometry') {
            shape = new CANNON.Cylinder(
                geometry.parameters.radiusTop,
                geometry.parameters.radiusBottom,
                geometry.parameters.height,
                geometry.parameters.radialSegments
            );
        } else if (geometry.type === 'PlaneGeometry') {
            shape = new CANNON.Plane();
        } else {
            // Fallback to box
            shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
        }

        const body = new CANNON.Body({ mass: mass });
        body.addShape(shape);
        body.position.set(position.x, position.y, position.z);
        body.material = this.materials[material];
        
        this.world.addBody(body);
        this.bodies.set(body.id, body);
        
        return body;
    }

    createStaticBody(geometry, position, material = 'default') {
        return this.createRigidBody(geometry, position, 0, material);
    }

    createDynamicBody(geometry, position, mass = 1, material = 'default') {
        return this.createRigidBody(geometry, position, mass, material);
    }

    createConstraint(bodyA, bodyB, type = 'pointToPoint', options = {}) {
        let constraint;
        
        switch (type) {
            case 'pointToPoint':
                constraint = new CANNON.PointToPointConstraint(
                    bodyA,
                    options.pivotA || new CANNON.Vec3(0, 0, 0),
                    bodyB,
                    options.pivotB || new CANNON.Vec3(0, 0, 0)
                );
                break;
                
            case 'hinge':
                constraint = new CANNON.HingeConstraint(
                    bodyA,
                    bodyB,
                    options.options || {}
                );
                break;
                
            case 'distance':
                constraint = new CANNON.DistanceConstraint(
                    bodyA,
                    bodyB,
                    options.distance || 1
                );
                break;
                
            default:
                console.error(`Unknown constraint type: ${type}`);
                return null;
        }
        
        this.world.addConstraint(constraint);
        this.constraints.set(constraint.id, constraint);
        
        return constraint;
    }

    applyForce(bodyId, force, position = null) {
        const body = this.bodies.get(bodyId);
        if (body) {
            if (position) {
                body.applyForce(new CANNON.Vec3(force.x, force.y, force.z), 
                               new CANNON.Vec3(position.x, position.y, position.z));
            } else {
                body.applyForce(new CANNON.Vec3(force.x, force.y, force.z));
            }
        }
    }

    applyImpulse(bodyId, impulse, position = null) {
        const body = this.bodies.get(bodyId);
        if (body) {
            if (position) {
                body.applyImpulse(new CANNON.Vec3(impulse.x, impulse.y, impulse.z), 
                                 new CANNON.Vec3(position.x, position.y, position.z));
            } else {
                body.applyImpulse(new CANNON.Vec3(impulse.x, impulse.y, impulse.z));
            }
        }
    }

    setVelocity(bodyId, velocity) {
        const body = this.bodies.get(bodyId);
        if (body) {
            body.velocity.set(velocity.x, velocity.y, velocity.z);
        }
    }

    setAngularVelocity(bodyId, angularVelocity) {
        const body = this.bodies.get(bodyId);
        if (body) {
            body.angularVelocity.set(angularVelocity.x, angularVelocity.y, angularVelocity.z);
        }
    }

    getPosition(bodyId) {
        const body = this.bodies.get(bodyId);
        if (body) {
            return {
                x: body.position.x,
                y: body.position.y,
                z: body.position.z
            };
        }
        return null;
    }

    getRotation(bodyId) {
        const body = this.bodies.get(bodyId);
        if (body) {
            return {
                x: body.quaternion.x,
                y: body.quaternion.y,
                z: body.quaternion.z,
                w: body.quaternion.w
            };
        }
        return null;
    }

    setPosition(bodyId, position) {
        const body = this.bodies.get(bodyId);
        if (body) {
            body.position.set(position.x, position.y, position.z);
        }
    }

    setRotation(bodyId, rotation) {
        const body = this.bodies.get(bodyId);
        if (body) {
            body.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
        }
    }

    removeBody(bodyId) {
        const body = this.bodies.get(bodyId);
        if (body) {
            this.world.removeBody(body);
            this.bodies.delete(bodyId);
        }
    }

    removeConstraint(constraintId) {
        const constraint = this.constraints.get(constraintId);
        if (constraint) {
            this.world.removeConstraint(constraint);
            this.constraints.delete(constraintId);
        }
    }

    update(deltaTime) {
        this.world.step(deltaTime);
    }

    // Electrical physics simulation
    createElectricalField(center, radius, strength) {
        const field = {
            center: center,
            radius: radius,
            strength: strength,
            active: true
        };
        
        this.electricalFields = this.electricalFields || [];
        this.electricalFields.push(field);
        
        return field;
    }

    updateElectricalFields() {
        if (!this.electricalFields) return;
        
        this.electricalFields.forEach(field => {
            if (!field.active) return;
            
            this.bodies.forEach((body, bodyId) => {
                if (body.material === this.electricalMaterial) {
                    const distance = Math.sqrt(
                        Math.pow(body.position.x - field.center.x, 2) +
                        Math.pow(body.position.y - field.center.y, 2) +
                        Math.pow(body.position.z - field.center.z, 2)
                    );
                    
                    if (distance < field.radius) {
                        const force = field.strength / (distance * distance + 0.1);
                        const direction = new CANNON.Vec3(
                            (field.center.x - body.position.x) / distance,
                            (field.center.y - body.position.y) / distance,
                            (field.center.z - body.position.z) / distance
                        );
                        
                        body.applyForce(direction.scale(force));
                    }
                }
            });
        });
    }

    // Collision detection
    onCollision(callback) {
        this.world.addEventListener('postStep', () => {
            this.world.contacts.forEach(contact => {
                if (contact.getImpactVelocityAlongNormal() > 0.1) {
                    callback(contact);
                }
            });
        });
    }

    // Raycasting
    raycast(origin, direction, maxDistance = 100) {
        const ray = new CANNON.Ray(
            new CANNON.Vec3(origin.x, origin.y, origin.z),
            new CANNON.Vec3(direction.x, direction.y, direction.z)
        );
        
        const result = new CANNON.RaycastResult();
        ray.intersectWorld(this.world, result);
        
        if (result.hasHit) {
            return {
                hit: true,
                distance: result.distance,
                point: {
                    x: result.hitPoint.x,
                    y: result.hitPoint.y,
                    z: result.hitPoint.z
                },
                normal: {
                    x: result.hitNormal.x,
                    y: result.hitNormal.y,
                    z: result.hitNormal.z
                },
                body: result.body
            };
        }
        
        return { hit: false };
    }

    // Debug rendering
    createDebugRenderer(scene) {
        this.debugRenderer = new CANNON.DebugRenderer(scene);
        this.debugRenderer.setWorld(this.world);
        return this.debugRenderer;
    }

    renderDebug() {
        if (this.debugRenderer) {
            this.debugRenderer.render();
        }
    }
}

// Export for use in main game
window.PhysicsEngine = PhysicsEngine;