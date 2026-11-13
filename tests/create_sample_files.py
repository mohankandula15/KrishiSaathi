"""
Creates sample soil health card test files (PDF and PNG) for end-to-end verification.
"""
from pathlib import Path
from PIL import Image, ImageDraw

def create_sample_image():
    out_dir = Path("tests/samples")
    out_dir.mkdir(parents=True, exist_ok=True)
    img_path = out_dir / "sample_soil_report.png"

    # Create white canvas
    img = Image.new("RGB", (800, 1000), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)

    text_lines = [
        "GOVERNMENT OF INDIA - SOIL HEALTH CARD",
        "Laboratory: District Soil Testing Lab, Ludhiana",
        "Farmer: Ramesh Kumar | Village: Kila Raipur | Dist: Ludhiana",
        "Sample No: SHC-PB-2025-9821 | Tested: 15-Oct-2025",
        "--------------------------------------------------",
        "PARAMETRIC ANALYSIS REPORT:",
        "Soil Reaction (pH): 7.20",
        "Electrical Conductivity (EC): 0.38 dS/m",
        "Organic Carbon (OC): 0.48 %",
        "Available Nitrogen (N): 185.0 kg/ha",
        "Available Phosphorus (P): 18.4 kg/ha",
        "Available Potassium (K): 295.0 kg/ha",
        "Available Zinc (Zn): 0.45 ppm",
        "Available Sulphur (S): 12.5 ppm",
        "Available Iron (Fe): 5.4 ppm",
        "Available Boron (B): 0.52 ppm",
        "--------------------------------------------------",
        "Status: Low Nitrogen, Low Zinc, High Potash"
    ]

    y = 40
    for line in text_lines:
        draw.text((40, y), line, fill=(20, 20, 20))
        y += 40

    img.save(img_path)
    print(f"Sample image created at {img_path}")

    # Also save as PDF using PIL
    pdf_path = out_dir / "sample_soil_report.pdf"
    img.save(pdf_path, "PDF", resolution=100.0)
    print(f"Sample PDF created at {pdf_path}")

if __name__ == "__main__":
    create_sample_image()
