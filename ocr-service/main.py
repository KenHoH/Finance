import os
import io
import json
import re
from typing import List, Dict, Optional, Tuple
from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from paddleocr import PaddleOCR
from PIL import Image, ImageEnhance, ImageFilter, ImageOps
import numpy as np
import cv2

load_dotenv()


def allowed_origins() -> List[str]:
    configured = os.environ.get("ALLOWED_ORIGINS", "")
    origins = [origin.strip() for origin in configured.split(",") if origin.strip()]
    if origins:
        return origins
    return ["http://localhost:3000", "http://localhost:5173"]

app = FastAPI(title="Receipt OCR Service", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins(),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize PaddleOCR with improved config
print("Loading PaddleOCR model...")
ocr = PaddleOCR(
    use_angle_cls=True,
    lang='en',
    det_db_thresh=0.2,        # lower = more text boxes detected
    det_db_box_thresh=0.4,    # lower = more boxes kept
    det_db_unclip_ratio=1.8,  # expand text regions for better coverage
    drop_score=0.3,           # keep lower-confidence results
    use_dilation=True,        # connect broken characters
    det_limit_side_len=1280,  # process at higher resolution
    rec_batch_num=8,          # more parallel recognition
    max_text_length=40,       # allow longer item names
)
print("PaddleOCR loaded successfully!")

# Initialize Groq client
groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))


def preprocess_image(pil_image: Image.Image) -> List[Tuple[Image.Image, str]]:
    """Generate multiple preprocessed variants of the image for OCR.
    Returns list of (image, label) tuples."""
    variants = []

    # Convert to numpy for OpenCV processing
    img = np.array(pil_image.convert('RGB'))
    img_bgr = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)

    # Variant 1: Original (just ensure RGB)
    variants.append((pil_image.convert('RGB'), 'original'))

    # Variant 2: Grayscale
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    variants.append((Image.fromarray(gray).convert('RGB'), 'grayscale'))

    # Variant 3: CLAHE contrast enhancement
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    gray_clahe = clahe.apply(gray)
    variants.append((Image.fromarray(gray_clahe).convert('RGB'), 'clahe'))

    # Variant 4: Sharpened
    gray_sharp = cv2.GaussianBlur(gray, (0, 0), 3)
    gray_sharp = cv2.addWeighted(gray, 1.5, gray_sharp, -0.5, 0)
    variants.append((Image.fromarray(gray_sharp).convert('RGB'), 'sharpened'))

    # Variant 5: Denoised
    gray_denoised = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)
    variants.append((Image.fromarray(gray_denoised).convert('RGB'), 'denoised'))

    # Variant 6: Adaptive threshold (binarization) - good for receipts
    gray_binary = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 15, 4
    )
    variants.append((Image.fromarray(gray_binary).convert('RGB'), 'binary'))

    # Variant 7: CLAHE + sharpen
    gray_clahe_sharp = cv2.GaussianBlur(gray_clahe, (0, 0), 3)
    gray_clahe_sharp = cv2.addWeighted(gray_clahe, 1.5, gray_clahe_sharp, -0.5, 0)
    variants.append((Image.fromarray(gray_clahe_sharp).convert('RGB'), 'clahe_sharp'))

    return variants


def merge_ocr_results(all_results: List[Tuple[str, str, any]]) -> Tuple[str, any]:
    """Merge OCR results from multiple preprocessing variants.
    Takes the best result (most text with numbers).
    Returns (best_text, raw_ocr_result)."""
    best_text = ""
    best_raw = None
    best_score = 0

    for text, label, raw_result in all_results:
        if not text.strip():
            continue
        lines = text.split('\n')
        num_lines = [l for l in lines if any(c.isdigit() for c in l)]
        score = len(num_lines) * 10 + len(text)

        if score > best_score:
            best_score = score
            best_text = text
            best_raw = raw_result
            print(f"  Best variant so far: {label} (score={score}, {len(num_lines)} price lines)")

    return best_text, best_raw


