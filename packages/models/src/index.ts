/**
 * The shipped model catalog.
 *
 * Every model is declared in its own file under image/, video/ or audio/ using
 * the factories from `@forge/core`. This file only collects them — adding a
 * model means adding a file and one line here.
 *
 * Prices were read from Cloudflare's published pricing and model pages on
 * 2026-11-10. They move; see README for how to re-check them.
 */
import type { AnyModel } from '@forge/core';

import { fluxSchnell } from './image/flux-1-schnell';
import { lucidOrigin } from './image/lucid-origin';
import { phoenix } from './image/phoenix-1.0';
import { gptImage25Flare } from './image/gpt-image-2-5-flare';

import { veo31 } from './video/veo-3-1';
import { wan30 } from './video/wan-3-0';
import { grokImagineVideo } from './video/grok-imagine-video';

import { aura1 } from './audio/aura-1';
import { grokTts } from './audio/grok-tts';
import { minimaxSpeech } from './audio/speech-2-8-turbo';
import { nova3 } from './audio/nova-3';

export const imageModels = [fluxSchnell, lucidOrigin, phoenix, gptImage25Flare];
export const videoModels = [veo31, wan30, grokImagineVideo];
export const audioModels = [aura1, grokTts, minimaxSpeech, nova3];

/** Everything, in the order the control panel lists it. */
export const allModels: AnyModel[] = [
  ...imageModels,
  ...videoModels,
  ...audioModels,
] as AnyModel[];

export {
  fluxSchnell,
  lucidOrigin,
  phoenix,
  gptImage25Flare,
  veo31,
  wan30,
  grokImagineVideo,
  aura1,
  grokTts,
  minimaxSpeech,
  nova3,
};
