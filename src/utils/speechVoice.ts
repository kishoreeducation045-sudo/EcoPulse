/**
 * Speech synthesis utility for Fire TV & accessibility read-aloud
 * Enables hands-free audio playback for users with visual/reading difficulties.
 */

let activeUtterance: SpeechSynthesisUtterance | null = null;

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function stopSpeaking(): void {
  if (isSpeechSupported()) {
    try {
      window.speechSynthesis.cancel();
      activeUtterance = null;
    } catch (e) {
      console.warn('Speech cancellation error:', e);
    }
  }
}

export function speakMessage(
  text: string,
  options?: {
    rate?: number;
    pitch?: number;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }
): boolean {
  if (!isSpeechSupported()) {
    console.warn('Web Speech API is not supported in this browser environment.');
    return false;
  }

  try {
    stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options?.rate ?? 0.95; // Slightly relaxed pace for maximum intelligibility
    utterance.pitch = options?.pitch ?? 1.0;

    // Pick best natural sounding English voice if available
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(
      (v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha'))
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    if (options?.onStart) {
      utterance.onstart = options.onStart;
    }

    utterance.onend = () => {
      activeUtterance = null;
      if (options?.onEnd) options.onEnd();
    };

    utterance.onerror = (e) => {
      activeUtterance = null;
      if (options?.onError) options.onError(e);
    };

    activeUtterance = utterance;
    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.warn('Speech synthesis failure:', err);
    if (options?.onError) options.onError(err);
    return false;
  }
}
