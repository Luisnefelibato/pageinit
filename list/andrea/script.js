class AndreaBancaAmigaSystem {
            constructor() {
                // APIs - Configuración
                this.GEMINI_API_KEY = 'AIzaSyC2sGWOkbp6Z1xfns5cZWM5Ti8nTPWUBEE';
                this.ELEVENLABS_API_KEY = 'sk_461f0eb94d7fc7f8b2e24f6d6136824392cd88050c27eebc';
                this.ELEVENLABS_VOICE_ID = 'oWSxI36XAKnfMWmzmQok'; // Voz femenina para Andrea
                
                // Estados del sistema
                this.isCallActive = false;
                this.isAndreaSpeaking = false;
                this.isMicrophoneActive = false;
                this.isProcessingResponse = false;
                
                // Control de audio
                this.volume = 0.8;
                this.recognition = null;
                this.currentAudio = null;
                this.silenceTimer = null;
                this.microphoneTimer = null;
                
                // Datos de conversación
                this.finalTranscript = '';
                this.interimTranscript = '';
                this.conversationHistory = [];
                this.interactionCount = 0;
                this.clientName = null;
                this.salesPhase = 'inicial';
                
                // Elementos DOM
                this.initializeDOMElements();
                this.initializeSystem();
            }

            initializeDOMElements() {
                this.callButton = document.getElementById('callButton');
                this.endCallButton = document.getElementById('endCallButton');
                this.callStatus = document.getElementById('callStatus');
                this.conversationDisplay = document.getElementById('conversationDisplay');
                this.transcriptDisplay = document.getElementById('transcriptDisplay');
                this.audioVisualizer = document.getElementById('audioVisualizer');
                this.micIndicator = document.getElementById('micIndicator');
                
                // Stats
                this.callDurationEl = document.getElementById('callDuration');
                this.responseTimeEl = document.getElementById('responseTime');
                this.callStatusEl = document.getElementById('callStatus2');
                this.interactionsEl = document.getElementById('interactions');
            }

            initializeSystem() {
                console.log('🏦 Inicializando Andrea BancaAmiga System...');
                this.setupEventListeners();
                this.initializeVoiceRecognition();
                this.updateCallStatus('🏦 Andrea lista para asesoría financiera', 'waiting');
                this.updateMicrophoneStatus(false);
                console.log('✅ Sistema Andrea BancaAmiga inicializado');
            }

            setupEventListeners() {
                this.callButton.addEventListener('click', () => this.startCall());
                this.endCallButton.addEventListener('click', () => this.endCall());
            }

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
                    this.updateMicrophoneStatus(true);
                    this.updateCallStatus('🎧 Andrea escucha - Cuéntame tu necesidad financiera', 'listening');
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
                        this.transcriptDisplay.classList.add('active');
                    }
                    
                    clearTimeout(this.silenceTimer);
                    this.silenceTimer = setTimeout(() => {
                        if (this.finalTranscript.trim()) {
                            this.processUserInput();
                        }
                    }, 2000);
                };

                this.recognition.onerror = (event) => {
                    console.warn('❌ Error reconocimiento:', event.error);
                    this.updateMicrophoneStatus(false);
                    
                    if (this.isCallActive && !this.isAndreaSpeaking) {
                        setTimeout(() => this.activateMicrophone(), 1000);
                    }
                };

                this.recognition.onend = () => {
                    console.log('🔚 Reconocimiento terminado');
                    this.updateMicrophoneStatus(false);
                    
                    if (this.isCallActive && !this.isAndreaSpeaking && !this.isProcessingResponse) {
                        setTimeout(() => this.activateMicrophone(), 500);
                    }
                };
            }

            activateMicrophone() {
                if (!this.isCallActive || this.isAndreaSpeaking || this.isProcessingResponse || this.isMicrophoneActive) {
                    return;
                }

                try {
                    this.recognition.start();
                } catch (error) {
                    console.error('Error activando micrófono:', error);
                    setTimeout(() => this.activateMicrophone(), 1000);
                }
            }

            deactivateMicrophone() {
                clearTimeout(this.silenceTimer);
                this.updateMicrophoneStatus(false);
                
                if (this.recognition) {
                    try {
                        this.recognition.stop();
                    } catch (e) {}
                }
                
                this.finalTranscript = '';
                this.interimTranscript = '';
            }

            async processUserInput() {
                const userMessage = this.finalTranscript.trim();
                if (!userMessage) return;

                console.log('🧠 Procesando:', userMessage);
                
                this.deactivateMicrophone();
                this.addToConversation(userMessage, 'customer');
                this.interactionCount++;
                this.interactionsEl.textContent = this.interactionCount;
                
                this.isProcessingResponse = true;
                this.updateCallStatus('⚡ Andrea procesando tu consulta...', 'processing');
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
                    const fallbackResponse = 'Disculpa, ¿podrías repetir tu consulta financiera?';
                    this.addToConversation(fallbackResponse, 'agent');
                    await this.speakResponse(fallbackResponse);
                }
            }

            async generateResponse(userMessage) {
                const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${this.GEMINI_API_KEY}`;
                
                let conversationContext = '';
                if (this.conversationHistory.length > 0) {
                    conversationContext = this.conversationHistory.slice(-4).map(entry => 
                        `${entry.speaker === 'customer' ? 'Cliente' : 'Andrea'}: ${entry.message}`
                    ).join('\n');
                }
                
                const requestBody = {
                    contents: [{
                        parts: [{
                            text: `Eres Andrea Rodríguez, asesora financiera EXPERTA de BancaAmiga con 12 años de experiencia en productos bancarios.

CONVERSACIÓN PREVIA:
${conversationContext}

PERSONALIDAD ANDREA:
- Asesora bancaria profesional y confiable
- Especialista en todos los productos financieros
- Enfoque en soluciones personalizadas
- Nunca menciones "IA" o "inteligencia artificial"
- Cálida pero profesional en el trato

PRODUCTOS BANCAAMIGA:
🏦 TARJETAS DE CRÉDITO:
- Clásica: cupo hasta $2M, sin cuota manejo primer año
- Dorada: cupo hasta $8M, cashback 2%, lounges aeropuerto  
- Platinum: cupo hasta $20M, concierge 24/7, seguros incluidos

💰 PRÉSTAMOS PERSONALES:
- Montos: $1M a $50M
- Tasas desde 1.2% mensual
- Plazos: 12 a 72 meses
- Aprobación en línea inmediata

🏠 CRÉDITO HIPOTECARIO:
- Financiación hasta 30 años
- Tasa fija desde 9.5% EA
- Cobertura hasta 80% del valor
- Subsidios gobierno disponibles

🚗 CRÉDITO VEHICULAR:
- Vehículos nuevos y usados
- Financiación hasta 84 meses
- Seguros todo riesgo incluidos
- Convenios con concesionarios

💎 INVERSIONES:
- CDT desde $500K, rentabilidad 12% EA
- Fondos de inversión diversificados
- Cuentas remuneradas alto rendimiento

OPTIMIZACIÓN ELEVENLABS:
- Tasas: "nueve punto cinco por ciento" NO "9.5%"
- Montos: "dos millones de pesos" NO "$2M"
- Plazos: "setenta y dos meses" NO "72 meses"
- Solo usar "pesos" para dinero real

PROCESO DE VENTA:
1. Escucha la necesidad específica
2. Recomienda 1-2 productos ideales
3. Explica beneficios clave
4. Menciona tasas/condiciones una vez
5. Coordina proceso si hay interés

INSTRUCCIÓN CRÍTICA:
Responde como Andrea humana experta. Máximo 50 palabras. Natural, directo, enfocado en la solución financiera.

Cliente dice: "${userMessage}"`
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
                    const controller = new AbortController();
                    setTimeout(() => controller.abort(), 5000);
                    
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(requestBody),
                        signal: controller.signal
                    });

                    if (response.ok) {
                        const data = await response.json();
                        const rawResponse = data.candidates[0].content.parts[0].text.trim();
                        return this.optimizeForElevenLabs(rawResponse);
                    } else {
                        throw new Error('Gemini error');
                    }
                } catch (error) {
                    console.warn('Gemini timeout, usando fallback:', error);
                    return this.getFinancialFallbackResponse(userMessage);
                }
            }

            optimizeForElevenLabs(text) {
                let optimized = text;
                
                // Montos de dinero
                optimized = optimized.replace(/\$(\d{1,3}(?:[.,]\d{3})*)/g, (match, number) => {
                    const cleanNumber = parseInt(number.replace(/[.,]/g, ''));
                    return this.numberToSpanishWords(cleanNumber) + ' pesos';
                });
                
                // Porcentajes
                optimized = optimized.replace(/(\d+(?:\.\d+)?)\s*%/g, (match, number) => {
                    return this.numberToSpanishWords(parseFloat(number)) + ' por ciento';
                });
                
                // Tasas
                optimized = optimized.replace(/(\d+(?:\.\d+)?)\s*EA/gi, (match, number) => {
                    return this.numberToSpanishWords(parseFloat(number)) + ' por ciento efectivo anual';
                });
                
                // Meses
                optimized = optimized.replace(/(\d+)\s*meses?/gi, (match, number) => {
                    return this.numberToSpanishWords(parseInt(number)) + ' meses';
                });
                
                return optimized;
            }

            numberToSpanishWords(number) {
                if (number === 0) return 'cero';
                if (number === 100) return 'cien';
                
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
                
                // Lógica para números más grandes...
                return number.toString(); // Fallback
            }

            getFinancialFallbackResponse(userMessage) {
                const msg = userMessage.toLowerCase();
                
                if (msg.includes('tarjeta') || msg.includes('crédito')) {
                    return 'Perfecto, nuestras tarjetas BancaAmiga tienen excelentes beneficios. La Dorada te da hasta ocho millones de cupo con cashback del dos por ciento. ¿Te interesa conocer más detalles?';
                }
                
                if (msg.includes('préstamo') || msg.includes('plata')) {
                    return 'Tenemos préstamos personales hasta cincuenta millones con tasa desde uno punto dos por ciento mensual. Aprobación inmediata y desembolso en veinticuatro horas. ¿Qué monto necesitas?';
                }
                
                if (msg.includes('casa') || msg.includes('vivienda')) {
                    return 'Nuestro crédito hipotecario financia hasta el ochenta por ciento del valor de la vivienda, con plazos hasta treinta años. Tasa fija desde nueve punto cinco por ciento. ¿Ya tienes una propiedad en mente?';
                }
                
                return 'Como asesora de BancaAmiga, puedo ayudarte con tarjetas, préstamos, hipotecarios, vehículos e inversiones. Cuéntame exactamente qué producto financiero te interesa y te doy la mejor opción.';
            }

            async speakResponse(text) {
                console.log('🗣️ Andrea hablando:', text);
                
                this.isAndreaSpeaking = true;
                this.updateCallStatus('🗣️ Andrea explicando productos financieros...', 'speaking');
                this.callStatusEl.textContent = 'Hablando';
                this.audioVisualizer.classList.add('active');
                this.transcriptDisplay.textContent = `Andrea: "${text}"`;
                this.transcriptDisplay.classList.remove('active');
                
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
                            console.log('✅ Andrea terminó de hablar');
                            URL.revokeObjectURL(audioUrl);
                            this.currentAudio = null;
                            this.isAndreaSpeaking = false;
                            this.audioVisualizer.classList.remove('active');
                            this.callStatusEl.textContent = 'Escuchando';
                            this.transcriptDisplay.textContent = '🎤 Andrea terminó - Tu turno para consultas';
                            
                            if (this.isCallActive) {
                                this.microphoneTimer = setTimeout(() => {
                                    this.activateMicrophone();
                                }, 1000);
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
                    utterance.rate = 0.9;
                    
                    utterance.onend = () => {
                        this.isAndreaSpeaking = false;
                        this.audioVisualizer.classList.remove('active');
                        this.callStatusEl.textContent = 'Escuchando';
                        
                        if (this.isCallActive) {
                            setTimeout(() => this.activateMicrophone(), 1000);
                        }
                    };
                    
                    speechSynthesis.speak(utterance);
                }
            }

            async startCall() {
                console.log('📞 Iniciando llamada con Andrea...');
                
                this.isCallActive = true;
                this.callStartTime = new Date();
                this.interactionCount = 0;
                
                this.callButton.style.display = 'none';
                this.endCallButton.style.display = 'flex';
                
                this.updateCallStatus('🔄 Conectando con Andrea...', 'connected');
                this.callStatusEl.textContent = 'Conectando';
                
                this.conversationDisplay.innerHTML = '';
                this.startCallDurationTimer();
                
                const greeting = 'Hola, buen día. Soy Andrea Rodríguez, asesora financiera de BancaAmiga. Me da mucho gusto atenderte. Cuéntame, ¿qué producto financiero te interesa o en qué puedo ayudarte hoy?';
                
                setTimeout(() => {
                    this.addToConversation(greeting, 'agent');
                    this.speakResponse(greeting);
                }, 2000);
            }

            endCall() {
                console.log('📞 Finalizando llamada...');
                
                this.isCallActive = false;
                this.isAndreaSpeaking = false;
                this.isProcessingResponse = false;
                
                this.endCallButton.style.display = 'none';
                this.callButton.style.display = 'flex';
                
                this.deactivateMicrophone();
                this.stopAudio();
                
                clearTimeout(this.microphoneTimer);
                clearInterval(this.callDurationInterval);
                
                this.updateCallStatus('🏦 Andrea lista para asesoría financiera', 'waiting');
                this.callStatusEl.textContent = 'Disponible';
                this.transcriptDisplay.textContent = 'Llamada finalizada - Gracias por contactar BancaAmiga 🏦';
                this.transcriptDisplay.classList.remove('active');
                
                this.callDurationEl.textContent = '00:00';
            }

            startCallDurationTimer() {
                this.callDurationInterval = setInterval(() => {
                    if (this.callStartTime) {
                        const now = new Date();
                        const duration = Math.floor((now - this.callStartTime) / 1000);
                        const minutes = Math.floor(duration / 60);
                        const seconds = duration % 60;
                        this.callDurationEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                    }
                }, 1000);
            }

            stopAudio() {
                if (this.currentAudio) {
                    this.currentAudio.pause();
                    this.currentAudio = null;
                }
                
                if ('speechSynthesis' in window) {
                    speechSynthesis.cancel();
                }
                
                this.isAndreaSpeaking = false;
                this.audioVisualizer.classList.remove('active');
            }

            updateCallStatus(message, type) {
                this.callStatus.textContent = message;
                this.callStatus.className = `call-status ${type}`;
            }

            updateMicrophoneStatus(active) {
                this.isMicrophoneActive = active;
                this.micIndicator.className = `microphone-indicator ${active ? 'active' : ''}`;
            }

            addToConversation(message, type) {
                const messageEl = document.createElement('div');
                messageEl.className = `conversation-item ${type === 'customer' ? 'customer-message' : 'agent-message'}`;
                
                const label = type === 'customer' ? 'Cliente' : 'Andrea IA';
                messageEl.innerHTML = `
                    <div class="message-label">${label}</div>
                    <div>${message}</div>
                `;
                
                this.conversationDisplay.appendChild(messageEl);
                this.conversationDisplay.scrollTop = this.conversationDisplay.scrollHeight;
                
                this.conversationHistory.push({
                    speaker: type,
                    message: message,
                    timestamp: new Date()
                });
                
                if (this.conversationHistory.length > 8) {
                    this.conversationHistory = this.conversationHistory.slice(-8);
                }
            }
        }

        // Inicializar sistema cuando carga la página
        document.addEventListener('DOMContentLoaded', () => {
            new AndreaBancaAmigaSystem();
        });