def ocr_correct(text: str) -> str:
    """Fix common OCR mistakes on Indonesian receipts."""
    corrections = {
        # Common OCR misreads
        'O': '0',  # letter O → zero (in prices)
        'l': '1',  # lowercase L → one
        'I': '1',  # capital I → one
        'S': '5',  # S → 5
        'B': '8',  # B → 8
        'G': '6',  # G → 6
        'Z': '2',  # Z → 2
        'T': '7',  # T → 7
        'A': '4',  # A → 4
        # Indonesian-specific
        'Rp.': 'Rp',
        'RP': 'Rp',
        'rp': 'Rp',
        'T0TAL': 'TOTAL',
        'T0tal': 'Total',
        'SUBT0TAL': 'SUBTOTAL',
        'SubT0tal': 'Subtotal',
        'Tunai': 'Cash',
        'Kembali': 'Change',
        'Kembalian': 'Change',
        'Diskon': 'Discount',
        'Pajak': 'Tax',
        'PPN': 'Tax',
    }

    # Don't apply letter→number corrections globally, only in price-like contexts
    # Just fix common Indonesian receipt OCR errors
    for wrong, right in corrections.items():
        if wrong in ['O', 'l', 'I', 'S', 'B', 'G', 'Z', 'T', 'A']:
            continue  # skip these, too aggressive globally
        text = text.replace(wrong, right)

    return text


def extract_text_with_layout(result) -> str:
    """Extract text from OCR result with proper layout grouping."""
    if not result or not result[0]:
        return ""

    parsed_items = []
    for item in result[0]:
        box = item[0]
        text = item[1][0]
        confidence = item[1][1]

        y_coords = [p[1] for p in box]
        x_coords = [p[0] for p in box]
        y_center = sum(y_coords) / 4
        y_min = min(y_coords)
        y_max = max(y_coords)
        x_left = min(x_coords)
        x_right = max(x_coords)
        height = y_max - y_min

        parsed_items.append({
            'text': text,
            'y_center': y_center,
            'y_min': y_min,
            'y_max': y_max,
            'x_left': x_left,
            'x_right': x_right,
            'height': height,
            'confidence': confidence,
        })

    if not parsed_items:
        return ""

    parsed_items.sort(key=lambda item: item['y_center'])

    # Adaptive line grouping: tolerance based on average text height
    avg_height = sum(it['height'] for it in parsed_items) / len(parsed_items)
    y_tolerance = max(avg_height * 0.6, 8)

    lines = []
    current_line = []

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
    char_width = 10

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


def is_price_like(text: str) -> Optional[int]:
    """Check if text looks like an Indonesian Rupiah price. Returns integer value or None."""
    # Strip common prefixes
    clean = re.sub(r'^[Rr][Pp]\s*', '', text.strip())
    # Check if it's a number with Indonesian formatting
    if re.match(r'^\d{1,3}([.,]\d{3})*([.,]\d{1,3})?$', clean):
        num = clean.replace('.', '').replace(',', '')
        try:
            val = int(num)
            if 100 <= val <= 10000000:
                return val
        except ValueError:
            pass
    return None


