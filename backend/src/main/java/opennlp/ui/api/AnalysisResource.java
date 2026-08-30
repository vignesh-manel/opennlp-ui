package opennlp.ui.api;

import io.javalin.http.Context;
import opennlp.ui.dto.AnalysisRequest;
import opennlp.ui.dto.AnalysisResponse;
import opennlp.ui.service.AnalysisService;

public class AnalysisResource {

  private final AnalysisService analysisService;

  public AnalysisResource(AnalysisService analysisService) {
    this.analysisService = analysisService;
  }

  public void analyze(Context ctx) {
    AnalysisRequest request = ctx.bodyAsClass(AnalysisRequest.class);

    if (request.text() == null || request.text().isBlank()) {
      ctx.status(400).json(new ErrorBody("text must not be empty"));
      return;
    }
    if (request.features() == null) {
      ctx.status(400).json(new ErrorBody("features configuration is required"));
      return;
    }

    AnalysisResponse response = analysisService.analyze(request);
    ctx.json(response);
  }

  private record ErrorBody(String error) {}
}
