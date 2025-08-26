import React, { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  opacity: number
  size: number
  originalX: number
  originalY: number
  isDrifting: boolean
}

interface Connection {
  p1: Particle
  p2: Particle
  distance: number
}

interface ParticleLoaderProps {
  width: number
  height: number
  fadeOut?: boolean
  onFadeComplete?: () => void
}

export default function ParticleLoader({ 
  width, 
  height, 
  fadeOut = false,
  onFadeComplete 
}: ParticleLoaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const particlesRef = useRef<Particle[]>([])
  const fadeOpacityRef = useRef<number>(1)
  const mouseRef = useRef<{ x: number; y: number }>({ x: -1000, y: -1000 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size with high DPI support
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)

    // Mouse event handlers
    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      }
    }

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 }
    }

    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseleave', handleMouseLeave)

    // Initialize particles
    const initParticles = () => {
      const particles: Particle[] = []
      const particleCount = Math.min(25, Math.floor((width * height) / 8000)) // Fewer particles for better performance
      
      for (let i = 0; i < particleCount; i++) {
        const x = Math.random() * width
        const y = Math.random() * height
        particles.push({
          x,
          y,
          originalX: x,
          originalY: y,
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
          opacity: Math.random() * 0.3 + 0.5, // Varied opacity between 0.5-0.8
          size: Math.random() * 1 + 2, // Size between 2-3 for better performance
          isDrifting: false
        })
      }
      
      particlesRef.current = particles
    }

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, width, height)
      
      const particles = particlesRef.current
      const mouse = mouseRef.current
      
      // Update particles
      particles.forEach(particle => {
        // Mouse repulsion effect
        const distanceToMouse = Math.sqrt((particle.x - mouse.x) ** 2 + (particle.y - mouse.y) ** 2)
        const repulsionRadius = 80
        
        if (distanceToMouse < repulsionRadius && mouse.x > -500) {
          // Calculate repulsion force
          const angle = Math.atan2(particle.y - mouse.y, particle.x - mouse.x)
          const force = (repulsionRadius - distanceToMouse) / repulsionRadius
          const repulsionForce = force * 3
          
          particle.vx += Math.cos(angle) * repulsionForce
          particle.vy += Math.sin(angle) * repulsionForce
          particle.isDrifting = true
        } else if (particle.isDrifting) {
          // Return to original position gradually
          const returnForce = 0.02
          const dx = particle.originalX - particle.x
          const dy = particle.originalY - particle.y
          
          particle.vx += dx * returnForce
          particle.vy += dy * returnForce
          
          // Check if close enough to original position
          if (Math.abs(dx) < 5 && Math.abs(dy) < 5) {
            particle.isDrifting = false
          }
        }
        
        // Apply velocity with damping
        particle.vx *= 0.95
        particle.vy *= 0.95
        
        particle.x += particle.vx
        particle.y += particle.vy
        
        // Bounce off edges
        if (particle.x <= 0 || particle.x >= width) {
          particle.vx *= -0.8
          particle.x = Math.max(0, Math.min(width, particle.x))
        }
        if (particle.y <= 0 || particle.y >= height) {
          particle.vy *= -0.8
          particle.y = Math.max(0, Math.min(height, particle.y))
        }
        
        // Keep particles in bounds
        particle.x = Math.max(0, Math.min(width, particle.x))
        particle.y = Math.max(0, Math.min(height, particle.y))
      })
      
      // Handle fade out
      if (fadeOut) {
        fadeOpacityRef.current -= 0.03
        if (fadeOpacityRef.current <= 0) {
          fadeOpacityRef.current = 0
          if (onFadeComplete) {
            onFadeComplete()
          }
          return // Stop animation
        }
      }
      
      const globalOpacity = fadeOpacityRef.current
      
      // Draw connections with optimized distance checking
      ctx.lineWidth = 1
      const maxDistance = 120
      
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i]
          const p2 = particles[j]
          const dx = p1.x - p2.x
          const dy = p1.y - p2.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance < maxDistance) {
            const opacity = (1 - distance / maxDistance) * 0.25 * globalOpacity
            ctx.strokeStyle = `rgba(235, 89, 12, ${opacity})`
            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.stroke()
          }
        }
      }
      
      // Draw particles with simple but effective appearance
      particles.forEach(particle => {
        const nodeOpacity = particle.opacity * globalOpacity
        
        // Draw simple particle
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(235, 89, 12, ${nodeOpacity})`
        ctx.fill()
      })
      
      animationRef.current = requestAnimationFrame(animate)
    }

    initParticles()
    animate()

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseleave', handleMouseLeave)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [width, height, fadeOut, onFadeComplete])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ background: 'transparent' }}
    />
  )
}