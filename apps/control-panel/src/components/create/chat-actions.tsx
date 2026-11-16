'use client';

import { createContext, useContext } from 'react';

export interface EditRequest {
  /** What to ask for, in words. */
  text: string;
  /**
   * A composited PNG to send with it, as a data URL.
   *
   * Markup, comments and erase all work by flattening what you drew onto a
   * copy of the image and sending that — there is no mask parameter on the
   * models we run, so the annotation has to travel as pixels.
   */
  dataUrl?: string;
  /** The untouched image, when nothing was drawn on it. */
  url?: string;
  mime?: string;
}

export interface ChatActions {
  chatId: string;
  /** Send an edit back into the conversation as a new turn. */
  submitEdit: (request: EditRequest) => Promise<void>;
}

/*
 * A context rather than props: the viewer sits at the bottom of
 * CreateChat > Message > Generation > GenerationResult > MediaViewer, and
 * threading two callbacks through five components that have no other use for
 * them is how those components end up knowing about chat submission.
 */
const Context = createContext<ChatActions | null>(null);

export const ChatActionsProvider = Context.Provider;

export function useChatActions(): ChatActions | null {
  return useContext(Context);
}
