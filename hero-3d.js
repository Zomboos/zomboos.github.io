(function initHero3d() {
    if (typeof THREE === 'undefined') return;

    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;

    const wrap = canvas.parentElement;
    if (!wrap) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let renderer;
    try {
        renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance',
        });
    } catch {
        return;
    }

    const gl = renderer.getContext();
    if (!gl) return;

    canvas.style.width = '';
    canvas.style.height = '';

    renderer.setClearColor(0x000000, 0);

    if (THREE.SRGBColorSpace !== undefined) {
        renderer.outputColorSpace = THREE.SRGBColorSpace;
    } else if (THREE.sRGBEncoding !== undefined) {
        renderer.outputEncoding = THREE.sRGBEncoding;
    }

    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.sortObjects = true;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060911, 0.05);

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0, 8.5);

    scene.add(new THREE.AmbientLight(0xc7dbff, 0.85));

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.75);
    keyLight.position.set(4.5, 5.2, 6.2);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x7fb1ff, 0.65);
    fillLight.position.set(-4.4, 2.5, 3.2);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0x234dff, 2.4, 18, 2);
    rimLight.position.set(-1.8, 1.1, 4.5);
    scene.add(rimLight);

    const underLight = new THREE.PointLight(0x142891, 1.35, 14, 2);
    underLight.position.set(0.6, -2.7, 3.2);
    scene.add(underLight);

    const root = new THREE.Group();
    scene.add(root);

    const emblemRig = new THREE.Group();
    root.add(emblemRig);

    const emblem = new THREE.Group();
    emblemRig.add(emblem);

    function makeWireNode(geometry, color, opacity) {
        return new THREE.LineSegments(
            new THREE.WireframeGeometry(geometry),
            new THREE.LineBasicMaterial({
                color,
                transparent: true,
                opacity,
                depthWrite: false,
            })
        );
    }

    function clamp01(value) {
        return Math.min(1, Math.max(0, value));
    }

    function makeGlowTexture() {
        const glowCanvas = document.createElement('canvas');
        glowCanvas.width = 256;
        glowCanvas.height = 256;

        const ctx = glowCanvas.getContext('2d');
        if (!ctx) return null;

        const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.25, 'rgba(183,212,255,0.95)');
        gradient.addColorStop(0.62, 'rgba(39,69,255,0.28)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 256, 256);

        const texture = new THREE.CanvasTexture(glowCanvas);
        texture.needsUpdate = true;
        return texture;
    }

    const glowTexture = makeGlowTexture();

    const aura = glowTexture
        ? new THREE.Sprite(new THREE.SpriteMaterial({
            map: glowTexture,
            color: 0x2a46ff,
            transparent: true,
            opacity: 0.25,
            depthWrite: false,
            depthTest: false,
            blending: THREE.AdditiveBlending,
        }))
        : null;

    if (aura) {
        aura.scale.set(4.6, 4.6, 1);
        aura.position.set(-0.06, -0.04, -1.05);
        emblem.add(aura);
    }

    const orbitGroup = new THREE.Group();
    orbitGroup.rotation.x = 0.32;
    orbitGroup.rotation.z = 0.2;
    emblem.add(orbitGroup);

    const dashGeometry = new THREE.BoxGeometry(0.18, 0.06, 0.045);
    const dashMaterial = new THREE.LineBasicMaterial({
        color: 0xaeb5c7,
        transparent: true,
        opacity: 0.52,
        depthWrite: false,
    });

    const orbitRadius = 2.25;
    const dashCount = 26;

    for (let i = 0; i < dashCount; i++) {
        const angle = (i / dashCount) * Math.PI * 2;
        const dash = new THREE.LineSegments(new THREE.EdgesGeometry(dashGeometry), dashMaterial);
        dash.position.set(Math.cos(angle) * orbitRadius, Math.sin(angle) * orbitRadius, 0);
        dash.rotation.z = angle;
        orbitGroup.add(dash);
    }

    const planet = makeWireNode(new THREE.SphereGeometry(1.48, 18, 12), 0x5d71ff, 0.42);
    emblem.add(planet);

    const planetShell = makeWireNode(new THREE.SphereGeometry(1.58, 16, 10), 0x2738cf, 0.18);
    emblem.add(planetShell);

    const moon = makeWireNode(new THREE.SphereGeometry(0.37, 14, 10), 0xf2f6ff, 0.85);
    moon.position.set(0.67, 0.63, 1.08);
    emblem.add(moon);

    const satellitePivot = new THREE.Group();
    emblem.add(satellitePivot);

    const satellite = makeWireNode(new THREE.SphereGeometry(0.31, 12, 9), 0x6d7dff, 0.72);
    satellite.position.set(1.82, 1.74, 0.2);
    satellitePivot.add(satellite);

    const particleCount = 100;
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 2.7 + Math.random() * 1.4;
        particlePositions[i * 3] = Math.cos(angle) * radius;
        particlePositions[i * 3 + 1] = Math.sin(angle) * radius * 0.72;
        particlePositions[i * 3 + 2] = -0.9 - Math.random() * 0.7;
    }

    const particles = new THREE.Points(
        new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(particlePositions, 3)),
        new THREE.PointsMaterial({
            color: 0xc5d0ff,
            size: 0.04,
            transparent: true,
            opacity: 0.16,
            sizeAttenuation: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            map: glowTexture || null,
            alphaMap: glowTexture || null,
        })
    );
    particles.position.set(0, 0, -0.5);
    emblem.add(particles);

    let targetRotX = 0;
    let targetRotY = 0;
    let currentRotX = 0;
    let currentRotY = 0;
    let baseLogoX = 0;
    let baseLogoY = 0;

    function onPointerMove(event) {
        const rect = wrap.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1;

        targetRotY = clamp01((nx + 1) * 0.5) * 0.18 - 0.09;
        targetRotX = -(clamp01((ny + 1) * 0.5) * 0.14 - 0.07);
    }

    function resetPointer() {
        targetRotX = 0;
        targetRotY = 0;
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    wrap.addEventListener('pointerleave', resetPointer, { passive: true });

    function resize() {
        const width = Math.round(canvas.clientWidth);
        const height = Math.round(canvas.clientHeight);
        if (width < 1 || height < 1) return;

        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(width, height, false);

        const compact = width < 760;
        const medium = width >= 760 && width < 980;

        camera.aspect = width / height;
        camera.fov = compact ? 39 : 34;
        camera.position.set(0, compact ? -0.12 : -0.1, compact ? 8.9 : 8.65);
        camera.updateProjectionMatrix();
        camera.lookAt(0, compact ? -0.06 : -0.1, 0);

        if (compact) {
            baseLogoX = 0.72;
            baseLogoY = -0.1;
            emblemRig.scale.setScalar(0.65);
            emblemRig.position.set(baseLogoX, baseLogoY, -0.08);
            return;
        }

        if (medium) {
            baseLogoX = 1.12;
            baseLogoY = -0.26;
            emblemRig.scale.setScalar(0.79);
            emblemRig.position.set(baseLogoX, baseLogoY, -0.02);
            return;
        }

        baseLogoX = 1.88;
        baseLogoY = -0.36;
        emblemRig.scale.setScalar(0.86);
        emblemRig.position.set(baseLogoX, baseLogoY, 0);
    }

    function scheduleResize() {
        resize();
        requestAnimationFrame(resize);
    }

    scheduleResize();
    window.addEventListener('resize', scheduleResize, { passive: true });
    window.addEventListener('load', scheduleResize, { once: true });

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => scheduleResize());
    }

    if (typeof ResizeObserver !== 'undefined') {
        const ro = new ResizeObserver(() => scheduleResize());
        ro.observe(wrap);
    }

    function renderFrame(time, dt) {
        currentRotX += (targetRotX - currentRotX) * 0.065;
        currentRotY += (targetRotY - currentRotY) * 0.065;

        root.rotation.x = currentRotX * 0.55;
        root.rotation.y = currentRotY * 0.75;

        emblemRig.position.x = baseLogoX + Math.sin(time * 0.22) * 0.03;
        emblemRig.position.y = baseLogoY + Math.sin(time * 0.72) * 0.035;
        emblem.rotation.x = -0.16 + Math.sin(time * 0.3) * 0.04 + currentRotX * 0.95;
        emblem.rotation.y = 0.38 + Math.sin(time * 0.42 + 0.5) * 0.06 + currentRotY * 1.1;
        emblem.rotation.z = Math.sin(time * 0.24) * 0.025;

        orbitGroup.rotation.z += dt * 0.18;
        particles.rotation.z -= dt * 0.03;
        particles.rotation.y += dt * 0.02;

        planet.rotation.y += dt * 0.12;
        planetShell.rotation.y -= dt * 0.08;

        moon.position.x = 0.67 + Math.cos(time * 0.9) * 0.02;
        moon.position.y = 0.63 + Math.sin(time * 0.75) * 0.015;

        satellitePivot.rotation.z += dt * 0.42;
        satellite.position.z = 0.18 + Math.sin(time * 1.1) * 0.05;
        satellite.scale.setScalar(1 + Math.sin(time * 1.25) * 0.03);

        if (aura) {
            aura.material.opacity = 0.22 + Math.sin(time * 1.1) * 0.04;
            aura.scale.setScalar(4.6 + Math.sin(time * 0.8) * 0.1);
        }

        keyLight.intensity = 1.75 + Math.sin(time * 1.15) * 0.16;
        fillLight.intensity = 0.65 + Math.sin(time * 0.95 + 0.7) * 0.08;
        rimLight.intensity = 2.25 + Math.sin(time * 1.4 + 0.4) * 0.22;
        underLight.intensity = 1.25 + Math.sin(time * 1.1 + 1.4) * 0.12;

        renderer.render(scene, camera);
    }

    if (reduceMotion) {
        emblem.rotation.set(-0.16, 0.38, 0.01);
        renderer.render(scene, camera);
        return;
    }

    const clock = new THREE.Clock();
    let running = !document.hidden;
    let elapsedTime = 0;

    function tick() {
        if (!running) return;

        const dt = clock.getDelta();
        elapsedTime += dt;
        renderFrame(elapsedTime, dt);
        requestAnimationFrame(tick);
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            running = false;
        } else {
            running = true;
            clock.getDelta();
            tick();
        }
    });

    tick();
})();
