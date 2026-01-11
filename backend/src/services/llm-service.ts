import OpenAI from 'openai';
import { llmResponseSchema, LLMResponse } from '../schemas/llm-response.js';
import { logger } from '../utils/logger.js';
import pLimit from 'p-limit';

/**
 * LLM Service for generating fake news headlines
 */
export class LLMService {
  private client: OpenAI;
  private limiter: ReturnType<typeof pLimit>;
  private timeout: number = 30000; // 30 seconds
  private maxRetries: number = 1;

  constructor(apiKey: string, concurrency: number = 3) {
    this.client = new OpenAI({ apiKey });
    this.limiter = pLimit(concurrency);
    
    logger.info('LLM Service initialized', { concurrency });
  }

  /**
   * Generate fake news headline and category for a real headline
   */
  async generateFakeNews(
    realTitle: string,
    articleId: string
  ): Promise<LLMResponse> {
    return this.limiter(async () => {
      const startTime = Date.now();

      try {
        logger.debug('Generating fake news', { articleId, realTitle });

        const response = await this.callOpenAI(realTitle);
        const duration = Date.now() - startTime;

        logger.info('Fake news generated', {
          articleId,
          duration,
          category: response.category,
        });

        return response;
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.error('Failed to generate fake news', {
          articleId,
          duration,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    });
  }

  /**
   * Call OpenAI API with retry logic
   */
  private async callOpenAI(realTitle: string): Promise<LLMResponse> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.makeRequest(realTitle);
        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < this.maxRetries) {
          logger.warn('OpenAI request failed, retrying', {
            attempt: attempt + 1,
            maxRetries: this.maxRetries,
            error: lastError.message,
          });
          await this.delay(1000); // Wait 1 second before retry
        }
      }
    }

    throw lastError || new Error('OpenAI request failed');
  }

  /**
   * Make a single request to OpenAI
   */
  private async makeRequest(realTitle: string): Promise<LLMResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const completion = await this.client.chat.completions.create(
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are a creative writer who generates obviously fake, absurd, and humorous news headlines that are semantically related to real headlines. 
Your headlines should be clearly satirical and impossible, but still connected to the original topic.
You must respond ONLY with valid JSON in this exact format: {"category": "string", "fakeTitle": "string"}
The category should be one word like: Politics, World, Business, Sports, Technology, Science, Health, Entertainment.
The fakeTitle must be maximum 140 characters.`,
            },
            {
              role: 'user',
              content: `Generate a fake headline for: "${realTitle}"`,
            },
          ],
          temperature: 0.9,
          max_tokens: 150,
          response_format: { type: 'json_object' },
        },
        {
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in OpenAI response');
      }

      // Parse and validate JSON response
      const parsed = JSON.parse(content);
      const validated = llmResponseSchema.parse(parsed);

      return validated;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('OpenAI request timeout');
      }
      
      throw error;
    }
  }

  /**
   * Delay helper for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      concurrency: this.limiter.activeCount,
      pending: this.limiter.pendingCount,
    };
  }
}
