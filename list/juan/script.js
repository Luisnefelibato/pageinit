class AgenteCiudadanoSistema {
            constructor() {
                // APIs - Configuración
                this.GEMINI_API_KEY = 'AIzaSyC2sGWOkbp6Z1xfns5cZWM5Ti8nTPWUBEE';
                this.ELEVENLABS_API_KEY = 'sk_461f0eb94d7fc7f8b2e24f6d6136824392cd88050c27eebc';
                this.ELEVENLABS_VOICE_ID = 'tL5DHtPRo8KiW5xsx8yD'; // Voz profesional
                
                // Estados principales
                this.isCallActive = false;
                this.isAgenteSpeaking = false;
                this.isMicrophoneActive = false;
                this.isProcessingResponse = false;
                
                // Control de audio y reconocimiento
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
                this.citizenName = null;
                this.currentProcedure = null;
                this.callStartTime = null;
                this.callDurationInterval = null;
                
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
                
                // Estadísticas
                this.callDurationEl = document.getElementById('callDuration');
                this.responseTimeEl = document.getElementById('responseTime');
                this.callStatus2El = document.getElementById('callStatus2');
                this.interactionsEl = document.getElementById('interactions');
            }

            initializeSystem() {
                console.log('🚀 Inicializando Agente Ciudadano...');
                this.setupEventListeners();
                this.initializeVoiceRecognition();
                this.updateCallStatus('🏛️ Agente Ciudadano listo para gestionar trámites', 'waiting');
                console.log('✅ Sistema Agente Ciudadano inicializado');
            }

            setupEventListeners() {
                this.callButton.addEventListener('click', () => this.startCall());
                this.endCallButton.addEventListener('click', () => this.endCall());
            }

            // === RECONOCIMIENTO DE VOZ ===
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
                    this.updateCallStatus('🎧 Agente escucha - Exprese su consulta', 'listening');
                    this.finalTranscript = '';
                    this.interimTranscript = '';
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
                    }, 2000);
                };

                this.recognition.onerror = (event) => {
                    console.warn('❌ Error reconocimiento:', event.error);
                    this.updateMicrophoneStatus(false);
                    
                    if (this.isCallActive && !this.isAgenteSpeaking) {
                        setTimeout(() => this.activateMicrophone(), 1000);
                    }
                };

                this.recognition.onend = () => {
                    console.log('🔚 Reconocimiento terminado');
                    this.updateMicrophoneStatus(false);
                    
                    if (this.finalTranscript.trim()) {
                        this.processUserInput();
                    } else if (this.isCallActive && !this.isAgenteSpeaking && !this.isProcessingResponse) {
                        setTimeout(() => this.activateMicrophone(), 500);
                    }
                };
            }

            // === CONTROL DE MICRÓFONO ===
            activateMicrophone() {
                if (!this.isCallActive || this.isAgenteSpeaking || this.isProcessingResponse || this.isMicrophoneActive) {
                    return;
                }

                console.log('🎤 Activando micrófono...');
                
                try {
                    this.recognition.start();
                } catch (error) {
                    console.error('Error activando micrófono:', error);
                    setTimeout(() => this.activateMicrophone(), 1000);
                }
            }

            deactivateMicrophone() {
                console.log('🔇 Desactivando micrófono...');
                
                clearTimeout(this.silenceTimer);
                clearTimeout(this.microphoneTimer);
                
                this.updateMicrophoneStatus(false);
                
                if (this.recognition) {
                    try {
                        this.recognition.stop();
                    } catch (e) {
                        // Ignorar errores
                    }
                }
                
                this.finalTranscript = '';
                this.interimTranscript = '';
            }

            updateMicrophoneStatus(active) {
                this.isMicrophoneActive = active;
            }

            // === PROCESAMIENTO DE ENTRADA ===
            async processUserInput() {
                const userMessage = this.finalTranscript.trim();
                if (!userMessage) return;

                console.log('🧠 Procesando:', userMessage);
                
                this.deactivateMicrophone();
                this.addToConversation(userMessage, 'customer');
                this.interactionCount++;
                this.updateStats();
                
                this.isProcessingResponse = true;
                this.updateCallStatus('⚡ Agente procesando consulta...', 'processing');
                this.callStatus2El.textContent = 'Procesando';

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
                    const fallbackResponse = 'Disculpe, ¿podría repetir su consulta?';
                    this.addToConversation(fallbackResponse, 'agent');
                    await this.speakResponse(fallbackResponse);
                }
            }

            // === GENERACIÓN DE RESPUESTAS ===
            async generateResponse(userMessage) {
                const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${this.GEMINI_API_KEY}`;
                
                let conversationContext = '';
                if (this.conversationHistory.length > 0) {
                    conversationContext = this.conversationHistory.slice(-4).map(entry => 
                        `${entry.speaker === 'customer' ? 'Ciudadano' : 'Agente'}: ${entry.message}`
                    ).join('\n');
                }
                
                const requestBody = {
                    contents: [{
                        parts: [{
                            text: `Eres el Agente Ciudadano especializado en trámites gubernamentales colombianos con 10 años de experiencia.

CONVERSACIÓN PREVIA:
${conversationContext}

ESPECIALIDADES:
- Pasaportes y renovaciones (Cancillería)
- Licencias de conducir (RUNT)
- Cédulas de ciudadanía (Registraduría)
- Certificados de nacimiento/matrimonio
- Trámites notariales
- Multas de tránsito
- Antecedentes judiciales
- Certificados de paz y salvo

REGLAS CRÍTICAS PARA ELEVENLABS:
- Fechas: "quince de marzo" NO "15 de marzo"
- Números de cédula: "uno dos tres cuatro cinco" NO "1234"
- Costos: "cincuenta mil pesos" NO "$50,000"
- Horarios: "ocho de la mañana" NO "8:00 AM"
- Código de trámite: "A-B-C-uno-dos-tres" separando cada carácter

PERSONALIDAD:
- Agente gubernamental profesional (NUNCA mencionar "IA")
- Conoce todos los procedimientos y requisitos
- Eficiente pero amable
- Siempre ofrece soluciones concretas
- Maneja fechas y recordatorios precisos

RESPUESTAS TÍPICAS:
- Si pregunta por pasaporte: menciona documentos, costo, tiempo de entrega
- Si pregunta por licencia: explica exámenes, documentos, vigencia
- Si pregunta por cédula: proceso en registraduría, documentos necesarios
- Si pregunta por certificados: tipos disponibles, costos, tiempo de expedición

FORMATO RESPUESTA:
1. Saludo profesional (solo primera vez)
2. Información específica del trámite
3. Documentos requeridos
4. Costos exactos
5. Tiempos de proceso
6. Próximo paso o recordatorio

Ciudadano consulta: "${userMessage}"

Responde como Agente Ciudadano profesional (máximo 80 palabras):`
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.6,
                        topK: 30,
                        topP: 0.8,
                        maxOutputTokens: 120,
                    }
                };

                try {
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(requestBody),
                        signal: AbortSignal.timeout(5000)
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
                    return this.getGovernmentFallbackResponse(userMessage);
                }
            }

            // === OPTIMIZACIÓN PARA ELEVENLABS ===
            optimizeForElevenLabs(text) {
                let optimized = text;
                
                // Fechas
                optimized = optimized.replace(/(\d{1,2})\/(\d{1,2})\/(\d{4})/g, (match, day, month, year) => {
                    return `${this.numberToSpanishWords(parseInt(day))} del ${this.numberToSpanishWords(parseInt(month))} del ${this.numberToSpanishWords(parseInt(year))}`;
                });
                
                // Costos
                optimized = optimized.replace(/\$?\s*(\d{1,3}(?:[.,]\d{3})*)/g, (match, number) => {
                    const cleanNumber = parseInt(number.replace(/[$.,]/g, ''));
                    if (cleanNumber > 1000) {
                        return this.numberToSpanishWords(cleanNumber) + ' pesos';
                    }
                    return this.numberToSpanishWords(cleanNumber);
                });
                
                // Números de cédula (separar dígitos)
                optimized = optimized.replace(/(\d{8,})/g, (match) => {
                    return match.split('').join(' ');
                });
                
                // Horas
                optimized = optimized.replace(/(\d{1,2}):(\d{2})/g, (match, hour, minute) => {
                    const hourWord = this.numberToSpanishWords(parseInt(hour));
                    if (minute === '00') {
                        return `${hourWord} en punto`;
                    } else {
                        return `${hourWord} y ${this.numberToSpanishWords(parseInt(minute))}`;
                    }
                });
                
                return optimized;
            }

            // === CONVERSIÓN NÚMEROS A ESPAÑOL ===
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
                
                // Implementar cientos y miles según sea necesario
                return number.toString(); // Fallback
            }

            // === FALLBACK RESPUESTAS ===
            getGovernmentFallbackResponse(userMessage) {
                const msg = userMessage.toLowerCase();
                
                if (msg.includes('pasaporte')) {
                    return 'Para renovar su pasaporte necesita: cédula vigente, foto tres por cuatro fondo blanco, formulario diligenciado y pago de ciento ochenta mil pesos. El proceso toma ocho días hábiles. ¿Le agendo una cita?';
                }
                
                if (msg.includes('licencia') || msg.includes('conducir')) {
                    return 'Para la licencia de conducir debe presentar: cédula, certificado médico, curso de conducción y pagar doscientos mil pesos. El examen práctico se programa según disponibilidad. ¿Necesita más información?';
                }
                
                if (msg.includes('cedula') || msg.includes('cédula')) {
                    return 'Para duplicar su cédula en Registraduría necesita: denuncia de pérdida, dos testigos con cédula, formulario y pago de cincuenta mil pesos. Se entrega en tres días hábiles.';
                }
                
                return 'Como Agente Ciudadano, le ayudo con todos los trámites gubernamentales. Por favor, especifique qué tipo de trámite necesita: pasaporte, licencia, certificados o documentos de identidad.';
            }

            // === SÍNTESIS DE VOZ ===
            async speakResponse(text) {
                console.log('🗣️ Agente hablando:', text);
                
                this.isAgenteSpeaking = true;
                this.updateCallStatus('🗣️ Agente Ciudadano informando...', 'speaking');
                this.callStatus2El.textContent = 'Hablando';
                this.audioVisualizer.style.display = 'block';
                this.transcriptDisplay.textContent = `Agente: "${text}"`;
                
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
                            console.log('✅ Agente terminó de hablar');
                            URL.revokeObjectURL(audioUrl);
                            this.currentAudio = null;
                            this.isAgenteSpeaking = false;
                            this.audioVisualizer.style.display = 'none';
                            this.callStatus2El.textContent = 'Escuchando';
                            this.transcriptDisplay.textContent = '🎤 Agente terminó - Su turno para consultar';
                            
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
                    
                    utterance.onend = () => {
                        console.log('✅ Agente terminó (navegador)');
                        this.isAgenteSpeaking = false;
                        this.audioVisualizer.style.display = 'none';
                        this.callStatus2El.textContent = 'Escuchando';
                        
                        if (this.isCallActive) {
                            this.microphoneTimer = setTimeout(() => {
                                this.activateMicrophone();
                            }, 1000);
                        }
                    };
                    
                    speechSynthesis.speak(utterance);
                }
            }

            // === CONTROL DE LLAMADA ===
            async startCall() {
                console.log('📞 Iniciando llamada...');
                
                this.isCallActive = true;
                this.callStartTime = new Date();
                this.callButton.style.display = 'none';
                this.endCallButton.style.display = 'flex';
                
                this.updateCallStatus('📞 Llamada conectada', 'connected');
                this.callStatus2El.textContent = 'Conectado';
                
                this.startCallDurationTimer();
                
                const greeting = 'Buenos días, habla el Agente Ciudadano del sistema de trámites gubernamentales. Estoy aquí para ayudarle con recordatorios de citas, fechas de vencimiento y coordinación de trámites oficiales. ¿En qué puedo asistirle hoy?';
                
                this.addToConversation(greeting, 'agent');
                this.updateStats();
                
                await this.speakResponse(greeting);
            }

            endCall() {
                console.log('📞 Finalizando llamada...');
                
                this.isCallActive = false;
                this.isAgenteSpeaking = false;
                this.isProcessingResponse = false;
                
                this.callButton.style.display = 'flex';
                this.endCallButton.style.display = 'none';
                
                this.deactivateMicrophone();
                this.stopAudio();
                
                clearTimeout(this.microphoneTimer);
                clearInterval(this.callDurationInterval);
                
                this.updateCallStatus('📞 Llamada finalizada', 'waiting');
                this.callStatus2El.textContent = 'Listo';
                this.transcriptDisplay.textContent = 'Llamada terminada. Gracias por contactar al Agente Ciudadano 🏛️';
                
                // Reset para próxima llamada
                setTimeout(() => {
                    this.callDurationEl.textContent = '00:00';
                    this.transcriptDisplay.textContent = 'Sistema optimizado para recordatorios de citas gubernamentales 📋';
                    this.conversationDisplay.innerHTML = '';
                }, 3000);
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
                    this.currentAudio.currentTime = 0;
                    this.currentAudio = null;
                }
                
                if ('speechSynthesis' in window) {
                    speechSynthesis.cancel();
                }
                
                this.isAgenteSpeaking = false;
                this.audioVisualizer.style.display = 'none';
            }

            // === GESTIÓN DE CONVERSACIÓN ===
            addToConversation(message, speaker) {
                const conversationItem = document.createElement('div');
                conversationItem.className = `conversation-item ${speaker === 'customer' ? 'customer-message' : 'agent-message'}`;
                
                const label = document.createElement('div');
                label.className = 'message-label';
                label.textContent = speaker === 'customer' ? 'Ciudadano:' : 'Agente Ciudadano:';
                
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

            updateCallStatus(message, type) {
                this.callStatus.textContent = message;
                this.callStatus.className = `call-status ${type}`;
            }

            updateStats() {
                this.interactionsEl.textContent = this.interactionCount;
            }
        }

        // Initialize system when page loads
        document.addEventListener('DOMContentLoaded', () => {
            new AgenteCiudadanoSistema();
        });