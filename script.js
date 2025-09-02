// AI Spectrum System with Heartbeat Effects
        class AISpectrumSystem {
            constructor() {
                this.ELEVENLABS_API_KEY = 'sk_461f0eb94d7fc7f8b2e24f6d6136824392cd88050c27eebc';
                this.VOICE_ID = 'UNIruiz09F4kWYjRpOvy';
                
                this.spectrum = document.getElementById('aiSpectrum');
                this.audioLoading = document.getElementById('audioLoading');
                this.volumeControl = document.getElementById('volumeControl');
                this.volumeSlider = document.getElementById('volumeSlider');
                
                this.currentAudio = null;
                this.audioContext = null;
                this.analyser = null;
                this.dataArray = null;
                this.isAudioPlaying = false;
                this.dots = [];
                
                this.initializeSpectrum();
                this.setupVolumeControl();
                this.initializeAudio();
            }

            initializeSpectrum() {
                const spectrum = this.spectrum;
                const centerX = 175;
                const centerY = 175;
                const rings = 12;
                const maxRadius = 150;
                
                // Clear existing dots
                spectrum.innerHTML = `
                    <div class="pulse-wave" id="pulseWave1"></div>
                    <div class="pulse-wave" id="pulseWave2"></div>
                `;
                
                this.dots = [];
                
                for (let ring = 0; ring < rings; ring++) {
                    const radius = (ring + 1) * (maxRadius / rings);
                    const dotsInRing = Math.floor(4 + ring * 2.5);
                    
                    for (let i = 0; i < dotsInRing; i++) {
                        const angle = (i / dotsInRing) * 2 * Math.PI;
                        const x = centerX + radius * Math.cos(angle);
                        const y = centerY + radius * Math.sin(angle);
                        
                        // Calculate size and color based on distance from center
                        const distanceFromCenter = radius / maxRadius;
                        const size = Math.max(2, 16 - (distanceFromCenter * 12));
                        const opacity = 1 - (distanceFromCenter * 0.6);
                        
                        // Color gradient from magenta to blue
                        let color;
                        if (distanceFromCenter < 0.3) {
                            color = '#FF00FF'; // Magenta
                        } else if (distanceFromCenter < 0.7) {
                            color = '#8A2BE2'; // Purple
                        } else {
                            color = '#4169E1'; // Blue
                        }
                        
                        const dot = document.createElement('div');
                        dot.className = 'spectrum-dot';
                        dot.style.cssText = `
                            left: ${x - size/2}px;
                            top: ${y - size/2}px;
                            width: ${size}px;
                            height: ${size}px;
                            background: ${color};
                            opacity: ${opacity};
                            box-shadow: 0 0 ${size}px ${color}40;
                        `;
                        
                        spectrum.appendChild(dot);
                        this.dots.push({
                            element: dot,
                            originalSize: size,
                            originalOpacity: opacity,
                            ring: ring,
                            angle: angle,
                            color: color,
                            distanceFromCenter: distanceFromCenter
                        });
                    }
                }
            }

            setupVolumeControl() {
                this.volumeSlider.addEventListener('input', (e) => {
                    const volume = e.target.value / 100;
                    if (this.currentAudio) {
                        this.currentAudio.volume = volume;
                    }
                });
            }

            async initializeAudio() {
                this.audioLoading.classList.add('show');
                this.volumeControl.classList.add('show');
                
                try {
                    await this.playWelcomeMessage();
                } catch (error) {
                    console.error('Error initializing audio:', error);
                    this.audioLoading.textContent = 'Click para activar audio';
                    this.audioLoading.style.cursor = 'pointer';
                    this.audioLoading.onclick = () => this.playWelcomeMessage();
                }
            }

            async generateSpeech(text) {
                const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${this.VOICE_ID}`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'audio/mpeg',
                        'Content-Type': 'application/json',
                        'xi-api-key': this.ELEVENLABS_API_KEY
                    },
                    body: JSON.stringify({
                        text: text,
                        model_id: 'eleven_multilingual_v2',
                        voice_settings: {
                            stability: 0.5,
                            similarity_boost: 0.5,
                            style: 0.0,
                            use_speaker_boost: true
                        }
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                return await response.blob();
            }

            async playWelcomeMessage() {
                const welcomeText = "¡Hola! Soy el Vendedor Digital R de Antares Innovate. Estoy aquí las 24 horas del día, los 7 días de la semana, listo para revolucionar tus ventas con inteligencia artificial avanzada. Mi objetivo es ser tu socio estratégico en el crecimiento de tu negocio. ¿Listo para descubrir el futuro de las ventas?";
                
                try {
                    const audioBlob = await this.generateSpeech(welcomeText);
                    const audioUrl = URL.createObjectURL(audioBlob);
                    
                    this.currentAudio = new Audio(audioUrl);
                    this.currentAudio.volume = this.volumeSlider.value / 100;
                    
                    await this.setupAudioContext();
                    
                    this.currentAudio.addEventListener('loadeddata', () => {
                        this.audioLoading.textContent = 'Reproduciendo mensaje...';
                    });
                    
                    this.currentAudio.addEventListener('play', () => {
                        this.isAudioPlaying = true;
                        this.startHeartbeatEffect();
                        this.audioLoading.textContent = 'Hablando...';
                    });
                    
                    this.currentAudio.addEventListener('ended', () => {
                        this.isAudioPlaying = false;
                        this.stopHeartbeatEffect();
                        setTimeout(() => {
                            this.audioLoading.classList.remove('show');
                        }, 2000);
                    });
                    
                    await this.currentAudio.play();
                    
                } catch (error) {
                    console.error('Error playing welcome message:', error);
                    this.audioLoading.textContent = 'Error de audio - Click para reintentar';
                    this.audioLoading.onclick = () => this.playWelcomeMessage();
                }
            }

            async setupAudioContext() {
                if (!this.currentAudio) return;
                
                try {
                    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const source = this.audioContext.createMediaElementSource(this.currentAudio);
                    this.analyser = this.audioContext.createAnalyser();
                    
                    source.connect(this.analyser);
                    this.analyser.connect(this.audioContext.destination);
                    
                    this.analyser.fftSize = 256;
                    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
                    
                    this.analyzeAudio();
                } catch (error) {
                    console.error('Error setting up audio context:', error);
                }
            }

            analyzeAudio() {
                if (!this.analyser || !this.isAudioPlaying) return;
                
                this.analyser.getByteFrequencyData(this.dataArray);
                
                // Calculate average amplitude
                const average = this.dataArray.reduce((a, b) => a + b) / this.dataArray.length;
                const normalizedAmplitude = average / 255;
                
                // Trigger heartbeat if amplitude is significant
                if (normalizedAmplitude > 0.1) {
                    this.triggerHeartbeat(normalizedAmplitude);
                }
                
                requestAnimationFrame(() => this.analyzeAudio());
            }

            startHeartbeatEffect() {
                this.spectrum.classList.add('spectrum-speaking');
                this.heartbeatInterval = setInterval(() => {
                    if (Math.random() > 0.3) { // 70% chance of heartbeat
                        this.triggerHeartbeat(0.5 + Math.random() * 0.5);
                    }
                }, 800 + Math.random() * 400); // Variable heartbeat timing
            }

            stopHeartbeatEffect() {
                this.spectrum.classList.remove('spectrum-speaking');
                if (this.heartbeatInterval) {
                    clearInterval(this.heartbeatInterval);
                    this.heartbeatInterval = null;
                }
            }

            triggerHeartbeat(intensity = 1) {
                // Trigger pulse waves
                this.triggerPulseWaves();
                
                // Double heartbeat effect - two quick pulses
                this.pulseDots(intensity * 0.8);
                setTimeout(() => {
                    this.pulseDots(intensity * 1.2);
                }, 150);
                
                // Individual dot animations with delay from center
                this.dots.forEach((dot, index) => {
                    const delay = dot.distanceFromCenter * 100; // Delay based on distance from center
                    setTimeout(() => {
                        dot.element.classList.add('active-pulse');
                        setTimeout(() => {
                            dot.element.classList.remove('active-pulse');
                        }, 200);
                    }, delay);
                });
            }

            pulseDots(intensity) {
                this.dots.forEach(dot => {
                    const scaleFactor = 1 + (intensity * 0.4 * (1 - dot.distanceFromCenter * 0.5));
                    const brightnessFactor = 1 + (intensity * 0.6);
                    
                    dot.element.style.transform = `scale(${scaleFactor})`;
                    dot.element.style.filter = `brightness(${brightnessFactor})`;
                    
                    setTimeout(() => {
                        dot.element.style.transform = '';
                        dot.element.style.filter = '';
                    }, 200);
                });
            }

            triggerPulseWaves() {
                const wave1 = document.getElementById('pulseWave1');
                const wave2 = document.getElementById('pulseWave2');
                
                wave1.classList.add('pulse-active');
                setTimeout(() => {
                    wave2.classList.add('pulse-active');
                }, 100);
                
                setTimeout(() => {
                    wave1.classList.remove('pulse-active');
                    wave2.classList.remove('pulse-active');
                }, 1000);
            }
        }

        // Enhanced Floating Particles System
        function createEnhancedParticles() {
            const container = document.getElementById('enhancedParticles');
            const particleCount = 25;
            
            for (let i = 0; i < particleCount; i++) {
                const particle = document.createElement('div');
                particle.className = 'floating-particle-enhanced';
                
                const size = Math.random() * 8 + 3;
                const x = Math.random() * window.innerWidth;
                const y = Math.random() * window.innerHeight;
                const duration = Math.random() * 6 + 6;
                const delay = Math.random() * 3;
                
                particle.style.cssText = `
                    width: ${size}px;
                    height: ${size}px;
                    left: ${x}px;
                    top: ${y}px;
                    animation-duration: ${duration}s;
                    animation-delay: ${delay}s;
                `;
                
                container.appendChild(particle);
            }
        }

        // Testimonial Carousel System
        let currentTestimonial = 0;
        const testimonialWrapper = document.getElementById('testimonialWrapper');
        
        function changeTestimonial(index) {
            currentTestimonial = index;
            testimonialWrapper.style.transform = `translateX(-${index * 33.333}%)`;
            
            document.querySelectorAll('.carousel-dot').forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });
        }

        function autoChangeTestimonial() {
            currentTestimonial = (currentTestimonial + 1) % 3;
            changeTestimonial(currentTestimonial);
        }

        // Video Player System
        function playVideo(element) {
            element.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            
            setTimeout(() => {
                element.innerHTML = `
                    <video controls playsinline webkit-playsinline style="width: 100%; height: 100%; object-fit: cover;">
                        <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" type="video/mp4">
                        Tu navegador no soporta el elemento de video.
                    </video>
                `;
                
                const video = element.querySelector('video');
                video.play();
            }, 1500);
        }

        // ROI Calculator System
        class ROICalculator {
            constructor() {
                this.setupInputListeners();
                this.initializeChart();
                this.calculateROI();
            }

            setupInputListeners() {
                const inputs = ['currentSalespeople', 'averageSalary', 'dailyCalls', 'conversionRate', 'averageSale'];
                inputs.forEach(inputId => {
                    document.getElementById(inputId).addEventListener('input', () => this.calculateROI());
                });
            }

            calculateROI() {
                const salespeople = parseInt(document.getElementById('currentSalespeople').value) || 3;
                const salary = parseInt(document.getElementById('averageSalary').value) || 2500;
                const dailyCalls = parseInt(document.getElementById('dailyCalls').value) || 40;
                const conversionRate = parseFloat(document.getElementById('conversionRate').value) || 15;
                const averageSale = parseInt(document.getElementById('averageSale').value) || 500;

                // Calculations
                const monthlySalaryBill = salespeople * salary;
                const aiCost = 299; // Empresarial plan
                const monthlySavings = monthlySalaryBill - aiCost;

                // AI improvements
                const aiCallsPerDay = dailyCalls * salespeople * 3; // 3x more calls with AI
                const aiConversionRate = conversionRate * 1.4; // 40% improvement
                const monthlyCallsHuman = dailyCalls * salespeople * 22; // 22 working days
                const monthlyCallsAI = aiCallsPerDay * 30; // 30 days

                const humanSales = monthlyCallsHuman * (conversionRate / 100);
                const aiSales = monthlyCallsAI * (aiConversionRate / 100);

                const humanRevenue = humanSales * averageSale;
                const aiRevenue = aiSales * averageSale;
                const additionalRevenue = aiRevenue - humanRevenue;

                const totalROI = ((monthlySavings + additionalRevenue) / aiCost) * 100;
                const paybackDays = Math.ceil(aiCost / ((monthlySavings + additionalRevenue) / 30));

                // Update display
                document.getElementById('monthlySavings').textContent = `$${monthlySavings.toLocaleString()}`;
                document.getElementById('additionalRevenue').textContent = `$${Math.max(0, additionalRevenue).toLocaleString()}`;
                document.getElementById('totalROI').textContent = `${Math.max(0, totalROI).toFixed(0)}%`;
                document.getElementById('paybackTime').textContent = `${Math.max(1, paybackDays)} días`;

                this.updateChart(humanRevenue, aiRevenue, monthlySalaryBill, aiCost);
            }

            initializeChart() {
                const ctx = document.getElementById('roiChart').getContext('2d');
                this.chart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: ['Ingresos Humano', 'Ingresos IA', 'Costos Humano', 'Costos IA'],
                        datasets: [{
                            data: [0, 0, 0, 0],
                            backgroundColor: [
                                'rgba(239, 68, 68, 0.8)',
                                'rgba(16, 185, 129, 0.8)',
                                'rgba(239, 68, 68, 0.8)',
                                'rgba(59, 130, 246, 0.8)'
                            ],
                            borderColor: [
                                'rgb(239, 68, 68)',
                                'rgb(16, 185, 129)',
                                'rgb(239, 68, 68)',
                                'rgb(59, 130, 246)'
                            ],
                            borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    color: '#e5e7eb',
                                    callback: function(value) {
                                        return '$' + value.toLocaleString();
                                    }
                                },
                                grid: {
                                    color: 'rgba(59, 130, 246, 0.1)'
                                }
                            },
                            x: {
                                ticks: {
                                    color: '#e5e7eb'
                                },
                                grid: {
                                    color: 'rgba(59, 130, 246, 0.1)'
                                }
                            }
                        }
                    }
                });
            }

            updateChart(humanRevenue, aiRevenue, humanCost, aiCost) {
                this.chart.data.datasets[0].data = [humanRevenue, aiRevenue, humanCost, aiCost];
                this.chart.update();
            }
        }

        // Scroll Animation Observer
        function initializeScrollAnimations() {
            const elements = document.querySelectorAll('.scroll-animate');
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            });
            
            elements.forEach(element => {
                observer.observe(element);
            });
        }

        // Enhanced CTA Button Effects
        function setupCTAEffects() {
            const ctaButton = document.getElementById('ctaMainButton');
            
            if (ctaButton) {
                ctaButton.addEventListener('click', function(e) {
                    const ripple = document.createElement('div');
                    ripple.className = 'cta-button-ripple';
                    
                    const rect = this.getBoundingClientRect();
                    const size = Math.max(rect.width, rect.height);
                    const x = e.clientX - rect.left - size / 2;
                    const y = e.clientY - rect.top - size / 2;
                    
                    ripple.style.cssText = `
                        width: ${size}px;
                        height: ${size}px;
                        left: ${x}px;
                        top: ${y}px;
                    `;
                    
                    this.appendChild(ripple);
                    
                    setTimeout(() => {
                        if (ripple.parentNode) {
                            ripple.parentNode.removeChild(ripple);
                        }
                    }, 600);
                });
            }
        }

        // Form Enhancement
        function setupFormEffects() {
            const form = document.getElementById('contactForm');
            
            if (form) {
                form.addEventListener('submit', function(e) {
                    e.preventDefault();
                    
                    const button = this.querySelector('.form-button');
                    const originalText = button.innerHTML;
                    
                    button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Enviando...';
                    button.disabled = true;
                    
                    setTimeout(() => {
                        button.innerHTML = '<i class="fas fa-check mr-2"></i> ¡Enviado Exitosamente!';
                        button.style.background = 'linear-gradient(135deg, #10B981 0%, #059669 100%)';
                        
                        setTimeout(() => {
                            button.innerHTML = originalText;
                            button.disabled = false;
                            button.style.background = '';
                        }, 3000);
                    }, 2000);
                });
            }
        }

        // Initialize everything when DOM loads
        document.addEventListener('DOMContentLoaded', function() {
            // Initialize AI Spectrum System
            new AISpectrumSystem();
            
            // Initialize ROI Calculator
            new ROICalculator();
            
            // Initialize other systems
            createEnhancedParticles();
            initializeScrollAnimations();
            setupCTAEffects();
            setupFormEffects();
            
            // Start testimonial carousel
            setInterval(autoChangeTestimonial, 5000);
            
            // Handle responsive particle visibility
            function handleResize() {
                const particles = document.querySelectorAll('.floating-particle-enhanced');
                particles.forEach(particle => {
                    particle.style.display = window.innerWidth > 768 ? 'block' : 'none';
                });
            }
            
            window.addEventListener('resize', handleResize);
            handleResize();
        });