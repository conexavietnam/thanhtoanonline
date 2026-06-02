// Quốc Trí: keep the default homepage banners in one place so public pages and admin slideshow stay in sync.
export const DEFAULT_HOMEPAGE_SLIDES = [
  {
    imageUrl: "/banner1.jpg",
    title: "Lan tỏa lòng biết ơn",
    altText: "Banner dự án lan tỏa lòng biết ơn",
    link: "",
  },
  {
    imageUrl: "/banner2.jpg",
    title: "Hướng nghiệp thành công",
    altText: "Banner hướng nghiệp thành công",
    link: "",
  },
  {
    imageUrl: "/banner3.jpg",
    title: "Đào Ngọc Cường",
    altText: "Banner diễn giả Đào Ngọc Cường",
    link: "",
  },
];

export const cloneHomepageSlides = (slides = DEFAULT_HOMEPAGE_SLIDES) =>
  slides.map((slide) => ({ ...slide }));
