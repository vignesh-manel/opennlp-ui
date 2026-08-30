package opennlp.ui.api;

import io.javalin.http.Context;

import java.io.File;
import java.util.Arrays;
import java.util.List;

/**
 * Lets the frontend browse the local filesystem for .bin model files
 * so users don't have to type full paths manually.
 */
public class ModelResource {

  public void browse(Context ctx) {
    String dir = ctx.queryParam("dir");

    File directory;
    if (dir == null || dir.isBlank()) {
      directory = new File(System.getProperty("user.home"));
    } else {
      directory = new File(dir);
    }

    if (!directory.exists() || !directory.isDirectory()) {
      ctx.status(400).json(new BrowseResponse(null, List.of(), "Directory not found: " + dir));
      return;
    }

    File[] entries = directory.listFiles();
    if (entries == null) {
      ctx.json(new BrowseResponse(directory.getAbsolutePath(), List.of(), null));
      return;
    }

    List<FileEntry> files = Arrays.stream(entries)
        .filter(f -> f.isDirectory() || f.getName().endsWith(".bin"))
        .sorted((a, b) -> {
          // Files always after directories
          if (a.isDirectory() && !b.isDirectory()) return -1;
          if (!a.isDirectory() && b.isDirectory()) return 1;
          // Within directories: non-hidden (no leading dot) before hidden
          if (a.isDirectory() && b.isDirectory()) {
            boolean aHidden = a.getName().startsWith(".");
            boolean bHidden = b.getName().startsWith(".");
            if (!aHidden && bHidden) return -1;
            if (aHidden && !bHidden) return 1;
          }
          return a.getName().compareToIgnoreCase(b.getName());
        })
        .map(f -> new FileEntry(f.getName(), f.getAbsolutePath(), f.isDirectory(),
            f.isFile() ? f.length() : 0))
        .toList();

    // Include parent directory navigation
    File parent = directory.getParentFile();
    ctx.json(new BrowseResponse(directory.getAbsolutePath(), files,
        parent != null ? parent.getAbsolutePath() : null));
  }

  public record BrowseResponse(String currentPath, List<FileEntry> entries, String parentPath) {}

  public record FileEntry(String name, String path, boolean isDirectory, long sizeBytes) {}
}
