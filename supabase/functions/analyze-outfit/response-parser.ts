
import { AnalyzeOutfitResponse, AnalyzeOutfitRequest } from './types.ts';
import { AdvancedResponseParser } from './advanced-parser.ts';

export function parseAIResponse(aiResponse: string, request: AnalyzeOutfitRequest): AnalyzeOutfitResponse {
  console.log('Using advanced response parser for improved feedback quality...');
  return AdvancedResponseParser.parseAIResponse(aiResponse, request);
}
