import './styles.css'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import * as THREE from 'three'

gsap.registerPlugin(ScrollTrigger)

// ─── Lenis Smooth Scroll ───
const lenis = new Lenis({
  duration: 1.2,
  easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  touchMultiplier: 2,
})

function raf(time: number) {
  lenis.raf(time)
  requestAnimationFrame(raf)
}
requestAnimationFrame(raf)

lenis.on('scroll', ScrollTrigger.update)
gsap.ticker.add((time) => lenis.raf(time * 1000))

// ─── Custom Cursor ───
const cursor = document.getElementById('cursor')
const cursorDot = document.getElementById('cursor-dot')

if (cursor && cursorDot) {
  let mx = 0, my = 0
  let cx = 0, cy = 0
  let dx = 0, dy = 0

  document.addEventListener('mousemove', (e) => {
    mx = e.clientX
    my = e.clientY
  })

  function animateCursor() {
    cx += (mx - cx) * 0.12
    cy += (my - cy) * 0.12
    dx += (mx - dx) * 0.25
    dy += (my - dy) * 0.25

    cursor!.style.transform = `translate(${cx - 10}px, ${cy - 10}px)`
    cursorDot!.style.transform = `translate(${dx - 3}px, ${dy - 3}px)`
    requestAnimationFrame(animateCursor)
  }
  animateCursor()

  document.querySelectorAll('a, button, .product-card, .social-card').forEach(el => {
    el.addEventListener('mouseenter', () => cursor!.classList.add('hovering'))
    el.addEventListener('mouseleave', () => cursor!.classList.remove('hovering'))
  })
}

