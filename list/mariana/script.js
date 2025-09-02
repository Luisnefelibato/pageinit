class MarianaEducaSystem {
            constructor() {
                // APIs Configuration
                this.GEMINI_API_KEY = 'AIzaSyC2sGWOkbp6Z1xfns5cZWM5Ti8nTPWUBEE';
                this.ELEVENLABS_API_KEY = 'sk_461f0eb94d7fc7f8b2e24f6d6136824392cd88050c27eebc';
                this.ELEVENLABS_VOICE_ID = 'xwH1gVhr2dWKPJkpNQT9'; // Female voice for Mariana
                
                // Main states
                this.isCallActive = false;
                this.isMarianasSpeaking = false;
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
                this.studentName = null;
                this.educationPhase = 'inicial';
                
                // DOM Elements
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
                
                // Stats
                this.callDurationEl = document.getElementById('callDuration');
                this.responseTimeEl = document.getElementById('responseTime');
                this.callStatusEl = document.getElementById('callStatus2');
                this.interactionsEl = document.getElementById('interactions');
            }

            initializeSystem() {
                console.log('🚀 Iniciando Mariana Educa System...');
                this.setupEventListeners();
                this.initializeVoiceRecognition();
                this.updateCallStatus('🎓 Mariana lista para asesorar en educación', 'waiting');
                this.updateMicrophoneStatus(false);
                console.log('✅ Sistema Mariana inicializado correctamente');
            }

            // === EVENT LISTENERS ===
            setupEventListeners() {
                this.callButton.addEventListener('click', () => {
                    if (this.isCallActive) {
                        this.endCall();
                    } else {
                        this.startCall();
                    }
                });

                this.endCallButton.addEventListener('click', () => {
                    this.endCall();
                });
            }

            // === VOICE RECOGNITION ===
            initializeVoiceRecognition() {
                if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                    console.error('❌ Reconocimiento de voz no soportado');
                    return;
                }

                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                this.recognition = new SpeechRecognition();
                
                this.recognition.continuous = true;
                this.recognition.interimResults = true;
                this.recognition.lang = 'es-ES';
                this.recognition.maxAlternatives = 1;

                this.recognition.onstart = () => {
                    console.log('🎤 Reconocimiento iniciado');
                    this.updateMicrophoneStatus(true);
                    this.updateCallStatus('🎧 Mariana escucha - Habla cuando quieras', 'listening');
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
                    }, 1500);
                };

                this.recognition.onerror = (event) => {
                    console.warn('❌ Error reconocimiento:', event.error);
                    clearTimeout(this.silenceTimer);
                    this.updateMicrophoneStatus(false);
                    
                    if (this.isCallActive && !this.isMarianasSpeaking) {
                        setTimeout(() => this.activateMicrophone(), 1000);
                    }
                };

                this.recognition.onend = () => {
                    console.log('🔚 Reconocimiento terminado');
                    this.updateMicrophoneStatus(false);
                    
                    if (this.finalTranscript.trim()) {
                        this.processUserInput();
                    } else if (this.isCallActive && !this.isMarianasSpeaking && !this.isProcessingResponse) {
                        setTimeout(() => this.activateMicrophone(), 500);
                    }
                };
            }

            // === MICROPHONE CONTROL ===
            activateMicrophone() {
                if (!this.isCallActive || this.isMarianasSpeaking || this.isProcessingResponse || this.isMicrophoneActive) {
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
                        // Ignore errors
                    }
                }
                
                this.finalTranscript = '';
                this.interimTranscript = '';
            }

            updateMicrophoneStatus(active) {
                this.isMicrophoneActive = active;
            }

            // === USER INPUT PROCESSING ===
            async processUserInput() {
                const userMessage = this.finalTranscript.trim();
                if (!userMessage) return;

                console.log('🧠 Procesando:', userMessage);
                
                this.deactivateMicrophone();
                this.addToConversation(userMessage, 'customer');
                this.interactionCount++;
                this.updateStats();
                
                this.isProcessingResponse = true;
                this.updateCallStatus('⚡ Mariana procesando...', 'processing');
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
                    const fallbackResponse = 'Disculpa, ¿podrías repetir eso? No escuché bien.';
                    this.addToConversation(fallbackResponse, 'agent');
                    await this.speakResponse(fallbackResponse);
                }
            }

            // === RESPONSE GENERATION ===
            async generateResponse(userMessage) {
                const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${this.GEMINI_API_KEY}`;
                
                let conversationContext = '';
                let phaseContext = this.determineEducationPhase();
                
                if (this.conversationHistory.length > 0) {
                    conversationContext = this.conversationHistory.slice(-4).map(entry => 
                        `${entry.speaker === 'customer' ? 'Estudiante' : 'Mariana'}: ${entry.message}`
                    ).join('\n');
                }
                
                const requestBody = {
                    contents: [{
                        parts: [{
                            text: `Eres Mariana Educa, especialista en seguimiento de matrículas y procesos educativos con 12 años de experiencia en el sector académico.

CONTEXTO: Estudiante o padre de familia llamó para consultar sobre matrículas, colegios o universidades.

FASE EDUCATIVA ACTUAL: ${phaseContext}

CONVERSACIÓN PREVIA:
${conversationContext}

REGLAS CRÍTICAS PARA ELEVENLABS:
- Fechas: "quince de marzo" NO "15 de marzo"
- Costos: "dos millones quinientos mil pesos" NO "2,500,000"
- Números de contacto: "tres-cero-uno-dos-tres-cuatro-cinco-seis-siete-ocho"
- Grados: "grado once" NO "grado 11"
- Años académicos: "dos mil veinticuatro" NO "2024"
- Porcentajes: "ochenta por ciento" NO "80%"
- Créditos: "dieciséis créditos académicos" NO "16 créditos"

PERSONALIDAD:
- Asesora educativa humana real (NUNCA mencionar "IA")
- Cálida, maternal y profesional
- Organizada y detallista
- Enfocada en ayudar al éxito académico
- Conocedora del sistema educativo colombiano

SERVICIOS QUE MANEJAS:
1. MATRÍCULAS: Fechas, documentos, proceso de inscripción
2. COLEGIOS: Públicos, privados, calendarios A y B
3. UNIVERSIDADES: Admisiones, programas, becas
4. DOCUMENTACIÓN: Certificados, validaciones, homologaciones
5. COSTOS: Matrículas, pensiones, materiales
6. BECAS: Gubernamentales, institucionales, mérito académico

INFORMACIÓN EDUCATIVA ACTUALIZADA:
- Matrícula universitaria pública: quinientos mil pesos promedio
- Colegio privado: entre uno y cuatro millones anuales
- Becas Ser Pilo Paga disponibles
- ICETEX con créditos blandos
- Calendario A: febrero-noviembre / Calendario B: agosto-junio

TÉCNICAS DE ASESORÍA:
1. ESCUCHA: Identifica nivel educativo y necesidad específica
2. INFORMA: Da datos precisos sobre fechas y requisitos
3. GUÍA: Explica paso a paso el proceso a seguir
4. COORDINA: Ayuda a organizar la documentación
5. SEGUIMIENTO: Ofrece recordatorios de fechas importantes

TU MISIÓN:
Resolver completamente la consulta educativa, dar información precisa y coordinada seguimiento si es necesario. Máximo sesenta palabras, natural y útil.

Estudiante/Padre dice: "${userMessage}"

Responde como Mariana especialista educativa:`
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
                    setTimeout(() => controller.abort(), 4000);
                    
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(requestBody),
                        signal: controller.signal
                    });

                    if (response.ok) {
                        const data = await response.json();
                        const rawResponse = data.candidates[0].content.parts[0].text.trim();
                        
                        const optimizedResponse = this.optimizeForElevenLabs(rawResponse);
                        this.updateEducationPhase(userMessage, optimizedResponse);
                        
                        return optimizedResponse;
                    } else {
                        throw new Error('Gemini error');
                    }
                } catch (error) {
                    console.warn('Gemini timeout, usando fallback:', error);
                    return this.getEducationFallbackResponse(userMessage);
                }
            }

            // === EDUCATION PHASE DETERMINATION ===
            determineEducationPhase() {
                const lastMessages = this.conversationHistory.slice(-3);
                const allText = lastMessages.map(h => h.message.toLowerCase()).join(' ');
                
                if (allText.includes('universidad') || allText.includes('carrera')) {
                    return 'CONSULTA UNIVERSITARIA';
                }
                if (allText.includes('colegio') || allText.includes('bachillerato')) {
                    return 'CONSULTA ESCOLAR';
                }
                if (allText.includes('matrícula') || allText.includes('inscripción')) {
                    return 'PROCESO DE MATRÍCULA';
                }
                if (allText.includes('beca') || allText.includes('financiación')) {
                    return 'INFORMACIÓN FINANCIERA';
                }
                if (allText.includes('documento') || allText.includes('certificado')) {
                    return 'TRÁMITE DOCUMENTAL';
                }
                
                return 'CONSULTA INICIAL';
            }

            updateEducationPhase(userMessage, marianaResponse) {
                const combined = (userMessage + ' ' + marianaResponse).toLowerCase();
                
                if (combined.includes('universidad')) {
                    this.educationPhase = 'universitaria';
                } else if (combined.includes('colegio')) {
                    this.educationPhase = 'escolar';
                } else if (combined.includes('beca')) {
                    this.educationPhase = 'financiera';
                } else if (combined.includes('documento')) {
                    this.educationPhase = 'documental';
                }
            }

            // === ELEVENLABS OPTIMIZATION ===
            optimizeForElevenLabs(text) {
                let optimized = text;
                
                // Precios y costos
                optimized = optimized.replace(/\$?\s*(\d{1,3}(?:[.,]\d{3})*)/g, (match, number) => {
                    const cleanNumber = parseInt(number.replace(/[$.,]/g, ''));
                    if (cleanNumber > 10000) {
                        return this.numberToSpanishWords(cleanNumber) + ' pesos';
                    }
                    return this.numberToSpanishWords(cleanNumber);
                });
                
                // Fechas
                optimized = optimized.replace(/(\d{1,2})\/(\d{1,2})\/(\d{4})/g, (match, day, month, year) => {
                    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                                  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
                    return `${this.numberToSpanishWords(parseInt(day))} de ${months[parseInt(month) - 1]} del ${this.numberToSpanishWords(parseInt(year))}`;
                });
                
                // Grados escolares
                optimized = optimized.replace(/grado\s*(\d+)/gi, (match, number) => {
                    return `grado ${this.numberToSpanishWords(parseInt(number))}`;
                });
                
                // Años académicos
                optimized = optimized.replace(/(\d{4})/g, (match, year) => {
                    if (parseInt(year) > 2000 && parseInt(year) < 2100) {
                        return this.numberToSpanishWords(parseInt(year));
                    }
                    return match;
                });
                
                return optimized;
            }

            // === NUMBER TO SPANISH CONVERSION ===
            numberToSpanishWords(number) {
                if (number === 0) return 'cero';
                if (number === 100) return 'cien';
                
                const ones = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
                const teens = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
                const tens = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
                const hundreds = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
                
                if (number < 10) return ones[number];
                if (number < 20) return teens[number - 10];
                if (number < 30) return number === 20 ? 'veinte' : 'veinti' + ones[number % 10];
                if (number < 100) return tens[Math.floor(number / 10)] + (number % 10 > 0 ? ' y ' + ones[number % 10] : '');
                if (number < 1000) {
                    const hundred = Math.floor(number / 100);
                    const remainder = number % 100;
                    return hundreds[hundred] + (remainder > 0 ? ' ' + this.numberToSpanishWords(remainder) : '');
                }
                if (number < 1000000) {
                    const thousands = Math.floor(number / 1000);
                    const remainder = number % 1000;
                    const thousandsText = thousands === 1 ? 'mil' : this.numberToSpanishWords(thousands) + ' mil';
                    return thousandsText + (remainder > 0 ? ' ' + this.numberToSpanishWords(remainder) : '');
                }
                
                const millions = Math.floor(number / 1000000);
                const remainder = number % 1000000;
                const millionsText = millions === 1 ? 'un millón' : this.numberToSpanishWords(millions) + ' millones';
                return millionsText + (remainder > 0 ? ' ' + this.numberToSpanishWords(remainder) : '');
            }

            // === FALLBACK RESPONSES ===
            getEducationFallbackResponse(userMessage) {
                const msg = userMessage.toLowerCase();
                
                if (msg.includes('universidad')) {
                    return 'Para ingreso universitario necesitas certificado de bachiller, pruebas Saber once y documento de identidad. Las inscripciones suelen ser entre octubre y enero. ¿Qué carrera te interesa?';
                }
                
                if (msg.includes('colegio')) {
                    return 'Para matrícula en colegio necesitas registro civil, certificados de años anteriores y carnet de vacunas actualizado. ¿Es para qué grado escolar?';
                }
                
                if (msg.includes('beca')) {
                    return 'Tenemos becas gubernamentales como Jóvenes en Acción, becas de excelencia académica y ICETEX. Todo depende de tu situación socioeconómica y rendimiento. ¿Cuál es tu caso?';
                }
                
                const fallbacks = [
                    'Como especialista educativa, necesito más información específica. ¿Es para colegio, universidad o algún trámite en particular?',
                    'Te ayudo con todo el proceso educativo. Cuéntame exactamente qué necesitas: matrícula, documentos o información sobre instituciones.',
                    'Perfecto, manejo todo tipo de consultas académicas. Especifica si es para educación básica, media o superior para asesorarte mejor.'
                ];
                
                return fallbacks[Math.floor(Math.random() * fallbacks.length)];
            }

            // === AUDIO REPRODUCTION ===
            async speakResponse(text) {
                console.log('🗣️ Mariana hablando:', text);
                
                this.isMarianasSpeaking = true;
                this.updateCallStatus('🗣️ Mariana asesorando...', 'speaking');
                this.callStatusEl.textContent = 'Hablando';
                this.audioVisualizer.style.display = 'block';
                this.transcriptDisplay.textContent = `Mariana: "${text}"`;
                
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
                                stability: 0.71,
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
                            console.log('✅ Mariana terminó de hablar');
                            URL.revokeObjectURL(audioUrl);
                            this.currentAudio = null;
                            this.isMarianasSpeaking = false;
                            this.audioVisualizer.style.display = 'none';
                            this.callStatusEl.textContent = 'Conectado';
                            this.transcriptDisplay.textContent = '🎤 Mariana terminó - Tu turno para preguntar';
                            
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
                        console.log('✅ Mariana terminó de hablar (navegador)');
                        this.isMarianasSpeaking = false;
                        this.audioVisualizer.style.display = 'none';
                        this.callStatusEl.textContent = 'Conectado';
                        this.transcriptDisplay.textContent = '🎤 Mariana terminó - Tu turno';
                        
                        if (this.isCallActive) {
                            this.microphoneTimer = setTimeout(() => {
                                this.activateMicrophone();
                            }, 1000);
                        }
                    };
                    
                    speechSynthesis.speak(utterance);
                } else {
                    this.isMarianasSpeaking = false;
                    this.audioVisualizer.style.display = 'none';
                    this.transcriptDisplay.textContent = 'Sin audio - Tu turno';
                    
                    if (this.isCallActive) {
                        setTimeout(() => this.activateMicrophone(), 500);
                    }
                }
            }

            // === CALL CONTROL ===
            async startCall() {
                console.log('📞 Iniciando llamada...');
                
                this.isCallActive = true;
                this.callButton.innerHTML = '<i class="fas fa-phone"></i> Finalizar Llamada';
                this.callButton.classList.add('active');
                this.endCallButton.style.display = 'inline-flex';
                
                this.updateCallStatus('📞 Llamada conectada', 'connected');
                this.callStatusEl.textContent = 'Conectado';
                
                this.startCallTimer();
                
                const greeting = '¡Hola! Buenos días, soy Mariana Educa, especialista en procesos académicos y matrículas. Me da mucho gusto atenderte. Cuéntame, ¿en qué proceso educativo te puedo ayudar hoy?';
                
                this.addToConversation(greeting, 'agent');
                this.educationPhase = 'inicial';
                this.updateStats();
                
                await this.speakResponse(greeting);
            }

            endCall() {
                console.log('📞 Finalizando llamada...');
                
                this.isCallActive = false;
                this.isMarianasSpeaking = false;
                this.isProcessingResponse = false;
                
                this.callButton.innerHTML = '<i class="fas fa-phone"></i> Iniciar Llamada';
                this.callButton.classList.remove('active');
                this.endCallButton.style.display = 'none';
                
                this.deactivateMicrophone();
                this.stopAudio();
                
                clearTimeout(this.microphoneTimer);
                clearInterval(this.callTimer);
                
                this.updateCallStatus('📞 Llamada finalizada', 'waiting');
                this.callStatusEl.textContent = 'Disponible';
                this.transcriptDisplay.textContent = 'Llamada terminada. ¡Éxitos en tu proceso educativo!';
            }

            startCallTimer() {
                this.callStartTime = Date.now();
                this.callTimer = setInterval(() => {
                    const elapsed = Math.floor((Date.now() - this.callStartTime) / 1000);
                    const minutes = Math.floor(elapsed / 60);
                    const seconds = elapsed % 60;
                    this.callDurationEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                }, 1000);
            }

            // === AUDIO CONTROL ===
            stopAudio() {
                if (this.currentAudio) {
                    this.currentAudio.pause();
                    this.currentAudio.currentTime = 0;
                    this.currentAudio = null;
                }
                
                if ('speechSynthesis' in window) {
                    speechSynthesis.cancel();
                }
                
                this.isMarianasSpeaking = false;
                this.audioVisualizer.style.display = 'none';
            }

            // === STATUS UPDATES ===
            updateCallStatus(message, type) {
                this.callStatus.textContent = message;
                this.callStatus.className = `call-status ${type}`;
            }

            updateStats() {
                this.interactionsEl.textContent = this.interactionCount;
            }

            // === CONVERSATION MANAGEMENT ===
            addToConversation(message, speaker) {
                const conversationItem = document.createElement('div');
                conversationItem.className = `conversation-item ${speaker === 'customer' ? 'customer-message' : 'agent-message'}`;
                
                const label = document.createElement('div');
                label.className = 'message-label';
                label.textContent = speaker === 'customer' ? 'Estudiante:' : 'Mariana:';
                
                const content = document.createElement('div');
                content.textContent = message;
                
                conversationItem.appendChild(label);
                conversationItem.appendChild(content);
                
                this.conversationDisplay.appendChild(conversationItem);
                this.conversationDisplay.scrollTop = this.conversationDisplay.scrollHeight;
                
                // Detectar nombre del estudiante
                if (speaker === 'customer' && !this.studentName) {
                    const nameMatch = message.match(/soy\s+(\w+)|me\s+llamo\s+(\w+)|mi\s+nombre\s+es\s+(\w+)/i);
                    if (nameMatch) {
                        this.studentName = nameMatch[1] || nameMatch[2] || nameMatch[3];
                    }
                }
                
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
            new MarianaEducaSystem();
        });