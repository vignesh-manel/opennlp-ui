package opennlp.ui.dto;

import java.util.List;

public record AnalysisResponse(
    String text,
    List<Sentence> sentences,
    List<Token> tokens,
    List<Entity> entities,
    LanguageResult language,
    List<String> errors   // non-fatal per-feature errors (e.g. model not found)
) {
  public record Sentence(int start, int end, String text) {}

  public record Token(int start, int end, String text, String posTag) {}

  public record Entity(int start, int end, String text, String type, double confidence) {}

  public record LanguageResult(String language, double confidence, List<LanguageResult> topLanguages) {
    public LanguageResult(String language, double confidence) {
      this(language, confidence, null);
    }
  }
}
