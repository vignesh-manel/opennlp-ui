package opennlp.ui.service;

import opennlp.tools.langdetect.LanguageDetectorModel;
import opennlp.tools.namefind.TokenNameFinderModel;
import opennlp.tools.postag.POSModel;
import opennlp.tools.sentdetect.SentenceModel;
import opennlp.tools.tokenize.TokenizerModel;

import java.io.FileInputStream;
import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Caches loaded OpenNLP models by file path so models aren't reloaded on every request.
 * Loading a .bin model is expensive (~100-500ms); inference is fast once loaded.
 */
public class ModelCache {

  private final ConcurrentHashMap<String, Object> cache = new ConcurrentHashMap<>();

  public SentenceModel getSentenceModel(String path) throws IOException {
    return (SentenceModel) cache.computeIfAbsent(path, p -> {
      try (var in = new FileInputStream(p)) {
        return new SentenceModel(in);
      } catch (IOException e) {
        throw new RuntimeException("Failed to load sentence model from: " + p, e);
      }
    });
  }

  public TokenizerModel getTokenizerModel(String path) throws IOException {
    return (TokenizerModel) cache.computeIfAbsent(path, p -> {
      try (var in = new FileInputStream(p)) {
        return new TokenizerModel(in);
      } catch (IOException e) {
        throw new RuntimeException("Failed to load tokenizer model from: " + p, e);
      }
    });
  }

  public POSModel getPosModel(String path) throws IOException {
    return (POSModel) cache.computeIfAbsent(path, p -> {
      try (var in = new FileInputStream(p)) {
        return new POSModel(in);
      } catch (IOException e) {
        throw new RuntimeException("Failed to load POS model from: " + p, e);
      }
    });
  }

  public TokenNameFinderModel getNameFinderModel(String path) throws IOException {
    return (TokenNameFinderModel) cache.computeIfAbsent(path, p -> {
      try (var in = new FileInputStream(p)) {
        return new TokenNameFinderModel(in);
      } catch (IOException e) {
        throw new RuntimeException("Failed to load NER model from: " + p, e);
      }
    });
  }

  public LanguageDetectorModel getLangDetectModel(String path) throws IOException {
    return (LanguageDetectorModel) cache.computeIfAbsent(path, p -> {
      try (var in = new FileInputStream(p)) {
        return new LanguageDetectorModel(in);
      } catch (IOException e) {
        throw new RuntimeException("Failed to load language detection model from: " + p, e);
      }
    });
  }

  public void clearAll() {
    cache.clear();
  }

  public void evict(String path) {
    cache.remove(path);
  }

  public int size() {
    return cache.size();
  }
}
