import * as THREE from 'three';

export class CharacterModel {
  static create(assetGen, options = {}) {
    const {
      hairColor = 0xff7eb3, // Pastel pink default
      hairStyle = 'twintails', // 'twintails', 'spiky', 'bob'
      outfitColor = 0x38bdf8, // Sky blue hoodie
      pantsColor = 0x334155, // Dark denim
      isPlayer = false
    } = options;

    const group = new THREE.Group();

    // Materials
    const skinMat = assetGen.createToonMaterial(0xffdfd3); // Warm anime peach skin
    const hairMat = assetGen.createToonMaterial(hairColor);
    const outfitMat = assetGen.createToonMaterial(outfitColor);
    const pantsMat = assetGen.createToonMaterial(pantsColor);
    const eyeWhiteMat = assetGen.createToonMaterial(0xffffff);
    const eyeIrisMat = assetGen.createToonMaterial(0x3b82f6);
    const shoeMat = assetGen.createToonMaterial(0xffffff);

    // 1. Torso / Hoodie
    const torsoGeo = new THREE.BoxGeometry(0.7, 0.9, 0.45);
    const torso = new THREE.Mesh(torsoGeo, outfitMat);
    torso.position.y = 1.15;
    torso.castShadow = true;
    group.add(torso);

    // 2. Head with cute anime proportions (chibi-stylized)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.85, 0);

    const headGeo = new THREE.SphereGeometry(0.42, 16, 16);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.castShadow = true;
    headGroup.add(head);

    // Cute Anime Eyes (Big expressive eyes)
    [-0.14, 0.14].forEach(xOff => {
      // White sclera
      const eyeWhiteGeo = new THREE.PlaneGeometry(0.12, 0.16);
      const eyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
      eyeWhite.position.set(xOff, 0.04, 0.4);
      headGroup.add(eyeWhite);

      // Colored Iris
      const eyeIrisGeo = new THREE.PlaneGeometry(0.08, 0.11);
      const eyeIris = new THREE.Mesh(eyeIrisGeo, eyeIrisMat);
      eyeIris.position.set(xOff, 0.03, 0.405);
      headGroup.add(eyeIris);

      // Anime sparkle highlight
      const sparkleGeo = new THREE.PlaneGeometry(0.035, 0.035);
      const sparkle = new THREE.Mesh(sparkleGeo, eyeWhiteMat);
      sparkle.position.set(xOff + 0.02, 0.06, 0.41);
      headGroup.add(sparkle);

      // Blush cheek
      const blushGeo = new THREE.PlaneGeometry(0.1, 0.04);
      const blushMat = assetGen.createToonMaterial(0xff4081, { transparent: true, opacity: 0.6 });
      const blush = new THREE.Mesh(blushGeo, blushMat);
      blush.position.set(xOff * 1.35, -0.1, 0.39);
      headGroup.add(blush);
    });

    // 3. Hair Styles
    const hairCapGeo = new THREE.SphereGeometry(0.45, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.65);
    const hairCap = new THREE.Mesh(hairCapGeo, hairMat);
    hairCap.position.y = 0.08;
    headGroup.add(hairCap);

    // Bangs
    const bangGeo = new THREE.ConeGeometry(0.12, 0.3, 4);
    bangGeo.rotateX(Math.PI / 1.1);
    for (let b = -2; b <= 2; b++) {
      const bang = new THREE.Mesh(bangGeo, hairMat);
      bang.position.set(b * 0.09, 0.18, 0.38);
      headGroup.add(bang);
    }

    if (hairStyle === 'twintails') {
      // Cute twin tails on both sides
      [-0.45, 0.45].forEach((tx, i) => {
        const tailGeo = new THREE.ConeGeometry(0.15, 0.8, 8);
        tailGeo.rotateZ(i === 0 ? 0.3 : -0.3);
        const tail = new THREE.Mesh(tailGeo, hairMat);
        tail.position.set(tx, 0.1, -0.1);
        headGroup.add(tail);
      });
    } else if (hairStyle === 'spiky') {
      // Shonen anime spiky hair tufts
      for (let s = 0; s < 6; s++) {
        const spikeGeo = new THREE.ConeGeometry(0.15, 0.45, 4);
        const spike = new THREE.Mesh(spikeGeo, hairMat);
        const ang = (s / 6) * Math.PI * 2;
        spike.position.set(Math.cos(ang) * 0.3, 0.38, Math.sin(ang) * 0.3);
        spike.rotation.x = Math.sin(ang) * 0.4;
        spike.rotation.z = -Math.cos(ang) * 0.4;
        headGroup.add(spike);
      }
    }

    group.add(headGroup);

    // 4. Arms
    const armGeo = new THREE.CylinderGeometry(0.1, 0.09, 0.75, 8);
    armGeo.translate(0, -0.35, 0);

    const leftArm = new THREE.Mesh(armGeo, outfitMat);
    leftArm.position.set(-0.48, 1.5, 0);
    leftArm.castShadow = true;

    const rightArm = new THREE.Mesh(armGeo, outfitMat);
    rightArm.position.set(0.48, 1.5, 0);
    rightArm.castShadow = true;

    group.add(leftArm, rightArm);

    // 5. Legs & Shoes
    const legGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.7, 8);
    legGeo.translate(0, -0.35, 0);

