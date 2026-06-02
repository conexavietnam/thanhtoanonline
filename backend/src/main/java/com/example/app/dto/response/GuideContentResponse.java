package com.example.app.dto.response;

import java.util.List;

public record GuideContentResponse(List<FaqItem> faqs, List<VideoItem> videos) {
  public record FaqItem(String question, String answer) {
  }

  public record VideoItem(String title, String url, String description) {
  }
}
