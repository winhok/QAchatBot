/**
 * Template Service
 *
 * Manages QA templates loaded from MCP server resources.
 * Provides caching, YAML frontmatter parsing, and node-to-template mapping.
 *
 * Note: This is a simplified implementation that loads templates directly
 * from the file system. The MCP server integration can be added when
 * MultiServerMCPClient resource reading is properly configured.
 */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

interface TemplateMetadata {
  name: string
  version: string
  applicable_to?: string[]
}

interface CachedTemplate {
  content: string
  metadata: TemplateMetadata
  loadedAt: Date
}

/**
 * Node name to template file mapping
 */
const NODE_TEMPLATE_MAPPING: Record<string, string[]> = {
  // Graph nodes
  testPointsNode: ['test-points', 'best-practices'],
  testCasesNode: ['test-cases', 'best-practices'],
  reviewNode: ['review', 'security-checklist'],
  // Tool names (for direct tool usage)
  analyze_test_points: ['test-points', 'best-practices'],
  generate_test_cases: ['test-cases', 'best-practices'],
  review_test_cases: ['review', 'security-checklist'],
}

@Injectable()
export class TemplateService implements OnModuleInit {
  private readonly logger = new Logger(TemplateService.name)
  private templateCache: Map<string, CachedTemplate> = new Map()
  private readonly cacheTTL = 5 * 60 * 1000 // 5 minutes
  private readonly templatesDir: string
  private isInitialized = false

  constructor() {
    // Templates are located relative to the project root
    this.templatesDir = join(process.cwd(), 'src/mcp-servers/qa-templates/templates')
  }

  onModuleInit() {
    this.initialize()
  }

  /**
   * Initialize the template service
   */
  private initialize(): void {
    try {
      if (existsSync(this.templatesDir)) {
        this.isInitialized = true
        this.logger.log(`Template service initialized: ${this.templatesDir}`)
      } else {
        this.logger.warn(`Templates directory not found: ${this.templatesDir}`)
      }
    } catch (error) {
      this.logger.error('Failed to initialize template service', error)
    }
  }

  /**
   * Get a single template by name
   */
  getTemplate(name: string): string {
    const cacheKey = `template:${name}`

    // Check cache first
    const cached = this.templateCache.get(cacheKey)
    if (cached && Date.now() - cached.loadedAt.getTime() < this.cacheTTL) {
      return cached.content
    }

    // Load from file system
    if (!this.isInitialized) {
      this.logger.warn('Template service not initialized, returning empty template')
      return ''
    }

    try {
      const filePath = join(this.templatesDir, `${name}.md`)
      if (!existsSync(filePath)) {
        this.logger.warn(`Template file not found: ${filePath}`)
        return ''
      }

      const raw = readFileSync(filePath, 'utf-8')
      const { content, metadata } = this.parseTemplate(raw)

      this.templateCache.set(cacheKey, {
        content,
        metadata,
        loadedAt: new Date(),
      })

      this.logger.debug(`Loaded template: ${name} (v${metadata.version})`)
      return content
    } catch (error) {
      this.logger.error(`Failed to load template: ${name}`, error)
      return ''
    }
  }

  /**
   * Get combined templates for a graph node or tool
   */
  getTemplatesForNode(nodeName: string): string {
    const templateNames = NODE_TEMPLATE_MAPPING[nodeName]
    if (!templateNames || templateNames.length === 0) {
      this.logger.warn(`No template mapping found for node: ${nodeName}`)
      return ''
    }

    const templates = templateNames.map((name) => this.getTemplate(name))
    const validTemplates = templates.filter((t) => t.length > 0)

    if (validTemplates.length === 0) {
      return ''
    }

    return validTemplates.join('\n\n---\n\n')
  }

  /**
   * Get template metadata
   */
  getTemplateMetadata(name: string): TemplateMetadata | null {
    this.getTemplate(name) // Ensure cached
    return this.templateCache.get(`template:${name}`)?.metadata || null
  }

  /**
   * Clear template cache
   */
  clearCache(): void {
    this.templateCache.clear()
    this.logger.log('Template cache cleared')
  }

  /**
   * Parse template with YAML frontmatter
   */
  private parseTemplate(raw: string): { content: string; metadata: TemplateMetadata } {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/
    const match = raw.match(frontmatterRegex)

    if (!match) {
      return {
        content: raw,
        metadata: { name: 'unknown', version: '0.0.0' },
      }
    }

    // Simple YAML parsing (for basic frontmatter)
    const yamlContent = match[1]
    const metadata: TemplateMetadata = {
      name: 'unknown',
      version: '0.0.0',
    }

    for (const line of yamlContent.split('\n')) {
      const [key, ...valueParts] = line.split(':')
      const value = valueParts.join(':').trim()
      if (key === 'name') metadata.name = value
      if (key === 'version') metadata.version = value
      if (key === 'applicable_to') {
        // Parse array format: [item1, item2]
        const arrayMatch = value.match(/\[(.*)\]/)
        if (arrayMatch) {
          metadata.applicable_to = arrayMatch[1].split(',').map((s) => s.trim())
        }
      }
    }

    return {
      content: match[2].trim(),
      metadata,
    }
  }

  /**
   * Check if template service is ready
   */
  isReady(): boolean {
    return this.isInitialized
  }
}
