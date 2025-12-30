import { useCanvasArtifacts } from '@/stores/useCanvasArtifacts';
import { useChatMessages } from '@/stores/useChatMessages';
import { useEffect } from 'react';

export function useArtifactParsing() {
  const messages = useChatMessages(state => state.messages);
  const { restoreArtifactsFromMessage } = useCanvasArtifacts();
  
  // Keep track of processed content hash or length to avoid re-parsing identical content
  // But for now, we rely on restoreArtifactsFromMessage's internal check
  
  useEffect(() => {
    messages.forEach(msg => {
      // Only parse assistant messages
      if (msg.role === 'assistant' && typeof msg.content === 'string') {
        // Optimization: check if content contains canvas tags before calling store
        if (msg.content.includes('<canvasArtifact')) {
            restoreArtifactsFromMessage(msg.id, msg.content);
        }
      }
    });
  }, [messages, restoreArtifactsFromMessage]);
}
