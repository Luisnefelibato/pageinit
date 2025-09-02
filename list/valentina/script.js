class ValentinaExitoSystem {
            constructor() {
                // APIs Configuration
                this.GEMINI_API_KEY = 'AIzaSyC2sGWOkbp6Z1xfns5cZWM5Ti8nTPWUBEE';
                this.ELEVENLABS_API_KEY = 'sk_461f0eb94d7fc7f8b2e24f6d6136824392cd88050c27eebc';
                this.ELEVENLABS_VOICE_ID = 'TsKSGPuG26FpNj0JzQBq'; // Female voice for Valentina
                
                // Main states
                this.isCallActive = false;
                this.isValentinaSpeaking = false;
                this.isMicrophoneActive = false;
                this.isProcessingResponse = false;
                
                // Audio and recognition control
                this.volume = 0.8;
                this.recognition = null;
                this.currentAudio = null;
                this.silenceTimer = null;
                this.microphoneTimer = null;
                
                // Conversation data
                this.finalTranscript = '';
                this.interimTranscript = '';
                this.conversationHistory = [];
                this.interactionCount = 0;
                this.customerName = null;
                
                // DOM elements
                this.initializeDOMElements();
                this.initializeSystem();
            }

            initializeDOMElements() {
                this.callButton = document.getElementById('callButton');
                this.endCallButton = document.getElementById('endCallButton');
                this.callStatus = document.getElementById('callStatus');
                this.transcriptDisplay = document.getElementById('transcriptDisplay');
                this.conversationDisplay = document.getElementById('conversationDisplay');
                this.audioVisualizer = document.getElementById('audioVisualizer');
                this.callDurationEl = document.getElementById('callDuration');
                this.responseTimeEl = document.getElementById('responseTime');
                this.callStatusEl = document.getElementById('callStatus2');
                this.interactionsEl = document.getElementById('interactions');
            }

            initializeSystem() {
                console.log('🚀 Inicializando Valentina Éxito System...');
                this.setupEventListeners();
                this.initializeVoiceRecognition();
                this.updateCallStatus('🛒 Valentina lista para mostrarte las mejores ofertas', 'waiting');
                console.log('✅ Sistema Valentina inicializado correctamente');
            }

            setupEventListeners() {
                this.callButton.addEventListener('click', () => this.startCall());
                this.endCallButton.addEventListener('click', () => this.endCall());
            }

            // Voice Recognition System
            initializeVoiceRecognition() {
                if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                    console.error('❌ Reconocimiento de voz no soportado');
                    return;
                }

                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                this.recognition = new SpeechRecognition();
                
                this.recognition.continuous = true;
                this.recognition.interimResults = true;
                this.recognition.lang = 'es-CO';
                this.recognition.maxAlternatives = 1;

                this.recognition.onstart = () => {
                    console.log('🎤 Reconocimiento iniciado');
                    this.isMicrophoneActive = true;
                    this.updateCallStatus('🎧 Valentina escucha - Háblame de lo que buscas', 'listening');
                };

                this.recognition.onresult = (event) => {
                    this.interimTranscript = '';
                    
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        const transcript = event.results[i][0].transcript;
                        
                        if (event.results[i].isFinal) {
                            this.finalTranscript += transcript + ' ';
                        } else {
                            this.interimTranscript += transcript;
                        }
                    }
                    
                    const currentText = this.finalTranscript + this.interimTranscript;
                    if (currentText.trim()) {
                        this.transcriptDisplay.textContent = `🎤 "${currentText.trim()}"`;
                    }
                    
                    clearTimeout(this.silenceTimer);
                    this.silenceTimer = setTimeout(() => {
                        if (this.finalTranscript.trim()) {
                            this.processUserInput();
                        }
                    }, 1500);
                };

                this.recognition.onerror = (event) => {
                    console.warn('❌ Error reconocimiento:', event.error);
                    if (this.isCallActive && !this.isValentinaSpeaking) {
                        setTimeout(() => this.activateMicrophone(), 1000);
                    }
                };

                this.recognition.onend = () => {
                    console.log('🔚 Reconocimiento terminado');
                    this.isMicrophoneActive = false;
                    
                    if (this.finalTranscript.trim()) {
                        this.processUserInput();
                    } else if (this.isCallActive && !this.isValentinaSpeaking && !this.isProcessingResponse) {
                        setTimeout(() => this.activateMicrophone(), 500);
                    }
                };
            }

            activateMicrophone() {
                if (!this.isCallActive || this.isValentinaSpeaking || this.isProcessingResponse) {
                    return;
                }

                try {
                    this.recognition.start();
                } catch (error) {
                    setTimeout(() => this.activateMicrophone(), 1000);
                }
            }

            deactivateMicrophone() {
                clearTimeout(this.silenceTimer);
                if (this.recognition) {
                    try {
                        this.recognition.stop();
                    } catch (e) {}
                }
                this.finalTranscript = '';
                this.interimTranscript = '';
            }

            // Process user input and generate response
            async processUserInput() {
                const userMessage = this.finalTranscript.trim();
                if (!userMessage) return;

                this.deactivateMicrophone();
                this.addToConversation(userMessage, 'customer');
                this.interactionCount++;
                this.interactionsEl.textContent = this.interactionCount;
                
                this.isProcessingResponse = true;
                this.updateCallStatus('⚡ Valentina buscando las mejores ofertas...', 'processing');
                this.callStatusEl.textContent = 'Procesando';

                const startTime = performance.now();

                try {
                    const response = await this.generateResponse(userMessage);
                    const endTime = performance.now();
                    const responseTime = Math.round(endTime - startTime);
                    
                    this.responseTimeEl.textContent = `${responseTime}ms`;
                    this.addToConversation(response, 'agent');
                    
                    this.isProcessingResponse = false;
                    await this.speakResponse(response);
                    
                } catch (error) {
                    console.error('Error procesando:', error);
                    this.isProcessingResponse = false;
                    const fallbackResponse = 'Disculpa, ¿podrías repetir qué tipo de producto te interesa?';
                    this.addToConversation(fallbackResponse, 'agent');
                    await this.speakResponse(fallbackResponse);
                }
            }

            // Generate AI response using Gemini
            async generateResponse(userMessage) {
                const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${this.GEMINI_API_KEY}`;
                
                let conversationContext = '';
                if (this.conversationHistory.length > 0) {
                    conversationContext = this.conversationHistory.slice(-4).map(entry => 
                        `${entry.speaker === 'customer' ? 'Cliente' : 'Valentina'}: ${entry.message}`
                    ).join('\n');
                }
                
                const requestBody = {
                    contents: [{
                        parts: [{
                            text: `Eres Valentina Rodríguez, vendedora EXPERTA de Supermercados Éxito con 12 años de experiencia en retail.

CONTEXTO: Cliente llamó interesado en ofertas y promociones de Éxito.

CONVERSACIÓN PREVIA:
${conversationContext}

REGLAS CRÍTICAS PARA ELEVENLABS:
- Precios: "cincuenta mil pesos" NO "50.000 pesos"  
- Descuentos: "treinta por ciento" NO "30%"
- Tallas: "talla cuarenta y dos" NO "talla 42"
- Cantidades: "cinco unidades" NO "5 unidades"
- Solo dinero lleva "pesos", números técnicos no

PERSONALIDAD:
- Vendedora humana real (NUNCA mencionar "IA")
- Entusiasta de las ofertas y promociones
- Especialista en productos Éxito
- Natural y cercana

PRODUCTOS ÉXITO:
**ROPA Y CALZADO:**
- Jeans Studio F: Antes 89.900, ahora 59.900 pesos (33% desc.)
- Tenis Nike Air: Antes 149.900, ahora 109.900 pesos 
- Camisetas Arturo Calle: 2x1, desde 39.900 pesos
- Zapatos Vélez: Hasta 40% descuento

**HOGAR:**
- Juegos de cama: Desde 79.900 pesos
- Electrodomésticos Kalley: 20% descuento
- Muebles: Financiación 0% interés 12 meses
- Decoración: 2x1 en artículos seleccionados

**SUPERMERCADO:**
- Canasta familiar: Ahorro hasta 25%
- Productos de aseo: 3x2
- Bebidas: 20% descuento fines de semana
- Carnes: Miércoles 30% descuento

TÉCNICAS DE VENTA:
1. Identifica qué busca específicamente
2. Presenta la mejor oferta disponible
3. Menciona promociones complementarias
4. Facilita compra y entrega
5. Cierra con coordinación de entrega

FECHAS PROMOCIONALES:
- Esta semana: Día sin IVA productos seleccionados
- Próximo mes: Black Friday Éxito
- Permanente: Puntos Éxito acumulables

Tu misión: Ayudar a encontrar las mejores ofertas y cerrar la venta. Máximo 60 palabras, natural y efectivo.

Cliente dice: "${userMessage}"

Responde como Valentina experta en ofertas:`
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 30,
                        topP: 0.85,
                        maxOutputTokens: 100,
                    }
                };

                try {
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(requestBody),
                    });

                    if (response.ok) {
                        const data = await response.json();
                        const rawResponse = data.candidates[0].content.parts[0].text.trim();
                        return this.optimizeForElevenLabs(rawResponse);
                    } else {
                        throw new Error('Gemini error');
                    }
                } catch (error) {
                    return this.getFallbackResponse(userMessage);
                }
            }

            // Optimize text for ElevenLabs TTS
            optimizeForElevenLabs(text) {
                let optimized = text;
                
                // Prices (only money gets "pesos")
                optimized = optimized.replace(/\$?\s*(\d{1,3}(?:[.,]\d{3})*)/g, (match, number) => {
                    const cleanNumber = parseInt(number.replace(/[$.,]/g, ''));
                    if (cleanNumber > 1000) {
                        return this.numberToSpanishWords(cleanNumber) + ' pesos';
                    }
                    return this.numberToSpanishWords(cleanNumber);
                });
                
                // Percentages
                optimized = optimized.replace(/(\d+)%/gi, (match, number) => {
                    return this.numberToSpanishWords(parseInt(number)) + ' por ciento';
                });
                
                return optimized;
            }

            // Convert numbers to Spanish words
            numberToSpanishWords(number) {
                if (number === 0) return 'cero';
                
                const ones = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
                const teens = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
                const tens = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
                
                if (number < 10) return ones[number];
                if (number < 20) return teens[number - 10];
                if (number < 30) {
                    return number === 20 ? 'veinte' : 'veinti' + ones[number % 10];
                }
                if (number < 100) {
                    return tens[Math.floor(number / 10)] + (number % 10 > 0 ? ' y ' + ones[number % 10] : '');
                }
                
                // Handle thousands
                if (number < 1000000) {
                    const thousands = Math.floor(number / 1000);
                    const remainder = number % 1000;
                    const thousandsText = thousands === 1 ? 'mil' : this.numberToSpanishWords(thousands) + ' mil';
                    return thousandsText + (remainder > 0 ? ' ' + this.numberToSpanishWords(remainder) : '');
                }
                
                return number.toString();
            }

            getFallbackResponse(userMessage) {
                const msg = userMessage.toLowerCase();
                
                if (msg.includes('ropa') || msg.includes('camisa') || msg.includes('jean')) {
                    return '¡Perfecto! Tenemos jeans Studio F con treinta y tres por ciento de descuento. Antes ochenta y nueve mil novecientos, ahora cincuenta y nueve mil novecientos pesos. ¿Qué talla necesitas?';
                }
                
                if (msg.includes('zapato') || msg.includes('tenis') || msg.includes('calzado')) {
                    return 'Excelente elección. Tenis Nike Air con descuento especial: antes ciento cuarenta y nueve mil novecientos, ahora ciento nueve mil novecientos pesos. ¿Para hombre o mujer?';
                }
                
                return '¡Hola! Soy Valentina de Éxito. Tenemos increíbles ofertas esta semana. ¿Te interesa ropa, calzado, hogar o productos de supermercado?';
            }

            // Text-to-speech using ElevenLabs
            async speakResponse(text) {
                console.log('🗣️ Valentina hablando:', text);
                
                this.isValentinaSpeaking = true;
                this.updateCallStatus('🗣️ Valentina presentando ofertas...', 'speaking');
                this.callStatusEl.textContent = 'Hablando';
                this.audioVisualizer.style.display = 'block';
                this.transcriptDisplay.textContent = `Valentina: "${text}"`;
                
                this.deactivateMicrophone();

                try {
                    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${this.ELEVENLABS_VOICE_ID}`, {
                        method: 'POST',
                        headers: {
                            'Accept': 'audio/mpeg',
                            'Content-Type': 'application/json',
                            'xi-api-key': this.ELEVENLABS_API_KEY
                        },
                        body: JSON.stringify({
                            text: text,
                            model_id: "eleven_turbo_v2_5",
                            voice_settings: {
                                stability: 0.7,
                                similarity_boost: 0.8,
                                style: 0.3
                            }
                        })
                    });

                    if (response.ok) {
                        const audioBlob = await response.blob();
                        const audioUrl = URL.createObjectURL(audioBlob);
                        this.currentAudio = new Audio(audioUrl);
                        this.currentAudio.volume = this.volume;
                        
                        this.currentAudio.onended = () => {
                            console.log('✅ Valentina terminó de hablar');
                            URL.revokeObjectURL(audioUrl);
                            this.currentAudio = null;
                            this.isValentinaSpeaking = false;
                            this.audioVisualizer.style.display = 'none';
                            this.callStatusEl.textContent = 'Escuchando';
                            this.transcriptDisplay.textContent = '🎤 Valentina terminó - ¿Qué más te interesa?';
                            
                            if (this.isCallActive) {
                                setTimeout(() => this.activateMicrophone(), 1000);
                            }
                        };
                        
                        await this.currentAudio.play();
                        
                    } else {
                        throw new Error('ElevenLabs error');
                    }
                    
                } catch (error) {
                    console.error('Error ElevenLabs:', error);
                    this.speakWithBrowser(text);
                }
            }

            speakWithBrowser(text) {
                if ('speechSynthesis' in window) {
                    const utterance = new SpeechSynthesisUtterance(text);
                    utterance.lang = 'es-ES';
                    utterance.volume = this.volume;
                    
                    utterance.onend = () => {
                        this.isValentinaSpeaking = false;
                        this.audioVisualizer.style.display = 'none';
                        this.callStatusEl.textContent = 'Escuchando';
                        
                        if (this.isCallActive) {
                            setTimeout(() => this.activateMicrophone(), 1000);
                        }
                    };
                    
                    speechSynthesis.speak(utterance);
                }
            }

            // Call management
            async startCall() {
                this.isCallActive = true;
                this.callStartTime = new Date();
                
                this.callButton.style.display = 'none';
                this.endCallButton.style.display = 'flex';
                
                this.updateCallStatus('📞 Conectando con Valentina...', 'connected');
                this.callStatusEl.textContent = 'Conectando';
                
                this.startCallTimer();
                
                const greeting = '¡Hola! Buen día, habla Valentina de Supermercados Éxito. Tenemos ofertas increíbles esta semana en ropa, calzado, hogar y supermercado. ¿Qué tipo de producto te interesa?';
                
                this.addToConversation(greeting, 'agent');
                await this.speakResponse(greeting);
            }

            endCall() {
                this.isCallActive = false;
                this.isValentinaSpeaking = false;
                
                this.callButton.style.display = 'flex';
                this.endCallButton.style.display = 'none';
                
                this.deactivateMicrophone();
                
                if (this.currentAudio) {
                    this.currentAudio.pause();
                    this.currentAudio = null;
                }
                
                this.updateCallStatus('🛒 Valentina lista para mostrarte las mejores ofertas', 'waiting');
                this.callStatusEl.textContent = 'Lista';
                this.transcriptDisplay.textContent = 'Llamada finalizada. ¡Gracias por contactar Éxito!';
                this.audioVisualizer.style.display = 'none';
                
                if (this.callTimer) {
                    clearInterval(this.callTimer);
                }
            }

            startCallTimer() {
                this.callTimer = setInterval(() => {
                    if (this.callStartTime) {
                        const now = new Date();
                        const duration = Math.floor((now - this.callStartTime) / 1000);
                        const minutes = Math.floor(duration / 60);
                        const seconds = duration % 60;
                        this.callDurationEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                    }
                }, 1000);
            }

            updateCallStatus(message, type) {
                this.callStatus.textContent = message;
                this.callStatus.className = `call-status ${type}`;
            }

            addToConversation(message, speaker) {
                const conversationItem = document.createElement('div');
                conversationItem.className = `conversation-item ${speaker === 'customer' ? 'customer-message' : 'agent-message'}`;
                
                const label = document.createElement('div');
                label.className = 'message-label';
                label.textContent = speaker === 'customer' ? 'Cliente' : 'Valentina IA';
                
                const content = document.createElement('div');
                content.textContent = message;
                
                conversationItem.appendChild(label);
                conversationItem.appendChild(content);
                
                this.conversationDisplay.appendChild(conversationItem);
                this.conversationDisplay.scrollTop = this.conversationDisplay.scrollHeight;
                
                this.conversationHistory.push({
                    speaker: speaker,
                    message: message,
                    timestamp: new Date()
                });
                
                if (this.conversationHistory.length > 10) {
                    this.conversationHistory = this.conversationHistory.slice(-10);
                }
            }
        }

        // Initialize system when page loads
        document.addEventListener('DOMContentLoaded', () => {
            new ValentinaExitoSystem();
        });