/**
 * Prompts 模块入口
 */

// Persona
export {
  DEFAULT_PERSONA,
  PERSONA_TEMPLATES,
  type PersonaConfig,
  type PersonaTemplate,
} from './persona'

// Chatbot prompts
export { buildChatbotSystemPrompt } from './chatbot.prompts'

// QA prompts
export {
  QA_REVIEW_PROMPT,
  QA_STAGE_FOOTERS,
  QA_STAGE_HEADERS,
  QA_TEST_CASES_PROMPT,
  QA_TEST_POINTS_PROMPT,
} from './qa'

// Canvas prompts
export { generateArtifactId, getCanvasSystemPrompt } from './canvas.prompts'
