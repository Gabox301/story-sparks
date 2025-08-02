"use server";

/**
 * @fileOverview Converts text to speech.
 *
 * - textToSpeech - A function that converts text to speech.
 * - TextToSpeechInput - The input type for the textToSpeech function.
 * - TextToSpeechOutput - The return type for the textToSpeech function.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";
import wav from "wav";
import { googleAI } from "@genkit-ai/googleai";

const TextToSpeechInputSchema = z.object({
    text: z.string().describe("The text to convert to speech."),
});
export type TextToSpeechInput = z.infer<typeof TextToSpeechInputSchema>;

const TextToSpeechOutputSchema = z.object({
    audioDataUri: z
        .string()
        .describe(
            "A data URI of the audio. Expected format: 'data:audio/wav;base64,<encoded_data>'."
        ),
});

export type TextToSpeechOutput = z.infer<typeof TextToSpeechOutputSchema>;

export async function textToSpeech(
    input: TextToSpeechInput
): Promise<TextToSpeechOutput> {
    return textToSpeechFlow(input);
}

async function toWav(
    pcmData: Buffer,
    channels = 1,
    rate = 24000,
    sampleWidth = 2
): Promise<string> {
    return new Promise((resolve, reject) => {
        const writer = new wav.Writer({
            channels,
            sampleRate: rate,
            bitDepth: sampleWidth * 8,
        });

        let bufs: any[] = [];
        writer.on("error", reject);
        writer.on("data", function (d) {
            bufs.push(d);
        });
        writer.on("end", function () {
            resolve(Buffer.concat(bufs).toString("base64"));
        });

        writer.write(pcmData);
        writer.end();
    });
}

const textToSpeechFlow = ai.defineFlow(
    {
        name: "textToSpeechFlow",
        inputSchema: TextToSpeechInputSchema,
        outputSchema: TextToSpeechOutputSchema,
    },
    async ({ text }) => {
        const { media } = await ai.generate({
            model: googleAI.model("gemini-2.5-flash-preview-tts"),
            prompt: text,
            config: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: "Algenib" },
                    },
                    languageCode: "es-ES",
                },
            },
        });

        if (!media) {
            throw new Error("No se pudo generar el audio.");
        }
        const audioBuffer = Buffer.from(
            media.url.substring(media.url.indexOf(",") + 1),
            "base64"
        );

        const audioDataUri =
            "data:audio/wav;base64," + (await toWav(audioBuffer));

        return { audioDataUri };
    }
);