def parse_items_from_coordinates(result) -> List[Dict]:
    """Parse receipt items directly from OCR bounding box coordinates.
    Handles multi-column receipts where names/qtys/prices are in separate columns.
    Returns list of {item, price, quantity} dicts."""
    if not result or not result[0]:
        return []

    # Extract all fragments with coordinates
    fragments = []
    for item in result[0]:
        box = item[0]
        text = item[1][0]
        confidence = item[1][1]
        y_coords = [p[1] for p in box]
        x_coords = [p[0] for p in box]
        fragments.append({
            'text': text,
            'confidence': confidence,
            'x_center': sum(x_coords) / 4,
            'y_center': sum(y_coords) / 4,
            'x_left': min(x_coords),
            'x_right': max(x_coords),
            'y_min': min(y_coords),
            'y_max': max(y_coords),
            'height': max(y_coords) - min(y_coords),
        })

    if not fragments:
        return []

    # Classify fragments by type
    price_frags = []
    qty_frags = []
    name_frags = []
    skip_keywords = [
        'subtotal', 'total', 'payment', 'thank you', 'please come',
        'checkno', 'pos1', 'closed', 'debit', 'credit', 'www.', 'jl.',
        'bca', 'mandiri', 'rupiah', 'change', 'cash', 'kembali',
        'kembalian', 'diskon', 'discount', 'pajak', 'ppn', 'tax',
        'service charge', 'biaya layanan', 'saved', 'member', 'poin',
        'struk', 'receipt', 'invoice', 'tanggal', 'date', 'kasir',
        'cashier', 'telp', 'phone', 'fax', 'qty', 'harga',
    ]

    for f in fragments:
        txt = f['text'].strip()
        lower = txt.lower()

        # Skip header/footer fragments
        if any(skip in lower for skip in skip_keywords):
            continue

        # Classify as price, qty, or name
        price_val = is_price_like(txt)
        if price_val is not None and price_val >= 1000:
            f['price'] = price_val
            price_frags.append(f)
        elif re.match(r'^\d{1,2}$', txt):
            f['qty'] = int(txt)
            qty_frags.append(f)
        elif len(txt) >= 2 and not txt.isdigit():
            name_frags.append(f)

    if not price_frags:
        return []

    # Determine image bounds for column detection
    all_x = [f['x_center'] for f in fragments]
    x_min, x_max = min(all_x), max(all_x)
    img_width = x_max - x_min

    # Split name_frags into left-column names vs inline names
    # Left column: x_center in left 45% of image
    # Inline: x_center between 45% and price column
    left_boundary = x_min + img_width * 0.45
    right_boundary = x_min + img_width * 0.70

    left_names = [f for f in name_frags if f['x_center'] < left_boundary]
    inline_names = [f for f in name_frags if left_boundary <= f['x_center'] < right_boundary]
    left_names.sort(key=lambda f: f['y_center'])
    inline_names.sort(key=lambda f: f['y_center'])
    qty_frags.sort(key=lambda f: f['y_center'])
    price_frags.sort(key=lambda f: f['y_center'])

    # Build items by matching prices to names via y-proximity
    items = []
    used_left = set()
    used_inline = set()
    used_qty = set()

    for pf in price_frags:
        py = pf['y_center']
        px = pf['x_left']

        # Try to find a matching name
        best_name = None
        best_name_src = None
        best_dist = float('inf')

        # First: try inline names (same line, to the left of price)
        for i, nf in enumerate(inline_names):
            if i in used_inline:
                continue
            if nf['x_right'] > px - 10:
                continue
            dist = abs(nf['y_center'] - py)
            if dist < best_dist:
                best_dist = dist
                best_name = nf
                best_name_src = ('inline', i)

        # Second: try left-column names (multi-column receipt)
        if best_name is None or best_dist > 25:
            for i, nf in enumerate(left_names):
                if i in used_left:
                    continue
                dist = abs(nf['y_center'] - py)
                if dist < best_dist:
                    best_dist = dist
                    best_name = nf
                    best_name_src = ('left', i)

        if best_name is None:
            continue

        # Find quantity: between name and price, close in y
        qty = 1
        for i, qf in enumerate(qty_frags):
            if i in used_qty:
                continue
            # Qty should be between name and price in x, and close in y
            if best_name['x_right'] - 20 <= qf['x_center'] <= px + 20:
                if abs(qf['y_center'] - py) < 25:
                    qty = qf['qty']
                    used_qty.add(i)
                    break

        # If no qty found between, look for qty near price in y
        if qty == 1:
            for i, qf in enumerate(qty_frags):
                if i in used_qty:
                    continue
                if abs(qf['y_center'] - py) < 15 and qf['x_center'] < px:
                    qty = qf['qty']
                    used_qty.add(i)
                    break

        name = best_name['text'].strip()
        # Clean up name
        name = re.sub(r'^\d+\s*', '', name).strip()
        name = re.sub(r'\s+', ' ', name).strip()
        if len(name) < 2:
            name = 'Item'

        items.append({
            'item': name,
            'price': pf['price'],
            'quantity': qty,
        })

        # Mark name as used
        if best_name_src[0] == 'inline':
            used_inline.add(best_name_src[1])
        else:
            used_left.add(best_name_src[1])

    # Deduplicate: if same name+price appears multiple times, merge quantities
    merged = {}
    for it in items:
        key = (it['item'], it['price'])
        if key in merged:
            merged[key]['quantity'] += it['quantity']
        else:
            merged[key] = it.copy()

    return list(merged.values())


