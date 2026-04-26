import os
import io
import json
from typing import List, Dict
from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from paddleocr import PaddleOCR
from PIL import Image
import numpy as np

load_dotenv()

app = FastAPI(title="Receipt OCR Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize PaddleOCR
print("Loading PaddleOCR model...")
ocr = PaddleOCR(use_angle_cls=True, lang='en')
print("PaddleOCR loaded successfully!")

# Initialize Groq client
groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))


def extract_text_with_layout(result) -> str:
    """Extract text from OCR result with proper layout grouping."""
    # PaddleOCR result format: [[box_coords, (text, confidence)], ...]
    if not result or not result[0]:
        return ""

    # Parse items with coordinates
    parsed_items = []
    for item in result[0]:
        box = item[0]  # [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]
        text = item[1][0]  # text content

        # Calculate center Y and X bounds
        y_coords = [p[1] for p in box]
        x_coords = [p[0] for p in box]
        y_center = sum(y_coords) / 4
        x_left = min(x_coords)
        x_right = max(x_coords)

        parsed_items.append({
            'text': text,
            'y_center': y_center,
            'x_left': x_left,
            'x_right': x_right
        })

    # Sort by vertical position
    parsed_items.sort(key=lambda item: item['y_center'])

    # Group by line
    lines = []
    current_line = []
    y_tolerance = 20

    for item in parsed_items:
        if not current_line:
            current_line.append(item)
        else:
            last_item = current_line[-1]
            if abs(item['y_center'] - last_item['y_center']) <= y_tolerance:
                current_line.append(item)
            else:
                lines.append(current_line)
                current_line = [item]

    if current_line:
        lines.append(current_line)

    # Build text with proportional spacing
    final_text = ""
    char_width = 12

    for line in lines:
        line.sort(key=lambda item: item['x_left'])

        line_str = ""
        prev_x_right = 0

        for i, item in enumerate(line):
            if i == 0:
                line_str += item['text']
            else:
                gap_pixels = item['x_left'] - prev_x_right
                num_spaces = max(1, int(gap_pixels / char_width))
                line_str += (" " * num_spaces) + item['text']

            prev_x_right = item['x_right']

        final_text += line_str + "\n"

    return final_text


def parse_with_groq(extracted_text: str) -> List[Dict]:
    """Use Groq LLM to parse receipt text into structured data."""
    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Extract food items, products, and their prices from this receipt. "
                        "Return a JSON array with format: [{\"item\": \"name\", \"price\": number, \"quantity\": number}]. "
                        "Price should be a number without currency symbols. "
                        "Only return the JSON array, no other text."
                    )
                },
                {
                    "role": "user",
                    "content": extracted_text
                }
            ],
            temperature=0.1,
            max_tokens=1024
        )

        content = response.choices[0].message.content.strip()

        # Extract JSON from response
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]

        content = content.strip()

        return json.loads(content)

    except Exception as e:
        print(f"Groq parsing error: {e}")
        return []


@app.post("/scan")
async def scan_receipt(image: UploadFile = File(...)):
    """
    Scan a receipt image and extract items with prices.
    Returns: [{"item": "name", "price": 12.50, "quantity": 1}]
    """
    try:
        # Read image bytes
        image_bytes = await image.read()

        # Convert to PIL Image
        pil_image = Image.open(io.BytesIO(image_bytes)).convert('RGB')

        # Convert to numpy array for PaddleOCR
        img_array = np.array(pil_image)

        # Run OCR
        result = ocr.ocr(img_array, cls=True)

        if not result or not result[0]:
            return {"items": [], "raw_text": "", "message": "No text detected"}

        # Extract text with layout
        extracted_text = extract_text_with_layout(result)

        # Parse with Groq LLM
        items = parse_with_groq(extracted_text)

        return {
            "items": items,
            "raw_text": extracted_text,
            "message": f"Successfully extracted {len(items)} items"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "ocr-service"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 5000))
    uvicorn.run(app, host="0.0.0.0", port=port)
