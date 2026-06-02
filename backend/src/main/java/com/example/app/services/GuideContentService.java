package com.example.app.services;

import com.example.app.dto.response.GuideContentResponse;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class GuideContentService {
  public GuideContentResponse getGuideContent() {
    List<GuideContentResponse.FaqItem> faqs = List.of(
        new GuideContentResponse.FaqItem(
            "The platform supports free mode?",
            "No. The platform now runs as paid-only to protect product value and service quality."
        ),
        new GuideContentResponse.FaqItem(
            "When are credits deducted?",
            "Credits are required for all report exports. This ensures every delivery includes a personalized deep coaching report."
        ),
        new GuideContentResponse.FaqItem(
            "What is Deep Coaching report?",
            "A personalized consulting output with behavior diagnosis, communication playbook, sales actions, and a 30-day coaching roadmap."
        )
    );

    List<GuideContentResponse.VideoItem> videos = List.of(
        new GuideContentResponse.VideoItem(
            "Partner Platform Overview",
            "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "Quick walkthrough for partners/agencies, wholesale workflows, and premium reports."
        ),
        new GuideContentResponse.VideoItem(
            "Running Deep Coaching Assessment",
            "https://www.youtube.com/watch?v=oHg5SJYRHA0",
            "Step-by-step guide to create a paid session, complete assessment, and deliver coaching report."
        )
    );

    return new GuideContentResponse(faqs, videos);
  }
}
