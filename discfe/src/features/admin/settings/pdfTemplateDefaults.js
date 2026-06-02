const createField = (
  page,
  x,
  y,
  width,
  height,
  fontSize,
  align = "left",
  color = "#111111",
  options = {}
) => ({
  page,
  x,
  y,
  width,
  height,
  fontSize,
  color,
  align,
  ...options,
});

const PAID_TEXT_COLOR = "#33434c";
const PAID_CARD_BACKGROUND = "#DEF6CC";
const PAID_CARD_BORDER = "#B7D99A";

const createPaidCardField = (page, x, y, width, height, fontSize) =>
  createField(page, x, y, width, height, fontSize, "left", PAID_TEXT_COLOR, {
    appearance: "card",
    backgroundColor: PAID_CARD_BACKGROUND,
    borderColor: PAID_CARD_BORDER,
    borderWidth: 1.5,
    radius: 18,
    padding: 18,
  });

export const createDefaultPdfTemplateConfig = () => ({
  fullName: [
    createField(2, 650, 840.5, 760, 60, 40, "left", "#33444c"),
  ],
  phoneNumber: [
    createField(2, 650, 753.5, 760, 60, 40, "left", "#33444c"),
  ],
  email: [
    createField(2, 650, 675.5, 760, 60, 36, "left", "#33444c"),
  ],
  address: [
    createField(2, 650, 573.5, 760, 84, 34, "left", "#33444c"),
  ],
  disc_D_score: [
    createField(6, 535.68, 1484.26, 295, 68, 50, "left", "#33444c", {
      backgroundColor: "#DEF5CC",
      appearance: "highlight",
    }),
  ],
  disc_I_score: [
    createField(6, 500.64, 1319.26, 273, 68, 50, "left", "#33444c", {
      backgroundColor: "#DEF5CC",
      appearance: "highlight",
    }),
  ],
  disc_S_score: [
    createField(6, 451.94, 1154.26, 291, 68, 50, "left", "#33444c", {
      backgroundColor: "#DEF5CC",
      appearance: "highlight",
    }),
  ],
  disc_C_score: [
    createField(6, 494.84, 989.26, 292, 68, 50, "left", "#33444c", {
      backgroundColor: "#DEF5CC",
      appearance: "highlight",
    }),
  ],
  disc_type: [
    createField(6, 701.79, 824.26, 221, 68, 50, "left", "#33444c", {
      backgroundColor: "#DEF5CC",
      appearance: "highlight",
    }),
  ],
  disc_primary: [
    createField(6, 469.94, 576.76, 289, 68, 50, "left", "#33444c", {
      backgroundColor: "#DEF5CC",
      appearance: "highlight",
    }),
  ],
  disc_secondary: [
    createField(6, 440.49, 329.26, 342, 68, 50, "left", "#33444c", {
      backgroundColor: "#DEF5CC",
      appearance: "highlight",
    }),
  ],
  disc_summary: [
    createField(8, 68.2, 1640.26, 1380, 68, 46, "left", "#33444c", {
      backgroundColor: "#DEF5CC",
      appearance: "highlight",
    }),
  ],
  disc_strength: [
    createField(9, 68.2, 105.7, 1380, 220, 44, "left", "#33444c", {
      backgroundColor: "#DEF5CC",
      appearance: "highlight",
    }),
  ],
  disc_limitation: [
    createField(11, 68.2, 1302.45, 1380, 250, 44, "left", "#33444c", {
      backgroundColor: "#DEF5CC",
      appearance: "highlight",
    }),
  ],
});

export const createDefaultPdfTemplateConfigPaid = () => ({
  fullName: [
    createField(2, 650, 840.5, 760, 60, 40, "left", PAID_TEXT_COLOR),
  ],
  phoneNumber: [
    createField(2, 650, 753.5, 760, 60, 40, "left", PAID_TEXT_COLOR),
  ],
  email: [
    createField(2, 650, 675.5, 760, 60, 36, "left", PAID_TEXT_COLOR),
  ],
  address: [
    createField(2, 650, 573.5, 760, 84, 34, "left", PAID_TEXT_COLOR),
  ],
  disc_percent_d: [
    createField(20, 133, 494.5, 240, 68, 38, "left", PAID_TEXT_COLOR),
  ],
  disc_percent_i: [
    createField(20, 109, 412, 240, 68, 38, "left", PAID_TEXT_COLOR),
  ],
  disc_percent_s: [
    createField(20, 127, 329.5, 240, 68, 38, "left", PAID_TEXT_COLOR),
  ],
  disc_percent_c: [
    createField(20, 130, 247, 240, 68, 38, "left", PAID_TEXT_COLOR),
  ],
  disc_primary_axis: [
    createPaidCardField(22, 100, 1462.5, 1100, 420, 34),
  ],
  disc_secondary_axis: [
    createPaidCardField(23, 100, 718.5, 1150, 430, 34),
  ],
  disc_low_zone: [
    createPaidCardField(25, 100, 1549.5, 980, 250, 34),
  ],
  disc_combination: [
    createPaidCardField(26, 100, 389.5, 1100, 360, 34),
  ],
  disc_archetype: [
    createPaidCardField(28, 100, 1049.5, 1180, 420, 30),
  ],
  disc_strengths: [
    createPaidCardField(30, 100, 702.5, 1220, 520, 28),
  ],
  disc_weaknesses: [
    createPaidCardField(32, 100, 1299.5, 1220, 500, 28),
  ],
  disc_motivation: [
    createPaidCardField(33, 100, 158.5, 1220, 420, 28),
  ],
  disc_stress_behavior: [
    createPaidCardField(35, 100, 1549.5, 1250, 250, 28),
  ],
  disc_communication_style: [
    createPaidCardField(36, 100, 809.5, 1300, 330, 28),
  ],
  disc_work_environment: [
    createPaidCardField(37, 100, 552.5, 1280, 350, 28),
  ],
  disc_career_fields: [
    createPaidCardField(38, 100, 703.5, 1220, 280, 28),
  ],
  disc_work_roles: [
    createPaidCardField(39, 100, 1122.5, 1220, 430, 28),
  ],
});