// ─── Three.js Hero Scene ───
function initHeroScene() {
  const canvas = document.getElementById('hero-canvas') as HTMLCanvasElement
  if (!canvas) return

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
  camera.position.z = 5

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  // Floating particles representing natural ingredients
  const particleCount = 120
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(particleCount * 3)
  const sizes = new Float32Array(particleCount)

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 12
    positions[i * 3 + 1] = (Math.random() - 0.5) * 12
    positions[i * 3 + 2] = (Math.random() - 0.5) * 8
    sizes[i] = Math.random() * 3 + 1
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

  const particleMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color('#E07A2C') },
      uColor2: { value: new THREE.Color('#5B2A86') },
      uMouse: { value: new THREE.Vector2(0, 0) },
    },
    vertexShader: `
      attribute float size;
      uniform float uTime;
      uniform vec2 uMouse;
      varying float vAlpha;
      varying vec3 vPos;

      void main() {
        vPos = position;
        vec3 pos = position;

        pos.x += sin(uTime * 0.3 + position.y * 0.5) * 0.4;
        pos.y += cos(uTime * 0.2 + position.x * 0.4) * 0.3;
        pos.z += sin(uTime * 0.15 + position.x * 0.3) * 0.2;

        float dist = length(pos.xy - uMouse * 4.0);
        pos.xy += normalize(pos.xy - uMouse * 4.0) * smoothstep(2.0, 0.0, dist) * 0.5;

        vAlpha = smoothstep(6.0, 0.0, length(pos)) * 0.6;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = size * (200.0 / -mvPosition.z);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      uniform float uTime;
      varying float vAlpha;
      varying vec3 vPos;

      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;

        float alpha = smoothstep(0.5, 0.1, d) * vAlpha;
        float mixer = sin(vPos.x * 0.5 + uTime * 0.2) * 0.5 + 0.5;
        vec3 color = mix(uColor1, uColor2, mixer);

        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })

  const particles = new THREE.Points(geometry, particleMaterial)
  scene.add(particles)

  // Floating torus knots for organic 3D feel
  const torusGeo = new THREE.TorusKnotGeometry(0.8, 0.25, 100, 16)
  const torusMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#E07A2C'),
    wireframe: true,
    transparent: true,
    opacity: 0.08,
  })
  const torus = new THREE.Mesh(torusGeo, torusMat)
  torus.position.set(3, -1, -2)
  scene.add(torus)

  const torus2Geo = new THREE.TorusKnotGeometry(0.5, 0.15, 80, 12, 3, 5)
  const torus2Mat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#5B2A86'),
    wireframe: true,
    transparent: true,
    opacity: 0.06,
  })
  const torus2 = new THREE.Mesh(torus2Geo, torus2Mat)
  torus2.position.set(-3.5, 1.5, -3)
  scene.add(torus2)

  // Icosahedron
  const icoGeo = new THREE.IcosahedronGeometry(1.2, 1)
  const icoMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#7B1F2B'),
    wireframe: true,
    transparent: true,
    opacity: 0.07,
  })
  const ico = new THREE.Mesh(icoGeo, icoMat)
  ico.position.set(2, 2.5, -4)
  scene.add(ico)

  let mouseX = 0, mouseY = 0
  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1
    mouseY = -(e.clientY / window.innerHeight) * 2 + 1
  })

  let time = 0
  function animate() {
    requestAnimationFrame(animate)
    time += 0.01

    particleMaterial.uniforms.uTime.value = time
    particleMaterial.uniforms.uMouse.value.set(mouseX, mouseY)

    torus.rotation.x = time * 0.15
    torus.rotation.y = time * 0.2
    torus.position.y = -1 + Math.sin(time * 0.5) * 0.3

    torus2.rotation.x = -time * 0.1
    torus2.rotation.z = time * 0.18
    torus2.position.y = 1.5 + Math.cos(time * 0.4) * 0.25

    ico.rotation.x = time * 0.12
    ico.rotation.y = time * 0.08
    ico.position.y = 2.5 + Math.sin(time * 0.3) * 0.2

    camera.position.x += (mouseX * 0.3 - camera.position.x) * 0.02
    camera.position.y += (mouseY * 0.2 - camera.position.y) * 0.02

    renderer.render(scene, camera)
  }
  animate()

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  })

  // Parallax scroll for hero 3D
  ScrollTrigger.create({
    trigger: '#hero',
    start: 'top top',
    end: 'bottom top',
    onUpdate: (self) => {
      camera.position.z = 5 + self.progress * 3
      particles.rotation.y = self.progress * 0.5
    },
  })
}

// ─── Ingredients Floating Canvas ───
function initIngredientsScene() {
  const canvas = document.getElementById('ingredients-canvas') as HTMLCanvasElement
  if (!canvas) return

  const parent = canvas.parentElement!
  const w = parent.offsetWidth
  const h = parent.offsetHeight

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100)
  camera.position.z = 4

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
  renderer.setSize(w, h)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  // Floating organic shapes
  const shapes: THREE.Mesh[] = []
  const geos = [
    new THREE.SphereGeometry(0.3, 16, 16),
    new THREE.OctahedronGeometry(0.25),
    new THREE.DodecahedronGeometry(0.2),
    new THREE.TetrahedronGeometry(0.25),
    new THREE.SphereGeometry(0.15, 8, 8),
  ]

  for (let i = 0; i < 8; i++) {
    const geo = geos[i % geos.length]
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(i % 2 === 0 ? '#E07A2C' : '#5B2A86'),
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(
      (Math.random() - 0.5) * 4,
      (Math.random() - 0.5) * 5,
      (Math.random() - 0.5) * 2
    )
    mesh.userData = {
      speed: Math.random() * 0.5 + 0.2,
      offset: Math.random() * Math.PI * 2,
    }
    scene.add(mesh)
    shapes.push(mesh)
  }

  let time = 0
  function animate() {
    requestAnimationFrame(animate)
    time += 0.01

    shapes.forEach((s) => {
      s.rotation.x += 0.005 * s.userData.speed
      s.rotation.y += 0.008 * s.userData.speed
      s.position.y += Math.sin(time * s.userData.speed + s.userData.offset) * 0.002
    })

    renderer.render(scene, camera)
  }
  animate()
}

// ─── Loader ───
function initLoader() {
  return new Promise<void>((resolve) => {
    const loader = document.getElementById('loader')!
    const hideLoader = () => {
      loader.style.opacity = '0'
      loader.style.transition = 'opacity 0.5s ease'
      setTimeout(() => {
        loader.style.display = 'none'
        resolve()
      }, 600)
    }
    setTimeout(hideLoader, 1800)
  })
}

// ─── Hero Animations ───
function animateHero() {
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)'
  const items: [string, number][] = [
    ['.hero-subtitle', 0],
    ['.hero-title', 100],
    ['.hero-desc', 250],
    ['.hero-ctas', 400],
    ['#scroll-indicator', 600],
  ]

  items.forEach(([sel, delay]) => {
    const el = document.querySelector(sel) as HTMLElement
    if (!el) return
    el.style.transform = 'translateY(30px)'
    el.style.opacity = '0'
    setTimeout(() => {
      el.style.transition = `opacity 1s ${ease}, transform 1s ${ease}`
      el.style.opacity = '1'
      el.style.transform = 'translateY(0)'
    }, delay)
  })
}

// ─── Navbar Scroll ───
function initNavbar() {
  const navbar = document.getElementById('navbar')!

  ScrollTrigger.create({
    trigger: '#hero',
    start: 'top top',
    end: '100px top',
    onLeave: () => navbar.classList.add('scrolled'),
    onEnterBack: () => navbar.classList.remove('scrolled'),
  })

  // Mobile menu
  const toggle = document.getElementById('menu-toggle')!
  const menu = document.getElementById('mobile-menu')!
  const links = menu.querySelectorAll('a')

  toggle.addEventListener('click', () => {
    toggle.classList.toggle('active')
    menu.classList.toggle('active')
    document.body.style.overflow = menu.classList.contains('active') ? 'hidden' : ''
  })

  links.forEach(link => {
    link.addEventListener('click', () => {
      toggle.classList.remove('active')
      menu.classList.remove('active')
      document.body.style.overflow = ''
    })
  })
}

// ─── Smooth scroll for anchor links ───
function initSmoothAnchors() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault()
      const target = document.querySelector((anchor as HTMLAnchorElement).getAttribute('href')!)
      if (target) {
        lenis.scrollTo(target as HTMLElement, { offset: -80 })
      }
    })
  })
}

// ─── Scroll Reveal via IntersectionObserver ───
function initScrollAnimations() {
  const revealEls = document.querySelectorAll(
    '.about-label, .about-title, .about-text, .about-stat, .about-image-wrapper, ' +
    '.products-label, .products-title, .product-card, ' +
    '.ingredient-img, .ingredient-item, .value-item, .social-card'
  ) as NodeListOf<HTMLElement>

  revealEls.forEach(el => {
    el.style.opacity = '0'
    el.style.transform = 'translateY(30px)'
  })

  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)'
  let staggerIndex = 0

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return
      const el = entry.target as HTMLElement
      const delay = staggerIndex * 60
      staggerIndex++
      setTimeout(() => {
        el.style.transition = `opacity 0.8s ${ease}, transform 0.8s ${ease}`
        el.style.opacity = '1'
        el.style.transform = 'translateY(0)'
      }, delay)
      observer.unobserve(el)

      // Trigger counter animation for stat elements
      if (el.classList.contains('about-stat')) {
        setTimeout(animateCounters, delay + 400)
      }
    })
    staggerIndex = 0
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' })

  revealEls.forEach(el => observer.observe(el))

  // About image parallax (GSAP scrub works fine)
  gsap.to('.about-image-wrapper img', {
    scrollTrigger: {
      trigger: '.about-image-wrapper',
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1,
    },
    y: -60,
    ease: 'none',
  })
}

// ─── Animate Counters ───
function animateCounters() {
  document.querySelectorAll('[data-count]').forEach((el) => {
    const target = parseInt(el.getAttribute('data-count')!)
    const obj = { val: 0 }
    gsap.to(obj, {
      val: target,
      duration: 2,
      ease: 'power2.out',
      onUpdate: () => {
        el.textContent = Math.round(obj.val).toString()
      },
    })
  })
}

// ─── Horizontal Parallax for Product Cards ───
function initParallaxCards() {
  document.querySelectorAll('.product-card').forEach((card) => {
    const img = card.querySelector('img')
    if (!img) return

    gsap.to(img, {
      scrollTrigger: {
        trigger: card,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1,
      },
      y: -30,
      ease: 'none',
    })
  })
}

// ─── Shopping Cart ───
interface CartItem {
  id: string
  name: string
  price: number
  img: string
  qty: number
}

const cart: CartItem[] = []

function initCart() {
  const overlay = document.getElementById('cart-overlay')!
  const drawer = document.getElementById('cart-drawer')!
  const closeBtn = document.getElementById('cart-close')!
  const toggleBtn = document.getElementById('cart-toggle')!
  const toggleMobile = document.getElementById('cart-toggle-mobile')!
  const cartList = document.getElementById('cart-list')!
  const cartEmpty = document.getElementById('cart-empty')!
  const cartFooter = document.getElementById('cart-footer')!
  const cartTotal = document.getElementById('cart-total')!
  const cartCount = document.getElementById('cart-count')!
  const cartCountMobile = document.getElementById('cart-count-mobile')!
  const checkoutBtn = document.getElementById('checkout-btn')

  function openCart() {
    drawer.style.transform = 'translateX(0)'
    overlay.style.opacity = '1'
    overlay.style.pointerEvents = 'all'
    document.body.style.overflow = 'hidden'
  }

  function closeCart() {
    drawer.style.transform = 'translateX(100%)'
    overlay.style.opacity = '0'
    overlay.style.pointerEvents = 'none'
    document.body.style.overflow = ''
  }

  toggleBtn.addEventListener('click', openCart)
  toggleMobile.addEventListener('click', openCart)
  closeBtn.addEventListener('click', closeCart)
  overlay.addEventListener('click', closeCart)

  function formatPrice(n: number) {
    return 'Le ' + n.toLocaleString()
  }

  function updateBadge() {
    const total = cart.reduce((s, i) => s + i.qty, 0)
    ;[cartCount, cartCountMobile].forEach(el => {
      el.textContent = total.toString()
      el.classList.toggle('hidden', total === 0)
    })
  }

  function renderCart() {
    updateBadge()

    if (cart.length === 0) {
      cartEmpty.classList.remove('hidden')
      cartList.classList.add('hidden')
      cartFooter.classList.add('hidden')
      return
    }

    cartEmpty.classList.add('hidden')
    cartList.classList.remove('hidden')
    cartFooter.classList.remove('hidden')

    cartList.innerHTML = cart.map(item => `
      <div class="flex gap-4 items-center bg-white/[0.03] border border-white/5 p-4 rounded" data-cart-id="${item.id}">
        <img src="${item.img}" alt="${item.name}" class="w-16 h-16 object-cover rounded flex-shrink-0">
        <div class="flex-1 min-w-0">
          <p class="font-display text-sm text-white truncate">${item.name}</p>
          <p class="font-body text-xs text-white/40 mt-1">${formatPrice(item.price)}</p>
          <div class="flex items-center gap-3 mt-2">
            <button class="cart-qty-btn w-6 h-6 flex items-center justify-center border border-white/10 text-white/50 hover:border-[#E07A2C] hover:text-[#E07A2C] transition-colors text-xs cursor-pointer bg-transparent" data-action="dec" data-id="${item.id}">−</button>
            <span class="font-body text-sm text-white/70 w-4 text-center">${item.qty}</span>
            <button class="cart-qty-btn w-6 h-6 flex items-center justify-center border border-white/10 text-white/50 hover:border-[#E07A2C] hover:text-[#E07A2C] transition-colors text-xs cursor-pointer bg-transparent" data-action="inc" data-id="${item.id}">+</button>
          </div>
        </div>
        <div class="text-right flex-shrink-0">
          <p class="font-display text-sm text-[#E07A2C]">${formatPrice(item.price * item.qty)}</p>
          <button class="cart-remove-btn mt-2 text-white/20 hover:text-red-400 transition-colors text-xs cursor-pointer bg-transparent border-none" data-id="${item.id}">Remove</button>
        </div>
      </div>
    `).join('')

    const total = cart.reduce((s, i) => s + i.price * i.qty, 0)
    cartTotal.textContent = formatPrice(total)

    cartList.querySelectorAll('.cart-qty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).dataset.id!
        const action = (btn as HTMLElement).dataset.action!
        const item = cart.find(i => i.id === id)
        if (!item) return
        if (action === 'inc') item.qty++
        if (action === 'dec') {
          item.qty--
          if (item.qty <= 0) cart.splice(cart.indexOf(item), 1)
        }
        renderCart()
      })
    })

    cartList.querySelectorAll('.cart-remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).dataset.id!
        const idx = cart.findIndex(i => i.id === id)
        if (idx > -1) cart.splice(idx, 1)
        renderCart()
      })
    })

    // Register new interactive elements for cursor
    if (cursor) {
      cartList.querySelectorAll('button').forEach(el => {
        el.addEventListener('mouseenter', () => cursor!.classList.add('hovering'))
        el.addEventListener('mouseleave', () => cursor!.classList.remove('hovering'))
      })
    }
  }

  document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      const card = btn.closest('.product-card') as HTMLElement
      if (!card) return

      const id = card.dataset.product!
      const name = card.dataset.name!
      const price = parseInt(card.dataset.price!)
      const img = card.dataset.img!

      const existing = cart.find(i => i.id === id)
      if (existing) {
        existing.qty++
      } else {
        cart.push({ id, name, price, img, qty: 1 })
      }

      // Button feedback
      const origHTML = btn.innerHTML
      btn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg> Added!`
      setTimeout(() => { btn.innerHTML = origHTML }, 1200)

      renderCart()
      openCart()
    })
  })

  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      // Checkout link will be wired up later
    })
  }

  renderCart()
}

// ─── WhatsApp Float Appear ───
function initWhatsAppFloat() {
  gsap.from('#whatsapp-float', {
    opacity: 0,
    scale: 0,
    duration: 0.5,
    delay: 3,
    ease: 'back.out(1.7)',
  })
}

// ─── Init ───
async function init() {
  initHeroScene()
  initIngredientsScene()

  await initLoader()

  animateHero()
  initNavbar()
  initSmoothAnchors()
  initScrollAnimations()
  initParallaxCards()
  initWhatsAppFloat()
  initCart()
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
