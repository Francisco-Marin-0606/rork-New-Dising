import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  Platform,
  Animated,
  ScrollView,
  Keyboard,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Audio } from 'expo-av';
import { Mic, Square } from 'lucide-react-native';
import { router, Stack } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { FORM_QUESTIONS } from '@/constants/questions';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function FormScreen() {
  const insets = useSafeAreaInsets();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [inputValue, setInputValue] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const nextButtonScale = useRef(new Animated.Value(1)).current;
  const nextButtonOpacity = useRef(new Animated.Value(1)).current;
  const prevButtonScale = useRef(new Animated.Value(1)).current;
  const prevButtonOpacity = useRef(new Animated.Value(1)).current;
  const micButtonScale = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const keyboardAnimatedHeight = useRef(new Animated.Value(0)).current;

  const currentQuestion = FORM_QUESTIONS[currentQuestionIndex] || FORM_QUESTIONS[0];
  const isLastQuestion = currentQuestionIndex === FORM_QUESTIONS.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  const renderFormattedText = (text: string) => {
    const parts: React.ReactNode[] = [];
    let currentIndex = 0;
    const boldRegex = /\*\*(.+?)\*\*/g;
    const italicRegex = /\*(.+?)\*/g;
    
    const segments: { start: number; end: number; type: 'bold' | 'italic'; content: string }[] = [];
    
    let boldMatch: RegExpExecArray | null;
    while ((boldMatch = boldRegex.exec(text)) !== null) {
      segments.push({ start: boldMatch.index, end: boldMatch.index + boldMatch[0].length, type: 'bold', content: boldMatch[1] });
    }
    
    let italicMatch: RegExpExecArray | null;
    while ((italicMatch = italicRegex.exec(text)) !== null) {
      const isBold = segments.some(s => s.start <= italicMatch!.index && s.end >= italicMatch!.index + italicMatch![0].length);
      if (!isBold) {
        segments.push({ start: italicMatch.index, end: italicMatch.index + italicMatch[0].length, type: 'italic', content: italicMatch[1] });
      }
    }
    
    segments.sort((a, b) => a.start - b.start);
    
    segments.forEach((segment, index) => {
      if (currentIndex < segment.start) {
        parts.push(text.substring(currentIndex, segment.start));
      }
      
      if (segment.type === 'bold') {
        parts.push(
          <Text key={`bold-${index}`} style={{ fontWeight: '700' }}>
            {segment.content}
          </Text>
        );
      } else if (segment.type === 'italic') {
        parts.push(
          <Text key={`italic-${index}`} style={{ fontStyle: 'italic' }}>
            {segment.content}
          </Text>
        );
      }
      
      currentIndex = segment.end;
    });
    
    if (currentIndex < text.length) {
      parts.push(text.substring(currentIndex));
    }
    
    return parts;
  };

  useEffect(() => {
    loadCachedAnswers();
  }, []);

  useEffect(() => {
    saveCachedAnswers();
  }, [answers, inputValue, currentQuestionIndex]);

  const loadCachedAnswers = async () => {
    try {
      const cached = await AsyncStorage.getItem('form_cache');
      if (cached) {
        const data = JSON.parse(cached);
        setAnswers(data.answers || {});
        setCurrentQuestionIndex(data.currentQuestionIndex || 0);
        setInputValue(data.answers?.[FORM_QUESTIONS[data.currentQuestionIndex || 0]?.id] || '');
        console.log('Loaded cached form data:', data);
      }
    } catch (error) {
      console.error('Failed to load cached answers:', error);
    }
  };

  const saveCachedAnswers = async () => {
    try {
      const currentAnswers = { ...answers, [currentQuestion.id]: inputValue };
      const data = {
        answers: currentAnswers,
        currentQuestionIndex,
      };
      await AsyncStorage.setItem('form_cache', JSON.stringify(data));
      console.log('Saved form cache:', data);
    } catch (error) {
      console.error('Failed to save cached answers:', error);
    }
  };

  const clearCache = async () => {
    try {
      await AsyncStorage.removeItem('form_cache');
      console.log('Cleared form cache');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        if (isNavigating) return;
        setKeyboardHeight(e.endCoordinates.height);
        Animated.timing(keyboardAnimatedHeight, {
          toValue: -e.endCoordinates.height,
          duration: Platform.OS === 'ios' ? Math.min(e.duration, 200) : 100,
          useNativeDriver: true,
        }).start();
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      (e) => {
        if (isNavigating) return;
        setKeyboardHeight(0);
        Animated.timing(keyboardAnimatedHeight, {
          toValue: 0,
          duration: Platform.OS === 'ios' ? Math.min(e.duration, 200) : 100,
          useNativeDriver: true,
        }).start();
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, [keyboardAnimatedHeight, isNavigating]);



  const sanitizeInput = (text: string): string => {
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{FE00}-\u{FE0F}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F251}]/gu;
    const specialCharsRegex = /[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s.,;:!?¿¡()\-"']/g;
    
    return text.replace(emojiRegex, '').replace(specialCharsRegex, '');
  };

  const handleNext = useCallback(async () => {
    if (inputValue.trim().length < 10) {
      setValidationError('Mínimo 10 caracteres');
      if (Platform.OS !== 'web') {
        try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); } catch {}
      }
      return;
    }

    if (inputValue.length > 500) {
      setValidationError('Máximo 500 caracteres');
      if (Platform.OS !== 'web') {
        try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); } catch {}
      }
      return;
    }



    setValidationError('');

    if (Platform.OS !== 'web') {
      try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch {}
    }

    setAnswers(prev => ({ ...prev, [currentQuestion.id]: inputValue }));

    if (isLastQuestion) {
      console.log('Form completed:', { ...answers, [currentQuestion.id]: inputValue });
      await clearCache();
      setIsNavigating(true);
      router.push('/confirmation');
      setTimeout(() => {
        Keyboard.dismiss();
      }, 500);
      return;
    }

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -30,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentQuestionIndex(prev => prev + 1);
      const nextAnswer = answers[FORM_QUESTIONS[currentQuestionIndex + 1]?.id] || '';
      setInputValue(nextAnswer);
      
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 50);
      });
    });
  }, [currentQuestion, inputValue, isLastQuestion, answers, currentQuestionIndex, fadeAnim, slideAnim]);

  const handlePrevious = useCallback(async () => {
    if (Platform.OS !== 'web') {
      try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    }

    if (isFirstQuestion) {
      const hasAnyAnswer = Object.values(answers).some(answer => answer.trim().length > 0) || inputValue.trim().length > 0;
      
      if (hasAnyAnswer) {
        Alert.alert(
          '¿Deseas responder estas preguntas luego?',
          '',
          [
            {
              text: 'No',
              style: 'cancel',
              onPress: () => {
                console.log('User chose to stay');
              },
            },
            {
              text: 'Sí',
              onPress: () => {
                router.back();
              },
            },
          ],
          { cancelable: true }
        );
      } else {
        router.back();
      }
      return;
    }

    setAnswers(prev => ({ ...prev, [currentQuestion.id]: inputValue }));

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 30,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentQuestionIndex(prev => prev - 1);
      const prevAnswer = answers[FORM_QUESTIONS[currentQuestionIndex - 1]?.id] || '';
      setInputValue(prevAnswer);
      
      fadeAnim.setValue(0);
      slideAnim.setValue(-30);
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [currentQuestion, inputValue, isFirstQuestion, answers, currentQuestionIndex, fadeAnim, slideAnim]);

  const startRecordingMobile = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos acceso al micrófono para grabar audio.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          outputFormat: Audio.IOSOutputFormat.LINEARPCM,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });

      await recording.startAsync();
      recordingRef.current = recording;
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
      
      setRecordingSeconds(0);
      setLiveTranscript('');
      setIsRecording(true);
      
      console.log('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'No se pudo iniciar la grabación.');
    }
  };

  const stopRecordingMobile = async () => {
    try {
      if (!recordingRef.current) return;

      await recordingRef.current.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      setIsRecording(false);
      setRecordingSeconds(0);

      if (!uri) {
        Alert.alert('Error', 'No se pudo obtener la grabación.');
        return;
      }

      console.log('Recording stopped, URI:', uri);
      await transcribeAudio(uri);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'No se pudo detener la grabación.');
      setIsRecording(false);
    }
  };

  const startRecordingWeb = async () => {
    try {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'es-ES';
        
        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }
          
          if (finalTranscript) {
            setLiveTranscript(prev => prev + finalTranscript);
          } else if (interimTranscript) {
            setLiveTranscript(prev => {
              const lastFinalText = prev;
              return lastFinalText + interimTranscript;
            });
          }
        };
        
        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
        };
        
        recognition.start();
        recognitionRef.current = recognition;
        console.log('Web speech recognition started');
      } else {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          stream.getTracks().forEach(track => track.stop());
          await transcribeAudioWeb(audioBlob);
        };

        mediaRecorder.start();
        mediaRecorderRef.current = mediaRecorder;
        console.log('Web recording started (fallback)');
      }
      
      setRecordingSeconds(0);
      setLiveTranscript('');
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start web recording:', error);
      Alert.alert('Error', 'No se pudo acceder al micrófono.');
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const stopRecordingWeb = () => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      
      if (liveTranscript.trim()) {
        setInputValue(prev => prev ? `${prev} ${liveTranscript.trim()}` : liveTranscript.trim());
      }
      setLiveTranscript('');
      setIsRecording(false);
      setRecordingSeconds(0);
      console.log('Web speech recognition stopped');
    } else if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      setIsRecording(false);
      setRecordingSeconds(0);
      console.log('Web recording stopped');
    }
  };

  const transcribeAudio = async (uri: string) => {
    setIsTranscribing(true);
    try {
      const uriParts = uri.split('.');
      const fileType = uriParts[uriParts.length - 1];

      const formData = new FormData();
      const audioFile = {
        uri,
        name: `recording.${fileType}`,
        type: `audio/${fileType}`,
      } as any;

      formData.append('audio', audioFile);
      formData.append('language', 'es');

      const response = await fetch('https://toolkit.rork.com/stt/transcribe/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const data = await response.json();
      console.log('Transcription result:', data);
      
      if (data.text) {
        setInputValue(prev => prev ? `${prev} ${data.text}` : data.text);
      }
    } catch (error) {
      console.error('Transcription error:', error);
      Alert.alert('Error', 'No se pudo transcribir el audio.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const transcribeAudioWeb = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('language', 'es');

      const response = await fetch('https://toolkit.rork.com/stt/transcribe/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const data = await response.json();
      console.log('Transcription result:', data);
      
      if (data.text) {
        setInputValue(prev => prev ? `${prev} ${data.text}` : data.text);
      }
    } catch (error) {
      console.error('Transcription error:', error);
      Alert.alert('Error', 'No se pudo transcribir el audio.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleMicPress = useCallback(async () => {
    if (Platform.OS !== 'web') {
      try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    }

    if (isRecording) {
      if (Platform.OS === 'web') {
        stopRecordingWeb();
      } else {
        await stopRecordingMobile();
      }
    } else {
      if (Platform.OS === 'web') {
        await startRecordingWeb();
      } else {
        await startRecordingMobile();
      }
    }
  }, [isRecording]);



  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" translucent backgroundColor="transparent" />
      
      <View style={styles.safe}>
        <View style={styles.container}>
          <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
            <View style={styles.progressBarContainer}>
              {FORM_QUESTIONS.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressBar,
                    index <= currentQuestionIndex
                      ? styles.progressBarActive
                      : styles.progressBarInactive,
                  ]}
                />
              ))}
            </View>
          </View>

          <ScrollView 
            ref={scrollViewRef}
            style={styles.content}
            contentContainerStyle={[
              styles.contentContainer,
              keyboardHeight > 0 && { paddingBottom: keyboardHeight + 300 }
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            overScrollMode="always"
            scrollEnabled={true}
          >
            <Animated.View 
              style={[
                styles.questionContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {keyboardHeight === 0 && (
                <>
                  {currentQuestion.header && (
                    <Text style={styles.headerText}>{currentQuestion.header}</Text>
                  )}
                  <Text style={styles.questionText}>{currentQuestion.text}</Text>
                  {currentQuestion.description && (
                    <Text style={styles.descriptionText}>{renderFormattedText(currentQuestion.description)}</Text>
                  )}
                </>
              )}

              <View style={styles.inputContainer}>
                {keyboardHeight === 0 && !currentQuestion.description && (
                  <View style={styles.placeholderBox}>
                    <Text style={styles.placeholderText}>{currentQuestion.placeholder}</Text>
                  </View>
                )}

                {keyboardHeight > 0 && (
                  <View style={styles.compactQuestionBox}>
                    {currentQuestion.header && (
                      <Text style={styles.compactHeaderText}>{currentQuestion.header}</Text>
                    )}
                    <Text style={styles.compactQuestionText}>{currentQuestion.text}</Text>
                    <Text style={styles.compactDescriptionText}>{renderFormattedText(currentQuestion.description || currentQuestion.placeholder)}</Text>
                  </View>
                )}

                <View style={styles.textInputWrapper}>
                  <TextInput
                    ref={inputRef}
                    style={[
                      styles.input,
                      validationError && styles.inputError,
                      inputValue.length > 500 && styles.inputTransparent,
                    ]}
                    value={isRecording && liveTranscript ? `${inputValue}${inputValue ? ' ' : ''}${liveTranscript}` : inputValue}
                    onChangeText={(text) => {
                      const sanitized = sanitizeInput(text);
                      setInputValue(sanitized);
                      if (validationError) {
                        if (sanitized.trim().length >= 10 && sanitized.length <= 500) {
                          setValidationError('');
                        }
                      }
                    }}
                    placeholder="Escríbelo aquí…"
                    placeholderTextColor="rgba(251, 239, 217, 0.3)"
                    multiline
                    textAlignVertical="top"
                    autoFocus={false}
                    editable={!isRecording}
                    scrollEnabled={true}
                  />
                  {inputValue.length > 500 && (
                    <ScrollView 
                      style={styles.textOverlay} 
                      contentContainerStyle={styles.textOverlayContent}
                      pointerEvents="none"
                      showsVerticalScrollIndicator={false}
                      scrollEnabled={false}
                    >
                      <Text style={styles.overlayText}>
                        <Text style={styles.normalText}>{inputValue.slice(0, 500)}</Text>
                        <Text style={styles.excessText}>{inputValue.slice(500)}</Text>
                      </Text>
                    </ScrollView>
                  )}
                </View>

                {validationError && (
                  <Text style={styles.errorText}>{validationError}</Text>
                )}

                <View style={styles.inputFooter}>
                  <View style={styles.micContainer}>
                    <Pressable
                      onPress={handleMicPress}
                      onPressIn={() => {
                        Animated.spring(micButtonScale, {
                          toValue: 0.85,
                          useNativeDriver: true,
                          speed: 50,
                          bounciness: 0,
                        }).start();
                      }}
                      onPressOut={() => {
                        Animated.spring(micButtonScale, {
                          toValue: 1,
                          useNativeDriver: true,
                          speed: 50,
                          bounciness: 0,
                        }).start();
                      }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      disabled={isTranscribing}
                    >
                      <Animated.View style={[
                        styles.micButton,
                        isRecording && styles.micButtonRecording,
                        isTranscribing && styles.micButtonTranscribing,
                        { transform: [{ scale: micButtonScale }] }
                      ]}>
                        {isTranscribing ? (
                          <Text style={styles.micButtonText}>...</Text>
                        ) : isRecording ? (
                          <Square color="#ff6b35" size={16} strokeWidth={2} fill="#ff6b35" />
                        ) : (
                          <Mic color="#fbefd9" size={20} strokeWidth={2} />
                        )}
                      </Animated.View>
                    </Pressable>
                    {isRecording && (
                      <Text style={styles.recordingTime}>{recordingSeconds}s</Text>
                    )}
                  </View>

                  <Text style={styles.charCount}>
                    {(isRecording && liveTranscript ? inputValue.length + liveTranscript.length + 1 : inputValue.length)}/{currentQuestion.maxLength}
                  </Text>
                </View>
              </View>
            </Animated.View>
          </ScrollView>

          <Animated.View style={[styles.footer, { 
            transform: [{ translateY: keyboardAnimatedHeight }],
            paddingBottom: keyboardHeight === 0 ? 55 : 15,
          }]} pointerEvents="box-none">
            <Pressable
              onPress={handlePrevious}
              onPressIn={() => {
                if (isRecording) return;
                Animated.parallel([
                  Animated.timing(prevButtonScale, {
                    toValue: 0.9,
                    duration: 150,
                    useNativeDriver: true,
                  }),
                  Animated.timing(prevButtonOpacity, {
                    toValue: 0.2,
                    duration: 150,
                    useNativeDriver: true,
                  }),
                ]).start();
              }}
              onPressOut={() => {
                if (isRecording) return;
                Animated.parallel([
                  Animated.timing(prevButtonScale, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true,
                  }),
                  Animated.timing(prevButtonOpacity, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true,
                  }),
                ]).start();
              }}
              style={{ flex: 1 }}
              disabled={isRecording}
            >
              <Animated.View style={[
                styles.button, 
                styles.buttonSecondary,
                isRecording && styles.buttonDisabledSecondary,
                {
                  transform: [{ scale: prevButtonScale }], 
                  opacity: isRecording ? 0.3 : prevButtonOpacity
                }
              ]}>
                <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Atrás</Text>
              </Animated.View>
            </Pressable>

            <Pressable
              onPress={handleNext}
              onPressIn={() => {
                if (isRecording) return;
                Animated.parallel([
                  Animated.timing(nextButtonScale, {
                    toValue: 0.9,
                    duration: 150,
                    useNativeDriver: true,
                  }),
                  Animated.timing(nextButtonOpacity, {
                    toValue: 0.2,
                    duration: 150,
                    useNativeDriver: true,
                  }),
                ]).start();
              }}
              onPressOut={() => {
                if (isRecording) return;
                Animated.parallel([
                  Animated.timing(nextButtonScale, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true,
                  }),
                  Animated.timing(nextButtonOpacity, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true,
                  }),
                ]).start();
              }}
              style={{ flex: 1 }}
              disabled={isRecording}
            >
              <Animated.View style={[
                styles.button, 
                styles.buttonPrimary,
                isRecording && styles.buttonDisabled,
                {
                  transform: [{ scale: nextButtonScale }], 
                  opacity: isRecording ? 0.3 : nextButtonOpacity
                }
              ]}>
                <Text style={[styles.buttonText, styles.buttonTextPrimary]}>
                  {isLastQuestion ? 'Enviar' : 'Siguiente'}
                </Text>
              </Animated.View>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#170501',
  },
  safe: {
    flex: 1,
    backgroundColor: '#170501',
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },
  progressBarContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  progressBarActive: {
    backgroundColor: '#ff6b35',
  },
  progressBarInactive: {
    backgroundColor: 'rgba(251, 239, 217, 0.3)',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  questionContainer: {
    flex: 1,
  },
  headerText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(251, 239, 217, 0.5)',
    letterSpacing: 1,
    marginBottom: 12,
  },
  questionText: {
    fontSize: 33,
    fontWeight: '700',
    color: '#fbefd9',
    lineHeight: 34,
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 14.4,
    color: 'rgba(251, 239, 217, 0.5)',
    lineHeight: 20,
    marginBottom: 16,
  },
  examplesContainer: {
    marginBottom: 24,
  },
  examplesTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fbefd9',
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: 'rgba(251, 239, 217, 0.6)',
    lineHeight: 20,
    marginBottom: 4,
  },
  inputContainer: {
    flex: 1,
  },
  placeholderBox: {
    marginBottom: 24,
  },
  placeholderText: {
    fontSize: 15,
    color: 'rgba(251, 239, 217, 0.5)',
    lineHeight: 22,
  },
  input: {
    backgroundColor: 'rgba(251, 239, 217, 0.08)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fbefd9',
    lineHeight: 24,
    minHeight: 200,
    maxHeight: 400,
    borderWidth: 1,
    borderColor: 'rgba(251, 239, 217, 0.2)',
  },
  inputError: {
    borderColor: '#ff6b35',
    borderWidth: 2,
  },
  errorText: {
    fontSize: 13,
    color: '#ff6b35',
    marginTop: 8,
    fontWeight: '600',
  },
  inputFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  micContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recordingTime: {
    fontSize: 16,
    color: '#ff6b35',
    fontWeight: '700',
    minWidth: 40,
  },
  micButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(251, 239, 217, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(251, 239, 217, 0.2)',
  },
  micButtonRecording: {
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    borderColor: '#ff6b35',
  },
  micButtonTranscribing: {
    backgroundColor: 'rgba(251, 239, 217, 0.15)',
    borderColor: 'rgba(251, 239, 217, 0.3)',
  },
  micButtonText: {
    fontSize: 18,
    color: '#fbefd9',
    fontWeight: '700' as const,
  },
  charCount: {
    fontSize: 14,
    color: 'rgba(251, 239, 217, 0.4)',
    fontWeight: '500',
  },
  compactQuestionBox: {
    marginBottom: 16,
  },
  compactHeaderText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(251, 239, 217, 0.5)',
    letterSpacing: 1,
    marginBottom: 6,
  },
  compactQuestionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fbefd9',
    lineHeight: 20,
  },
  compactDescriptionText: {
    fontSize: 13,
    color: 'rgba(251, 239, 217, 0.5)',
    lineHeight: 18,
    marginTop: 4,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 15,
    gap: 12,
    backgroundColor: '#170501',
    borderTopWidth: 1,
    borderTopColor: 'rgba(251, 239, 217, 0.1)',
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#ff6b35',
  },
  buttonSecondary: {
    backgroundColor: 'rgba(251, 239, 217, 0.1)',
  },
  buttonDisabled: {
    backgroundColor: 'rgba(255, 107, 53, 0.3)',
  },
  buttonDisabledSecondary: {
    backgroundColor: 'rgba(251, 239, 217, 0.05)',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  buttonTextPrimary: {
    color: '#ffffff',
  },
  buttonTextSecondary: {
    color: '#fbefd9',
  },
  buttonTextDisabled: {
    color: 'rgba(255, 255, 255, 0.4)',
  },
  textInputWrapper: {
    position: 'relative',
  },
  inputTransparent: {
    color: 'transparent',
  },
  textOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  textOverlayContent: {
    padding: 16,
  },
  overlayText: {
    fontSize: 16,
    lineHeight: 24,
  },
  normalText: {
    color: '#fbefd9',
  },
  excessText: {
    color: '#ff0000',
  },
});