def preprocess_receipt_lines(text: str) -> str:
    """Clean and filter receipt lines (fallback when no coordinate data available)."""
    lines = text.split('\n')
    item_lines = []
    skip_keywords = [
        'subtotal', 'total:', 'total rp', 'payment:', 'thank you',
        'please come', 'checkno', 'pos1', 'closed', 'debit', 'credit',
        'www.', 'jl.', 'bca', 'mandiri', 'rupiah', '---', '===',
        'change:', 'cash:', 'kembali', 'kembalian', 'diskon', 'discount',
        'pajak', 'ppn', 'tax', 'service charge', 'biaya layanan',
        'saved:', 'you saved', 'member:', 'poin:', 'point:',
        'struk', 'receipt', 'invoice', 'tanggal', 'date:',
        'kasir', 'cashier', 'telp', 'phone', 'fax',
    ]
    for line in lines:
        line = line.strip()
        if not line:
            continue
        lower = line.lower()
        if any(skip in lower for skip in skip_keywords):
            continue
        if any(c.isdigit() for c in line):
            item_lines.append(line)
    return '\n'.join(item_lines)


def regex_parse_prices(text: str) -> List[Dict]:
    """Fallback regex-based parser when Groq is unavailable.
    Extracts item names and prices using pattern matching."""
    items = []
    lines = text.split('\n')

    # Indonesian price pattern: number with optional thousands separator
    price_pattern = re.compile(r'(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,3})?)')

    for line in lines:
        line = line.strip()
        if not line:
            continue

        # Find all price-like numbers
        prices = price_pattern.findall(line)
        if not prices:
            continue

        # Filter to likely prices (>= 100, reasonable range)
        valid_prices = []
        for p in prices:
            clean = p.replace('.', '').replace(',', '')
            try:
                val = int(clean)
                if 100 <= val <= 10000000:
                    valid_prices.append(val)
            except ValueError:
                continue

        if not valid_prices:
            continue

        # Extract item name: remove all price numbers and clean
        name = line
        for p in prices:
            name = name.replace(p, '', 1)
        name = re.sub(r'\s+', ' ', name).strip()
        # Remove leading quantity numbers
        name = re.sub(r'^\d+\s*', '', name)
        # Remove trailing non-alpha
        name = re.sub(r'[^\w\s]+$', '', name).strip()

        if not name or len(name) < 2:
            continue

        for price in valid_prices:
            items.append({'item': name, 'price': price, 'quantity': 1})

    return items


