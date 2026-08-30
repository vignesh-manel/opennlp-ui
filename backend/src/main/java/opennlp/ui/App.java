package opennlp.ui;

import io.javalin.Javalin;
import io.javalin.http.staticfiles.Location;
import opennlp.ui.api.AnalysisResource;
import opennlp.ui.api.ModelResource;
import opennlp.ui.service.AnalysisService;
import opennlp.ui.service.ModelCache;

import java.awt.Desktop;
import java.net.URI;

public class App {

  static final int PORT = 8080;
  static final boolean DEV_MODE = "true".equals(System.getProperty("dev.mode"));

  public static void main(String[] args) throws Exception {
    ModelCache modelCache = new ModelCache();
    AnalysisService analysisService = new AnalysisService(modelCache);
    AnalysisResource analysisResource = new AnalysisResource(analysisService);
    ModelResource modelResource = new ModelResource();

    boolean hasWebapp = App.class.getResourceAsStream("/webapp/index.html") != null;

    if (!DEV_MODE && !hasWebapp) {
      System.err.println("""
          ─────────────────────────────────────────────────────────
          Frontend not found in JAR. Build it first:

            cd frontend && npm run build:backend

          Then repackage:

            cd backend && mvn package

          Or run in dev mode (no frontend build needed):

            cd backend && mvn compile exec:java
            cd frontend && npm run dev   ← in a second terminal
          ─────────────────────────────────────────────────────────
          """);
      System.exit(1);
    }

    Javalin app = Javalin.create(config -> {
      // Serve the React build from classpath:/webapp (populated by frontend build)
      if (!DEV_MODE && hasWebapp) {
        config.staticFiles.add("/webapp", Location.CLASSPATH);
        config.spaRoot.addFile("/", "/webapp/index.html", Location.CLASSPATH);
      }

      // In dev mode, allow Vite dev server (port 5173) to call the API.
      // In production mode the frontend is served from this same server,
      // so CORS must NOT be registered (it would reject same-origin asset requests).
      if (DEV_MODE) {
        config.bundledPlugins.enableCors(cors ->
            cors.addRule(rule -> {
              rule.allowHost("http://localhost:5173");
              rule.allowCredentials = true;
            })
        );
      }
    });

    // REST routes
    app.post("/api/analyze", analysisResource::analyze);
    app.get("/api/browse", modelResource::browse);

    app.exception(Exception.class, (e, ctx) -> {
      ctx.status(500).json(new ErrorResponse(e.getMessage()));
    });

    app.start(PORT);

    System.out.println("OpenNLP UI running at http://localhost:" + PORT);
    openBrowser("http://localhost:" + PORT);

    Runtime.getRuntime().addShutdownHook(new Thread(() -> {
      System.out.println("Shutting down...");
      modelCache.clearAll();
      app.stop();
    }));
  }

  private static void openBrowser(String url) {
    try {
      if (Desktop.isDesktopSupported() && Desktop.getDesktop().isSupported(Desktop.Action.BROWSE)) {
        Desktop.getDesktop().browse(new URI(url));
      }
    } catch (Exception e) {
      // Non-fatal — user can open the URL manually
      System.out.println("Could not open browser automatically. Please open: " + url);
    }
  }

  public record ErrorResponse(String error) {}
}
