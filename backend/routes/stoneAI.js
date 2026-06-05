import express from "express";
const router = express.Router();
router.post("/calculate", (req, res) => {
  const {
    isSquare,
    area,
    length,
    width,
    height,
    windows,
    doors,
  } = req.body;
  if (
    typeof height !== "number" ||
    typeof windows !== "number" ||
    typeof doors !== "number"
  ) {
    return res.status(400).json({ message: "Invalid input" });
  }
  let perimeter;
  if (isSquare) {
    if (typeof area !== "number") {
      return res.status(400).json({ message: "Area is required" });
    }
    const side = Math.sqrt(area);
    perimeter = side * 4;
  } else {
    if (typeof length !== "number" || typeof width !== "number") {
      return res.status(400).json({ message: "Length & width are required" });
    }
    perimeter = 2 * (length + width);
  }
  const wallArea = perimeter * height;
  const openings = windows * 1.5 + doors * 2;
  const finalArea = ((wallArea - openings) * 1.05).toFixed(2);
  res.json({
    required_m2: Number(finalArea),
  });
});
export default router;
