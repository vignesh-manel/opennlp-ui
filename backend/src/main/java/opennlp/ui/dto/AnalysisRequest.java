package opennlp.ui.dto;

import java.util.List;

public record AnalysisRequest(
    String text,
    FeatureConfig features
) {
  public record FeatureConfig(
      ModelFeature sentenceDetection,
      ModelFeature tokenization,
      ModelFeature posTagging,
      ModelFeature ner,
      ModelFeature languageDetection
  ) {}

  public record ModelFeature(
      boolean enabled,
      String modelPath  // absolute path to .bin file on local disk
  ) {}
}
