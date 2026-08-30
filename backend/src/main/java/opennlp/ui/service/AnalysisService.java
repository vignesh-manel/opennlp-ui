package opennlp.ui.service;

import opennlp.tools.langdetect.Language;
import opennlp.tools.langdetect.LanguageDetectorME;
import opennlp.tools.namefind.NameFinderME;
import opennlp.tools.postag.POSTaggerME;
import opennlp.tools.sentdetect.SentenceDetectorME;
import opennlp.tools.tokenize.TokenizerME;
import opennlp.tools.util.Span;
import opennlp.ui.dto.AnalysisRequest;
import opennlp.ui.dto.AnalysisRequest.FeatureConfig;
import opennlp.ui.dto.AnalysisResponse;
import opennlp.ui.dto.AnalysisResponse.*;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class AnalysisService {

  private final ModelCache modelCache;

  public AnalysisService(ModelCache modelCache) {
    this.modelCache = modelCache;
  }

  public AnalysisResponse analyze(AnalysisRequest request) {
    String text = request.text();
    FeatureConfig features = request.features();
    List<String> errors = new ArrayList<>();

    // Step 1: Sentence detection
    Span[] sentenceSpans = detectSentences(text, features, errors);

    // Step 2: Tokenize each sentence, returning absolute char offsets
    List<Token> tokens = new ArrayList<>();
    List<Sentence> sentences = new ArrayList<>();
    String[][] tokenizedSentences = new String[sentenceSpans.length][];
    Span[][] tokenSpansPerSentence = new Span[sentenceSpans.length][];

    for (int i = 0; i < sentenceSpans.length; i++) {
      Span sentSpan = sentenceSpans[i];
      String sentText = sentSpan.getCoveredText(text).toString();
      sentences.add(new Sentence(sentSpan.getStart(), sentSpan.getEnd(), sentText));

      Span[] tokenSpans = tokenize(sentText, features, errors);
      tokenSpansPerSentence[i] = tokenSpans;
      tokenizedSentences[i] = Span.spansToStrings(tokenSpans, sentText);
    }

    // Step 3: POS tagging (per sentence)
    String[][] posTagsPerSentence = posTag(tokenizedSentences, features, errors);

    // Step 4: Assemble token list with absolute offsets and POS tags
    for (int i = 0; i < sentenceSpans.length; i++) {
      int sentOffset = sentenceSpans[i].getStart();
      for (int j = 0; j < tokenSpansPerSentence[i].length; j++) {
        Span relSpan = tokenSpansPerSentence[i][j];
        int absStart = sentOffset + relSpan.getStart();
        int absEnd = sentOffset + relSpan.getEnd();
        String tokenText = tokenizedSentences[i][j];
        String posTag = (posTagsPerSentence != null && posTagsPerSentence[i] != null
            && j < posTagsPerSentence[i].length) ? posTagsPerSentence[i][j] : null;
        tokens.add(new Token(absStart, absEnd, tokenText, posTag));
      }
    }

    // Step 5: Named entity recognition (per sentence)
    List<Entity> entities = findEntities(text, sentenceSpans, tokenizedSentences,
        tokenSpansPerSentence, features, errors);

    // Step 6: Language detection (whole text)
    LanguageResult languageResult = detectLanguage(text, features, errors);

    return new AnalysisResponse(text, sentences, tokens, entities, languageResult, errors);
  }

  private Span[] detectSentences(String text, FeatureConfig features, List<String> errors) {
    var config = features.sentenceDetection();
    if (config != null && config.enabled() && config.modelPath() != null && !config.modelPath().isBlank()) {
      try {
        var model = modelCache.getSentenceModel(config.modelPath());
        var detector = new SentenceDetectorME(model);
        return detector.sentPosDetect(text);
      } catch (Exception e) {
        errors.add("Sentence detection: " + e.getMessage());
      }
    }
    // Fallback: treat entire text as one sentence
    return new Span[]{new Span(0, text.length())};
  }

  private Span[] tokenize(String sentenceText, FeatureConfig features, List<String> errors) {
    var config = features.tokenization();
    if (config != null && config.enabled() && config.modelPath() != null && !config.modelPath().isBlank()) {
      try {
        var model = modelCache.getTokenizerModel(config.modelPath());
        var tokenizer = new TokenizerME(model);
        return tokenizer.tokenizePos(sentenceText);
      } catch (Exception e) {
        errors.add("Tokenization: " + e.getMessage());
      }
    }
    // Fallback: whitespace tokenization
    return whitespaceTokenize(sentenceText);
  }

  private String[][] posTag(String[][] tokenizedSentences, FeatureConfig features, List<String> errors) {
    var config = features.posTagging();
    if (config == null || !config.enabled() || config.modelPath() == null || config.modelPath().isBlank()) {
      return null;
    }
    try {
      var model = modelCache.getPosModel(config.modelPath());
      var tagger = new POSTaggerME(model);
      String[][] result = new String[tokenizedSentences.length][];
      for (int i = 0; i < tokenizedSentences.length; i++) {
        result[i] = tagger.tag(tokenizedSentences[i]);
      }
      return result;
    } catch (Exception e) {
      errors.add("POS tagging: " + e.getMessage());
      return null;
    }
  }

  private List<Entity> findEntities(String fullText, Span[] sentenceSpans,
      String[][] tokenizedSentences, Span[][] tokenSpansPerSentence,
      FeatureConfig features, List<String> errors) {
    List<Entity> entities = new ArrayList<>();
    var config = features.ner();
    if (config == null || !config.enabled() || config.modelPath() == null || config.modelPath().isBlank()) {
      return entities;
    }
    try {
      var model = modelCache.getNameFinderModel(config.modelPath());
      var nameFinder = new NameFinderME(model);
      // Default entity type label — overridden per-span by the type stored in each Span
      String defaultEntityType = "entity";

      for (int i = 0; i < sentenceSpans.length; i++) {
        int sentOffset = sentenceSpans[i].getStart();
        Span[] nameSpans = nameFinder.find(tokenizedSentences[i]);
        for (Span nameSpan : nameSpans) {
          // nameSpan is in token indices — convert to character offsets
          int charStart = sentOffset + tokenSpansPerSentence[i][nameSpan.getStart()].getStart();
          int charEnd = sentOffset + tokenSpansPerSentence[i][nameSpan.getEnd() - 1].getEnd();
          String entityText = fullText.substring(charStart, charEnd);
          entities.add(new Entity(charStart, charEnd, entityText,
              nameSpan.getType() != null ? nameSpan.getType() : defaultEntityType,
              nameSpan.getProb()));
        }
        nameFinder.clearAdaptiveData();
      }
    } catch (Exception e) {
      errors.add("NER: " + e.getMessage());
    }
    return entities;
  }

  private LanguageResult detectLanguage(String text, FeatureConfig features, List<String> errors) {
    var config = features.languageDetection();
    if (config == null || !config.enabled() || config.modelPath() == null || config.modelPath().isBlank()) {
      return null;
    }
    try {
      var model = modelCache.getLangDetectModel(config.modelPath());
      var detector = new LanguageDetectorME(model);
      Language best = detector.predictLanguage(text);
      Language[] topN = detector.predictLanguages(text);
      List<LanguageResult> topLanguages = Arrays.stream(topN)
          .limit(5)
          .map(l -> new LanguageResult(l.getLang(), l.getConfidence()))
          .toList();
      return new LanguageResult(best.getLang(), best.getConfidence(), topLanguages);
    } catch (Exception e) {
      errors.add("Language detection: " + e.getMessage());
      return null;
    }
  }

  /** Fallback: split on whitespace, producing character-offset Spans. */
  private Span[] whitespaceTokenize(String text) {
    List<Span> spans = new ArrayList<>();
    int start = -1;
    for (int i = 0; i <= text.length(); i++) {
      boolean boundary = i == text.length() || Character.isWhitespace(text.charAt(i));
      if (!boundary && start == -1) {
        start = i;
      } else if (boundary && start != -1) {
        spans.add(new Span(start, i));
        start = -1;
      }
    }
    return spans.toArray(new Span[0]);
  }
}