    const leftLeg = new THREE.Mesh(legGeo, pantsMat);
    leftLeg.position.set(-0.2, 0.7, 0);
    leftLeg.castShadow = true;

    const rightLeg = new THREE.Mesh(legGeo, pantsMat);
    rightLeg.position.set(0.2, 0.7, 0);
    rightLeg.castShadow = true;

    // Shoes
    const shoeGeo = new THREE.BoxGeometry(0.2, 0.15, 0.32);
    shoeGeo.translate(0, -0.72, 0.05);
    const leftShoe = new THREE.Mesh(shoeGeo, shoeMat);
    const rightShoe = new THREE.Mesh(shoeGeo, shoeMat);
    leftLeg.add(leftShoe);
    rightLeg.add(rightShoe);

    group.add(leftLeg, rightLeg);

    // Store limb references for animation
    return {
      root: group,
      head: headGroup,
      torso: torso,
      leftArm: leftArm,
      rightArm: rightArm,
      leftLeg: leftLeg,
      rightLeg: rightLeg,
      animTime: 0,

      // Procedural character animation state
      animate(state, speed = 1, delta = 0.016) {
        this.animTime += delta * speed * 8;
        const t = this.animTime;

        if (state === 'idle') {
          // Gentle breathing bob
          this.torso.position.y = 1.15 + Math.sin(t * 0.5) * 0.02;
          this.head.position.y = 1.85 + Math.sin(t * 0.5) * 0.025;
          this.leftArm.rotation.x = Math.sin(t * 0.5) * 0.05;
          this.rightArm.rotation.x = -Math.sin(t * 0.5) * 0.05;
          this.leftArm.rotation.z = 0.1;
          this.rightArm.rotation.z = -0.1;
          this.leftLeg.rotation.x = 0;
          this.rightLeg.rotation.x = 0;
          this.leftLeg.position.y = 0.7;
          this.rightLeg.position.y = 0.7;
        } else if (state === 'walk') {
          // Natural walking cycle
          const swing = Math.sin(t);
          this.leftLeg.rotation.x = swing * 0.6;
          this.rightLeg.rotation.x = -swing * 0.6;
          this.leftArm.rotation.x = -swing * 0.5;
          this.rightArm.rotation.x = swing * 0.5;
          this.torso.position.y = 1.15 + Math.abs(Math.sin(t * 2)) * 0.04;
          this.head.position.y = 1.85 + Math.abs(Math.sin(t * 2)) * 0.04;
        } else if (state === 'sprint') {
          // Dynamic anime sprint: arms trailing back or pumping fast, deeper forward lean
          const sprintSwing = Math.sin(t * 1.5);
          this.leftLeg.rotation.x = sprintSwing * 0.9;
          this.rightLeg.rotation.x = -sprintSwing * 0.9;
          this.leftArm.rotation.x = -1.1 + Math.sin(t * 1.5) * 0.2; // Anime airplane run flare
          this.rightArm.rotation.x = -1.1 - Math.sin(t * 1.5) * 0.2;
          this.leftArm.rotation.z = 0.35;
          this.rightArm.rotation.z = -0.35;
          this.torso.rotation.x = 0.28; // Lean forward
          this.head.rotation.x = -0.15;
          this.torso.position.y = 1.1 + Math.abs(Math.sin(t * 3)) * 0.06;
          this.head.position.y = 1.8 + Math.abs(Math.sin(t * 3)) * 0.06;
        } else if (state === 'jump') {
          // Airborne pose
          this.leftLeg.rotation.x = -0.4;
          this.rightLeg.rotation.x = 0.3;
          this.leftArm.rotation.x = 0.8;
          this.rightArm.rotation.x = 0.8;
          this.torso.rotation.x = 0;
        } else if (state === 'drive') {
          // Seated driving pose
          this.torso.position.set(0, 0.45, 0);
          this.torso.rotation.x = 0.1;
          this.head.position.set(0, 1.15, 0);
          this.head.rotation.x = 0;
          this.leftLeg.rotation.x = -Math.PI / 2.2;
          this.rightLeg.rotation.x = -Math.PI / 2.2;
          this.leftLeg.position.set(-0.2, 0.25, 0.3);
          this.rightLeg.position.set(0.2, 0.25, 0.3);
          this.leftArm.rotation.x = 0.85;
          this.rightArm.rotation.x = 0.85;
          this.leftArm.rotation.y = 0.3;
          this.rightArm.rotation.y = -0.3;
        }
      }
    };
  }
}
