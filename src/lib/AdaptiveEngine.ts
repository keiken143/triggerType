import { wordBank } from './word-bank';
import { DifficultyMap } from '@/hooks/useTypingTelemetry';

const DEFAULT_LINE_LENGTH = 35; // Characters per line

export const generateAdaptiveSnippet = (language: string, difficulty: DifficultyMap, length: number = DEFAULT_LINE_LENGTH): string => {
    const normalizedLanguage = language.toLowerCase() as keyof typeof wordBank;
    const bank = wordBank[normalizedLanguage] || wordBank.simple;

    // Analyze "DNA" to find the top 3 weakest keys
    // Weight heavily towards errors, but also consider latency
    const weakKeys = Object.entries(difficulty)
        .sort((a, b) => {
            const scoreA = (a[1].avgLatency * 0.5) + (a[1].errors * 500);
            const scoreB = (b[1].avgLatency * 0.5) + (b[1].errors * 500);
            return scoreB - scoreA;
        })
        .slice(0, 3)
        .map(entry => entry[0]);

    let result = "";

    // Generate sequence until we hit the desired line length
    while (result.length < length) {
        // 35% chance to force a word containing a weak key (Adaptive Stress)
        const forceWeak = weakKeys.length > 0 && Math.random() < 0.35;
        let chosenWord = "";

        if (forceWeak) {
            // Pick a random weak key to target
            const targetKey = weakKeys[Math.floor(Math.random() * weakKeys.length)];

            // Filter bank for words containing that exact friction character
            const validWords = bank.filter(w => w.toLowerCase().includes(targetKey));

            // If no words have it (rare), fallback to random
            if (validWords.length > 0) {
                chosenWord = validWords[Math.floor(Math.random() * validWords.length)];
            } else {
                chosenWord = bank[Math.floor(Math.random() * bank.length)];
            }
        } else {
            // Standard flow state
            chosenWord = bank[Math.floor(Math.random() * bank.length)];
        }

        const newResult = result + (result.length > 0 ? " " : "") + chosenWord;

        // Check if adding this word exactly overshoots the line length limit significantly
        // If we're already close to length, maybe stop here to keep lines uniform
        if (newResult.length > length + 5) {
            break;
        }

        result = newResult;
    }

    // Slice to exact length and ensure it doesn't end on a hanging space
    return result.substring(0, length).trim();
}