def parse_with_groq(extracted_text: str) -> List[Dict]:
    """Use Groq LLM to parse receipt text into structured data."""
    if not extracted_text.strip():
        print("No text to parse")
        return []

    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You parse Indonesian store receipt OCR text into JSON.\n\n"
                        "RECEIPT FORMAT (each item line):\n"
                        "  ITEM_NAME    QTY    PRICE    SUBTOTAL    [extra_numbers]\n"
                        "- Item name is on the LEFT (may contain product codes, sizes, brands).\n"
                        "- QTY is a small number (1-99) after the name.\n"
                        "- PRICE is the per-unit price (usually 3-6 digits, may have dot/comma).\n"
                        "- SUBTOTAL = QTY * PRICE (may appear after the price).\n"
                        "- Extra numbers (tax, discount, change) after subtotal are NOT items.\n\n"
                        "EXAMPLES:\n"
                        "Input: 'WLS PL STR90ML KP BRD L 0.020 1 5,000 5,000 500'\n"
                        "Output: [{\"item\":\"WLS PL STR90ML KP BRD L 0.020\",\"price\":5000,\"quantity\":1}]\n\n"
                        "Input: 'SASA SNT 200ML 1 10,000 10,000'\n"
                        "Output: [{\"item\":\"SASA SNT 200ML\",\"price\":10000,\"quantity\":1}]\n\n"
                        "Input: 'MD EGG DROP110G 1 9,100 9,100'\n"
                        "Output: [{\"item\":\"MD EGG DROP110G\",\"price\":9100,\"quantity\":1}]\n\n"
                        "Input: 'Indomie Goreng 2 3,500 7,000'\n"
                        "Output: [{\"item\":\"Indomie Goreng\",\"price\":3500,\"quantity\":2}]\n\n"
                        "RULES:\n"
                        "- ONE item per line (unless line clearly has multiple name|price pairs).\n"
                        "- Price = the first 3-7 digit number after the quantity.\n"
                        "- Quantity defaults to 1 if not found.\n"
                        "- Strip leading quantity from item name.\n"
                        "- Indonesian Rupiah: '5,000'=5000, '14.000'=14000, '43.500'=43500.\n"
                        "- SKIP lines with: Total, Subtotal, Cash, Change, Tax, Discount,"
                        " Thank You, Kasir, Tanggal, header/footer text.\n"
                        "- Return ONLY a JSON array. No markdown, no explanation."
                    )
                },
                {
                    "role": "user",
                    "content": extracted_text
                }
            ],
            temperature=0.0,
            max_tokens=1024
        )

        content = response.choices[0].message.content.strip()

        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()

        items = json.loads(content)
        total_parsed = sum(int(i.get('price', 0)) for i in items)
        print(f"Groq parsed {len(items)} items, total: {total_parsed}")
        return items

    except Exception as e:
        print(f"Groq parsing error: {e}, falling back to regex parser")
        return regex_parse_prices(filtered_text)


@app.post("/scan")
async def scan_receipt(image: UploadFile = File(...)):
    """
    Scan a receipt image and extract items with prices.
    Uses multiple image preprocessing variants + coordinate-based item grouping.
    Returns: {"items": [...], "raw_text": "...", "message": "..."}
    """
    try:
        image_bytes = await image.read()
        pil_image = Image.open(io.BytesIO(image_bytes)).convert('RGB')

        print(f"\nProcessing receipt: {image.filename} ({pil_image.size})")
        variants = preprocess_image(pil_image)

        # Run OCR on each variant, keep raw results for coordinate grouping
        all_results = []
        for variant_img, label in variants:
            img_array = np.array(variant_img)
            result = ocr.ocr(img_array, cls=True)
            if result and result[0]:
                text = extract_text_with_layout(result)
                text = ocr_correct(text)
                all_results.append((text, label, result))
                print(f"  {label}: {len(result[0])} text boxes detected")

        if not all_results:
            return {"items": [], "raw_text": "", "message": "No text detected in any variant"}

        # Pick best variant
        extracted_text, best_raw = merge_ocr_results(all_results)

        # PRIMARY: parse items directly from coordinates (bypasses Groq for structure)
        items = []
        if best_raw is not None:
            items = parse_items_from_coordinates(best_raw)
            print(f"  Coordinate parser found {len(items)} items")

        # FALLBACK: if coordinate parser fails, use Groq on raw text
        if not items:
            items = parse_with_groq(extracted_text)
            print(f"  Groq parser found {len(items)} items")

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
